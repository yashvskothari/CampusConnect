/// <reference path="./types/express.d.ts" />
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import http from 'http';

import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import serviceRoutes from './routes/service.routes';
import jobRoutes from './routes/job.routes';
import bidRoutes from './routes/bid.routes';
import messageRoutes from './routes/message.routes';
import reviewRoutes from './routes/review.routes';
import paymentRoutes from './routes/payment.routes';
import recommendationRoutes from './routes/recommendation.routes';
import { setupSocket } from './socket';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Render (and most PaaS hosts) sit behind a reverse proxy, so without this
// req.ip would resolve to the proxy's address for every request, making
// IP-based rate limiting useless. Trusting one hop is safe for a single
// reverse proxy in front of the app.
app.set('trust proxy', 1);

const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:5175',
].filter(Boolean) as string[];

export const isAllowedOrigin = (origin?: string | null): boolean => {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  if (/^https?:\/\/localhost(:\d+)?$/.test(origin)) return true;
  if (/^https?:\/\/127\.0\.0\.1(:\d+)?$/.test(origin)) return true;
  return false;
};

app.use(cors({
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true,
}));
app.use(express.json({
  verify: (req: any, _res, buf) => {
    req.rawBody = buf;
  },
}));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'Gigverse API', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/bids', bidRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/recommendations', recommendationRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const httpServer = http.createServer(app);
setupSocket(httpServer); // Real-time chat & presence engine

if (process.env.NODE_ENV !== 'test') {
  httpServer.listen(PORT, () => {
    console.log(`Gigverse server running on port ${PORT}`);
  });
}

export { httpServer };
export default app;

