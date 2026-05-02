import { Request, Response } from 'express';
import { logger } from '../services/logger';
import crypto from 'crypto';
import db from '../db/db';
import { AuthRequest } from '../middlewares/auth';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
 
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-for-dev';
import { z } from 'zod';
 
// Vérification signature webhook partenaire (même logique que CinetPay)
const verifyPartnerWebhookSignature = (req: Request): boolean => {
  const secret = process.env.CINETPAY_API_SECRET;
  if (!secret) {
    logger.warn('CINETPAY_API_SECRET absent — vérification webhook partenaire désactivée (DEV)');
    return true;
  }
  const receivedToken = req.headers['x-token'] as string;
  if (!receivedToken) return false;
  const { partnerId } = req.body;
  const expected = crypto.createHmac('sha256', secret).update(partnerId || '').digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(receivedToken, 'hex'), Buffer.from(expected, 'hex'));
  } catch {
    return false;
  }
};
 
export const eventSchema = z.object({
  body: z.object({
    name: z.string().trim().min(3, "Le nom doit faire au moins 3 caractères"),
    organizer_name: z.string().trim().min(2, "Le nom de l'organisateur est requis"),
    description: z.string().trim().min(10, "La description doit être plus détaillée"),
    event_date: z.string().trim().refine(val => {
      const date = new Date(val);
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      return !isNaN(date.getTime()) && date >= yesterday;
    }, "La date de l'événement doit être valide et non passée"),
    location: z.string().trim().min(3, "Le lieu est requis"),
    image_url: z.string().trim().nullable().optional().or(z.literal("")),
    ticketTypes: z.array(z.object({
      name: z.string().trim().min(1, "Nom de catégorie requis"),
      price: z.preprocess((val) => Number(val), z.number().min(0, "Le prix ne peut pas être négatif")),
      quantity: z.preprocess((val) => Number(val), z.number().int().positive("La quantité doit être supérieure à 0"))
    }).passthrough()).min(1, "Au moins un type de billet est requis")
  }).passthrough(),
  query: z.any().optional(),
  params: z.any().optional(),
});
 
