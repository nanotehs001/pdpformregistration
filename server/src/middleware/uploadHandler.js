import multer from 'multer';
import path from 'path';

// Configure multer for file uploads
const storage = multer.memoryStorage(); // Store files in memory for cloud upload

const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedMimes = ['image/jpeg', 'image/png', 'image/jpg'];
  const allowedExt = ['.jpg', '.jpeg', '.png'];

  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedMimes.includes(file.mimetype) && allowedExt.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG and PNG allowed.'));
  }
};

// Vercel serverless functions reject request bodies over 4.5 MB outright, so
// the cap sits below that with headroom for the JSON fields and the base64
// signature that travel in the same multipart body.
export const MAX_PHOTO_BYTES = 4 * 1024 * 1024;

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: MAX_PHOTO_BYTES
  }
});

// Middleware to handle upload errors
export function handleUploadError(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File too large',
        message: 'Photo must be smaller than 4MB'
      });
    }
    return res.status(400).json({
      error: 'Upload error',
      message: err.message
    });
  } else if (err) {
    return res.status(400).json({
      error: 'Upload error',
      message: err.message
    });
  }
  next();
}

export default upload;
