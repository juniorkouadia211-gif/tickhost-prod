import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import routes from './src/routes/index';
import { logger } from './src/services/logger';
import { tenantMiddleware } from './src/middlewares/tenant';

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// Dossier uploads persistant
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

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

// Servir les images uploadées statiquement
app.use('/uploads', express.static(UPLOADS_DIR));

// Endpoint upload image — convertit base64 en fichier et retourne une URL
app.post('/api/upload-image', (req: Request, res: Response) => {
  try {
    const { data, filename } = req.body;
    if (!data || !data.startsWith('data:image/')) {
      return res.status(400).json({ success: false, error: 'Image invalide' });
    }
    const matches = data.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!matches) return res.status(400).json({ success: false, error: 'Format invalide' });

    const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
    const buffer = Buffer.from(matches[2], 'base64');
    const hash = crypto.createHash('md5').update(buffer).digest('hex').substring(0, 8);
    const safeName = (filename || 'image').replace(/[^a-z0-9]/gi, '-').toLowerCase();
    const fileName = `${Date.now()}-${hash}-${safeName}.${ext}`;
    const filePath = path.join(UPLOADS_DIR, fileName);
    fs.writeFileSync(filePath, buffer);

    const baseUrl = process.env.BASE_URL || `http://localhost:${PORT}`;
    res.json({ success: true, url: `${baseUrl}/uploads/${fileName}` });
  } catch (err: any) {
    logger.error('Upload error', { error: err.message });
    res.status(500).json({ success: false, error: err.message });
  }
});

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
