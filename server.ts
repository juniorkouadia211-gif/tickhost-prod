import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import routes from './src/routes/index';
import { logger } from './src/services/logger';
import { tenantMiddleware } from './src/middlewares/tenant';

const app = express();
// Render impose son propre PORT via variable d'environnement
const PORT = parseInt(process.env.PORT || '3000', 10);

// CORS — autoriser toutes les origines en dev, restreindre en prod
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : [];

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? (origin, cb) => {
        if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
          cb(null, true);
        } else {
          cb(new Error('Not allowed by CORS'));
        }
      }
    : true,
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(tenantMiddleware);
app.use('/api', routes);

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
  app.listen(PORT, '0.0.0.0', () => logger.info(`Server running on http://localhost:${PORT}`));
}

startServer();
