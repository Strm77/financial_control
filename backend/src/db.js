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

db.exec('PRAGMA foreign_keys = ON;');

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
    descricao TEXT NOT NULL,
    tipo TEXT NOT NULL,
    categoria TEXT NOT NULL,
    valor_cents INTEGER NOT NULL,
    valor_pago_cents INTEGER NOT NULL DEFAULT 0,
    desconto_cents INTEGER NOT NULL DEFAULT 0,
    due_date TEXT NOT NULL,
    payment_date TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS card_expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    payment_id INTEGER NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    descricao TEXT NOT NULL,
    valor_cents INTEGER NOT NULL,
    parcela_atual INTEGER,
    numero_parcelas INTEGER,
    data TEXT,
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
    recorrente INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

const DEFAULT_USERS = [
  { username: 'Brunno.', password: '7753955' },
  { username: 'Carol.', password: '051297' },
];

function seedDefaultUsers() {
  const existing = db.prepare('SELECT id FROM users WHERE username = ?');
  const insert = db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)');

  for (const { username, password } of DEFAULT_USERS) {
    if (existing.get(username)) continue;
    insert.run(username, bcrypt.hashSync(password, 10));
  }
}

function seedDemoPayments() {
  const { count } = db.prepare('SELECT COUNT(*) AS count FROM payments').get();
  if (count > 0) return;

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const pastDay = Math.max(1, now.getDate() - 1);
  const futureDay = Math.min(28, now.getDate() + 5);
  const today = `${year}-${String(month + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const monthDate = (monthOffset, day) => {
    const date = new Date(year, month + monthOffset, day);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const demoPayments = [
    {
      descricao: 'Aluguel',
      tipo: 'Fixo',
      categoria: 'Conta',
      valor_cents: 180000,
      valor_pago_cents: 0,
      desconto_cents: 0,
      due_date: monthDate(0, pastDay),
      payment_date: null,
    },
    {
      descricao: 'Água e luz',
      tipo: 'Fixo',
      categoria: 'Conta',
      valor_cents: 22000,
      valor_pago_cents: 22000,
      desconto_cents: 0,
      due_date: monthDate(0, Math.min(28, pastDay)),
      payment_date: today,
    },
    {
      descricao: 'Internet',
      tipo: 'Fixo',
      categoria: 'Assinatura',
      valor_cents: 12000,
      valor_pago_cents: 0,
      desconto_cents: 0,
      due_date: monthDate(0, futureDay),
      payment_date: null,
    },
    {
      descricao: 'Nubank',
      tipo: 'Variável',
      categoria: 'Cartão',
      valor_cents: 45000,
      valor_pago_cents: 0,
      desconto_cents: 0,
      due_date: monthDate(1, 10),
      payment_date: null,
    },
    {
      descricao: 'Riachuelo',
      tipo: 'Variável',
      categoria: 'Cartão de Loja',
      valor_cents: 18000,
      valor_pago_cents: 18000,
      desconto_cents: 0,
      due_date: monthDate(2, 5),
      payment_date: today,
    },
  ];

  const insert = db.prepare(
    `INSERT INTO payments (descricao, tipo, categoria, valor_cents, valor_pago_cents, desconto_cents, due_date, payment_date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  );
  for (const payment of demoPayments) {
    insert.run(
      payment.descricao,
      payment.tipo,
      payment.categoria,
      payment.valor_cents,
      payment.valor_pago_cents,
      payment.desconto_cents,
      payment.due_date,
      payment.payment_date
    );
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

seedDefaultUsers();
seedDemoPayments();
seedIncomeOptions();

export function logActivity(userId, event, details) {
  db.prepare('INSERT INTO activity_log (user_id, event, details) VALUES (?, ?, ?)').run(
    userId ?? null,
    event,
    details ? JSON.stringify(details) : null
  );
}
