import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import formRoutes from './routes/forms.js';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import { ensureLoaded, isKvConfigured, pingKv } from './services/configStore.js';

dotenv.config();

const app = express();

// Prime KV-backed config into the in-memory cache before any handler reads it.
// No-op (and instant) when KV isn't configured.
app.use(async (req, res, next) => {
  try {
    await ensureLoaded();
  } catch {
    // configStore already logs; never block a request on config loading.
  }
  next();
});

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

// Registered at both paths since Vercel forwards the original /api-prefixed URL.
app.get(['/health', '/api/health'], (req, res) => {
  // kv is a boolean only — no secrets — so KV detection can be checked without auth.
  res.json({ status: 'ok', kv: isKvConfigured() });
});

// Hit daily by Vercel Cron to keep the free-tier Upstash database from going
// idle. If CRON_SECRET is set, only requests carrying it are allowed (Vercel
// sends it automatically); if unset, the endpoint is open (it does nothing
// sensitive — just writes a timestamp).
async function keepAlive(req, res) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.get('authorization') !== `Bearer ${secret}`) {
    return res.status(401).json({ ok: false, error: 'unauthorized' });
  }
  const result = await pingKv();
  res.json(result);
}

app.get('/keep-alive', keepAlive);
app.get('/api/keep-alive', keepAlive);

// Temporarily expose the real error message so production 500s are debuggable.
app.use((err, req, res, next) => {
  console.error('[serverless error]', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err?.message || String(err)
  });
});

export default app;
