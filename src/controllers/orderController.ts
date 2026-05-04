import { Request, Response } from 'express';
import { logger } from '../services/logger';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import db from '../db/db';
import { signTicket } from '../services/qrService';
import { z } from 'zod';
 
// -----------------------------------------------------------------------------
// Vérification de signature webhook CinetPay
// CinetPay envoie un header "x-token" = SHA256(apiSecret + transactionId)
// Doc : https://docs.cinetpay.com/api/notification
// -----------------------------------------------------------------------------
const verifyCinetPaySignature = (req: Request): boolean => {
  const apiSecret = process.env.CINETPAY_API_SECRET;
 
  // En dev sans secret configuré : on logue un avertissement mais on laisse passer
  // EN PRODUCTION : ce bloc doit être supprimé (la vérif doit être obligatoire)
  if (!apiSecret) {
    logger.warn('CINETPAY_API_SECRET non défini — vérification webhook désactivée (DEV uniquement)');
    return true;
  }
 
  const receivedToken = req.headers['x-token'] as string;
  if (!receivedToken) {
    logger.warn('Webhook reçu sans header x-token');
    return false;
  }
 
  const { cpm_trans_id } = req.body; // identifiant de transaction côté CinetPay
  const expectedToken = crypto
    .createHmac('sha256', apiSecret)
    .update(cpm_trans_id || '')
    .digest('hex');
 
  const isValid = crypto.timingSafeEqual(
    Buffer.from(receivedToken, 'hex'),
    Buffer.from(expectedToken, 'hex')
  );
 
  if (!isValid) {
    logger.warn('Webhook : signature invalide', { receivedToken, cpm_trans_id });
  }
 
  return isValid;
};
 
export const orderSchema = z.object({
  body: z.object({
    items: z.array(z.object({
      ticketTypeId: z.string().trim(),
      quantity: z.preprocess((val) => Number(val), z.number().int().min(1, "Quantité invalide")),
      ticketTypeName: z.string().trim()
    }).passthrough()).min(1, "Le panier est vide"),
    totalAmount: z.preprocess((val) => Number(val), z.number().min(0)),
    userEmail: z.string().trim().email("Email invalide").or(z.string().trim().min(5)),
    userName: z.string().trim().min(1, "Nom requis"),
    userPhone: z.string().trim().nullable().optional().or(z.literal("")),
    operator: z.string().trim().min(1, "Opérateur requis"),
    phoneNumber: z.string().trim().min(1, "Numéro de téléphone requis"),
    promoCodeId: z.string().nullable().optional(),
    discountAmount: z.number().optional()
  }).passthrough(),
  query: z.any().optional(),
  params: z.any().optional(),
});
 
const cleanupExpiredOrders = () => {
  const now = new Date().toISOString();
  const expiredOrders = db.prepare("SELECT id FROM orders WHERE status = 'pending' AND expires_at < ?").all(now) as { id: string }[];
  
  if (expiredOrders.length > 0) {
    logger.info('Cleaning up expired orders', { count: expiredOrders.length });
    db.transaction(() => {
      for (const order of expiredOrders) {
        const items = db.prepare('SELECT ticket_type_id, quantity FROM order_items WHERE order_id = ?').all(order.id) as { ticket_type_id: string, quantity: number }[];
        for (const item of items) {
          db.prepare('UPDATE ticket_types SET available_quantity = available_quantity + ? WHERE id = ?').run(item.quantity, item.ticket_type_id);
        }
        db.prepare("UPDATE orders SET status = 'expired' WHERE id = ?").run(order.id);
      }
    })();
  }
};
 
