import app from '../server/src/app.js';

export default function handler(req, res) {
  // Vercel strips /api from the path, so we need to prepend it back
  // so that Express routes work correctly.
  req.url = `/api${req.url}`;
  return app(req, res);
}
