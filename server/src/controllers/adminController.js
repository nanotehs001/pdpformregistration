import { getAdminConfig } from '../services/authService.js';
import {
  configProblems,
  idFromSheetUrl,
  idFromFolderUrl
} from '../config/runtimeConfig.js';
import { setEnvValue } from '../services/envWriter.js';
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

/**
 * Admin-only: updates where submissions are stored. A full Google URL or a bare
 * ID is accepted for either field.
 *
 * Locally this writes to server/.env and takes effect immediately. On Vercel the
 * filesystem is read-only, so it cannot persist — it returns the exact values
 * for the admin to paste into the project's Environment Variables (mirroring how
 * the Google refresh token is handled).
 */
export function updateDestination(req, res) {
  const sheetUrl = typeof req.body?.sheetUrl === 'string' ? req.body.sheetUrl.trim() : '';
  const folderUrl = typeof req.body?.folderUrl === 'string' ? req.body.folderUrl.trim() : '';

  // Sheet is required and must resolve to an id; folder is optional.
  const sheetId = idFromSheetUrl(sheetUrl);
  if (!sheetId) {
    return res.status(400).json({
      error: 'Invalid Google Sheet',
      message: 'Enter a Google Sheet URL or ID. Example: https://docs.google.com/spreadsheets/d/<id>/edit'
    });
  }

  const folderId = folderUrl ? idFromFolderUrl(folderUrl) : null;
  if (folderUrl && !folderId) {
    return res.status(400).json({
      error: 'Invalid Drive folder',
      message: 'Enter a Google Drive folder URL or ID, or leave it blank to use your Drive root.'
    });
  }

  // Store the raw value the admin provided; runtimeConfig parses the id on read.
  const wroteSheet = setEnvValue('GOOGLE_SHEET_URL', sheetUrl);
  const wroteFolder = folderUrl
    ? setEnvValue('GOOGLE_DRIVE_FOLDER_URL', folderUrl)
    : true;

  const persisted = wroteSheet && wroteFolder;

  res.json({
    saved: persisted,
    // When the file could not be written (Vercel), the admin must set these by
    // hand. Send back the exact key/value pairs to make that copy-paste trivial.
    needsManualEnv: !persisted,
    values: persisted
      ? undefined
      : [
          { key: 'GOOGLE_SHEET_URL', value: sheetUrl },
          ...(folderUrl ? [{ key: 'GOOGLE_DRIVE_FOLDER_URL', value: folderUrl }] : [])
        ],
    sheetId,
    folderId
  });
}
