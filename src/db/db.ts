import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { logger } from '../services/logger';
import fs from 'fs';
import path from 'path';
 
const dbPath = process.env.DB_PATH || 'ticketing.db';

// Ensure directory exists if DB_PATH is in a subfolder (like /data/ticketing.db)
const dbDir = path.dirname(path.resolve(dbPath));
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}
 
// Reset DB if requested or if it seems corrupted
if (fs.existsSync('reset_db.flag')) {
  logger.info('Resetting database as requested...');
  try {
    if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
    fs.unlinkSync('reset_db.flag');
  } catch (e) {
    logger.error('Failed to reset DB', { error: (e as Error).message });
  }
}
 
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
 
// --- DATABASE SCHEMA ---
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'USER',
    phone TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
 
  CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    description TEXT,
    event_date DATETIME NOT NULL,
    location TEXT NOT NULL,
    image_url TEXT,
    primary_color TEXT DEFAULT '#10b981',
    status TEXT DEFAULT 'published',
    organizer_id TEXT REFERENCES users(id),
    access_code TEXT UNIQUE,
    show_logo_instead_of_name INTEGER DEFAULT 0,
    logo_url_main TEXT,
    gallery_title TEXT,
    home_options TEXT,
    partner_billing_enabled INTEGER DEFAULT 1,
    organizer_name TEXT,
    partners TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
 
  CREATE TABLE IF NOT EXISTS ticket_types (
    id TEXT PRIMARY KEY,
    event_id TEXT REFERENCES events(id),
    name TEXT NOT NULL,
    price REAL NOT NULL,
    total_quantity INTEGER NOT NULL,
    available_quantity INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
 
  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id),
    total_amount REAL NOT NULL,
    status TEXT DEFAULT 'pending',
    operator TEXT,
    phone_number TEXT,
    transaction_id TEXT UNIQUE,
    expires_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
 
  CREATE TABLE IF NOT EXISTS order_items (
    id TEXT PRIMARY KEY,
    order_id TEXT REFERENCES orders(id),
    ticket_type_id TEXT REFERENCES ticket_types(id),
    quantity INTEGER NOT NULL,
    price_at_purchase REAL NOT NULL
  );
 
  CREATE TABLE IF NOT EXISTS tickets (
    id TEXT PRIMARY KEY,
    order_id TEXT REFERENCES orders(id),
    ticket_type_id TEXT REFERENCES ticket_types(id),
    unique_code TEXT UNIQUE NOT NULL,
    qr_code_data TEXT NOT NULL,
    status TEXT DEFAULT 'unused',
    validated_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
 
  CREATE TABLE IF NOT EXISTS system_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
 
  CREATE TABLE IF NOT EXISTS payouts (
    id TEXT PRIMARY KEY,
    organizer_id TEXT REFERENCES users(id),
    amount REAL NOT NULL,
    commission_rate REAL NOT NULL,
    payout_method TEXT,
    payout_details TEXT,
    status TEXT DEFAULT 'pending',
    processed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
 
  CREATE TABLE IF NOT EXISTS logs (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id),
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id TEXT,
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
 
  CREATE TABLE IF NOT EXISTS promo_codes (
    id TEXT PRIMARY KEY,
    event_id TEXT REFERENCES events(id),
    code TEXT NOT NULL,
    reduction_percent REAL NOT NULL,
    is_active INTEGER DEFAULT 1,
    usage_count INTEGER DEFAULT 0,
    total_saved REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
 
  CREATE TABLE IF NOT EXISTS feedbacks (
    id TEXT PRIMARY KEY,
    event_id TEXT REFERENCES events(id),
    user_id TEXT REFERENCES users(id),
    rating INTEGER NOT NULL,
    comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
 
  CREATE TABLE IF NOT EXISTS organizer_subscriptions (
    id TEXT PRIMARY KEY,
    organizer_id TEXT REFERENCES users(id) UNIQUE,
    plan TEXT DEFAULT 'free',
    status TEXT DEFAULT 'inactive',
    started_at DATETIME,
    expires_at DATETIME,
    cinetpay_subscription_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
 
  CREATE TABLE IF NOT EXISTS organizer_requests (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id),
    motivation TEXT NOT NULL,
    structure_name TEXT NOT NULL,
    phone TEXT,
    status TEXT DEFAULT 'pending',
    reviewed_by TEXT REFERENCES users(id),
    reason TEXT,
    reviewed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
 
  CREATE TABLE IF NOT EXISTS support_tickets (
    id TEXT PRIMARY KEY,
    event_id TEXT REFERENCES events(id),
    user_id TEXT REFERENCES users(id),
    email_whatsapp TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
 
  CREATE TABLE IF NOT EXISTS partners (
    id TEXT PRIMARY KEY,
    event_id TEXT REFERENCES events(id),
    name TEXT,
    logo_url TEXT NOT NULL,
    is_paid INTEGER DEFAULT 0,
    amount_paid REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
 
  CREATE INDEX IF NOT EXISTS idx_tickets_unique_code ON tickets(unique_code);
  CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
  CREATE INDEX IF NOT EXISTS idx_ticket_types_event_id ON ticket_types(event_id);
  CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
  CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
`);
 
// --- MIGRATIONS ---
try {
  // Helper to check column existence (SQLite specific, but logic is standard)
  const getColumns = (table: string) => db.prepare(`PRAGMA table_info(${table})`).all() as any[];
  
  const userColumns = getColumns('users');
  if (!userColumns.some(c => c.name === 'password')) {
    db.exec("ALTER TABLE users ADD COLUMN password TEXT");
  }
  if (!userColumns.some(c => c.name === 'role')) {
    db.exec("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'USER'");
  }
  if (!userColumns.some(c => c.name === 'mobile_money_num')) {
    db.exec("ALTER TABLE users ADD COLUMN mobile_money_num TEXT");
  }
  if (!userColumns.some(c => c.name === 'wave_num')) {
    db.exec("ALTER TABLE users ADD COLUMN wave_num TEXT");
  }
  if (!userColumns.some(c => c.name === 'payout_frequency')) {
    db.exec("ALTER TABLE users ADD COLUMN payout_frequency TEXT DEFAULT 'weekly'");
  }
 
  const orderColumns = getColumns('orders');
  // Handle renaming payment_status to status if it exists
  if (!orderColumns.some(c => c.name === 'status')) {
    if (orderColumns.some(c => c.name === 'payment_status')) {
      try {
        db.exec("ALTER TABLE orders RENAME COLUMN payment_status TO status");
      } catch (e) {
        // Fallback for older SQLite: Add column and copy data
        db.exec("ALTER TABLE orders ADD COLUMN status TEXT DEFAULT 'pending'");
        db.exec("UPDATE orders SET status = payment_status");
      }
    } else {
      db.exec("ALTER TABLE orders ADD COLUMN status TEXT DEFAULT 'pending'");
    }
  }
 
  if (!orderColumns.some(c => c.name === 'operator')) {
    db.exec("ALTER TABLE orders ADD COLUMN operator TEXT");
  }
  if (!orderColumns.some(c => c.name === 'phone_number')) {
    db.exec("ALTER TABLE orders ADD COLUMN phone_number TEXT");
  }
  if (!orderColumns.some(c => c.name === 'transaction_id')) {
    db.exec("ALTER TABLE orders ADD COLUMN transaction_id TEXT");
  }
  if (!orderColumns.some(c => c.name === 'expires_at')) {
    db.exec("ALTER TABLE orders ADD COLUMN expires_at DATETIME");
  }
 
  const eventColumns = getColumns('events');
  if (!eventColumns.some(c => c.name === 'organizer_id')) {
    db.exec("ALTER TABLE events ADD COLUMN organizer_id TEXT REFERENCES users(id)");
  }
  if (!eventColumns.some(c => c.name === 'slug')) {
    db.exec("ALTER TABLE events ADD COLUMN slug TEXT");
    // Generate slugs for existing events
    const events = db.prepare("SELECT id, name FROM events").all() as any[];
    for (const event of events) {
      const slug = event.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
      db.prepare("UPDATE events SET slug = ? WHERE id = ?").run(slug, event.id);
    }
  }
  if (!eventColumns.some(c => c.name === 'primary_color')) {
    db.exec("ALTER TABLE events ADD COLUMN primary_color TEXT DEFAULT '#10b981'");
  }
  if (!eventColumns.some(c => c.name === 'welcome_message')) {
    db.exec("ALTER TABLE events ADD COLUMN welcome_message TEXT");
  }
  if (!eventColumns.some(c => c.name === 'info_content')) {
    db.exec("ALTER TABLE events ADD COLUMN info_content TEXT");
  }
  if (!eventColumns.some(c => c.name === 'access_code')) {
    db.exec("ALTER TABLE events ADD COLUMN access_code TEXT");
    // Generate access codes for existing events
    const events = db.prepare("SELECT id, name FROM events").all() as any[];
    for (const event of events) {
      const prefix = event.name.substring(0, 4).toUpperCase().replace(/[^A-Z]/g, 'E');
      const year = new Date().getFullYear().toString().substring(2);
      const code = `${prefix}${year}`;
      db.prepare("UPDATE events SET access_code = ? WHERE id = ?").run(code, event.id);
    }
  }
  if (!eventColumns.some(c => c.name === 'gallery_images')) {
    db.exec("ALTER TABLE events ADD COLUMN gallery_images TEXT");
  }
  if (!eventColumns.some(c => c.name === 'bg_type')) {
    db.exec("ALTER TABLE events ADD COLUMN bg_type TEXT DEFAULT 'color'");
  }
  if (!eventColumns.some(c => c.name === 'bg_image')) {
    db.exec("ALTER TABLE events ADD COLUMN bg_image TEXT");
  }
  if (!eventColumns.some(c => c.name === 'support_email')) {
    db.exec("ALTER TABLE events ADD COLUMN support_email TEXT");
  }
  if (!eventColumns.some(c => c.name === 'support_whatsapp')) {
    db.exec("ALTER TABLE events ADD COLUMN support_whatsapp TEXT");
  }
  if (!eventColumns.some(c => c.name === 'options')) {
    db.exec("ALTER TABLE events ADD COLUMN options TEXT");
  }
  if (!eventColumns.some(c => c.name === 'info_options')) {
    db.exec("ALTER TABLE events ADD COLUMN info_options TEXT");
  }
  if (!eventColumns.some(c => c.name === 'info_sections')) {
    db.exec("ALTER TABLE events ADD COLUMN info_sections TEXT");
  }
  if (!eventColumns.some(c => c.name === 'payment_modes')) {
    db.exec("ALTER TABLE events ADD COLUMN payment_modes TEXT");
  }
  if (!eventColumns.some(c => c.name === 'is_reported')) {
    db.exec("ALTER TABLE events ADD COLUMN is_reported INTEGER DEFAULT 0");
  }
  if (!eventColumns.some(c => c.name === 'report_reason')) {
    db.exec("ALTER TABLE events ADD COLUMN report_reason TEXT");
  }
  if (!eventColumns.some(c => c.name === 'moderation_status')) {
    db.exec("ALTER TABLE events ADD COLUMN moderation_status TEXT DEFAULT 'approved'");
  }
  if (!eventColumns.some(c => c.name === 'bg_intensity')) {
    db.exec("ALTER TABLE events ADD COLUMN bg_intensity REAL DEFAULT 1.0");
  }
  if (!eventColumns.some(c => c.name === 'bg_opacity')) {
    db.exec("ALTER TABLE events ADD COLUMN bg_opacity REAL DEFAULT 1.0");
  }
  if (!eventColumns.some(c => c.name === 'show_logo_instead_of_name')) {
    db.exec("ALTER TABLE events ADD COLUMN show_logo_instead_of_name INTEGER DEFAULT 0");
  }
  if (!eventColumns.some(c => c.name === 'logo_url_main')) {
    db.exec("ALTER TABLE events ADD COLUMN logo_url_main TEXT");
  }
  if (!eventColumns.some(c => c.name === 'partner_billing_enabled')) {
    db.exec("ALTER TABLE events ADD COLUMN partner_billing_enabled INTEGER DEFAULT 1");
  }
  if (!eventColumns.some(c => c.name === 'organizer_name')) {
    db.exec("ALTER TABLE events ADD COLUMN organizer_name TEXT");
  }
  if (!eventColumns.some(c => c.name === 'gallery_title')) {
    db.exec("ALTER TABLE events ADD COLUMN gallery_title TEXT");
  }
  if (!eventColumns.some(c => c.name === 'home_options')) {
    db.exec("ALTER TABLE events ADD COLUMN home_options TEXT");
  }
  if (!eventColumns.some(c => c.name === 'partners')) {
    db.exec("ALTER TABLE events ADD COLUMN partners TEXT");
  }
  if (!eventColumns.some(c => c.name === 'updated_at')) {
    db.exec("ALTER TABLE events ADD COLUMN updated_at DATETIME");
  }
 
  const orderColumns2 = getColumns('orders');
  if (!orderColumns2.some(c => c.name === 'promo_code_id')) {
    db.exec("ALTER TABLE orders ADD COLUMN promo_code_id TEXT REFERENCES promo_codes(id)");
  }
  if (!orderColumns2.some(c => c.name === 'discount_amount')) {
    db.exec("ALTER TABLE orders ADD COLUMN discount_amount REAL DEFAULT 0");
  }
 
  const promoColumns = getColumns('promo_codes');
  if (!promoColumns.some(c => c.name === 'usage_count')) {
    db.exec("ALTER TABLE promo_codes ADD COLUMN usage_count INTEGER DEFAULT 0");
  }
  if (!promoColumns.some(c => c.name === 'total_saved')) {
    db.exec("ALTER TABLE promo_codes ADD COLUMN total_saved REAL DEFAULT 0");
  }
 
  const userColumns2 = getColumns('users');
  if (!userColumns2.some(c => c.name === 'is_banned')) {
    db.exec("ALTER TABLE users ADD COLUMN is_banned INTEGER DEFAULT 0");
  }
  if (!userColumns2.some(c => c.name === 'verification_status')) {
    db.exec("ALTER TABLE users ADD COLUMN verification_status TEXT DEFAULT 'pending'");
  }
 
  // Init settings
  const hasSettings = db.prepare('SELECT COUNT(*) as count FROM system_settings').get() as { count: number };
  if (hasSettings.count === 0) {
    db.prepare('INSERT INTO system_settings (key, value) VALUES (?, ?)').run('commission_rate', '5');
    db.prepare('INSERT INTO system_settings (key, value) VALUES (?, ?)').run('maintenance_mode', 'false');
    db.prepare('INSERT INTO system_settings (key, value) VALUES (?, ?)').run('registrations_open', 'true');
    db.prepare('INSERT INTO system_settings (key, value) VALUES (?, ?)').run('auto_validation', 'false');
    db.prepare('INSERT INTO system_settings (key, value) VALUES (?, ?)').run('min_payout_threshold', '5000');
    db.prepare('INSERT INTO system_settings (key, value) VALUES (?, ?)').run('payout_delay_days', '7');
    db.prepare('INSERT INTO system_settings (key, value) VALUES (?, ?)').run('free_partner_logos', '3');
    db.prepare('INSERT INTO system_settings (key, value) VALUES (?, ?)').run('extra_logo_price', '5000');
    db.prepare('INSERT INTO system_settings (key, value) VALUES (?, ?)').run('partner_billing_global', 'true');
  }
} catch (err: any) {
  logger.error("Migration error", { error: err.message });
}
 
// --- SEED ADMIN ---
// On crée le compte admin UNIQUEMENT s'il n'existe pas déjà.
// On ne touche JAMAIS au mot de passe existant pour ne pas écraser
// un mot de passe changé depuis l'interface.
const adminEmail = 'admin@eventtick.com';
let existingAdmin = db.prepare('SELECT id FROM users WHERE email = ?').get(adminEmail) as any;
 
if (!existingAdmin) {
  // Premier démarrage uniquement — changer ce mot de passe immédiatement après connexion
  const adminId = uuidv4();
  const defaultPw = bcrypt.hashSync('admin123', 10);
  db.prepare('INSERT INTO users (id, full_name, email, password, role) VALUES (?, ?, ?, ?, ?)').run(
    adminId, 'Admin User', adminEmail, defaultPw, 'ADMIN'
  );
  existingAdmin = { id: adminId };
  logger.warn('Compte admin créé avec mot de passe par défaut. Changez-le immédiatement !');
} else {
  // Admin existant : on s'assure juste que le rôle est ADMIN,
  // sans jamais toucher au mot de passe.
  db.prepare("UPDATE users SET role = 'ADMIN' WHERE email = ?").run(adminEmail);
}
 
// --- SEED EVENTS ---
const seedEvents = () => {
  const eventsCount = db.prepare('SELECT COUNT(*) as count FROM events').get() as { count: number };
  if (eventsCount.count === 0) {
    const events = [
      {
        id: uuidv4(),
        name: 'Concert Afrobeat Live',
        slug: 'concert-afrobeat',
        description: 'Une soirée exceptionnelle avec les plus grandes stars de l\'Afrobeat. Rythme, danse et ambiance garantie !',
        event_date: '2026-06-15T20:00:00',
        location: 'Palais de la Culture, Abidjan',
        image_url: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=800&q=80',
        ticketTypes: [
          { name: 'Standard', price: 10000, qty: 500 },
          { name: 'VIP', price: 25000, qty: 100 },
          { name: 'VVIP', price: 50000, qty: 50 }
        ]
      },
      {
        id: uuidv4(),
        name: 'Festival Gastronomique Ivoirien',
        slug: 'festival-gastro',
        description: 'Découvrez les saveurs authentiques de la Côte d\'Ivoire. Plus de 50 stands, dégustations et ateliers culinaires.',
        event_date: '2026-07-10T11:00:00',
        location: 'Espace Laguna, Cocody',
        image_url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80',
        ticketTypes: [
          { name: 'Pass Journée', price: 5000, qty: 1000 },
          { name: 'Pass Gourmet', price: 15000, qty: 200 }
        ]
      },
      {
        id: uuidv4(),
        name: 'Journée de l\'Élégance',
        slug: 'journee-de-l-elegance',
        description: 'Le rendez-vous incontournable du chic et du raffinement. Défilés, cocktails et networking dans un cadre prestigieux.',
        event_date: '2026-05-18T19:30:00',
        location: 'Palais de la Culture, Abidjan',
        image_url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=800&q=80',
        primary_color: '#10b981',
        welcome_message: 'Bienvenue à la Journée de l\'Élégance. Préparez-vous pour une soirée inoubliable.',
        ticketTypes: [
          { name: 'Standard', price: 15000, qty: 300 },
          { name: 'VIP', price: 35000, qty: 100 },
          { name: 'Prestige', price: 75000, qty: 50 }
        ]
      }
    ];
 
    for (const event of events) {
      const prefix = event.name.substring(0, 4).toUpperCase().replace(/[^A-Z]/g, 'E');
      const year = new Date().getFullYear().toString().substring(2);
      const accessCode = `${prefix}${year}`;
      
      db.prepare('INSERT INTO events (id, name, slug, description, event_date, location, image_url, organizer_id, primary_color, welcome_message, access_code) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
        event.id, event.name, event.slug, event.description, event.event_date, event.location, event.image_url, existingAdmin ? existingAdmin.id : uuidv4(), (event as any).primary_color || '#10b981', (event as any).welcome_message || null, accessCode
      );
 
      for (const tt of event.ticketTypes) {
        db.prepare('INSERT INTO ticket_types (id, event_id, name, price, total_quantity, available_quantity) VALUES (?, ?, ?, ?, ?, ?)').run(
          uuidv4(), event.id, tt.name, tt.price, tt.qty, tt.qty
        );
      }
    }
    logger.info('Test events seeded successfully');
  }
 
  // Ensure 'Journée de l\'Élégance' exists for the microsite demo
  const eleganceSlug = 'journee-de-l-elegance';
  const existingElegance = db.prepare('SELECT id FROM events WHERE slug = ?').get(eleganceSlug);
  
  if (!existingElegance) {
    const eventId = uuidv4();
    const organizerId = existingAdmin ? existingAdmin.id : uuidv4();
    
    db.transaction(() => {
      db.prepare(`
        INSERT INTO events (id, name, slug, description, event_date, location, image_url, organizer_id, primary_color, welcome_message, status, access_code)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        eventId, 
        'Journée de l\'Élégance', 
        eleganceSlug, 
        'Le rendez-vous incontournable du chic et du raffinement. Défilés, cocktails et networking dans un cadre prestigieux.',
        '2026-05-18T19:30:00',
        'Palais de la Culture, Abidjan',
        'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=800&q=80',
        organizerId,
        '#10b981',
        'Bienvenue à la Journée de l\'Élégance. Préparez-vous pour une soirée inoubliable.',
        'published',
        'ELEG26'
      );
 
      const ticketTypes = [
        { name: 'Standard', price: 15000, qty: 300 },
        { name: 'VIP', price: 35000, qty: 100 },
        { name: 'Prestige', price: 75000, qty: 50 }
      ];
 
      for (const tt of ticketTypes) {
        db.prepare(`
          INSERT INTO ticket_types (id, event_id, name, price, total_quantity, available_quantity)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(uuidv4(), eventId, tt.name, tt.price, tt.qty, tt.qty);
      }
    })();
    logger.info('Journée de l\'Élégance event forced seed');
  }
};
 
seedEvents();
 
export default db;