const executeOrderAndIssueTickets = db.transaction((orderData: any) => {
  const { items, userEmail, userName, userPhone, operator, phoneNumber, promoCodeId } = orderData;
  // ⚠️ On ignore volontairement totalAmount et discountAmount envoyés par le client
  // Le prix est toujours recalculé depuis la base de données
 
  // 1. Cleanup expired orders to free stock
  cleanupExpiredOrders();
 
  // 2. Recalcul du prix réel depuis la DB (jamais depuis le client)
  let serverTotalAmount = 0;
  for (const item of items) {
    const ticketType = db.prepare('SELECT price FROM ticket_types WHERE id = ?').get(item.ticketTypeId) as { price: number } | undefined;
    if (!ticketType) {
      throw new Error(`Type de billet inexistant: ${item.ticketTypeName}`);
    }
    serverTotalAmount += ticketType.price * item.quantity;
  }
 
  // 3. Appliquer le promo code côté serveur si fourni
  let serverDiscountAmount = 0;
  if (promoCodeId) {
    const promo = db.prepare(
      "SELECT reduction_percent FROM promo_codes WHERE id = ? AND is_active = 1"
    ).get(promoCodeId) as { reduction_percent: number } | undefined;
 
    if (promo) {
      serverDiscountAmount = serverTotalAmount * (promo.reduction_percent / 100);
      serverTotalAmount = serverTotalAmount - serverDiscountAmount;
    } else {
      throw new Error('Code promo invalide ou inactif');
    }
  }
 
  logger.info('Prix recalculé côté serveur', { serverTotalAmount, serverDiscountAmount });
 
  let user = db.prepare('SELECT id FROM users WHERE email = ?').get(userEmail) as any;
  if (!user) {
    const newUserId = uuidv4();
    const tempPw = bcrypt.hashSync(uuidv4(), 10);
    db.prepare('INSERT INTO users (id, full_name, email, password, phone) VALUES (?, ?, ?, ?, ?)').run(
      newUserId, userName, userEmail, tempPw, userPhone
    );
    user = { id: newUserId };
  }
 
  const orderId = uuidv4();
  const transactionId = `CP-${Math.random().toString(36).substring(2, 15).toUpperCase()}`;
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes
 
  // 4. Vérification et réservation du stock
  for (const item of items) {
    const stock = db.prepare('SELECT available_quantity FROM ticket_types WHERE id = ?').get(item.ticketTypeId) as { available_quantity: number };
 
    if (!stock) {
      throw new Error(`Type de billet inexistant: ${item.ticketTypeName}`);
    }
 
    if (stock.available_quantity < item.quantity) {
      throw new Error(`Sold Out: ${item.ticketTypeName}`);
    }
 
    const result = db.prepare(
      'UPDATE ticket_types SET available_quantity = available_quantity - ? WHERE id = ? AND available_quantity >= ?'
    ).run(item.quantity, item.ticketTypeId, item.quantity);
 
    if (result.changes === 0) {
      throw new Error(`Stock épuisé entre-temps pour: ${item.ticketTypeName}`);
    }
  }
 
  // 5. Création de la commande avec le prix calculé CÔTÉ SERVEUR
  db.prepare(
    'INSERT INTO orders (id, user_id, total_amount, status, operator, phone_number, transaction_id, expires_at, promo_code_id, discount_amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(
    orderId, user.id, serverTotalAmount, 'pending', operator, phoneNumber,
    transactionId, expiresAt, promoCodeId || null, serverDiscountAmount
  );
 
  // 6. Sauvegarde des items avec le prix réel au moment de l'achat
  for (const item of items) {
    const ticketType = db.prepare('SELECT price FROM ticket_types WHERE id = ?').get(item.ticketTypeId) as { price: number };
    db.prepare(
      'INSERT INTO order_items (id, order_id, ticket_type_id, quantity, price_at_purchase) VALUES (?, ?, ?, ?, ?)'
    ).run(uuidv4(), orderId, item.ticketTypeId, item.quantity, ticketType.price);
  }
 
  return { success: true, orderId, transactionId, totalAmount: serverTotalAmount };
});
 
export const createOrder = async (req: Request, res: Response) => {
  logger.info('Creating order (CinetPay style)', { body: req.body });
  try {
    const result = executeOrderAndIssueTickets(req.body);
    logger.info('Order created successfully', { orderId: result.orderId, transactionId: result.transactionId });
    res.json(result);
  } catch (err: any) {
    logger.error('Order creation failed', { error: err.message });
    if (err.message.includes('Sold Out') || err.message.includes('épuisé')) {
      return res.status(400).json({ success: false, error: err.message });
    }
    res.status(500).json({ success: false, error: err.message });
  }
};
 
