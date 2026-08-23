import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { defaultLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/error';
import router from './routes';

export function createApp() {
  const app = express();

  app.use(helmet());
  // Two browser apps on two origins: the tenant app and the admin console.
  app.use(cors({ origin: [env.FRONTEND_URL, env.ADMIN_URL], credentials: true }));
  app.use(express.json());
  app.use(defaultLimiter);

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));
  app.use('/api/v1', router);

  app.use(errorHandler);

  return app;
}
