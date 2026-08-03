import { Readable } from 'stream';
import { appendRowToSheet, getSheetHeaders } from '../services/sheetsService.js';
import { buildSheetRow } from '../config/sheetColumns.js';
import {
  getDriveClient,
  uploadPhotoToDrive,
  uploadSignatureToDrive
} from '../services/driveService.js';
import { getValidAccessToken, getAdminConfig } from '../services/authService.js';

// Multipart sends everything as strings, so the structured fields arrive as JSON.
function parseJsonField(value, fallback) {
  if (value === undefined || value === null) return fallback;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export async function submitForm(req, res) {
  try {
    const data = parseJsonField(req.body.data, null);

    if (!data || typeof data !== 'object') {
      return res.status(400).json({
        error: 'Invalid form data'
      });
    }

    // Uploads are best-effort: a Drive failure shouldn't discard an otherwise
    // valid application, so the row is still written with an empty link.
    let signatureLink = '';
    let photoLink = '';

    const needsDrive = Boolean(data.signatureImage || req.file);

    if (needsDrive) {
      try {
        const config = getAdminConfig();
        const accessToken = await getValidAccessToken();
        const drive = getDriveClient(accessToken);
        const folderId = config?.folderId || undefined;
        const applicantName = [data.firstName, data.surname].filter(Boolean).join('-');

        if (data.signatureImage) {
          const uploaded = await uploadSignatureToDrive(
            drive,
            data.signatureImage,
            applicantName,
            folderId
          );
          signatureLink = uploaded.webViewLink;
        }

        if (req.file) {
          const safeName = (applicantName || 'applicant')
            .replace(/[^a-z0-9]+/gi, '-')
            .toLowerCase();
          const ext = req.file.mimetype === 'image/png' ? 'png' : 'jpg';

          const uploaded = await uploadPhotoToDrive(
            drive,
            Readable.from(req.file.buffer),
            `${safeName}-photo.${ext}`,
            req.file.mimetype,
            folderId
          );
          photoLink = uploaded.webViewLink;
        }
      } catch (uploadError) {
        console.error('Drive upload failed, continuing without it:', uploadError.message);
      }
    }

    // Column order comes from the server so it always matches the header row.
    const row = buildSheetRow({
      ...data,
      signatureImageUrl: signatureLink,
      profilePhotoUrl: photoLink
    });

    const result = await appendRowToSheet(row);

    res.status(201).json({
      success: true,
      message: 'Form submitted successfully',
      photoUploaded: Boolean(photoLink),
      signatureUploaded: Boolean(signatureLink),
      ...result
    });
  } catch (error) {
    console.error('Error submitting form:', error);
    res.status(500).json({
      error: 'Failed to submit form',
      message: error.message
    });
  }
}

export async function getFormHeaders(req, res) {
  try {
    const headers = await getSheetHeaders();
    res.json({
      headers
    });
  } catch (error) {
    console.error('Error fetching headers:', error);
    res.status(500).json({
      error: 'Failed to fetch form headers',
      message: error.message
    });
  }
}
