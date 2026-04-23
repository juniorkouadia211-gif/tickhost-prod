import { Request, Response } from 'express';
import { logger } from '../services/logger';
import db from '../db/db';
import { verifyTicket } from '../services/qrService';
import { AuthRequest } from '../middlewares/auth';
import { z } from 'zod';
 
export const validateSchema = z.object({
  body: z.object({
    code: z.string().min(1, 'Code manquant'),
    eventId: z.string().optional().nullable(),
  }).passthrough()
});
 
export const getMyTickets = (req: AuthRequest, res: Response) => {
  const email = req.user?.email;
  const tenantSlug = req.query.tenant as string || req.tenantSlug;
 
  try {
    let query = `
      SELECT t.id, t.unique_code, t.qr_code_data, t.status, e.name as eventName, e.event_date as eventDate, tt.name as ticketTypeName
      FROM tickets t
      JOIN orders o ON t.order_id = o.id
      JOIN users u ON o.user_id = u.id
      JOIN ticket_types tt ON t.ticket_type_id = tt.id
      JOIN events e ON tt.event_id = e.id
      WHERE u.email = ? AND o.status = 'paid'
    `;
    
    const params: any[] = [email];
    
    if (tenantSlug) {
      query += " AND e.slug = ?";
      params.push(tenantSlug);
    }
    
    query += " ORDER BY t.created_at DESC";
    
    const tickets = db.prepare(query).all(...params);
    res.json({ success: true, tickets: tickets || [] });
  } catch (err: any) {
    res.status(500).json({ success: false, tickets: [], error: err.message });
  }
};
 
export const validateTicket = (req: Request, res: Response) => {
  try {
    const { code, eventId } = req.body;
 
    // Si pas d'eventId fourni = scan sans session staff ouverte
    // On retourne un message rassurant pour le client qui scanne son propre billet
    if (!eventId) {
      const verifyResult = verifyTicket(code);
      const uniqueCode = verifyResult || (code.includes(':') ? code.split(':')[0] : code);
      const ticket = db.prepare(`
        SELECT tt.name as ticketTypeName, e.name as eventName, e.event_date as eventDate
        FROM tickets t
        JOIN ticket_types tt ON t.ticket_type_id = tt.id
        JOIN events e ON tt.event_id = e.id
        WHERE t.unique_code = ?
      `).get(uniqueCode) as any;
 
      if (ticket) {
        return res.json({
          success: true,
          status: 'client_check',
          message: 'Billet valide — Présentez ce QR code à l\'entrée de l\'événement',
          eventName: ticket.eventName,
          ticketType: ticket.ticketTypeName,
          eventDate: ticket.eventDate
        });
      }
      return res.json({
        success: true,
        status: 'client_check',
        message: 'Billet valide — Présentez ce QR code à l\'entrée de l\'événement'
      });
    }
 
    // Vérification du QR code signé (session staff active)
    const verifyResult = verifyTicket(code);
    let uniqueCode = verifyResult || (code.includes(':') ? code.split(':')[0] : code);
 
    const ticket = db.prepare(`
      SELECT t.*, u.full_name as client_name, tt.event_id, e.slug as event_slug FROM tickets t
      JOIN orders o ON t.order_id = o.id 
      JOIN users u ON o.user_id = u.id
      JOIN ticket_types tt ON t.ticket_type_id = tt.id
      JOIN events e ON tt.event_id = e.id
      WHERE t.unique_code = ?
    `).get(uniqueCode) as any;
 
    if (!ticket) return res.status(404).json({ success: false, status: 'invalid', message: 'Billet Invalide' });
    
    // Isolation Absolue: Check if ticket belongs to the session event
    if (eventId && ticket.event_id !== eventId) {
      logger.warn('Cross-event scan attempt blocked', { ticketId: ticket.id, attemptedEventId: eventId, actualEventId: ticket.event_id });
      return res.status(403).json({ success: false, status: 'wrong_event', message: 'ALERTE : Ce billet appartient à un autre événement. Accès refusé.' });
    }
 
    // Isolation Absolue: Check if ticket belongs to the current tenant (if applicable)
    const currentTenant = req.tenantSlug || req.query.tenant;
    if (currentTenant && ticket.event_slug !== currentTenant) {
      logger.warn('Cross-tenant scan attempt blocked', { ticketId: ticket.id, attemptedTenant: currentTenant, actualTenant: ticket.event_slug });
      return res.status(403).json({ success: false, status: 'forbidden_tenant', message: 'Accès Interdit : Ce billet n\'est pas valide pour cet univers.' });
    }
    
    if (ticket.status === 'used') {
      const usedAt = ticket.validated_at ? new Date(ticket.validated_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : 'inconnue';
      return res.json({ success: false, status: 'already_used', message: `Billet déjà utilisé à ${usedAt}`, clientName: ticket.client_name });
    }
 
    const now = new Date().toISOString();
    db.prepare("UPDATE tickets SET status = 'used', validated_at = ? WHERE id = ?").run(now, ticket.id);
    res.json({ success: true, status: 'valid', message: `Billet Valide - ${ticket.client_name}`, clientName: ticket.client_name });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Erreur interne', message: err.message });
  }
};
 
export const syncTickets = (req: Request, res: Response) => {
  const { scans } = req.body;
  if (!Array.isArray(scans)) return res.status(400).json({ success: false, error: 'Invalid scans format' });
 
  const results = { synced: 0, errors: 0 };
  
  const syncTransaction = db.transaction((scansToSync) => {
    for (const scan of scansToSync) {
      try {
        let uniqueCode = verifyTicket(scan.code);
        if (!uniqueCode) {
          uniqueCode = scan.code.includes(':') ? scan.code.split(':')[0] : scan.code;
        }
 
        if (uniqueCode) {
          const result = db.prepare("UPDATE tickets SET status = 'used', validated_at = ? WHERE unique_code = ? AND status = 'unused'").run(scan.validatedAt, uniqueCode);
          if (result.changes > 0) results.synced++;
          else results.errors++;
        } else {
          results.errors++;
        }
      } catch (e) {
        results.errors++;
      }
    }
  });
 
  try {
    syncTransaction(scans);
    res.json({ success: true, ...results });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};