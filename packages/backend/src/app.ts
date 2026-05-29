import express from 'express';
import cors from 'cors';
import { xiaoyunRouter } from './routes/xiaoyun.routes.js';
import { quoteRouter } from './routes/quote.routes.js';
import { imageRouter } from './routes/image.routes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';

export function createApp() {
  const app = express();

  app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3001', 'http://127.0.0.1:5173'],
    credentials: true,
  }));
  app.use(express.json({ limit: '10mb' }));
  app.use(requestLogger);

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', version: '1.0.0', timestamp: Date.now() });
  });

  // Routes
  app.use('/api/xiaoyun', xiaoyunRouter);
  app.use('/api/quotes', quoteRouter);
  app.use('/api/image', imageRouter);

  // Error handling
  app.use(errorHandler);

  return app;
}
