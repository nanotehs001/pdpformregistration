import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * Best-effort update of the local .env file.
 *
 * Only ever succeeds in local development. On Vercel the filesystem is
 * read-only, so this reports failure and the caller falls back to showing the
 * value for the admin to paste into the dashboard's Environment Variables.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '../../.env');

export function canWriteEnv() {
  if (process.env.NODE_ENV === 'production') return false;
  if (process.env.VERCEL) return false;

  try {
    fs.accessSync(envPath, fs.constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

/** Sets or replaces a single key. Returns true when the file was updated. */
export function setEnvValue(key, value) {
  if (!canWriteEnv()) return false;

  try {
    const current = fs.readFileSync(envPath, 'utf8');
    const line = `${key}=${value}`;
    const pattern = new RegExp(`^${key}=.*$`, 'm');

    const updated = pattern.test(current)
      ? current.replace(pattern, line)
      : `${current.replace(/\s*$/, '')}\n${line}\n`;

    fs.writeFileSync(envPath, updated, 'utf8');

    // Keep the running process consistent with the file it just wrote.
    process.env[key] = value;
    return true;
  } catch (error) {
    console.error(`Could not update ${key} in .env:`, error.message);
    return false;
  }
}
