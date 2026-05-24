import { Request, Response } from 'express';
import { logger } from '../services/logger';
import db from '../db/db';
import { AuthRequest } from '../middlewares/auth';
import { v4 as uuidv4 } from 'uuid';
 
export const getStats = (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    const isOrganizer = user?.role === 'ORGANIZER';
    const isStaff = user?.role === 'STAFF';
    const organizerId = user?.id;
    const tenantSlug = req.tenantSlug || req.query.tenant as string;

    // Isolation hermétique : le STAFF ne peut voir QUE son événement (eventId dans le JWT)
    let eventId = req.query.eventId as string;
    if (isStaff) {
      eventId = (user as any).eventId; // forcé depuis le token signé, non falsifiable
    }
 
    let revenueQuery = "SELECT COALESCE(SUM(o.total_amount), 0) as total FROM orders o WHERE o.status = 'paid'";
    let soldQuery = "SELECT COUNT(*) as count FROM tickets t JOIN orders o ON t.order_id = o.id WHERE o.status = 'paid'";
    let checkinsQuery = "SELECT COUNT(*) as count FROM tickets t JOIN orders o ON t.order_id = o.id WHERE t.status = 'used' AND o.status = 'paid'";
    
    let revenue: any = null;
    let sold: any = null;
    let checkins: any = null;
 
    // Isolation Absolue: Filter by eventId, tenant or organizer
    if (eventId) {
      // Vérifier que l'organisateur a bien accès à cet événement
      if (isOrganizer) {
        const belongsTo = db.prepare('SELECT id FROM events WHERE id = ? AND organizer_id = ?').get(eventId, organizerId);
        if (!belongsTo) return res.status(403).json({ success: false, error: 'Accès refusé à cet événement' });
      }

      revenueQuery = `
        SELECT COALESCE(SUM(oi.price_at_purchase * oi.quantity), 0) as total 
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        JOIN ticket_types tt ON oi.ticket_type_id = tt.id
        WHERE o.status = 'paid' AND tt.event_id = ?
      `;
      revenue = db.prepare(revenueQuery).get(eventId);
      
      soldQuery = `
        SELECT COUNT(*) as count 
        FROM tickets t
        JOIN ticket_types tt ON t.ticket_type_id = tt.id
        JOIN orders o ON t.order_id = o.id
        WHERE o.status = 'paid' AND tt.event_id = ?
      `;
      checkinsQuery = `
        SELECT COUNT(*) as count 
        FROM tickets t
        JOIN ticket_types tt ON t.ticket_type_id = tt.id
        JOIN orders o ON t.order_id = o.id
        WHERE t.status = 'used' AND o.status = 'paid' AND tt.event_id = ?
      `;

      sold = db.prepare(soldQuery).get(eventId);
      checkins = db.prepare(checkinsQuery).get(eventId);
    } else if (tenantSlug) {
      revenueQuery = `
        SELECT COALESCE(SUM(oi.price_at_purchase * oi.quantity), 0) as total 
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        JOIN ticket_types tt ON oi.ticket_type_id = tt.id
        JOIN events e ON tt.event_id = e.id
        WHERE o.status = 'paid' AND e.slug = ?
      `;
      soldQuery = `
        SELECT COUNT(*) as count 
        FROM tickets t
        JOIN ticket_types tt ON t.ticket_type_id = tt.id
        JOIN events e ON tt.event_id = e.id
        JOIN orders o ON t.order_id = o.id
        WHERE o.status = 'paid' AND e.slug = ?
      `;
      checkinsQuery = `
        SELECT COUNT(*) as count 
        FROM tickets t
        JOIN ticket_types tt ON t.ticket_type_id = tt.id
        JOIN events e ON tt.event_id = e.id
        JOIN orders o ON t.order_id = o.id
        WHERE t.status = 'used' AND o.status = 'paid' AND e.slug = ?
      `;
      revenue = db.prepare(revenueQuery).get(tenantSlug);
      sold = db.prepare(soldQuery).get(tenantSlug);
      checkins = db.prepare(checkinsQuery).get(tenantSlug);
    } else if (isOrganizer) {
      revenueQuery = `
        SELECT COALESCE(SUM(oi.price_at_purchase * oi.quantity), 0) as total 
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        JOIN ticket_types tt ON oi.ticket_type_id = tt.id
        JOIN events e ON tt.event_id = e.id
        WHERE o.status = 'paid' AND e.organizer_id = ?
      `;
      soldQuery = `
        SELECT COUNT(*) as count 
        FROM tickets t
        JOIN ticket_types tt ON t.ticket_type_id = tt.id
        JOIN events e ON tt.event_id = e.id
        JOIN orders o ON t.order_id = o.id
        WHERE o.status = 'paid' AND e.organizer_id = ?
      `;
      checkinsQuery = `
        SELECT COUNT(*) as count 
        FROM tickets t
        JOIN ticket_types tt ON t.ticket_type_id = tt.id
        JOIN events e ON tt.event_id = e.id
        JOIN orders o ON t.order_id = o.id
        WHERE t.status = 'used' AND o.status = 'paid' AND e.organizer_id = ?
      `;
      revenue = db.prepare(revenueQuery).get(organizerId);
      sold = db.prepare(soldQuery).get(organizerId);
      checkins = db.prepare(checkinsQuery).get(organizerId);
    }
 
    if (!eventId && !tenantSlug && !isOrganizer) {
      revenue = db.prepare(revenueQuery).get();
      sold = db.prepare(soldQuery).get();
      checkins = db.prepare(checkinsQuery).get();
    }
    
    // 1. Sales evolution (last 7 days)
    let salesEvolutionQuery = `
      SELECT 
        strftime('%d/%m', o.created_at) as date_label,
        COALESCE(SUM(oi.price_at_purchase * oi.quantity), 0) as value
      FROM orders o
      JOIN order_items oi ON oi.order_id = o.id
      JOIN ticket_types tt ON oi.ticket_type_id = tt.id
      JOIN events e ON tt.event_id = e.id
      WHERE o.created_at >= date('now', '-7 days') AND o.status = 'paid'
      ${eventId ? 'AND e.id = ?' : (tenantSlug ? 'AND e.slug = ?' : (isOrganizer ? 'AND e.organizer_id = ?' : ''))}
      GROUP BY date_label
      ORDER BY date_label ASC
    `;
 
    const salesParams = eventId ? [eventId] : (tenantSlug ? [tenantSlug] : (isOrganizer ? [organizerId] : []));
    const salesEvolutionRaw = db.prepare(salesEvolutionQuery).all(...salesParams);
    const salesEvolution = (salesEvolutionRaw as any[]).map(row => ({
      name: row.date_label,
      value: row.value
    }));
 
    // 2. Filling stats
    let eventFillingQuery = `
      SELECT 
        e.id, e.name, e.slug, e.primary_color,
        (SELECT COUNT(*) FROM tickets t JOIN ticket_types tt ON t.ticket_type_id = tt.id WHERE tt.event_id = e.id) as sold,
        (SELECT COUNT(*) FROM tickets t JOIN ticket_types tt ON t.ticket_type_id = tt.id WHERE tt.event_id = e.id AND t.status = 'used') as scanned,
        (SELECT COALESCE(SUM(total_quantity), 0) FROM ticket_types WHERE event_id = e.id) as capacity
      FROM events e
      WHERE e.status = 'published'
      ${eventId ? 'AND e.id = ?' : (tenantSlug ? 'AND e.slug = ?' : (isOrganizer ? 'AND e.organizer_id = ?' : ''))}
    `;
    const eventFilling = db.prepare(eventFillingQuery).all(...salesParams);
 
    // 3. Operator distribution
    let operatorStatsQuery = `
      SELECT o.operator as name, COUNT(DISTINCT o.id) as value
      FROM orders o
      JOIN order_items oi ON oi.order_id = o.id
      JOIN ticket_types tt ON oi.ticket_type_id = tt.id
      JOIN events e ON tt.event_id = e.id
      WHERE o.status = 'paid' AND o.operator IS NOT NULL
      ${eventId ? 'AND e.id = ?' : (tenantSlug ? 'AND e.slug = ?' : (isOrganizer ? 'AND e.organizer_id = ?' : ''))}
      GROUP BY o.operator
    `;
    const operatorStats = db.prepare(operatorStatsQuery).all(...salesParams);
 
    // 4. Recent transactions
    let recentTransactionsQuery = `
      SELECT u.full_name as client_name, SUM(oi.price_at_purchase * oi.quantity) as amount, o.phone_number, o.operator, o.created_at
      FROM orders o 
      JOIN order_items oi ON oi.order_id = o.id
      JOIN ticket_types tt ON oi.ticket_type_id = tt.id
      JOIN events e ON tt.event_id = e.id
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.status = 'paid' 
      ${eventId ? 'AND e.id = ?' : (tenantSlug ? 'AND e.slug = ?' : (isOrganizer ? 'AND e.organizer_id = ?' : ''))}
      GROUP BY o.id
      ORDER BY o.created_at DESC LIMIT 10
    `;
    const recentTransactions = db.prepare(recentTransactionsQuery).all(...salesParams);
 
    // 5. Ticket types
    let ticketTypeStatsQuery = `
      SELECT tt.name, COUNT(t.id) as sold, tt.total_quantity as capacity
      FROM ticket_types tt
      LEFT JOIN tickets t ON t.ticket_type_id = tt.id
      JOIN events e ON tt.event_id = e.id
      LEFT JOIN orders o ON t.order_id = o.id AND o.status = 'paid'
      WHERE 1=1
      ${eventId ? 'AND e.id = ?' : (tenantSlug ? 'AND e.slug = ?' : (isOrganizer ? 'AND e.organizer_id = ?' : ''))}
      GROUP BY tt.id
    `;
    const ticketTypeStats = db.prepare(ticketTypeStatsQuery).all(...salesParams);
 
    res.json({ 
      success: true,
      totalRevenue: (revenue as any)?.total || 0, 
      ticketsSold: (sold as any)?.count || 0, 
      checkins: (checkins as any)?.count || 0, 
      recentTransactions,
      salesEvolution,
      eventFilling,
      operatorStats,
      ticketTypeStats
    });
  } catch (err: any) {
    logger.error('Stats error', { error: err.message });
    res.status(500).json({ success: false, error: err.message });
  }
};
 
