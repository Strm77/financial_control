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

  CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    description TEXT NOT NULL,
    amount_cents INTEGER NOT NULL,
    due_date TEXT NOT NULL,
    paid INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS select_options (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    section TEXT NOT NULL,
    field TEXT NOT NULL,
    label TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS incomes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fonte TEXT NOT NULL,
    categoria TEXT NOT NULL,
    tipo TEXT NOT NULL,
    amount_cents INTEGER NOT NULL,
    received_date TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS debts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    credor TEXT NOT NULL,
    valor_contratado_cents INTEGER NOT NULL,
    valor_parcela_cents INTEGER NOT NULL,
    numero_parcelas INTEGER NOT NULL,
    parcela_atual INTEGER NOT NULL,
    juros_percent REAL,
    due_date TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

function seedDefaultUser() {
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get('Brunno.');
  if (existing) return;

  const passwordHash = bcrypt.hashSync('7753955', 10);
  db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run('Brunno.', passwordHash);
}

function seedDemoPayments() {
  const { count } = db.prepare('SELECT COUNT(*) AS count FROM payments').get();
  if (count > 0) return;

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const pastDay = Math.max(1, now.getDate() - 1);
  const futureDay = Math.min(28, now.getDate() + 5);

  const monthDate = (monthOffset, day) => {
    const date = new Date(year, month + monthOffset, day);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const demoPayments = [
    { description: 'Aluguel', amount_cents: 180000, due_date: monthDate(0, pastDay), paid: 0 },
    { description: 'Internet', amount_cents: 12000, due_date: monthDate(0, futureDay), paid: 0 },
    { description: 'Água e luz', amount_cents: 22000, due_date: monthDate(0, Math.min(28, pastDay)), paid: 1 },
    { description: 'Fatura do cartão', amount_cents: 45000, due_date: monthDate(1, 10), paid: 0 },
    { description: 'Financiamento do carro', amount_cents: 98000, due_date: monthDate(2, 5), paid: 1 },
  ];

  const insert = db.prepare(
    'INSERT INTO payments (description, amount_cents, due_date, paid) VALUES (?, ?, ?, ?)'
  );
  for (const payment of demoPayments) {
    insert.run(payment.description, payment.amount_cents, payment.due_date, payment.paid);
  }
}

function seedIncomeOptions() {
  const { count } = db
    .prepare("SELECT COUNT(*) AS count FROM select_options WHERE section = 'renda'")
    .get();
  if (count > 0) return;

  const defaults = {
    fonte: ['Salário', 'Freelance', 'Aluguel Recebido', 'Investimentos', 'Outros'],
    categoria: ['Fixa', 'Variável', 'Extra'],
    tipo: ['Recorrente', 'Pontual'],
  };

  const insert = db.prepare('INSERT INTO select_options (section, field, label) VALUES (?, ?, ?)');
  for (const [field, labels] of Object.entries(defaults)) {
    for (const label of labels) {
      insert.run('renda', field, label);
    }
  }
}

seedDefaultUser();
seedDemoPayments();
seedIncomeOptions();

export function logActivity(userId, event, details) {
  db.prepare('INSERT INTO activity_log (user_id, event, details) VALUES (?, ?, ?)').run(
    userId ?? null,
    event,
    details ? JSON.stringify(details) : null
  );
}
