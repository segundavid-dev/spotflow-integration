import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import healthRoutes from './routes/health.routes.js';
import walletRoutes from './routes/wallet.routes.js';
import webhookRoutes from './routes/webhook.routes.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors());

  // Webhook is mounted before the JSON parser so it can read the raw body
  // for signature verification.
  app.use('/webhooks', webhookRoutes);

  app.use(express.json());

  app.use('/health', healthRoutes);
  app.use('/wallet', walletRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
