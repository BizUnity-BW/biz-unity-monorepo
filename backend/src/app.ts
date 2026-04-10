import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { defaultLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/error';
import router from './routes';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: process.env.FRONTEND_URL ?? 'http://localhost:5173', credentials: true }));
  app.use(express.json());
  app.use(defaultLimiter);

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));
  app.use('/api/v1', router);

  app.use(errorHandler);

  return app;
}
