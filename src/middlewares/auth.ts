import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../services/logger';
 
// Pas de fallback — si JWT_SECRET est absent, server.ts a déjà bloqué le démarrage
const JWT_SECRET = process.env.JWT_SECRET as string;
 
export interface AuthRequest extends Request {
  user?: { id: string; email: string; role: string };
}
 
export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
 
  if (!token) return res.status(401).json({ error: 'Access denied' });
 
  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      logger.warn('Token verification failed', { error: err.message });
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};
 
export const optionalAuthenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
 
  if (!token) return next();
 
  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return next();
    req.user = user;
    next();
  });
};
 
export const authorizeRoles = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      logger.warn('Insufficient permissions', { 
        userRole: req.user?.role, 
        requiredRoles: roles, 
        path: req.originalUrl 
      });
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};