import { google } from 'googleapis';
import { getValidAccessToken, getAdminConfig } from './authService.js';
import { SHEET_HEADERS } from '../config/sheetColumns.js';

// A1 ranges must reference the tab by its real name. Wrap it in single quotes
// (and escape any embedded quotes) so names with spaces/punctuation parse.
function a1(title, ref) {
  return `'${String(title).replace(/'/g, "''")}'!${ref}`;
}

// The sheet is chosen by the admin at runtime (env/KV), not at boot, so resolve
// credentials and the target sheet — including its actual first-tab name — on
// every call. Hardcoding "Sheet1" breaks whenever the tab is named anything else.
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

  const sheets = google.sheets({ version: 'v4', auth });
  const spreadsheetId = config.sheetId;

  // Discover the first tab's real title + numeric id.
  const meta = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: 'sheets.properties(sheetId,title,index)'
  });
  const firstTab = meta.data.sheets?.[0]?.properties;
  const sheetTitle = firstTab?.title || 'Sheet1';
  const sheetGid = firstTab?.sheetId ?? 0;

  return { sheets, spreadsheetId, sheetTitle, sheetGid };
}

/**
 * Writes the header row when the sheet has none, so an admin opening the sheet
 * can tell what each column means. Existing content is never overwritten: if
 * row 1 already holds something, it is left exactly as-is.
 */
export async function ensureHeaderRow(sheets, spreadsheetId, sheetTitle, sheetGid) {
  const existing = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: a1(sheetTitle, '1:1')
  });

  const firstRow = existing.data.values?.[0] || [];
  if (firstRow.some((cell) => String(cell).trim() !== '')) {
    return false;
  }

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: a1(sheetTitle, 'A1'),
    valueInputOption: 'RAW',
    requestBody: { values: [SHEET_HEADERS] }
  });

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

export async function appendRowToSheet(values) {
  try {
    const { sheets, spreadsheetId, sheetTitle, sheetGid } = await getSheetsContext();

    await ensureHeaderRow(sheets, spreadsheetId, sheetTitle, sheetGid);

    const result = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: a1(sheetTitle, 'A1'),
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
    const { sheets, spreadsheetId, sheetTitle } = await getSheetsContext();

    const result = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: a1(sheetTitle, '1:1')
    });

    return result.data.values?.[0] || [];
  } catch (error) {
    console.error('Error reading sheet headers:', error);
    throw new Error(`Failed to read headers from sheet: ${error.message}`);
  }
}