export const webhook = async (req: Request, res: Response) => {
  // 🔒 Vérification de la signature HMAC avant tout traitement
  if (!verifyCinetPaySignature(req)) {
    logger.warn('Webhook rejeté : signature invalide', { ip: req.ip, body: req.body });
    return res.status(401).json({ success: false, error: 'Invalid webhook signature' });
  }
 
  const { orderId, transactionId, status } = req.body;
  logger.info('Webhook received', { orderId, transactionId, status });
  
  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ? OR transaction_id = ?').get(orderId, transactionId) as any;
    if (!order) {
      logger.warn('Webhook: Order not found', { orderId, transactionId });
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
 
    if (order.status === 'paid') {
      return res.json({ success: true, message: 'Already paid' });
    }
 
    if (status === 'paid' || status === 'ACCEPTED') {
      db.transaction(() => {
        db.prepare("UPDATE orders SET status = 'paid' WHERE id = ?").run(order.id);

        // Prélèvement automatique de la commission TICKHOST
        const commissionRateRes = db.prepare("SELECT value FROM system_settings WHERE key = 'commission_rate'").get() as any;
        const commissionRate = parseFloat(commissionRateRes?.value || '5') / 100;
        const commissionAmount = Math.round(order.total_amount * commissionRate);
        const organizerAmount = order.total_amount - commissionAmount;

        // Récupérer l'organisateur via l'événement du premier billet
        const firstItem = db.prepare('SELECT ticket_type_id FROM order_items WHERE order_id = ? LIMIT 1').get(order.id) as any;
        if (firstItem) {
          const eventRow = db.prepare('SELECT organizer_id, id as event_id FROM events WHERE id = (SELECT event_id FROM ticket_types WHERE id = ?)').get(firstItem.ticket_type_id) as any;
          if (eventRow) {
            // Enregistrer la commission dans les logs financiers
            db.prepare(`
              INSERT INTO payouts (id, organizer_id, amount, commission_rate, payout_method, payout_details, status)
              VALUES (?, ?, ?, ?, 'pending', ?, 'pending')
            `).run(
              uuidv4(),
              eventRow.organizer_id,
              organizerAmount,
              commissionRate * 100,
              JSON.stringify({ orderId: order.id, commissionAmount, totalAmount: order.total_amount, eventId: eventRow.event_id })
            );
          }
        }

        // Update promo code stats if used
        if (order.promo_code_id) {
          db.prepare('UPDATE promo_codes SET usage_count = usage_count + 1, total_saved = total_saved + ? WHERE id = ?').run(
            order.discount_amount || 0, order.promo_code_id
          );
        }

        // Generate tickets only on payment
        const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id) as any[];
        for (const item of items) {
          for (let i = 0; i < item.quantity; i++) {
            const ticketId = uuidv4();
            const uniqueCode = Math.random().toString(36).substring(2, 10).toUpperCase();
            const qrData = signTicket(uniqueCode);

            db.prepare('INSERT INTO tickets (id, order_id, ticket_type_id, unique_code, qr_code_data, status) VALUES (?, ?, ?, ?, ?, ?)').run(
              ticketId, order.id, item.ticket_type_id, uniqueCode, qrData, 'unused'
            );
          }
        }
      })();
      logger.info('Webhook: Payment confirmed, tickets issued, commission recorded', { orderId: order.id });
    } else {
      // Handle failure
      db.transaction(() => {
        db.prepare("UPDATE orders SET status = 'failed' WHERE id = ?").run(order.id);
        // Restore stock
        const items = db.prepare('SELECT ticket_type_id, quantity FROM order_items WHERE order_id = ?').all(order.id) as { ticket_type_id: string, quantity: number }[];
        for (const item of items) {
          db.prepare('UPDATE ticket_types SET available_quantity = available_quantity + ? WHERE id = ?').run(item.quantity, item.ticket_type_id);
        }
      })();
      logger.warn('Webhook: Payment failed', { orderId: order.id, status });
    }
 
    const tickets = db.prepare(`
      SELECT t.*, 
        tt.name as ticketTypeName,
        e.name as eventName,
        e.event_date as eventDate, 
        e.location
      FROM tickets t
      JOIN ticket_types tt ON t.ticket_type_id = tt.id
      JOIN events e ON tt.event_id = e.id
      WHERE t.order_id = ?
    `).all(order.id);
 
    res.json({ success: true, tickets });
  } catch (err: any) {
    logger.error('Webhook processing error', { error: err.message });
    res.status(500).json({ success: false, error: err.message });
  }
};
