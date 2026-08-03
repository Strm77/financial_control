import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DATA_DIR, 'financial_control.db');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export const db = new DatabaseSync(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS activity_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    event TEXT NOT NULL,
    details TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

function seedDefaultUser() {
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get('Brunno.');
  if (existing) return;

  const passwordHash = bcrypt.hashSync('7753955', 10);
  db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run('Brunno.', passwordHash);
}

seedDefaultUser();

export function logActivity(userId, event, details) {
  db.prepare('INSERT INTO activity_log (user_id, event, details) VALUES (?, ?, ?)').run(
    userId ?? null,
    event,
    details ? JSON.stringify(details) : null
  );
}
