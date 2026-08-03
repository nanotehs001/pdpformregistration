import express from 'express';
import { getConfig } from '../controllers/adminController.js';
import { requireAdmin } from '../middleware/requireAdmin.js';

const router = express.Router();

// Read-only: configuration lives in environment variables, so there is no
// write endpoint. Change the values in .env (or Vercel) and redeploy.
router.get('/config', requireAdmin, getConfig);

export default router;
