import { google } from 'googleapis';
import { getValidAccessToken, getAdminConfig } from './authService.js';
import { SHEET_HEADERS } from '../config/sheetColumns.js';

// A1 ranges must reference the tab by its real name. Wrap it in single quotes
// (and escape any embedded quotes) so names with spaces/punctuation parse.
function a1(title, ref) {
  return `'${String(title).replace(/'/g, "''")}'!${ref}`;
}

// Google Sheets tab titles: max 100 chars and may not contain : \ / ? * [ ].
function sanitizeTabName(name) {
  const cleaned = String(name || '')
    .replace(/[:\\/?*[\]]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 100);
  return cleaned || 'Unspecified';
}

// The sheet is chosen by the admin at runtime (env/KV), not at boot, so resolve
// credentials on every call.
async function getSheetsContext() {
  const config = getAdminConfig();

  if (!config.isConnected) {
    throw new Error('Google is not connected. Set GOOGLE_REFRESH_TOKEN on the server.');
  }

  if (!config.sheetId) {
    throw new Error('No Google Sheet configured. Set GOOGLE_SHEET_URL on the server.');
  }

  const accessToken = await getValidAccessToken();

  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });

  return {
    sheets: google.sheets({ version: 'v4', auth }),
    spreadsheetId: config.sheetId
  };
}

async function listTabs(sheets, spreadsheetId) {
  const meta = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: 'sheets.properties(sheetId,title,index)'
  });
  return (meta.data.sheets || []).map((s) => s.properties);
}

/**
 * Finds the tab for a province, creating it if absent. Submissions are filed by
 * province so each area lives on its own tab; a new province spins up a new tab
 * automatically. Returns the tab's real title and numeric id.
 */
async function ensureProvinceTab(sheets, spreadsheetId, provinceRaw) {
  const wanted = sanitizeTabName(provinceRaw);
  const tabs = await listTabs(sheets, spreadsheetId);

  const existing = tabs.find(
    (t) => t.title.trim().toLowerCase() === wanted.toLowerCase()
  );
  if (existing) return { title: existing.title, gid: existing.sheetId };

  const res = await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: { requests: [{ addSheet: { properties: { title: wanted } } }] }
  });
  const created = res.data.replies?.[0]?.addSheet?.properties;
  return { title: created.title, gid: created.sheetId };
}

/**
 * Writes the header row when the tab has none, so an admin opening it can tell
 * what each column means. Existing content is never overwritten.
 */
export async function ensureHeaderRow(sheets, spreadsheetId, sheetTitle, sheetGid) {
  const existing = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: a1(sheetTitle, '1:1')
  });

  const firstRow = existing.data.values?.[0] || [];
  const hasContent = firstRow.some((cell) => String(cell).trim() !== '');

  // Already fully headed — leave it alone. If it has an older, shorter header
  // row (missing newly-added columns), fall through to rewrite it in full so
  // the new columns get their labels too.
  if (hasContent && firstRow.length >= SHEET_HEADERS.length) {
    return false;
  }

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: a1(sheetTitle, 'A1'),
    valueInputOption: 'RAW',
    requestBody: { values: [SHEET_HEADERS] }
  });

  // A pre-existing tab is already formatted; only style brand-new tabs.
  if (hasContent) {
    return true;
  }

  // Bold + freeze the header so it stays visible while scrolling.
  try {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            repeatCell: {
              range: { sheetId: sheetGid, startRowIndex: 0, endRowIndex: 1 },
              cell: {
                userEnteredFormat: {
                  textFormat: { bold: true },
                  backgroundColor: { red: 0.85, green: 0.9, blue: 0.86 }
                }
              },
              fields: 'userEnteredFormat(textFormat,backgroundColor)'
            }
          },
          {
            updateSheetProperties: {
              properties: { sheetId: sheetGid, gridProperties: { frozenRowCount: 1 } },
              fields: 'gridProperties.frozenRowCount'
            }
          }
        ]
      }
    });
  } catch (formatError) {
    // Cosmetic only — the headers themselves are already written.
    console.warn('Could not format header row:', formatError.message);
  }

  return true;
}

/**
 * Appends one submission, filed onto the tab for `province` (created on demand).
 * Falls back to an "Unspecified" tab when no province is given (e.g. NCR).
 */
export async function appendRowToSheet(values, province) {
  try {
    const { sheets, spreadsheetId } = await getSheetsContext();

    const { title, gid } = await ensureProvinceTab(sheets, spreadsheetId, province);
    await ensureHeaderRow(sheets, spreadsheetId, title, gid);

    const result = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: a1(title, 'A1'),
      // RAW, not USER_ENTERED: Sheets parses a leading "+" as a formula and
      // would mangle mobile numbers like +639123456789 into a plain integer.
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [values]
      }
    });

    return {
      success: true,
      tab: title,
      updatedRange: result.data.updates.updatedRange,
      updatedRows: result.data.updates.updatedRows
    };
  } catch (error) {
    console.error('Error appending to sheet:', error);
    throw new Error(`Failed to save data to sheet: ${error.message}`);
  }
}

export async function getSheetHeaders() {
  try {
    const { sheets, spreadsheetId } = await getSheetsContext();
    const tabs = await listTabs(sheets, spreadsheetId);
    const first = tabs[0];
    if (!first) return [];

    const result = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: a1(first.title, '1:1')
    });

    return result.data.values?.[0] || [];
  } catch (error) {
    console.error('Error reading sheet headers:', error);
    throw new Error(`Failed to read headers from sheet: ${error.message}`);
  }
}
