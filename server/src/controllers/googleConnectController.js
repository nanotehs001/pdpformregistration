import { google } from 'googleapis';
import { createState, verifyState } from '../services/oauthState.js';
import { setEnvValue, canWriteEnv } from '../services/envWriter.js';
import { resetTokenCache } from '../services/authService.js';

function buildClient(redirectUrl) {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET are not set.');
  }

  return new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUrl
  );
}

/** Admin-only: starts the consent flow. */
export function initiateGoogleAuth(req, res) {
  try {
    // Construct the callback URL from the request. This works on localhost, Vercel, etc.
    const protocol = req.get('x-forwarded-proto') || req.protocol || 'http';
    const host = req.get('x-forwarded-host') || req.get('host');
    const callbackUrl = process.env.GOOGLE_OAUTH_REDIRECT_URL ||
      `${protocol}://${host}/api/auth/google-callback`;

    const client = buildClient(callbackUrl);

    const url = client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: [
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/spreadsheets'
      ],
      state: createState()
    });

    res.json({ authUrl: url });
  } catch (error) {
    console.error('Error initiating Google auth:', error);
    res.status(500).json({ error: 'Failed to start Google connection', message: error.message });
  }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));
}

function resultPage({ title, tone, body }) {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>${escapeHtml(title)}</title>
<style>
  :root { color-scheme: light dark; }
  body { font-family: system-ui, -apple-system, "Segoe UI", sans-serif; margin: 0;
         display: grid; place-items: center; min-height: 100vh; background: #f4f6f4; color: #1c1f1d; padding: 24px; }
  .card { background: #fff; border: 1px solid #e3e7e4; border-radius: 12px; padding: 28px;
          max-width: 620px; width: 100%; box-shadow: 0 1px 3px rgba(0,0,0,.06); }
  h1 { font-size: 19px; margin: 0 0 8px; }
  h1 .mark { color: ${tone === 'ok' ? '#2e7d47' : '#c0392b'}; }
  p { font-size: 14px; line-height: 1.55; color: #5b6560; margin: 0 0 14px; }
  code, .token { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
  .token { display: block; background: #f6f8f6; border: 1px solid #e3e7e4; border-radius: 8px;
           padding: 12px; font-size: 12px; word-break: break-all; margin: 0 0 12px; user-select: all; }
  button { font: inherit; font-size: 14px; padding: 9px 16px; border-radius: 7px; cursor: pointer;
           border: 1px solid transparent; background: #1a472a; color: #fff; }
  a.btn { display: inline-block; margin-left: 8px; font-size: 14px; padding: 9px 16px; border-radius: 7px;
          border: 1px solid #d3d9d5; background: #fff; color: #1c1f1d; text-decoration: none; }
  .note { font-size: 12.5px; color: #5b6560; margin-top: 14px; }
  @media (prefers-color-scheme: dark) {
    body { background: #141615; color: #e8ece9; }
    .card { background: #1c1f1d; border-color: #2c312e; }
    p, .note { color: #a3ada7; }
    .token { background: #141615; border-color: #2c312e; color: #e8ece9; }
    a.btn { background: #1c1f1d; border-color: #2c312e; color: #e8ece9; }
  }
</style></head><body><div class="card">${body}</div>
<script>
  const btn = document.getElementById('copy');
  if (btn) btn.addEventListener('click', async () => {
    await navigator.clipboard.writeText(document.getElementById('tok').textContent.trim());
    btn.textContent = 'Copied';
    setTimeout(() => { btn.textContent = 'Copy token'; }, 1800);
  });
</script></body></html>`;
}

function adminUrl() {
  const origin = (process.env.FRONTEND_URL || 'http://localhost:5173')
    .split(',')[0].trim().replace(/\/+$/, '');
  const route = process.env.ADMIN_ROUTE || '/pdpadmin';
  return `${origin}${route.startsWith('/') ? route : `/${route}`}`;
}

export async function handleGoogleAuthCallback(req, res) {
  const { code, state, error: oauthError } = req.query;

  const fail = (message) =>
    res.status(400).send(resultPage({
      title: 'Connection failed',
      tone: 'bad',
      body: `<h1><span class="mark">✕</span> Connection failed</h1>
             <p>${escapeHtml(message)}</p>
             <a class="btn" href="${escapeHtml(adminUrl())}">Back to dashboard</a>`
    }));

  if (oauthError) return fail(`Google returned: ${oauthError}`);
  if (!code || !state) return fail('Missing authorization code or state.');
  if (!verifyState(state)) return fail('This link has expired or is invalid. Start the connection again.');

  try {
    const protocol = req.get('x-forwarded-proto') || req.protocol || 'http';
    const host = req.get('x-forwarded-host') || req.get('host');
    const callbackUrl = process.env.GOOGLE_OAUTH_REDIRECT_URL ||
      `${protocol}://${host}/api/auth/google-callback`;

    const client = buildClient(callbackUrl);
    const { tokens } = await client.getToken(code);

    if (!tokens.refresh_token) {
      return fail(
        'Google did not return a refresh token. Remove this app at ' +
        'myaccount.google.com/permissions and try again.'
      );
    }

    // Newly issued token invalidates whatever access token is cached.
    resetTokenCache();

    const wrote = setEnvValue('GOOGLE_REFRESH_TOKEN', tokens.refresh_token);

    const tokenBlock = `
      <p>Add this as <code>GOOGLE_REFRESH_TOKEN</code> in your Vercel project's
         Environment Variables, then redeploy.</p>
      <span class="token" id="tok">${escapeHtml(tokens.refresh_token)}</span>
      <button id="copy" type="button">Copy token</button>
      <a class="btn" href="${escapeHtml(adminUrl())}">Back to dashboard</a>
      <p class="note">Treat this like a password — it grants ongoing access to this
         account's Drive and Sheets. It is shown only once.</p>`;

    if (wrote) {
      return res.send(resultPage({
        title: 'Google connected',
        tone: 'ok',
        body: `<h1><span class="mark">✓</span> Google connected</h1>
               <p>Saved to your local <code>.env</code>. Restart the dev server to be sure
                  every process picks it up.</p>
               ${tokenBlock}`
      }));
    }

    return res.send(resultPage({
      title: 'Google connected',
      tone: 'ok',
      body: `<h1><span class="mark">✓</span> Google authorized</h1>
             ${tokenBlock}`
    }));
  } catch (error) {
    console.error('Error handling auth callback:', error);
    return fail(error.message);
  }
}
