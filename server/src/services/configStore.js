import { createClient } from '@vercel/kv';
import { setEnvValue } from './envWriter.js';

/**
 * Runtime configuration overrides backed by Vercel KV.
 *
 * The problem this solves: on Vercel the filesystem is read-only, so config the
 * admin changes at runtime (which Sheet, which Drive folder, the Google refresh
 * token) cannot be written to .env. KV is a tiny managed key-value store that
 * persists those values and is readable live — no redeploy needed.
 *
 * Reads: values are pulled from KV into an in-memory cache (short TTL) so the
 * synchronous getRuntimeConfig() can stay synchronous. A request-scoped
 * middleware primes the cache before handlers run.
 *
 * Writes: persistConfig() writes to KV when it's configured (works on Vercel and
 * locally), otherwise falls back to writing the local .env file.
 *
 * When KV is not configured, every function here is a safe no-op and the app
 * behaves exactly as it did before — reading straight from environment vars.
 */

// The only keys we ever store. Everything else stays in env vars.
export const CONFIG_KEYS = [
  'GOOGLE_SHEET_URL',
  'GOOGLE_DRIVE_FOLDER_URL',
  'GOOGLE_REFRESH_TOKEN'
];

const CACHE_TTL_MS = 30_000;

let overrides = {}; // key -> value pulled from KV
let loadedAt = 0;
let client = null;

// The classic Vercel KV integration injects KV_REST_API_*; the newer Upstash
// marketplace integration (what "Vercel KV" now points to) may instead inject
// UPSTASH_REDIS_REST_*. Accept either so it works however the store was added.
function kvCreds() {
  return {
    url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN
  };
}

export function isKvConfigured() {
  const { url, token } = kvCreds();
  return Boolean(url && token);
}

function kvClient() {
  if (!isKvConfigured()) return null;
  if (!client) {
    client = createClient(kvCreds());
  }
  return client;
}

/**
 * Pulls the config keys from KV into the in-memory cache. Cheap and cached: it
 * only actually hits KV when the cache is empty, stale, or force is true.
 */
export async function ensureLoaded(force = false) {
  if (!isKvConfigured()) return;
  const fresh = loadedAt !== 0 && Date.now() - loadedAt < CACHE_TTL_MS;
  if (!force && fresh) return;

  try {
    const values = await kvClient().mget(...CONFIG_KEYS);
    const next = {};
    CONFIG_KEYS.forEach((key, i) => {
      const value = values[i];
      if (value != null && value !== '') next[key] = String(value);
    });
    overrides = next;
    loadedAt = Date.now();
  } catch (error) {
    // A KV outage must not take the whole app down — fall back to env vars.
    console.error('[configStore] KV load failed:', error.message);
  }
}

/** Synchronous read of a single override from the primed cache. */
export function getOverride(key) {
  return overrides[key] ?? null;
}

/**
 * Persists the given { KEY: value } pairs.
 *  - KV configured  -> writes to KV, updates the cache, effective immediately.
 *  - otherwise       -> writes to the local .env file (dev only).
 * Returns { saved, via } where via is 'kv' | 'env' | 'none'.
 */
export async function persistConfig(updates) {
  const entries = Object.entries(updates).filter(
    ([, v]) => v != null && v !== ''
  );
  if (entries.length === 0) return { saved: true, via: 'none' };

  if (isKvConfigured()) {
    try {
      await Promise.all(entries.map(([key, value]) => kvClient().set(key, value)));
      // Keep the local cache consistent so this instance reflects it at once.
      for (const [key, value] of entries) overrides[key] = value;
      loadedAt = Date.now();
      return { saved: true, via: 'kv' };
    } catch (error) {
      console.error('[configStore] KV write failed:', error.message);
      return { saved: false, via: 'none' };
    }
  }

  // Local development: write straight to .env.
  let allWritten = true;
  for (const [key, value] of entries) {
    if (!setEnvValue(key, value)) allWritten = false;
  }
  return allWritten ? { saved: true, via: 'env' } : { saved: false, via: 'none' };
}
