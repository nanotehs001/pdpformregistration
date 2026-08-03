import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import formRoutes from './routes/forms.js';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import { ensureLoaded } from './services/configStore.js';

dotenv.config();

const app = express();

// Prime KV-backed config before handlers read it (no-op when KV is unset).
app.use(async (req, res, next) => {
  try {
    await ensureLoaded();
  } catch {
    // never block a request on config loading
  }
  next();
});

// Multiple origins so preview deployments keep working alongside production.
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim().replace(/\/+$/, ''))
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    // Same-origin and server-to-server requests arrive without an Origin header.
    if (!origin || allowedOrigins.includes(origin.replace(/\/+$/, ''))) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

// Vercel caps request bodies at 4.5 MB; staying under it keeps the failure
// mode as our own 400 rather than an opaque platform 413.
app.use(express.json({ limit: '4mb' }));
app.use(express.urlencoded({ extended: true, limit: '4mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', formRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

export default app;
