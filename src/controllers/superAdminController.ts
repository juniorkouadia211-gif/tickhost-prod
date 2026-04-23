import { Response } from 'express';
import { logger } from '../services/logger';
import db from '../db/db';
import { AuthRequest } from '../middlewares/auth';
import { v4 as uuidv4 } from 'uuid';

/**
 * GET /api/admin/global-stats
 */
export const getGlobalStats = (req: AuthRequest, res: Response) => {
  try {
    // 1. Business Volume (Last 24h)
    const revenue24h = db.prepare(`
      SELECT COALESCE(SUM(total_amount), 0) as total 
      FROM orders 
      WHERE status = 'paid' AND created_at >= datetime('now', '-1 day')
    `).get() as any;

    const revenuePrev24h = db.prepare(`
      SELECT COALESCE(SUM(total_amount), 0) as total 
      FROM orders 
      WHERE status = 'paid' AND created_at >= datetime('now', '-2 days') AND created_at < datetime('now', '-1 day')
    `).get() as any;

    const trend = revenuePrev24h.total === 0 ? 100 : ((revenue24h.total - revenuePrev24h.total) / revenuePrev24h.total) * 100;

    // 2. Tickets in circulation (Valid QR codes)
    const ticketsInCirculation = db.prepare(`
      SELECT COUNT(*) as count FROM tickets WHERE status = 'unused'
    `).get() as any;

    // 3. Average Occupation Rate
    const occupation = db.prepare(`
      SELECT 
        AVG(CAST(sold AS FLOAT) / capacity) * 100 as avg_rate
      FROM (
        SELECT 
          e.id,
          (SELECT COUNT(*) FROM tickets t JOIN ticket_types tt ON t.ticket_type_id = tt.id WHERE tt.event_id = e.id) as sold,
          (SELECT SUM(total_quantity) FROM ticket_types WHERE event_id = e.id) as capacity
        FROM events e
        WHERE status = 'published'
      ) WHERE capacity > 0
    `).get() as any;

    // 4. Advertising Revenue (Logo Sales)
    const adRevenue = db.prepare(`SELECT SUM(amount_paid) as total FROM partners`).get() as any;

    // 4. Critical Alerts
    const alerts = db.prepare(`
        SELECT COUNT(*) as count FROM events WHERE is_reported = 1 AND moderation_status = 'approved'
    `).get() as any;

    // 5. Growth Chart (Last 6 months)
    const growthChart = db.prepare(`
      SELECT 
        strftime('%m/%Y', o.created_at) as name,
        COALESCE(SUM(o.total_amount), 0) as value
      FROM orders o
      WHERE o.status = 'paid' AND o.created_at >= date('now', '-6 months')
      GROUP BY name
      ORDER BY o.created_at ASC
    `).all();

    // 6. Recent Activity
    const recentActivity = db.prepare(`
      SELECT action as title, user_id, details, created_at as time
      FROM logs
      ORDER BY created_at DESC LIMIT 10
    `).all();

    res.json({
      success: true,
      kpis: {
        revenue24h: { value: revenue24h.total, trend: Math.round(trend) },
        tickets: ticketsInCirculation.count,
        occupationRate: Math.round(occupation.avg_rate || 0),
        adRevenue: adRevenue.total || 0,
        alerts: alerts.count
      },
      growthChart,
      recentActivity
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * GET /api/admin/events-supervision
 */
export const getEventsSupervision = (req: AuthRequest, res: Response) => {
  try {
    const events = db.prepare(`
      SELECT 
        e.id, e.name, e.image_url, e.status, e.moderation_status, e.is_reported,
        u.full_name as organizer_name, u.email as organizer_email,
        (SELECT COUNT(*) FROM tickets t JOIN ticket_types tt ON t.ticket_type_id = tt.id WHERE tt.event_id = e.id) as sold,
        (SELECT SUM(total_quantity) FROM ticket_types WHERE event_id = e.id) as capacity
      FROM events e
      JOIN users u ON e.organizer_id = u.id
      ORDER BY e.created_at DESC
    `).all();
    res.json({ success: true, events });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * GET /api/admin/organizers
 */
export const getOrganizers = (req: AuthRequest, res: Response) => {
  try {
    const organizers = db.prepare(`
      SELECT 
        u.id, u.full_name, u.email, u.verification_status, u.is_banned,
        (SELECT COUNT(*) FROM events WHERE organizer_id = u.id) as events_count,
        (SELECT COALESCE(SUM(o.total_amount), 0) 
         FROM orders o 
         JOIN order_items oi ON o.id = oi.order_id
         JOIN ticket_types tt ON oi.ticket_type_id = tt.id
         JOIN events e ON tt.event_id = e.id
         WHERE e.organizer_id = u.id AND o.status = 'paid') as total_revenue
      FROM users u
      WHERE u.role = 'ORGANIZER'
      ORDER BY total_revenue DESC
    `).all();
    res.json({ success: true, organizers });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * GET /api/admin/finances
 */
export const getFinances = (req: AuthRequest, res: Response) => {
  try {
    const totalTickets = db.prepare("SELECT COUNT(*) as count FROM tickets").get() as any;
    const globalRevenue = db.prepare("SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE status = 'paid'").get() as any;
    const activeOrganizers = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'ORGANIZER' AND is_banned = 0").get() as any;
    const globalAdRevenue = db.prepare("SELECT COALESCE(SUM(amount_paid), 0) as total FROM partners").get() as any;
    const commissionRateRes = db.prepare("SELECT value FROM system_settings WHERE key = 'commission_rate'").get() as any;
    const commissionRate = parseFloat(commissionRateRes?.value || '5');

    const payouts = db.prepare(`
      SELECT 
        p.*, u.full_name as organizer_name, u.mobile_money_num, u.wave_num
      FROM payouts p
      JOIN users u ON p.organizer_id = u.id
      ORDER BY p.created_at DESC
    `).all();

    res.json({
      success: true,
      stats: {
        totalTickets: totalTickets.count,
        globalRevenue: globalRevenue.total,
        activeOrganizers: activeOrganizers.count,
        adRevenue: globalAdRevenue.total,
        commissionRate
      },
      payouts
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * POST /api/admin/payouts
 * Generate settling for an organizer
 */
export const createPayout = (req: AuthRequest, res: Response) => {
  const { organizerId, amount, commissionRate, method, details } = req.body;
  try {
    const id = uuidv4();
    db.prepare(`
      INSERT INTO payouts (id, organizer_id, amount, commission_rate, payout_method, payout_details, status)
      VALUES (?, ?, ?, ?, ?, ?, 'pending')
    `).run(id, organizerId, amount, commissionRate, method, details);
    
    // Log action
    db.prepare('INSERT INTO logs (id, user_id, action, details) VALUES (?, ?, ?, ?)').run(
        uuidv4(), req.user?.id, 'Payout Created', `Payout of ${amount} for ${organizerId}`
    );

    res.json({ success: true, payoutId: id });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * PUT /api/admin/payouts/:id
 */
export const updatePayoutStatus = (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
      db.prepare("UPDATE payouts SET status = ?, processed_at = ? WHERE id = ?").run(status, status === 'paid' ? new Date().toISOString() : null, id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
}

/**
 * GET /api/admin/moderation
 */
export const getModeration = (req: AuthRequest, res: Response) => {
  try {
    const reported = db.prepare(`
      SELECT e.*, u.full_name as organizer_name 
      FROM events e JOIN users u ON e.organizer_id = u.id 
      WHERE is_reported = 1 OR moderation_status = 'pending'
    `).all();
    res.json({ success: true, reported });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * POST /api/admin/moderate-event
 */
export const moderateEvent = (req: AuthRequest, res: Response) => {
  const { eventId, action, reason } = req.body; // action: 'approve', 'suspend'
  try {
    const status = action === 'approve' ? 'approved' : 'suspended';
    db.prepare("UPDATE events SET moderation_status = ?, report_reason = ?, is_reported = 0 WHERE id = ?").run(status, reason, eventId);
    
    db.prepare('INSERT INTO logs (id, user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?, ?)').run(
        uuidv4(), req.user?.id, `Event ${status}`, 'event', eventId, reason
    );

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * GET /api/admin/settings
 */
export const getSystemSettings = (req: AuthRequest, res: Response) => {
  try {
    const settings = db.prepare("SELECT * FROM system_settings").all();
    const settingsMap = (settings as any[]).reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});
    res.json({ success: true, settings: settingsMap });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * PUT /api/admin/settings
 */
export const updateSystemSettings = (req: AuthRequest, res: Response) => {
  const { settings } = req.body; // { commission_rate: '5', maintenance_mode: 'true', ... }
  try {
    const stmt = db.prepare("INSERT OR REPLACE INTO system_settings (key, value) VALUES (?, ?)");
    for (const [key, value] of Object.entries(settings)) {
      stmt.run(key, String(value));
    }

    // Restore Logging
    db.prepare('INSERT INTO logs (id, user_id, action, details) VALUES (?, ?, ?, ?)').run(
      uuidv4(), req.user?.id, 'System Settings Updated', JSON.stringify(settings)
    );

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * GET /api/admin/client-space
 */
export const getClientSpace = (req: AuthRequest, res: Response) => {
  try {
    const reviews = db.prepare(`
      SELECT e.id, e.name, AVG(f.rating) as avg_rating, COUNT(f.id) as review_count
      FROM events e
      LEFT JOIN feedbacks f ON e.id = f.event_id
      GROUP BY e.id
    `).all();

    const signalings = db.prepare(`
      SELECT st.*, e.name as event_name, u.full_name as user_name, u.email as user_email, u.phone as user_phone
      FROM support_tickets st
      JOIN events e ON st.event_id = e.id
      JOIN users u ON st.user_id = u.id
      ORDER BY st.created_at DESC
    `).all();

    res.json({ success: true, reviews, signalings });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * GET /api/admin/events/:id/feedbacks
 */
export const getEventFeedbacks = (req: AuthRequest, res: Response) => {
  try {
    const feedbacks = db.prepare(`
      SELECT f.*, u.full_name, u.email, u.phone
      FROM feedbacks f
      JOIN users u ON f.user_id = u.id
      WHERE f.event_id = ?
      ORDER BY f.created_at DESC
    `).all(req.params.id);
    res.json({ success: true, feedbacks });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
