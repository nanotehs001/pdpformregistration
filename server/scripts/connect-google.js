/**
 * One-time helper to obtain a Google refresh token for GOOGLE_REFRESH_TOKEN.
 *
 * Run locally (`npm run connect-google`), approve the consent screen, and the
 * script prints the refresh token to paste into your environment. Production
 * never runs an OAuth flow — it only uses the resulting long-lived token.
 */
import http from 'http';
import { URL } from 'url';
import dotenv from 'dotenv';
import { google } from 'googleapis';

dotenv.config();

const PORT = 3000;
const REDIRECT = process.env.GOOGLE_OAUTH_REDIRECT_URL
  || `http://localhost:${PORT}/api/auth/google-callback`;

const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  console.error('✗ GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET must be set in .env');
  process.exit(1);
}

const client = new google.auth.OAuth2(clientId, clientSecret, REDIRECT);

const authUrl = client.generateAuthUrl({
  access_type: 'offline',
  // Forces a refresh token even if this account has consented before.
  prompt: 'consent',
  scope: [
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/spreadsheets'
  ]
});

const callbackPath = new URL(REDIRECT).pathname;

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  if (url.pathname !== callbackPath) {
    res.writeHead(404).end('Not found');
    return;
  }

  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');

  if (error || !code) {
    res.writeHead(400, { 'Content-Type': 'text/html' });
    res.end('<h2>Authorization failed.</h2><p>You can close this tab.</p>');
    console.error('\n✗ Authorization failed:', error || 'no code returned');
    server.close();
    process.exit(1);
  }

  try {
    const { tokens } = await client.getToken(code);

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('<h2>Connected.</h2><p>Return to your terminal for the token.</p>');

    if (!tokens.refresh_token) {
      console.error('\n✗ Google did not return a refresh token.');
      console.error('  Revoke access at https://myaccount.google.com/permissions and retry.');
      server.close();
      process.exit(1);
    }

    console.log('\n✓ Success. Add this to your .env (and to Vercel):\n');
    console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}\n`);
    server.close();
    process.exit(0);
  } catch (err) {
    res.writeHead(500).end('Token exchange failed.');
    console.error('\n✗ Token exchange failed:', err.message);
    server.close();
    process.exit(1);
  }
});

server.listen(PORT, () => {
  console.log('\nOpen this URL in your browser to authorize:\n');
  console.log(authUrl);
  console.log('\nWaiting for the redirect…');
});
