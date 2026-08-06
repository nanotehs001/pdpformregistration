import { Readable } from 'stream';
import { appendRowToSheet, getSheetHeaders } from '../services/sheetsService.js';
import { buildSheetRow } from '../config/sheetColumns.js';
import {
  getDriveClient,
  uploadPhotoToDrive,
  uploadSignatureToDrive
} from '../services/driveService.js';
import { getValidAccessToken, getAdminConfig } from '../services/authService.js';
import { generateMembershipId } from '../services/membershipId.js';
import { saveMember, getMember, isKvConfigured } from '../services/configStore.js';

// Builds the public origin (https://host) from the proxied request, falling back
// to FRONTEND_URL. Used to construct the printable card URL.
function resolveOrigin(req) {
  const envOrigin = (process.env.FRONTEND_URL || '').split(',')[0].trim().replace(/\/+$/, '');
  if (envOrigin) return envOrigin;
  const proto = req.get('x-forwarded-proto') || req.protocol || 'https';
  const host = req.get('x-forwarded-host') || req.get('host');
  return `${proto}://${host}`;
}

/**
 * Produces a membership ID and, when KV is available, persists a small verify
 * record under it — retrying on the rare collision so the ID is unique. Returns
 * the id (and whether the verify record was stored).
 */
async function assignMembershipId(record) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const id = generateMembershipId();
    if (!isKvConfigured()) {
      // No store to check against; the timestamp+random id is effectively unique.
      return { id, stored: false };
    }
    const stored = await saveMember(id, { id, ...record });
    if (stored) return { id, stored: true };
  }
  // Extremely unlikely: fall back to a definitely-unique id built from the clock.
  const fallback = `PDP-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
  await saveMember(fallback, { id: fallback, ...record });
  return { id: fallback, stored: true };
}

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
    let photoFileId = '';

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
          photoFileId = uploaded.fileId;
        }
      } catch (uploadError) {
        console.error('Drive upload failed, continuing without it:', uploadError.message);
      }
    }

    // A Drive thumbnail URL embeds reliably in an <img>, unlike the share link,
    // so the printable card page (opened later from the Sheet) can show the photo.
    const photoUrl = photoFileId
      ? `https://drive.google.com/thumbnail?id=${photoFileId}&sz=w600`
      : '';

    // ID card shows First + Surname only (middle name still lands in the Sheet).
    const fullName = [data.firstName, data.surname].filter(Boolean).join(' ');
    const location = [data.municipality, data.province].filter(Boolean).join(', ');

    // Assign the membership ID and store the verify/print record in KV.
    const { id: membershipId } = await assignMembershipId({
      fullName,
      location,
      photoUrl,
      photoFileId,
      createdAt: new Date().toISOString()
    });

    // The printable ID card lives at this URL; it's stored in the Sheet and is
    // also what the card's QR code points to.
    const origin = resolveOrigin(req);
    const cardUrl = `${origin}/card/${membershipId}`;

    // Column order comes from the server so it always matches the header row.
    const row = buildSheetRow({
      ...data,
      signatureImageUrl: signatureLink,
      profilePhotoUrl: photoLink,
      membershipId,
      cardUrl
    });

    // File the row onto a tab named after the province (region for NCR, which
    // has no province; "Unspecified" as a last resort). New provinces auto-create.
    const provinceTab = data.province || data.region || 'Unspecified';
    const result = await appendRowToSheet(row, provinceTab);

    res.status(201).json({
      success: true,
      message: 'Form submitted successfully',
      membershipId,
      cardUrl,
      fullName,
      location,
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

/**
 * Public lookup for the printable card / QR verification page. Returns the
 * stored member record (name, location, photo, date) or 404 if unknown.
 */
export async function getMemberCard(req, res) {
  const id = String(req.params.id || '').trim();
  if (!/^PDP-\d{4}-\d{4,6}$/.test(id)) {
    return res.status(400).json({ valid: false, error: 'Invalid membership ID' });
  }

  if (!isKvConfigured()) {
    return res.status(503).json({
      valid: false,
      error: 'Verification store is not configured.'
    });
  }

  const member = await getMember(id);
  if (!member) {
    return res.status(404).json({ valid: false, error: 'Member not found' });
  }

  res.json({
    valid: true,
    id,
    fullName: member.fullName || '',
    location: member.location || '',
    photoUrl: member.photoUrl || '',
    createdAt: member.createdAt || ''
  });
}

/**
 * Same-origin proxy for a member's photo. The card page loads the image through
 * here so it can be captured as an image without cross-origin canvas tainting
 * (a direct Google Drive URL would taint it). Streams the Drive thumbnail bytes.
 */
export async function getMemberPhoto(req, res) {
  const id = String(req.params.id || '').trim();
  if (!isKvConfigured()) return res.status(404).end();

  const member = await getMember(id);
  if (!member?.photoFileId) return res.status(404).end();

  try {
    const url = `https://drive.google.com/thumbnail?id=${member.photoFileId}&sz=w600`;
    const upstream = await fetch(url);
    if (!upstream.ok) return res.status(404).end();

    const buffer = Buffer.from(await upstream.arrayBuffer());
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'image/jpeg');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(buffer);
  } catch (error) {
    console.error('Photo proxy failed:', error.message);
    res.status(404).end();
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
