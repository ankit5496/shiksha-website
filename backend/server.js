import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import { connectDatabase } from './config/db.js';
import { ensureSeeded, setDriver } from './services/repository.js';
import apiRoutes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { logger } from './utils/logger.js';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(cors({ origin: env.corsOrigin, credentials: true }));
  app.use(express.json({ limit: '2mb' }));
  if (!env.isProd) app.use(morgan('dev'));
  app.use('/api', rateLimit({ windowMs: 60 * 1000, limit: 600, standardHeaders: 'draft-7', legacyHeaders: false }));
  app.use('/api', apiRoutes);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

async function start() {
  const driver = await connectDatabase();
  setDriver(driver);
  await ensureSeeded();
  createApp().listen(env.port, () => logger.info(`API listening on http://localhost:${env.port}/api (storage: ${driver})`));
}

start().catch((err) => {
  logger.error('Failed to start server:', err);
  process.exit(1);
});