export const getEvents = (req: AuthRequest, res: Response) => {
  try {
    const tenantSlug = req.query.tenant as string || req.tenantSlug;
    const filter = req.query.filter as string;
    
    // PRIORITÉ : Filtre dashboard pour les organisateurs
    if (filter === 'mine' && req.user) {
      let query = "SELECT * FROM events";
      const qParams: any[] = [];
      if (req.user.role !== 'ADMIN') {
        query += " WHERE organizer_id = ?";
        qParams.push(req.user.id);
      }
      query += " ORDER BY event_date ASC";
      
      const events = db.prepare(query).all(...qParams) as any[];
      return res.json(events.map(e => {
        const jsonFields = ['gallery_images', 'options', 'info_options', 'info_sections', 'payment_modes', 'home_options', 'partners'];
        jsonFields.forEach(f => {
          if (e[f]) { try { e[f] = JSON.parse(e[f]); } catch { e[f] = f.includes('options') ? {} : []; } }
          else { e[f] = f.includes('options') ? {} : []; }
        });
        return e;
      }));
    }

    // Cache Fallback pour le Microsite...
    if (tenantSlug) {
      // ... logique existante pour le microsite
    }
    // ...
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
 
    // For dashboard/list
    let query = "SELECT * FROM events";
    const queryParams: any[] = [];
 
    if (filter === 'mine' && req.user) {
      if (req.user.role !== 'ADMIN') {
        query += " WHERE organizer_id = ?";
        queryParams.push(req.user.id);
      }
    } else if (!req.user || req.user.role === 'USER') {
      query += " WHERE status = 'published'";
    }
 
    query += " ORDER BY event_date ASC";
    const events = db.prepare(query).all(...queryParams) as any[];
    
    const parsedEvents = events.map(e => {
      const jsonFields = ['gallery_images', 'options', 'info_options', 'info_sections', 'payment_modes', 'home_options', 'partners'];
      const arrayFields = ['info_sections', 'gallery_images', 'partners'];
      jsonFields.forEach(field => {
        if (e[field]) {
          try {
            e[field] = JSON.parse(e[field]);
          } catch (err) {
            e[field] = arrayFields.includes(field) ? [] : {};
          }
        } else {
          e[field] = arrayFields.includes(field) ? [] : {};
        }
      });
 
      // Calculate revenue
      const revenue = db.prepare(`
        SELECT SUM(o.total_amount) as total 
        FROM orders o
        JOIN order_items oi ON o.id = oi.order_id
        JOIN ticket_types tt ON oi.ticket_type_id = tt.id
        WHERE tt.event_id = ? AND o.status = 'completed'
      `).get(e.id) as any;
      e.revenue = revenue?.total || 0;
 
      return e;
    });
    res.json(parsedEvents);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
 
export const getEventById = (req: Request, res: Response) => {
  try {
    const event = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id) as any;
    if (!event) return res.status(404).json({ success: false, error: 'Event not found' });
    const ticketTypes = db.prepare('SELECT * FROM ticket_types WHERE event_id = ?').all(req.params.id);
    
    const jsonFields = ['gallery_images', 'options', 'info_options', 'info_sections', 'payment_modes', 'home_options', 'partners'];
    const arrayFields = ['info_sections', 'gallery_images', 'partners'];
    jsonFields.forEach(field => {
      if (event[field]) {
        try {
          event[field] = JSON.parse(event[field]);
        } catch (e) {
          event[field] = arrayFields.includes(field) ? [] : {};
        }
      } else {
        event[field] = arrayFields.includes(field) ? [] : {};
      }
    });
    
    res.json({ ...event, ticketTypes });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
 
export const createEvent = (req: AuthRequest, res: Response) => {
  const { 
    name, description, event_date, location, image_url, ticketTypes,
    organizer_name, primary_color, bg_type, bg_image, 
    bg_intensity, bg_opacity, show_logo_instead_of_name, logo_url_main,
    support_email, support_whatsapp,
    options, info_options, info_sections, payment_modes, status,
    partner_billing_enabled, gallery_images, gallery_title, home_options, partners
  } = req.body;
  const organizerId = req.user?.id;
 
  if (!organizerId) return res.status(401).json({ success: false, error: 'Unauthorized' });
 
  // Verify user exists in DB (protection against DB resets with old tokens)
  const userExists = db.prepare('SELECT id FROM users WHERE id = ?').get(organizerId);
  if (!userExists) return res.status(401).json({ success: false, error: 'Session expirée (Base de données réinitialisée). Veuillez vous reconnecter.' });
 
  try {
    const eventId = uuidv4();
    let slug = req.body.slug ? req.body.slug.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') : name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    
    // Check slug uniqueness
    const existingSlug = db.prepare('SELECT id FROM events WHERE slug = ?').get(slug);
    if (existingSlug) {
      return res.status(400).json({ success: false, error: 'Ce lien URL est déjà pris, veuillez en choisir un autre.' });
    }
    
    // Generate unique access code — format unifié : XXXX-0000
    const generateAccessCode = () => {
      const prefix = name.substring(0, 4).toUpperCase().padEnd(4, 'X').replace(/[^A-Z0-9]/g, 'X');
      const random = Math.floor(1000 + Math.random() * 9000);
      return `${prefix}-${random}`;
    };
 
    let accessCode = generateAccessCode();
    // Ensure uniqueness
    let attempts = 0;
    while (db.prepare('SELECT id FROM events WHERE access_code = ?').get(accessCode) && attempts < 10) {
      accessCode = generateAccessCode();
      attempts++;
    }
 
    db.transaction(() => {
      db.prepare(`
        INSERT INTO events (
          id, name, slug, description, event_date, location, image_url, organizer_id, access_code,
          organizer_name, primary_color, bg_type, bg_image, 
          bg_intensity, bg_opacity, show_logo_instead_of_name, logo_url_main,
          support_email, support_whatsapp,
          options, info_options, info_sections, payment_modes, status,
          partner_billing_enabled, gallery_images, gallery_title, home_options, partners
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        eventId, name, slug, description, event_date, location, 
        image_url || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80', 
        organizerId, accessCode,
        organizer_name || null,
        primary_color || '#10b981',
        bg_type || 'color',
        bg_image || null,
        bg_intensity ?? 0.5,
        bg_opacity ?? 0.8,
        show_logo_instead_of_name ? 1 : 0,
        logo_url_main || null,
        support_email || null,
        support_whatsapp || null,
        JSON.stringify(options || {}),
        JSON.stringify(info_options || {}),
        JSON.stringify(info_sections || []),
        JSON.stringify(payment_modes || {}),
        status || 'published',
        partner_billing_enabled ? 1 : 0,
        JSON.stringify(gallery_images || []),
        gallery_title || null,
        JSON.stringify(home_options || {}),
        JSON.stringify(partners || [])
      );
 
      if (Array.isArray(ticketTypes)) {
        for (const tt of ticketTypes) {
          db.prepare(`
            INSERT INTO ticket_types (id, event_id, name, price, total_quantity, available_quantity)
            VALUES (?, ?, ?, ?, ?, ?)
          `).run(uuidv4(), eventId, tt.name, tt.price, tt.quantity, tt.quantity);
        }
      }
    })();
 
    res.json({ success: true, id: eventId });
  } catch (err: any) {
    logger.error('Create event error', { error: err.message });
    res.status(500).json({ success: false, error: err.message });
  }
};
 
export const updateEvent = (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;
  const userRole = req.user?.role;
 
  try {
    const event = db.prepare('SELECT organizer_id FROM events WHERE id = ?').get(id) as any;
    if (!event) return res.status(404).json({ success: false, error: 'Event not found' });
 
    if (userRole !== 'ADMIN' && event.organizer_id !== userId) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }
 
    const { 
      name, description, event_date, location, image_url,
      slug, primary_color, welcome_message, info_content, gallery_images,
      bg_type, bg_image, support_email, support_whatsapp,
      options, info_options, info_sections, payment_modes, status,
      bg_intensity, bg_opacity, show_logo_instead_of_name, logo_url_main, partner_billing_enabled,
      organizer_name, gallery_title, home_options, partners
    } = req.body;
 
    // Helper to ensure values are SQLite-compatible
    const safe = (val: any, isJson = false) => {
      if (val === undefined || val === null) return null;
      if (isJson) return typeof val === 'string' ? val : JSON.stringify(val);
      if (typeof val === 'object') return JSON.stringify(val);
      if (typeof val === 'boolean') return val ? 1 : 0;
      return val;
    };
 
    if (slug) {
      if (/\s/.test(slug)) {
        return res.status(400).json({ success: false, error: 'Le slug ne doit pas contenir d\'espaces' });
      }
      const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
      const existingSlug = db.prepare('SELECT id FROM events WHERE slug = ? AND id != ?').get(cleanSlug, id);
      if (existingSlug) {
        return res.status(400).json({ success: false, error: 'Ce lien URL est déjà pris, veuillez en choisir un autre.' });
      }
    }
 
    db.prepare(`
      UPDATE events 
      SET name = COALESCE(?, name),
          description = COALESCE(?, description),
          event_date = COALESCE(?, event_date),
          location = COALESCE(?, location),
          image_url = COALESCE(?, image_url),
          slug = COALESCE(?, slug),
          primary_color = COALESCE(?, primary_color),
          welcome_message = COALESCE(?, welcome_message),
          info_content = COALESCE(?, info_content),
          gallery_images = COALESCE(?, gallery_images),
          bg_type = COALESCE(?, bg_type),
          bg_image = COALESCE(?, bg_image),
          support_email = COALESCE(?, support_email),
          support_whatsapp = COALESCE(?, support_whatsapp),
          options = COALESCE(?, options),
          info_options = COALESCE(?, info_options),
          info_sections = COALESCE(?, info_sections),
          payment_modes = COALESCE(?, payment_modes),
          status = COALESCE(?, status),
          bg_intensity = COALESCE(?, bg_intensity),
          bg_opacity = COALESCE(?, bg_opacity),
          show_logo_instead_of_name = COALESCE(?, show_logo_instead_of_name),
          logo_url_main = COALESCE(?, logo_url_main),
          partner_billing_enabled = COALESCE(?, partner_billing_enabled),
          organizer_name = COALESCE(?, organizer_name),
          gallery_title = COALESCE(?, gallery_title),
          home_options = COALESCE(?, home_options),
          partners = COALESCE(?, partners),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      safe(name), safe(description), safe(event_date), safe(location), safe(image_url),
      safe(slug), safe(primary_color), safe(welcome_message), safe(info_content), 
      safe(gallery_images, true),
      safe(bg_type), safe(bg_image), safe(support_email), safe(support_whatsapp),
      safe(options, true),
      safe(info_options, true),
      safe(info_sections, true),
      safe(payment_modes, true),
      safe(status),
      safe(bg_intensity), safe(bg_opacity), safe(show_logo_instead_of_name), safe(logo_url_main), safe(partner_billing_enabled),
      safe(organizer_name), safe(gallery_title), 
      safe(home_options, true),
      safe(partners, true),
      id
    );
 
    res.json({ success: true });
  } catch (err: any) {
    logger.error('Update event error', { error: err.message });
    res.status(500).json({ success: false, error: err.message });
  }
};
 
// --- PROMO CODES ---
export const getPromoCodes = (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const codes = db.prepare(`
      SELECT pc.*, 
      (SELECT COUNT(*) FROM orders WHERE promo_code_id = pc.id AND status = 'completed') as usage_count,
      (SELECT SUM(discount_amount) FROM orders WHERE promo_code_id = pc.id AND status = 'completed') as total_saved
      FROM promo_codes pc 
      WHERE event_id = ?
    `).all(id);
    res.json(codes);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
 
export const createPromoCode = (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { code, reduction_percent } = req.body;
    const codeId = uuidv4();
    db.prepare('INSERT INTO promo_codes (id, event_id, code, reduction_percent) VALUES (?, ?, ?, ?)').run(
      codeId, id, code.toUpperCase(), reduction_percent
    );
    res.json({ success: true, id: codeId });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
 
export const deletePromoCode = (req: AuthRequest, res: Response) => {
  try {
    db.prepare('DELETE FROM promo_codes WHERE id = ?').run(req.params.codeId);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
 
export const togglePromoCode = (req: AuthRequest, res: Response) => {
  try {
    const code = db.prepare('SELECT is_active FROM promo_codes WHERE id = ?').get(req.params.codeId) as any;
    if (!code) return res.status(404).json({ success: false, error: 'Code not found' });
    const newStatus = code.is_active === 1 ? 0 : 1;
    db.prepare('UPDATE promo_codes SET is_active = ? WHERE id = ?').run(newStatus, req.params.codeId);
    res.json({ success: true, is_active: newStatus });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
 
export const validatePromoCode = (req: Request, res: Response) => {
  try {
    const { event_id, code } = req.body;
    const promo = db.prepare('SELECT * FROM promo_codes WHERE event_id = ? AND code = ? AND is_active = 1').get(event_id, code.toUpperCase()) as any;
    if (!promo) return res.status(404).json({ success: false, error: 'Code promo invalide ou expiré' });
    res.json({ success: true, promo });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
 
// --- PARTNERS ---
export const getPartners = (req: Request, res: Response) => {
  try {
    const partners = db.prepare('SELECT * FROM partners WHERE event_id = ? ORDER BY created_at ASC').all(req.params.id);
    res.json(partners);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
 
const syncEventPartners = (eventId: string | number) => {
  const partners = db.prepare('SELECT logo_url FROM partners WHERE event_id = ? AND (is_paid = 1 OR amount_paid = 0)').all(eventId) as any[];
  const logoUrls = partners.map(p => p.logo_url);
  db.prepare('UPDATE events SET partners = ? WHERE id = ?').run(JSON.stringify(logoUrls), eventId);
};
 
export const checkoutPartner = (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { name, logo_url } = req.body;
  const userId = req.user?.id;
 
  try {
    const event = db.prepare('SELECT id, organizer_id FROM events WHERE id = ?').get(id) as any;
    if (!event) return res.status(404).json({ success: false, error: 'Event not found' });
    if (event.organizer_id !== userId && req.user?.role !== 'ADMIN') return res.status(403).json({ success: false, error: 'Forbidden' });
 
    const priceRes = db.prepare("SELECT value FROM system_settings WHERE key = 'extra_logo_price'").get() as any;
    const price = parseInt(priceRes?.value || '2000');
 
    const partnerId = uuidv4();
    const transactionId = 'PART-' + Math.random().toString(36).substring(2, 10).toUpperCase();
 
    // Insert as pending (is_paid = 0, amount_paid > 0 indicates it needs payment)
    db.prepare('INSERT INTO partners (id, event_id, name, logo_url, is_paid, amount_paid) VALUES (?, ?, ?, ?, ?, ?)').run(
      partnerId, id, name, logo_url, 0, price
    );
 
    res.json({ success: true, partnerId, transactionId, amount: price });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
 
export const handlePartnerPaymentWebhook = (req: Request, res: Response) => {
  if (!verifyPartnerWebhookSignature(req)) {
    logger.warn('Webhook partenaire rejeté : signature invalide', { ip: req.ip });
    return res.status(401).json({ success: false, error: 'Invalid webhook signature' });
  }
  const { partnerId, status } = req.body;
  try {
    if (status === 'paid') {
      const partner = db.prepare('SELECT event_id FROM partners WHERE id = ?').get(partnerId) as any;
      if (!partner) return res.status(404).json({ success: false, error: 'Partner not found' });
 
      db.prepare('UPDATE partners SET is_paid = 1 WHERE id = ?').run(partnerId);
      syncEventPartners(partner.event_id);
 
      // Log
      db.prepare('INSERT INTO logs (id, action, details) VALUES (?, ?, ?)').run(
        uuidv4(), 'Logo Premium Paid', `Partner ${partnerId} paid for event ${partner.event_id}`
      );
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
 
export const addPartner = (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, logo_url } = req.body;
    const userId = req.user?.id;
 
    const event = db.prepare('SELECT id, organizer_id FROM events WHERE id = ?').get(id) as any;
    if (!event) return res.status(404).json({ success: false, error: 'Event not found' });
    if (event.organizer_id !== userId && req.user?.role !== 'ADMIN') return res.status(403).json({ success: false, error: 'Forbidden' });
 
    // Vérifier si l'organisateur a un abonnement actif
    const now = new Date().toISOString();
    const subscription = db.prepare(`
      SELECT status, expires_at FROM organizer_subscriptions
      WHERE organizer_id = ? AND status = 'active' AND expires_at > ?
    `).get(userId, now) as any;
 
    const hasActiveSubscription = !!subscription;
 
    if (!hasActiveSubscription) {
      // Sans abonnement : quota gratuit limité
      const freeLimitRes = db.prepare("SELECT value FROM system_settings WHERE key = 'free_partner_logos'").get() as any;
      const freeLimit = parseInt(freeLimitRes?.value || '3');
      const partnerCount = db.prepare("SELECT COUNT(*) as count FROM partners WHERE event_id = ?").get(id) as any;
      const currentCount = partnerCount?.count || 0;
 
      if (currentCount >= freeLimit) {
        return res.status(400).json({ 
          success: false, 
          error: 'Quota gratuit atteint. Souscrivez à un abonnement premium pour ajouter des logos illimités.',
          requiresSubscription: true
        });
      }
    }
    // Avec abonnement actif : logos illimités, pas de vérification de quota
 
    const partnerId = uuidv4();
    db.prepare('INSERT INTO partners (id, event_id, name, logo_url, is_paid, amount_paid) VALUES (?, ?, ?, ?, ?, ?)').run(
      partnerId, id, name, logo_url, 0, 0
    );
 
    syncEventPartners(id);
    res.json({ success: true, id: partnerId, isPaid: false, amountPaid: 0 });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
 
export const deletePartner = (req: AuthRequest, res: Response) => {
  try {
    const { id, partnerId } = req.params;
    const partner = db.prepare('SELECT event_id FROM partners WHERE id = ?').get(partnerId) as any;
    
    db.prepare('DELETE FROM partners WHERE id = ?').run(partnerId);
    
    if (partner) {
      syncEventPartners(partner.event_id);
    }
    
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
 
// --- FEEDBACK & SUPPORT ---
export const submitFeedback = (req: AuthRequest, res: Response) => {
  try {
    const { id: event_id } = req.params;
    const { rating, comment } = req.body;
    const user_id = req.user?.id;
    const feedbackId = uuidv4();
    db.prepare('INSERT INTO feedbacks (id, event_id, user_id, rating, comment) VALUES (?, ?, ?, ?, ?)').run(
      feedbackId, event_id, user_id, rating, comment
    );
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
 
export const submitSupportTicket = (req: AuthRequest, res: Response) => {
  try {
    const { id: event_id } = req.params;
    const { email_whatsapp, message } = req.body;
    const user_id = req.user?.id;
    const ticketId = uuidv4();
    db.prepare('INSERT INTO support_tickets (id, event_id, user_id, email_whatsapp, message) VALUES (?, ?, ?, ?, ?)').run(
      ticketId, event_id, user_id, email_whatsapp, message
    );
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
 
export const deleteEvent = (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;
  const userRole = req.user?.role;
 
  try {
    const event = db.prepare('SELECT organizer_id FROM events WHERE id = ?').get(id) as any;
    if (!event) return res.status(404).json({ success: false, error: 'Event not found' });
 
    if (userRole !== 'ADMIN' && event.organizer_id !== userId) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }
 
    db.transaction(() => {
      db.prepare('DELETE FROM tickets WHERE ticket_type_id IN (SELECT id FROM ticket_types WHERE event_id = ?)').run(id);
      db.prepare('DELETE FROM ticket_types WHERE event_id = ?').run(id);
      db.prepare('DELETE FROM events WHERE id = ?').run(id);
    })();
 
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
 
export const toggleEventStatus = (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;
  const userRole = req.user?.role;
 
  try {
    const event = db.prepare('SELECT organizer_id, status FROM events WHERE id = ?').get(id) as any;
    if (!event) return res.status(404).json({ success: false, error: 'Event not found' });
 
    if (userRole !== 'ADMIN' && event.organizer_id !== userId) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }
 
    const newStatus = event.status === 'published' ? 'inactive' : 'published';
    db.prepare('UPDATE events SET status = ? WHERE id = ?').run(newStatus, id);
 
    res.json({ success: true, status: newStatus });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
 
 
export const closeEvent = (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;
  const userRole = req.user?.role;
 
  try {
    const event = db.prepare('SELECT organizer_id, status FROM events WHERE id = ?').get(id) as any;
    if (!event) return res.status(404).json({ success: false, error: 'Événement introuvable' });
 
    if (userRole !== 'ADMIN' && event.organizer_id !== userId) {
      return res.status(403).json({ success: false, error: 'Non autorisé' });
    }
 
    if (event.status === 'closed') {
      return res.status(400).json({ success: false, error: 'Événement déjà terminé' });
    }
 
    db.transaction(() => {
      // Marquer l'événement comme terminé
      db.prepare("UPDATE events SET status = 'closed' WHERE id = ?").run(id);
 
      // Invalider tous les billets non encore scannés
      const result = db.prepare(`
        UPDATE tickets SET status = 'expired'
        WHERE ticket_type_id IN (
          SELECT id FROM ticket_types WHERE event_id = ?
        ) AND status = 'unused'
      `).run(id);
 
      logger.info('Événement terminé — billets invalidés', {
        eventId: id,
        ticketsExpired: result.changes,
        byUser: userId
      });
    })();
 
    res.json({ success: true, message: 'Événement terminé. Tous les billets non scannés ont été invalidés.' });
  } catch (err: any) {
    logger.error('Erreur closeEvent', { error: err.message });
    res.status(500).json({ success: false, error: err.message });
  }
};
 
export const validateAccessCode = (req: Request, res: Response) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ success: false, error: 'Code requis' });
 
  try {
    const event = db.prepare('SELECT id, name, access_code FROM events WHERE access_code = ?').get(code.toUpperCase()) as any;
    if (!event) return res.status(404).json({ success: false, error: 'Code invalide' });
 
    // Générer un token JWT staff lié à l'événement pour l'isolation multi-tenant
    const staffToken = jwt.sign(
      { id: `staff_${event.id}`, role: 'STAFF', eventId: event.id },
      JWT_SECRET,
      { expiresIn: '12h' }
    );
 
    res.json({ success: true, eventId: event.id, eventName: event.name, accessCode: event.access_code, token: staffToken });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
 
export const regenerateAccessCode = (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;
  const userRole = req.user?.role;
 
  try {
    const event = db.prepare('SELECT name, organizer_id FROM events WHERE id = ?').get(id) as any;
    if (!event) return res.status(404).json({ success: false, error: 'Event not found' });
 
    if (userRole !== 'ADMIN' && event.organizer_id !== userId) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }
 
    const prefix = event.name.substring(0, 4).toUpperCase().padEnd(4, 'X').replace(/[^A-Z0-9]/g, 'X');
    const random = Math.floor(1000 + Math.random() * 9000);
    const newCode = `${prefix}-${random}`;
 
    db.prepare('UPDATE events SET access_code = ? WHERE id = ?').run(newCode, id);
 
    res.json({ success: true, access_code: newCode });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
