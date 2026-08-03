import { verifyToken, isAdminAuthConfigured } from '../services/adminAuthService.js';

/**
 * Gates the admin API behind the password set in ADMIN_PASSWORD.
 *
 * The client signs in once and sends the resulting token as
 * `Authorization: Bearer <token>` on every admin request.
 */
export function requireAdmin(req, res, next) {
  if (!isAdminAuthConfigured()) {
    // Fail closed in production rather than silently exposing the admin API.
    if (process.env.NODE_ENV === 'production') {
      return res.status(503).json({
        error: 'Admin authentication unavailable',
        message: 'ADMIN_PASSWORD is not set, so the admin API is disabled.'
      });
    }
    return next();
  }

  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : null;

  if (!token || !verifyToken(token)) {
    return res.status(401).json({
      error: 'Not authenticated',
      message: 'Sign in to manage settings.'
    });
  }

  next();
}
