import app from '../server/src/app.js';

export default function handler(req, res) {
  console.log('[Vercel API] Original URL:', req.url);
  console.log('[Vercel API] Original path:', req.path);

  // Vercel serverless functions strip the /api prefix before routing to api/[...slug].js
  // So we need to restore it for Express routes to work
  if (!req.url.startsWith('/api/')) {
    req.url = `/api${req.url}`;
  }

  console.log('[Vercel API] Modified URL:', req.url);
  return app(req, res);
}