export const getRecentScans = (req: AuthRequest, res: Response) => {
  try {
    const isOrganizer = req.user?.role === 'ORGANIZER';
    const isStaff = req.user?.role === 'STAFF';
    const organizerId = req.user?.id;

    // Isolation hermétique STAFF : forcer l'eventId du token
    const eventId = isStaff ? (req.user as any).eventId : req.query.eventId as string;
    if (!eventId) return res.status(400).json({ success: false, error: 'eventId requis' });

    if (isOrganizer) {
      const belongsTo = db.prepare('SELECT id FROM events WHERE id = ? AND organizer_id = ?').get(eventId, organizerId);
      if (!belongsTo) return res.status(403).json({ success: false, error: 'Accès refusé' });
    }
 
    let query = `
      SELECT t.id, u.full_name as name, tt.name as type, t.validated_at as time, t.status
      FROM tickets t
      JOIN ticket_types tt ON t.ticket_type_id = tt.id
      JOIN events e ON tt.event_id = e.id
      JOIN orders o ON t.order_id = o.id
      JOIN users u ON o.user_id = u.id
      WHERE e.id = ? AND t.status IN ('used', 'already_used')
    `;
 
    if (isOrganizer) {
      query += " AND e.organizer_id = ?";
    }
    query += " ORDER BY t.validated_at DESC LIMIT 50";
 
    const params = isOrganizer ? [eventId, organizerId] : [eventId];
    const scans = db.prepare(query).all(...params);
 
    res.json({ success: true, scans });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
 
export const seedTestData = (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    const isOrganizer = user?.role === 'ORGANIZER';
    const organizerId = user?.id;
 
    const operators = ['Wave', 'Orange', 'MTN', 'Moov'];
    
    let eventQuery = 'SELECT id FROM events';
    if (isOrganizer) {
      eventQuery += ' WHERE organizer_id = ?';
    }
    eventQuery += ' LIMIT 1';
 
    const event = isOrganizer ? db.prepare(eventQuery).get(organizerId) : db.prepare(eventQuery).get() as { id: string };
    const dbUser = db.prepare('SELECT id FROM users LIMIT 1').get() as { id: string };
    
    if (!event || !dbUser) throw new Error('Event or User not found for seeding');
 
    db.transaction(() => {
      const ticketType = db.prepare('SELECT id, price FROM ticket_types WHERE event_id = ? LIMIT 1').get((event as any).id) as { id: string, price: number };
      if (!ticketType) return;
 
      for (let i = 0; i < 20; i++) {
        const orderId = `TEST-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
        const amount = ticketType.price;
        const operator = operators[Math.floor(Math.random() * operators.length)];
        const date = new Date();
        date.setDate(date.getDate() - Math.floor(Math.random() * 7));
        const dateStr = date.toISOString();
 
        db.prepare(`
          INSERT INTO orders (id, user_id, total_amount, status, operator, phone_number, created_at)
          VALUES (?, ?, ?, 'paid', ?, '0700000000', ?)
        `).run(orderId, dbUser.id, amount, operator, dateStr);
 
        db.prepare(`
          INSERT INTO order_items (id, order_id, ticket_type_id, quantity, price_at_purchase)
          VALUES (?, ?, ?, 1, ?)
        `).run(uuidv4(), orderId, ticketType.id, ticketType.price);
 
        const ticketId = uuidv4();
        const uniqueCode = `TK-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
        db.prepare(`
          INSERT INTO tickets (id, order_id, ticket_type_id, unique_code, qr_code_data, status, created_at)
          VALUES (?, ?, ?, ?, ?, 'unused', ?)
        `).run(ticketId, orderId, ticketType.id, uniqueCode, uniqueCode, dateStr);
      }
    })();
 
    res.json({ success: true, message: '20 test orders seeded' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
 
export const getParticipants = (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    const isOrganizer = user?.role === 'ORGANIZER';
    const organizerId = user?.id;
 
    let query = `
      SELECT 
        u.full_name as name,
        u.email,
        u.phone,
        t.status as scan_status,
        tt.name as ticket_type,
        e.name as event_name,
        o.created_at as purchase_date,
        o.total_amount as amount
      FROM tickets t
      JOIN orders o ON t.order_id = o.id
      JOIN users u ON o.user_id = u.id
      JOIN ticket_types tt ON t.ticket_type_id = tt.id
      JOIN events e ON tt.event_id = e.id
      WHERE o.status = 'paid'
    `;
 
    if (isOrganizer) {
      query += " AND e.organizer_id = ?";
    }
    query += " ORDER BY o.created_at DESC";
 
    const participants = isOrganizer ? db.prepare(query).all(organizerId) : db.prepare(query).all();
    res.json(participants);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
 
export const exportParticipants = (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    const isOrganizer = user?.role === 'ORGANIZER';
    const organizerId = user?.id;
 
    let query = `
      SELECT 
        u.full_name as name,
        u.email,
        u.phone,
        t.status as scan_status,
        tt.name as ticket_type,
        e.name as event_name,
        o.created_at as purchase_date
      FROM tickets t
      JOIN orders o ON t.order_id = o.id
      JOIN users u ON o.user_id = u.id
      JOIN ticket_types tt ON t.ticket_type_id = tt.id
      JOIN events e ON tt.event_id = e.id
      WHERE o.status = 'paid'
    `;
 
    if (isOrganizer) {
      query += " AND e.organizer_id = ?";
    }
 
    const participants = isOrganizer ? db.prepare(query).all(organizerId) : db.prepare(query).all() as any[];
 
    // Generate CSV with semicolon separator and UTF-8 BOM
    const headers = ['Nom', 'Email', 'Téléphone', 'Statut Scan', 'Type Billet', 'Événement', 'Date Achat'];
    const rows = (participants as any[]).map(p => [
      p.name,
      p.email,
      p.phone || '',
      p.scan_status === 'used' ? 'Scanné' : 'Non scanné',
      p.ticket_type,
      p.event_name,
      p.purchase_date
    ]);
 
    const csvContent = '\ufeff' + [
      headers.join(';'),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(';'))
    ].join('\n');
 
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=participants.csv');
    res.send(csvContent);
  } catch (err: any) {
    logger.error('Export error', { error: err.message });
    res.status(500).json({ error: err.message });
  }
};
 
export const exportTickets = (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    const isOrganizer = user?.role === 'ORGANIZER';
    const organizerId = user?.id;
 
    let query = `
      SELECT t.unique_code, t.qr_code_data, t.status, u.full_name as client_name, tt.event_id
      FROM tickets t
      JOIN orders o ON t.order_id = o.id
      JOIN users u ON o.user_id = u.id
      JOIN ticket_types tt ON t.ticket_type_id = tt.id
      JOIN events e ON tt.event_id = e.id
      WHERE o.status = 'paid'
    `;
 
    if (isOrganizer) {
      query += " AND e.organizer_id = ?";
    }
 
    const tickets = isOrganizer ? db.prepare(query).all(organizerId) : db.prepare(query).all();
    res.json(tickets);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
 
// --- GESTION DES COMPTES ORGANISATEURS ---
 
// GET /admin/organizers — liste tous les organisateurs
export const getOrganizers = (req: AuthRequest, res: Response) => {
  try {
    const organizers = db.prepare(`
      SELECT 
        u.id, u.full_name, u.email, u.phone, u.is_banned,
        u.created_at,
        u.wave_num, u.mobile_money_num, u.payout_frequency,
        COUNT(DISTINCT e.id) as events_count,
        COALESCE(SUM(CASE WHEN o.status = 'paid' THEN o.total_amount ELSE 0 END), 0) as total_revenue
      FROM users u
      LEFT JOIN events e ON e.organizer_id = u.id
      LEFT JOIN orders o ON o.user_id = u.id
      WHERE u.role = 'ORGANIZER'
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `).all();
    res.json({ success: true, organizers });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
 
// PATCH /admin/organizers/:id/suspend — suspendre ou réactiver un organisateur
export const toggleSuspendOrganizer = (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const user = db.prepare('SELECT id, full_name, is_banned, role FROM users WHERE id = ?').get(id) as any;
    if (!user) return res.status(404).json({ success: false, error: 'Utilisateur introuvable' });
    if (user.role === 'ADMIN') return res.status(403).json({ success: false, error: 'Impossible de suspendre un admin' });
 
    const newStatus = user.is_banned ? 0 : 1;
    db.prepare('UPDATE users SET is_banned = ? WHERE id = ?').run(newStatus, id);
 
    const action = newStatus === 1 ? 'suspendu' : 'réactivé';
    logger.info(`Organisateur ${action}`, { targetId: id, byAdmin: req.user?.id });
 
    res.json({
      success: true,
      message: `Compte de ${user.full_name} ${action} avec succès`,
      is_banned: newStatus === 1
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
 
// DELETE /admin/organizers/:id — supprimer un compte organisateur
export const deleteOrganizer = (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const user = db.prepare('SELECT id, full_name, role FROM users WHERE id = ?').get(id) as any;
    if (!user) return res.status(404).json({ success: false, error: 'Utilisateur introuvable' });
    if (user.role === 'ADMIN') return res.status(403).json({ success: false, error: 'Impossible de supprimer un admin' });
 
    db.transaction(() => {
      // Désassocier les événements de cet organisateur avant suppression
      db.prepare("UPDATE events SET organizer_id = NULL WHERE organizer_id = ?").run(id);
      db.prepare('DELETE FROM users WHERE id = ?').run(id);
    })();
 
    logger.info('Compte organisateur supprimé', { targetId: id, byAdmin: req.user?.id });
    res.json({ success: true, message: `Compte de ${user.full_name} supprimé` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
