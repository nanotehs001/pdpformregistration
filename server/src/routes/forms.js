import express from 'express';
import { submitForm, getFormHeaders } from '../controllers/formController.js';
import upload, { handleUploadError } from '../middleware/uploadHandler.js';

const router = express.Router();

router.post('/submit-form', upload.single('profilePhoto'), handleUploadError, submitForm);
router.get('/form-headers', getFormHeaders);

export default router;
