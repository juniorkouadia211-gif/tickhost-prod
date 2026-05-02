import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import routes from './src/routes/index';
import { logger } from './src/services/logger';
import { tenantMiddleware } from './src/middlewares/tenant';

const app = express();
const PORT = 3000;

app.use(express.json());
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
