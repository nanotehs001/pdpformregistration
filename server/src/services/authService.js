import { google } from 'googleapis';
import { getRuntimeConfig } from '../config/runtimeConfig.js';

/**
 * Google access using a long-lived refresh token held in the environment.
 *
 * No storage is involved: the refresh token comes from GOOGLE_REFRESH_TOKEN and
 * short-lived access tokens are minted on demand and cached in memory. On a
 * warm serverless instance the cache is reused; on a cold start a new access
 * token is fetched. Nothing needs to be written anywhere.
 */

// Module-level cache, scoped to one server process / warm function instance.
let cachedAccessToken = null;
let cachedExpiry = 0;

function buildOAuthClient() {
  const { clientId, clientSecret } = getRuntimeConfig();

  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth credentials are not configured on the server.');
  }

  return new google.auth.OAuth2(
    clientId,
    clientSecret,
    process.env.GOOGLE_OAUTH_REDIRECT_URL || 'http://localhost:3000/api/auth/google-callback'
  );
}

export async function getValidAccessToken() {
  // 60s of slack so a token can't expire mid-request.
  if (cachedAccessToken && Date.now() < cachedExpiry - 60_000) {
    return cachedAccessToken;
  }

  const { refreshToken } = getRuntimeConfig();
  if (!refreshToken) {
    throw new Error(
      'GOOGLE_REFRESH_TOKEN is not set. Run `npm run connect-google` and add it to your environment.'
    );
  }

  const client = buildOAuthClient();
  client.setCredentials({ refresh_token: refreshToken });

  try {
    const { credentials } = await client.refreshAccessToken();
    cachedAccessToken = credentials.access_token;
    cachedExpiry = credentials.expiry_date || Date.now() + 55 * 60 * 1000;
    return cachedAccessToken;
  } catch (error) {
    cachedAccessToken = null;
    cachedExpiry = 0;
    // A revoked or rotated refresh token is the usual cause and needs a human.
    throw new Error(
      `Could not refresh Google access: ${error.message}. The refresh token may have been revoked — run \`npm run connect-google\` to issue a new one.`
    );
  }
}

/** Configuration surfaced to the admin dashboard. Read-only by design. */
export function getAdminConfig() {
  const { sheetId, folderId, refreshToken } = getRuntimeConfig();

  return {
    sheetId,
    folderId,
    isConnected: Boolean(refreshToken),
    readOnly: true,
    source: 'env'
  };
}

/** Clears the cached access token — used by tooling and tests. */
export function resetTokenCache() {
  cachedAccessToken = null;
  cachedExpiry = 0;
}
