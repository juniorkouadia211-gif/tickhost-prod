import { Request, Response, NextFunction } from 'express';

declare global {
  namespace Express {
    interface Request {
      tenantSlug?: string;
      isMainDomain?: boolean;
    }
  }
}

export const tenantMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const hostHeader = req.headers.host;
    const tenantParam = req.query.tenant as string;

    // Priorité 1: Paramètre URL (pour le debug et l'aperçu Google)
    if (tenantParam) {
      req.tenantSlug = tenantParam.toLowerCase();
      return next();
    }

    if (!hostHeader) {
      req.isMainDomain = true;
      return next();
    }

    const host = hostHeader.split(':')[0].toLowerCase();
    const parts = host.split('.');

    // CAS LOCAL DEV / TEST ENV
    const isTestEnv = host.includes('localhost') || 
                      host.startsWith('127.0.0.1') || 
                      host.includes('googleusercontent.com') || 
                      host.includes('run.app');

    if (isTestEnv) {
      req.isMainDomain = true;
      return next();
    }

    // CAS PRODUCTION (Hostname-based)
    // Si on a au moins 3 parties (ex: concert.tickhost.com)
    const reservedSubdomains = ['www', 'api', 'admin', 'dev', 'staging'];
    if (parts.length >= 3) {
      const subdomain = parts[0];
      if (!reservedSubdomains.includes(subdomain)) {
        req.tenantSlug = subdomain;
      } else {
        req.isMainDomain = true;
      }
    } else {
      req.isMainDomain = true;
    }

    next();
  } catch (error) {
    console.error('Tenant middleware error:', error);
    next();
  }
};
