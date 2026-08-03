import { getAdminConfig } from '../services/authService.js';
import { configProblems } from '../config/runtimeConfig.js';
import {
  verifyPassword,
  issueToken,
  verifyToken,
  isAdminAuthConfigured
} from '../services/adminAuthService.js';

export function adminLogin(req, res) {
  if (!isAdminAuthConfigured()) {
    return res.status(503).json({
      error: 'Admin login unavailable',
      message: 'ADMIN_PASSWORD is not set on the server.'
    });
  }

  if (!verifyPassword(req.body?.password)) {
    return res.status(401).json({
      error: 'Incorrect password',
      message: 'That password is not correct.'
    });
  }

  const { token, expiresAt } = issueToken();
  res.json({ token, expiresAt });
}

/** Lets the client check whether a stored token is still usable on load. */
export function adminSession(req, res) {
  if (!isAdminAuthConfigured()) {
    return res.json({ authRequired: false, authenticated: true });
  }

  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : null;

  res.json({ authRequired: true, authenticated: Boolean(token && verifyToken(token)) });
}

export function getConfig(req, res) {
  try {
    res.json({
      config: getAdminConfig(),
      problems: configProblems()
    });
  } catch (error) {
    console.error('Error getting config:', error);
    res.status(500).json({
      error: 'Failed to get configuration',
      message: error.message
    });
  }
}
