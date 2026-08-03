import express from 'express';
import { submitForm, getFormHeaders, getMemberCard, getMemberPhoto } from '../controllers/formController.js';
import upload, { handleUploadError } from '../middleware/uploadHandler.js';

const router = express.Router();

router.post('/submit-form', upload.single('profilePhoto'), handleUploadError, submitForm);
router.get('/form-headers', getFormHeaders);

// Public: printable card / QR verification lookup.
router.get('/members/:id', getMemberCard);
// Same-origin photo proxy so the card can be saved as an image without tainting.
router.get('/members/:id/photo', getMemberPhoto);

export default router;
