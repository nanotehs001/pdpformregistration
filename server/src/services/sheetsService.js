import { google } from 'googleapis';
import { getValidAccessToken, getAdminConfig } from './authService.js';
import { SHEET_HEADERS } from '../config/sheetColumns.js';

// The sheet is chosen by the admin at runtime (stored in SQLite), not at boot,
// so resolve credentials and target sheet on every call.
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

/**
 * Writes the header row when the sheet has none, so an admin opening the sheet
 * can tell what each column means. Existing content is never overwritten: if
 * row 1 already holds something, it is left exactly as-is.
 */
export async function ensureHeaderRow(sheets, spreadsheetId) {
  const existing = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'Sheet1!1:1'
  });

  const firstRow = existing.data.values?.[0] || [];
  if (firstRow.some((cell) => String(cell).trim() !== '')) {
    return false;
  }

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: 'Sheet1!A1',
    valueInputOption: 'RAW',
    requestBody: { values: [SHEET_HEADERS] }
  });

  // Bold + freeze the header so it stays visible while scrolling.
  try {
    const meta = await sheets.spreadsheets.get({ spreadsheetId, fields: 'sheets.properties' });
    const sheetId = meta.data.sheets?.[0]?.properties?.sheetId ?? 0;

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            repeatCell: {
              range: { sheetId, startRowIndex: 0, endRowIndex: 1 },
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
              properties: { sheetId, gridProperties: { frozenRowCount: 1 } },
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
    const { sheets, spreadsheetId } = await getSheetsContext();

    await ensureHeaderRow(sheets, spreadsheetId);

    const result = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Sheet1!A1',
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
    const { sheets, spreadsheetId } = await getSheetsContext();

    const result = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Sheet1!1:1'
    });

    return result.data.values?.[0] || [];
  } catch (error) {
    console.error('Error reading sheet headers:', error);
    throw new Error(`Failed to read headers from sheet: ${error.message}`);
  }
}
