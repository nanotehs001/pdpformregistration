import { getSupabase, isSupabaseConfigured } from './supabaseClient.js';

// SQLite is loaded on demand so the module never touches the filesystem on a
// serverless host where Supabase is the active backend.
async function sqlite() {
  return import('./database.js');
}

/**
 * Storage for admin configuration and OAuth state.
 *
 * Backed by Supabase Postgres when SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are
 * set, otherwise by local SQLite. Serverless hosts (Vercel) have an ephemeral
 * filesystem, so SQLite is for local development only.
 */

const CONFIG_ID = 1;

export function activeBackend() {
  return isSupabaseConfigured() ? 'supabase' : 'sqlite';
}

// Accepts a full Google URL or a bare ID, so env values and pasted URLs
// are handled identically.
function idFromSheetUrl(value) {
  if (!value) return null;
  const match = /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/.exec(value);
  return (match ? match[1] : value).trim() || null;
}

function idFromFolderUrl(value) {
  if (!value) return null;
  const match = /\/folders\/([a-zA-Z0-9-_]+)/.exec(value);
  const id = match ? match[1] : value;
  return /^https?:\/\//i.test(id) ? null : id.trim() || null;
}

/**
 * Defaults from the environment. These act as a starting point only — anything
 * saved in the Admin dashboard is stored in the database and takes precedence,
 * so an admin can change the destination without a redeploy.
 */
export function envDefaults() {
  return {
    sheetId: idFromSheetUrl(process.env.GOOGLE_SHEET_URL || process.env.GOOGLE_SHEET_ID),
    folderId: idFromFolderUrl(process.env.GOOGLE_DRIVE_FOLDER_URL || process.env.GOOGLE_DRIVE_FOLDER_ID)
  };
}

// Normalises both backends to one shape so callers don't branch.
function normalise(row) {
  const defaults = envDefaults();

  if (!row) {
    // No stored config yet — still surface the env defaults so a freshly
    // deployed instance has a destination before anyone opens the dashboard.
    return {
      accessToken: null,
      refreshToken: null,
      tokenExpiry: null,
      sheetId: defaults.sheetId,
      folderId: defaults.folderId,
      lastConnected: null,
      sheetSource: defaults.sheetId ? 'env' : 'unset'
    };
  }

  const storedSheet = row.google_sheet_id || null;
  const storedFolder = row.google_drive_folder_id || null;

  return {
    accessToken: row.google_access_token ?? null,
    refreshToken: row.google_refresh_token ?? null,
    tokenExpiry: row.google_token_expiry ?? null,
    sheetId: storedSheet || defaults.sheetId,
    folderId: storedFolder || defaults.folderId,
    lastConnected: row.last_connected ?? null,
    sheetSource: storedSheet ? 'dashboard' : defaults.sheetId ? 'env' : 'unset'
  };
}

export async function readConfig() {
  if (isSupabaseConfigured()) {
    const { data, error } = await getSupabase()
      .from('admin_config')
      .select('*')
      .eq('id', CONFIG_ID)
      .maybeSingle();

    if (error) throw new Error(`Supabase read failed: ${error.message}`);
    return normalise(data);
  }

  const { getOne } = await sqlite();
  return normalise(await getOne('SELECT * FROM admin_config WHERE id = ?', [CONFIG_ID]));
}

/**
 * Store freshly issued OAuth tokens, preserving the sheet/folder settings and
 * any existing refresh token (Google only returns one on first consent).
 */
export async function saveTokens({ accessToken, refreshToken, tokenExpiry }) {
  const existing = await readConfig();
  const effectiveRefresh = refreshToken || existing?.refreshToken || null;

  if (isSupabaseConfigured()) {
    const { error } = await getSupabase()
      .from('admin_config')
      .upsert({
        id: CONFIG_ID,
        google_access_token: accessToken,
        google_refresh_token: effectiveRefresh,
        google_token_expiry: tokenExpiry ?? null,
        last_connected: new Date().toISOString()
      });

    if (error) throw new Error(`Supabase write failed: ${error.message}`);
    return;
  }

  const { run } = await sqlite();

  if (existing) {
    await run(
      `UPDATE admin_config
       SET google_access_token = ?, google_refresh_token = ?,
           google_token_expiry = ?, last_connected = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [accessToken, effectiveRefresh, tokenExpiry ?? null, CONFIG_ID]
    );
  } else {
    await run(
      `INSERT INTO admin_config
       (id, google_access_token, google_refresh_token, google_token_expiry, last_connected)
       VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [CONFIG_ID, accessToken, effectiveRefresh, tokenExpiry ?? null]
    );
  }
}

/** Persist a refreshed access token without touching anything else. */
export async function saveRefreshedAccessToken(accessToken, tokenExpiry) {
  if (isSupabaseConfigured()) {
    const { error } = await getSupabase()
      .from('admin_config')
      .update({
        google_access_token: accessToken,
        google_token_expiry: tokenExpiry ?? null
      })
      .eq('id', CONFIG_ID);

    if (error) throw new Error(`Supabase write failed: ${error.message}`);
    return;
  }

  const { run } = await sqlite();
  await run(
    `UPDATE admin_config
     SET google_access_token = ?, google_token_expiry = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [accessToken, tokenExpiry ?? null, CONFIG_ID]
  );
}

/** Returns false when there is no connected account to attach settings to. */
export async function saveDestination(sheetId, folderId) {
  if (isSupabaseConfigured()) {
    const { data, error } = await getSupabase()
      .from('admin_config')
      .update({
        google_sheet_id: sheetId,
        google_drive_folder_id: folderId || null
      })
      .eq('id', CONFIG_ID)
      .select('id');

    if (error) throw new Error(`Supabase write failed: ${error.message}`);
    return (data?.length ?? 0) > 0;
  }

  const { run } = await sqlite();
  const result = await run(
    `UPDATE admin_config
     SET google_sheet_id = ?, google_drive_folder_id = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [sheetId, folderId || null, CONFIG_ID]
  );

  return result.changes > 0;
}

export async function saveOAuthState(state, expiresAt) {
  if (isSupabaseConfigured()) {
    const { error } = await getSupabase()
      .from('oauth_states')
      .insert({ state, expires_at: expiresAt.toISOString() });

    if (error) throw new Error(`Supabase write failed: ${error.message}`);
    return;
  }

  const { run } = await sqlite();
  await run('INSERT INTO oauth_states (state, expires_at) VALUES (?, ?)', [
    state,
    expiresAt.toISOString()
  ]);
}

/** Consumes a state token, returning true only if it existed and is unexpired. */
export async function consumeOAuthState(state) {
  if (isSupabaseConfigured()) {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('oauth_states')
      .select('state, expires_at')
      .eq('state', state)
      .maybeSingle();

    if (error) throw new Error(`Supabase read failed: ${error.message}`);
    if (!data) return false;

    await supabase.from('oauth_states').delete().eq('state', state);
    return !data.expires_at || new Date(data.expires_at) > new Date();
  }

  const { getOne, run } = await sqlite();
  const row = await getOne('SELECT * FROM oauth_states WHERE state = ?', [state]);
  if (!row) return false;

  await run('DELETE FROM oauth_states WHERE state = ?', [state]);
  return !row.expires_at || new Date(row.expires_at) > new Date();
}
