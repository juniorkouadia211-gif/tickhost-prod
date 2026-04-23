import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import routes from './src/routes/index';
import { logger } from './src/services/logger';
import { tenantMiddleware } from './src/middlewares/tenant';
 
// --- VÉRIFICATION DES SECRETS OBLIGATOIRES ---
// Le serveur refuse de démarrer si des variables critiques sont absentes en production.
// En développement, un avertissement est affiché mais le démarrage continue.
const REQUIRED_ENV_VARS = ['JWT_SECRET', 'QR_SECRET'];
const REQUIRED_IN_PROD  = ['CINETPAY_API_SECRET'];
const isProduction = process.env.NODE_ENV === 'production';
 
const missingAlways = REQUIRED_ENV_VARS.filter(v => !process.env[v]);
const missingInProd = isProduction ? REQUIRED_IN_PROD.filter(v => !process.env[v]) : [];
const allMissing = [...missingAlways, ...missingInProd];
 
if (allMissing.length > 0) {
  logger.warn(`Variables d'environnement manquantes : ${allMissing.join(', ')}`);
  logger.warn('Le serveur continue de démarrer mais certaines fonctionnalités pourraient échouer.');
}
 
const app = express();
app.set('trust proxy', 1);
// Always use 3000 as required by the infrastructure
const PORT = 3000;
 
// --- MIDDLEWARES ---
const uploadsPath = process.env.UPLOADS_PATH || path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}
app.use('/uploads', express.static(uploadsPath));
app.use('/manifest.json', express.static(path.join(process.cwd(), 'public/manifest.json')));

// Log every request to help debug
app.use((req, res, next) => {
  if (req.url.startsWith('/api')) {
    logger.info(`API Request: ${req.method} ${req.url}`);
  }
  next();
});
// CORS restreint aux origines autorisées en production
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o: string) => o.trim())
  : [];
 
app.use(cors({
  origin: (origin, callback) => {
    // En dev ou si pas d'origines configurées : tout autoriser
    if (!isProduction || allowedOrigins.length === 0) return callback(null, true);
    // En prod : vérifier que l'origine est dans la liste blanche
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`Origine non autorisée par CORS : ${origin}`));
  },
  credentials: true,
}));
 
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(tenantMiddleware);
 
app.use((req, res, next) => {
  next();
});
 
// --- API ROUTES ---
app.use('/api', routes);
 
// --- GLOBAL ERROR HANDLER (Ensures JSON response) ---
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error('Uncaught error', { error: err.message, stack: err.stack });
  
  // Ensure we don't send HTML even if it's a view error
  res.status(err.status || 500).json({ 
    error: true,
    message: err.message || 'Internal Server Error' 
  });
});
 
// --- 404 HANDLER (Ensures JSON for API, fallback for SPA) ---
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: `Route ${req.originalUrl} not found` });
});
 
// --- VITE MIDDLEWARE ---
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }
  app.listen(PORT, '0.0.0.0', () => logger.info(`Server running on http://localhost:${PORT}`));
}
 
startServer();
 