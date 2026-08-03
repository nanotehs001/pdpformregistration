import crypto from 'crypto';

/**
 * Stateless CSRF protection for the OAuth round-trip.
 *
 * With no database there is nowhere to record an issued state token, so the
 * state carries its own expiry and is HMAC-signed. On the way back it is
 * verified by recomputing the signature — no storage required.
 */

const STATE_TTL_MS = 10 * 60 * 1000;

function secret() {
  return (
    process.env.ADMIN_SESSION_SECRET ||
    crypto
      .createHash('sha256')
      .update(`pdp-oauth-state::${process.env.ADMIN_PASSWORD || ''}::${process.env.GOOGLE_OAUTH_CLIENT_SECRET || ''}`)
      .digest('hex')
  );
}

function sign(payload) {
  return crypto.createHmac('sha256', secret()).update(payload).digest('base64url');
}

function safeEquals(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export function createState() {
  const payload = `${Date.now() + STATE_TTL_MS}.${crypto.randomBytes(12).toString('base64url')}`;
  return `${payload}.${sign(payload)}`;
}

export function verifyState(state) {
  if (typeof state !== 'string') return false;

  const parts = state.split('.');
  if (parts.length !== 3) return false;

  const [expiresAt, nonce, signature] = parts;
  if (!safeEquals(signature, sign(`${expiresAt}.${nonce}`))) return false;

  const expiry = Number(expiresAt);
  return Number.isFinite(expiry) && Date.now() < expiry;
}
