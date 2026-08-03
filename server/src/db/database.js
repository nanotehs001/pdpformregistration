import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

/**
 * Local-development storage only.
 *
 * Everything here is lazy and dynamically imported: on a read-only serverless
 * filesystem (Vercel) merely importing this module used to crash the function
 * at cold start, because it opened the database and ran mkdirSync at module
 * scope. Nothing touches the disk now unless a SQLite call is actually made.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '../../data/pdp.db');

let dbPromise = null;

async function getDb() {
  if (dbPromise) return dbPromise;

  dbPromise = (async () => {
    let sqlite3;
    try {
      ({ default: sqlite3 } = await import('sqlite3'));
    } catch {
      throw new Error(
        'SQLite is unavailable. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to use Postgres storage.'
      );
    }

    const dataDir = path.dirname(dbPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(dbPath, (err) => {
        if (err) reject(err);
        else {
          console.log('✓ Connected to SQLite database:', dbPath);
          resolve(db);
        }
      });
    });
  })();

  return dbPromise;
}

export async function initializeDatabase() {
  const db = await getDb();
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');

  await new Promise((resolve, reject) => {
    db.exec(schema, (err) => (err ? reject(err) : resolve()));
  });

  // CREATE TABLE IF NOT EXISTS won't add columns to a pre-existing table, so
  // apply additive migrations separately. Duplicate-column errors are expected
  // on every run after the first.
  await new Promise((resolve, reject) => {
    db.run('ALTER TABLE admin_config ADD COLUMN google_token_expiry INTEGER', (err) => {
      if (err && !/duplicate column/i.test(err.message)) reject(err);
      else resolve();
    });
  });

  console.log('✓ Database schema initialized');
}

export async function getOne(sql, params = []) {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row)));
  });
}

export async function getAll(sql, params = []) {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows || [])));
  });
}

export async function run(sql, params = []) {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

export async function closeDatabase() {
  if (!dbPromise) return;
  const db = await dbPromise;
  await new Promise((resolve, reject) => {
    db.close((err) => (err ? reject(err) : resolve()));
  });
  dbPromise = null;
  console.log('✓ Database connection closed');
}
