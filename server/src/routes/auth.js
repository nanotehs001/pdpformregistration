import express from 'express';
import { adminLogin, adminSession } from '../controllers/adminController.js';
import { initiateGoogleAuth, handleGoogleAuthCallback } from '../controllers/googleConnectController.js';
import { requireAdmin } from '../middleware/requireAdmin.js';

const router = express.Router();

// Admin password sign-in
router.post('/admin-login', adminLogin);
router.get('/admin-session', adminSession);

// Admin-only: starting the flow binds a Google account to this app.
router.get('/google', requireAdmin, initiateGoogleAuth);

// Google redirects here with no Authorization header, so this cannot be gated.
// It is protected by the signed, expiring `state` parameter instead.
router.get('/google-callback', handleGoogleAuthCallback);

export default router;
