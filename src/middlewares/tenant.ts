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

    // Domaines d'hébergement — jamais des tenants
    const hostingDomains = [
      'onrender.com', 'render.com',
      'vercel.app', 'netlify.app',
      'herokuapp.com', 'railway.app',
      'fly.dev', 'pages.dev',
      'googleusercontent.com', 'run.app'
    ];
    const isHostingDomain = hostingDomains.some(d => host.endsWith(d));

    // CAS LOCAL DEV / TEST ENV
    const isTestEnv = host.includes('localhost') ||
                      host.startsWith('127.0.0.1') ||
                      isHostingDomain;

    if (isTestEnv) {
      req.isMainDomain = true;
      return next();
    }

    // CAS PRODUCTION (Hostname-based sous domaine personnalisé)
    // Domaine principal TICKHOST — jamais un tenant
    const mainDomains = ['tickhost.ci', 'tickhost.com', 'tickhost.africa'];
    const isMainDomain = mainDomains.some(d => host === d || host === `www.${d}`);
    if (isMainDomain) {
      req.isMainDomain = true;
      return next();
    }

    // Sous-domaine personnalisé (ex: concert.tickhost.ci → tenant = concert)
    const reservedSubdomains = ['www', 'api', 'admin', 'dev', 'staging', 'app'];
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
