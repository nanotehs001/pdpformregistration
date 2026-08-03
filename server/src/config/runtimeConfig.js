/**
 * Single source of truth for runtime configuration — all of it from the
 * environment.
 *
 * There is no database. That is a deliberate fit for serverless hosting
 * (Vercel), where the filesystem is ephemeral and nothing written at runtime
 * survives. The consequence is that configuration changes require updating
 * environment variables and redeploying; the admin dashboard is read-only.
 */

// Accepts a full Google URL or a bare ID so a pasted URL and a raw ID behave
// identically.
function idFromSheetUrl(value) {
  if (!value) return null;
  const match = /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/.exec(value);
  return (match ? match[1] : value).trim() || null;
}

function idFromFolderUrl(value) {
  if (!value) return null;
  const match = /\/folders\/([a-zA-Z0-9-_]+)/.exec(value);
  const id = match ? match[1] : value;
  // A bare "My Drive" URL carries no folder id — treat it as unset.
  return /^https?:\/\//i.test(id) ? null : id.trim() || null;
}

export function getRuntimeConfig() {
  return {
    sheetId: idFromSheetUrl(process.env.GOOGLE_SHEET_URL || process.env.GOOGLE_SHEET_ID),
    folderId: idFromFolderUrl(
      process.env.GOOGLE_DRIVE_FOLDER_URL || process.env.GOOGLE_DRIVE_FOLDER_ID
    ),
    refreshToken: process.env.GOOGLE_REFRESH_TOKEN || null,
    clientId: process.env.GOOGLE_OAUTH_CLIENT_ID || null,
    clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET || null
  };
}

/** Missing pieces that would stop submissions from working, for diagnostics. */
export function configProblems() {
  const config = getRuntimeConfig();
  const problems = [];

  if (!config.clientId || !config.clientSecret) {
    problems.push('GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET are not set.');
  }
  if (!config.refreshToken) {
    problems.push('GOOGLE_REFRESH_TOKEN is not set. Run `npm run connect-google` to obtain one.');
  }
  if (!config.sheetId) {
    problems.push('GOOGLE_SHEET_URL is not set.');
  }

  return problems;
}
