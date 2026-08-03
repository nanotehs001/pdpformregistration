import crypto from 'crypto';

/**
 * Admin authentication backed by a password in the environment.
 *
 * Sign-in exchanges ADMIN_PASSWORD for a short-lived HMAC-signed token. The
 * password itself is never stored client-side and never leaves the server
 * beyond the single login request.
 */

const TOKEN_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

export function isAdminAuthConfigured() {
  return Boolean(process.env.ADMIN_PASSWORD);
}

// Falls back to deriving a secret from the password so the app works with only
// ADMIN_PASSWORD set. Setting ADMIN_SESSION_SECRET explicitly is better: it
// lets you invalidate all sessions without changing the password.
function getSigningSecret() {
  const explicit = process.env.ADMIN_SESSION_SECRET;
  if (explicit) return explicit;

  return crypto
    .createHash('sha256')
    .update(`pdp-admin-session::${process.env.ADMIN_PASSWORD || ''}`)
    .digest('hex');
}

// Constant-time compare so response timing can't be used to guess the password.
function safeEquals(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export function verifyPassword(candidate) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  if (typeof candidate !== 'string' || candidate.length === 0) return false;
  return safeEquals(candidate, expected);
}

function sign(payload) {
  return crypto
    .createHmac('sha256', getSigningSecret())
    .update(payload)
    .digest('base64url');
}

export function issueToken() {
  const expiresAt = Date.now() + TOKEN_TTL_MS;
  const payload = `${expiresAt}.${crypto.randomBytes(12).toString('base64url')}`;
  return { token: `${payload}.${sign(payload)}`, expiresAt };
}

export function verifyToken(token) {
  if (typeof token !== 'string') return false;

  const parts = token.split('.');
  if (parts.length !== 3) return false;

  const [expiresAt, nonce, signature] = parts;
  const payload = `${expiresAt}.${nonce}`;

  if (!safeEquals(signature, sign(payload))) return false;

  const expiry = Number(expiresAt);
  return Number.isFinite(expiry) && Date.now() < expiry;
}
