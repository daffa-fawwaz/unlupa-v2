import { Router, Request, Response } from 'express';
import { checkDatabaseConnection } from '../db';
import { env } from '../env';
import { authRouter } from './auth.routes';
import { bookRouter } from './book.routes';
import { learningRouter } from './learning.routes';
import { quranRouter } from './quran.routes';
import { uploadRouter } from './upload.routes';
import { adminUserRouter } from './adminUser.routes';
import { classRouter } from './class.routes';

export const apiRouter = Router();

/**
 * Enhanced Health Check Route for PostgreSQL Database connectivity probe
 * GET /api/v1/health
 * Sanitized response: Does not leak raw database errors, internal hosts, or credentials to client.
 */
apiRouter.get('/health', async (req: Request, res: Response) => {
  const dbHealth = await checkDatabaseConnection();
  const isHealthy = dbHealth.connected;

  if (!isHealthy && dbHealth.error) {
    // Technical connection error is logged safely on the server only
    console.error('[HealthCheck] Database connection probe failed:', dbHealth.error);
  }

  const payload = {
    status: isHealthy ? 'ok' : 'degraded',
    service: 'unlupa-backend-api',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
    database: {
      provider: 'postgresql',
      connected: dbHealth.connected,
      latencyMs: dbHealth.latencyMs,
      ...(!isHealthy ? { message: 'Database connectivity degraded' } : {}),
    },
  };

  res.status(isHealthy ? 200 : 503).json(payload);
});

// Mount domain routes
apiRouter.use(uploadRouter);
apiRouter.use(authRouter);
apiRouter.use(bookRouter);
apiRouter.use(learningRouter);
apiRouter.use(quranRouter);
apiRouter.use(adminUserRouter);
apiRouter.use(classRouter);
