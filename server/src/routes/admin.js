import express from 'express';
import { getConfig, updateDestination } from '../controllers/adminController.js';
import { requireAdmin } from '../middleware/requireAdmin.js';

const router = express.Router();

router.get('/config', requireAdmin, getConfig);

// Updates GOOGLE_SHEET_URL / GOOGLE_DRIVE_FOLDER_URL. Writes to .env locally;
// on Vercel it returns the values to paste into the dashboard instead.
router.post('/destination', requireAdmin, updateDestination);

export default router;
