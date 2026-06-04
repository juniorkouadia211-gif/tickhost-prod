import { Request, Response } from 'express';
import { logger } from '../services/logger';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/db';
import { z } from 'zod';
 
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-for-dev';
 
export const registerSchema = z.object({
  body: z.object({
    fullName: z.string().min(2, 'Nom trop court'),
    email: z.string().email('Email invalide'),
    password: z.string().min(6, 'Mot de passe trop court (min 6)'),
    phone: z.string().nullable().optional().or(z.literal("")),
    // USER ou ORGANIZER uniquement — jamais ADMIN
    role: z.enum(['USER', 'ORGANIZER']).optional().default('USER'),
  }).passthrough()
});
 
export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Email invalide'),
    password: z.string().min(1, 'Mot de passe requis'),
  }).passthrough()
});
 
 
export const register = async (req: Request, res: Response) => {
  const { fullName, email, password, phone, role } = req.body;
  // Zod garantit déjà que role est 'USER' ou 'ORGANIZER' — jamais 'ADMIN'
  const userRole = role || 'USER';
 
  try {
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) return res.status(400).json({ success: false, error: 'Email already exists' });
 
    const id = uuidv4();
    const hashedPassword = await bcrypt.hash(password, 10);
    db.prepare('INSERT INTO users (id, full_name, email, password, phone, role) VALUES (?, ?, ?, ?, ?, ?)').run(
      id, fullName, email, hashedPassword, phone, userRole
    );
 
    const token = jwt.sign({ id, email, role: userRole }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, token, user: {
      id, fullName, email, role: userRole,
      mobile_money_num: null,
      wave_num: null,
      payout_frequency: 'weekly'
    }});
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
 
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
    if (!user) return res.status(400).json({ success: false, error: 'User not found' });
 
    if (user.is_banned) return res.status(403).json({ success: false, error: 'Compte suspendu' });
 
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ success: false, error: 'Invalid password' });
 
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, token, user: {
      id: user.id,
      fullName: user.full_name,
      email: user.email,
      role: user.role,
      mobile_money_num: user.mobile_money_num,
      wave_num: user.wave_num,
      payout_frequency: user.payout_frequency
    }});
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
 
export const updatePaymentInfo = async (req: any, res: Response) => {
  const { mobile_money_num, wave_num, payout_frequency } = req.body;
  const userId = req.user.id;
  try {
    db.prepare(`
      UPDATE users
      SET mobile_money_num = ?, wave_num = ?, payout_frequency = ?
      WHERE id = ?
    `).run(mobile_money_num, wave_num, payout_frequency, userId);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Changement de mot de passe
export const changePassword = async (req: any, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, error: 'Les deux mots de passe sont requis' });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ success: false, error: 'Le nouveau mot de passe doit faire au moins 8 caractères' });
  }

  try {
    const user = db.prepare('SELECT password FROM users WHERE id = ?').get(userId) as any;
    if (!user) return res.status(404).json({ success: false, error: 'Utilisateur introuvable' });

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) return res.status(401).json({ success: false, error: 'Mot de passe actuel incorrect' });

    const hashed = await bcrypt.hash(newPassword, 10);
    db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashed, userId);

    logger.info('Password changed', { userId });
    res.json({ success: true, message: 'Mot de passe modifié avec succès' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Sauvegarde des préférences de notification
export const updateNotificationPrefs = async (req: any, res: Response) => {
  const { notif_sales, notif_daily, notif_security } = req.body;
  const userId = req.user.id;
  try {
    // Vérifier si les colonnes existent, sinon les créer
    db.prepare('UPDATE users SET notif_sales = ?, notif_daily = ?, notif_security = ? WHERE id = ?')
      .run(notif_sales ? 1 : 0, notif_daily ? 1 : 0, notif_security ? 1 : 0, userId);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
