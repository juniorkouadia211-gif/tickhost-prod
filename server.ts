import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import routes from './src/routes/index';
import { logger } from './src/services/logger';
import { tenantMiddleware } from './src/middlewares/tenant';
 
const REQUIRED_ENV_VARS = ['JWT_SECRET', 'QR_SECRET'];
const isProduction = process.env.NODE_ENV === 'production';
 
const missingAlways = REQUIRED_ENV_VARS.filter(v => !process.env[v]);
if (missingAlways.length > 0) {
  logger.warn(`Variables d'environnement manquantes : ${missingAlways.join(', ')}`);
}
 
const app = express();
app.set('trust proxy', 1);
const PORT = Number(process.env.PORT) || 3000;
 
// --- MIDDLEWARES ---
const uploadsPath = process.env.UPLOADS_PATH || path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}
app.use('/uploads', express.static(uploadsPath));
app.use('/manifest.json', express.static(path.join(process.cwd(), 'public/manifest.json')));

app.use((req, res, next) => {
  if (req.url.startsWith('/api')) {
    logger.info(`API Request: ${req.method} ${req.url}`);
  }
  next();
});

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o: string) => o.trim())
  : [];
 
app.use(cors({
  origin: (origin, callback) => {
    if (!isProduction || allowedOrigins.length === 0) return callback(null, true);
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`Origine non autorisée par CORS : ${origin}`));
  },
  credentials: true,
}));
 
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(tenantMiddleware);
 
app.use('/api', routes);
 
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error('Uncaught error', { error: err.message, stack: err.stack });
  res.status(err.status || 500).json({ 
    error: true,
    message: err.message || 'Internal Server Error' 
  });
});
 
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: `Route ${req.originalUrl} not found` });
});
 
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }
  app.listen(PORT, '0.0.0.0', () => logger.info(`Server running on port ${PORT}`));
}
 
startServer();
 
