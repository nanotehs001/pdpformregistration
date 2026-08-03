/**
 * Single source of truth for runtime configuration.
 *
 * Values come from environment variables by default. When Vercel KV is
 * configured, admin-editable keys (Sheet URL, Drive folder, Google refresh
 * token) can be overridden live via the KV-backed configStore — those overrides
 * take precedence so changes made in the dashboard apply without a redeploy.
 */
import { getOverride } from '../services/configStore.js';

// Accepts a full Google URL or a bare ID so a pasted URL and a raw ID behave
// identically.
export function idFromSheetUrl(value) {
  if (!value) return null;
  const match = /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/.exec(value);
  return (match ? match[1] : value).trim() || null;
}

export function idFromFolderUrl(value) {
  if (!value) return null;
  const match = /\/folders\/([a-zA-Z0-9-_]+)/.exec(value);
  const id = match ? match[1] : value;
  // A bare "My Drive" URL carries no folder id — treat it as unset.
  return /^https?:\/\//i.test(id) ? null : id.trim() || null;
}

export function getRuntimeConfig() {
  // KV overrides win over env vars; both fall back to the legacy *_ID names.
  const sheetSource =
    getOverride('GOOGLE_SHEET_URL') ||
    process.env.GOOGLE_SHEET_URL ||
    process.env.GOOGLE_SHEET_ID;
  const folderSource =
    getOverride('GOOGLE_DRIVE_FOLDER_URL') ||
    process.env.GOOGLE_DRIVE_FOLDER_URL ||
    process.env.GOOGLE_DRIVE_FOLDER_ID;
  const refreshToken =
    getOverride('GOOGLE_REFRESH_TOKEN') || process.env.GOOGLE_REFRESH_TOKEN || null;

  return {
    sheetId: idFromSheetUrl(sheetSource),
    folderId: idFromFolderUrl(folderSource),
    refreshToken,
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
