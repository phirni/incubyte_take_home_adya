import express from 'express';
import cors from 'cors';
import { config } from './config';
import { authRoutes } from './routes/auth';
import { vehicleQueries } from './routes/vehicleQueries';
import { vehicleManagement } from './routes/vehicleManagement';
import { inventory } from './routes/inventory';
import { authenticate } from './middleware/auth';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

/** Builds the Express app without listening, so tests can use it via Supertest. */
export function createApp() {
  const app = express();
  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/vehicles', authenticate, vehicleQueries, vehicleManagement, inventory);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
