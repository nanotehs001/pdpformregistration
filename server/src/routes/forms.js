import express from 'express';
import { submitForm, getFormHeaders, getMemberCard } from '../controllers/formController.js';
import upload, { handleUploadError } from '../middleware/uploadHandler.js';

const router = express.Router();

router.post('/submit-form', upload.single('profilePhoto'), handleUploadError, submitForm);
router.get('/form-headers', getFormHeaders);

// Public: printable card / QR verification lookup.
router.get('/members/:id', getMemberCard);

export default router;
