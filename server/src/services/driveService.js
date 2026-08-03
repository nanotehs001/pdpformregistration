import { google } from 'googleapis';
import { v4 as uuidv4 } from 'uuid';
import { Readable } from 'stream';

export function getDriveClient(accessToken) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return google.drive({ version: 'v3', auth });
}

export async function uploadPhotoToDrive(drive, fileBuffer, fileName, mimeType, folderId) {
  try {
    const fileId = uuidv4();
    const displayName = `${fileId}-${fileName}`;

    const file = await drive.files.create({
      requestBody: {
        name: displayName,
        mimeType: mimeType,
        parents: folderId ? [folderId] : undefined
      },
      media: {
        mimeType: mimeType,
        body: fileBuffer
      },
      fields: 'id, webViewLink'
    });

    // Make file shareable
    await drive.permissions.create({
      fileId: file.data.id,
      requestBody: {
        role: 'reader',
        type: 'anyone'
      }
    });

    return {
      fileId: file.data.id,
      webViewLink: file.data.webViewLink,
      displayName: displayName
    };
  } catch (error) {
    console.error('Error uploading photo to Drive:', error);
    throw new Error(`Failed to upload photo: ${error.message}`);
  }
}

/**
 * Persist a signature captured from the browser canvas. The client sends a
 * `data:image/png;base64,...` URL, which is decoded and stored as a real PNG.
 */
export async function uploadSignatureToDrive(drive, dataUrl, applicantName, folderId) {
  const match = /^data:(image\/\w+);base64,(.+)$/.exec(dataUrl || '');
  if (!match) {
    throw new Error('Signature image is not a valid data URL');
  }

  const [, mimeType, base64] = match;
  const buffer = Buffer.from(base64, 'base64');
  const safeName = (applicantName || 'applicant').replace(/[^a-z0-9]+/gi, '-').toLowerCase();

  return uploadPhotoToDrive(
    drive,
    Readable.from(buffer),
    `${safeName}-signature.png`,
    mimeType,
    folderId
  );
}

export async function getPhotoShareLink(drive, fileId) {
  try {
    const file = await drive.files.get({
      fileId: fileId,
      fields: 'webViewLink, webContentLink'
    });

    return {
      webViewLink: file.data.webViewLink,
      webContentLink: file.data.webContentLink
    };
  } catch (error) {
    console.error('Error getting photo link:', error);
    throw new Error(`Failed to get photo link: ${error.message}`);
  }
}

export async function deletePhotoFromDrive(drive, fileId) {
  try {
    await drive.files.delete({
      fileId: fileId
    });
    return true;
  } catch (error) {
    console.error('Error deleting photo from Drive:', error);
    throw new Error(`Failed to delete photo: ${error.message}`);
  }
}
