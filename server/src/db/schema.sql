-- Admin Configuration Table
CREATE TABLE IF NOT EXISTS admin_config (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  google_access_token TEXT NOT NULL,
  google_refresh_token TEXT,
  google_token_expiry INTEGER,
  google_sheet_id TEXT,
  google_drive_folder_id TEXT,
  last_connected TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Google OAuth State for security
CREATE TABLE IF NOT EXISTS oauth_states (
  state TEXT PRIMARY KEY,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP
);

-- Log of form submissions with photos
CREATE TABLE IF NOT EXISTS form_submissions (
  id TEXT PRIMARY KEY,
  email TEXT,
  photo_url TEXT,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indices for faster queries
CREATE INDEX IF NOT EXISTS idx_admin_config_id ON admin_config(id);
CREATE INDEX IF NOT EXISTS idx_oauth_states_created ON oauth_states(created_at);
CREATE INDEX IF NOT EXISTS idx_form_submissions_email ON form_submissions(email);
CREATE INDEX IF NOT EXISTS idx_form_submissions_submitted ON form_submissions(submitted_at);
