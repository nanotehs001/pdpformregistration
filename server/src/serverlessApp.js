import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import formRoutes from './routes/forms.js';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';

dotenv.config();

const app = express();

const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim().replace(/\/+$/, ''))
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin.replace(/\/+$/, ''))) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

app.use(express.json({ limit: '4mb' }));
app.use(express.urlencoded({ extended: true, limit: '4mb' }));

// Mount routes at BOTH prefixes so this works whether or not Vercel strips the
// leading /api before invoking the function. Express matches the first that fits.
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', formRoutes);
app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);
app.use('/', formRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Temporarily expose the real error message so production 500s are debuggable.
app.use((err, req, res, next) => {
  console.error('[serverless error]', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err?.message || String(err)
  });
});

export default app;
