import pg from 'pg';

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!connectionString) {
  throw new Error(
    'Defina a variável de ambiente DATABASE_URL (ou POSTGRES_URL) com a connection string do Postgres.'
  );
}

const isLocal = /localhost|127\.0\.0\.1/.test(connectionString);

export const pool = new Pool({
  connectionString,
  ssl: isLocal ? false : { rejectUnauthorized: false },
});

const SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    descricao TEXT NOT NULL,
    tipo TEXT NOT NULL,
    categoria TEXT NOT NULL,
    valor_cents INTEGER NOT NULL,
    valor_pago_cents INTEGER NOT NULL DEFAULT 0,
    desconto_cents INTEGER NOT NULL DEFAULT 0,
    due_date TEXT NOT NULL,
    payment_date TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS card_expenses (
    id SERIAL PRIMARY KEY,
    payment_id INTEGER NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    descricao TEXT NOT NULL,
    valor_cents INTEGER NOT NULL,
    parcela_atual INTEGER,
    numero_parcelas INTEGER,
    data TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS select_options (
    id SERIAL PRIMARY KEY,
    section TEXT NOT NULL,
    field TEXT NOT NULL,
    label TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS incomes (
    id SERIAL PRIMARY KEY,
    fonte TEXT NOT NULL,
    categoria TEXT NOT NULL,
    tipo TEXT NOT NULL,
    amount_cents INTEGER NOT NULL,
    received_date TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS debts (
    id SERIAL PRIMARY KEY,
    credor TEXT NOT NULL,
    valor_contratado_cents INTEGER NOT NULL,
    valor_parcela_cents INTEGER NOT NULL,
    numero_parcelas INTEGER NOT NULL,
    parcela_atual INTEGER NOT NULL,
    juros_percent DOUBLE PRECISION,
    due_date TEXT NOT NULL,
    recorrente BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
`;

async function seedDemoPayments() {
  const { rows } = await pool.query('SELECT COUNT(*)::int AS count FROM payments');
  if (rows[0].count > 0) return;

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

  for (const payment of demoPayments) {
    await pool.query(
      `INSERT INTO payments (descricao, tipo, categoria, valor_cents, valor_pago_cents, desconto_cents, due_date, payment_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        payment.descricao,
        payment.tipo,
        payment.categoria,
        payment.valor_cents,
        payment.valor_pago_cents,
        payment.desconto_cents,
        payment.due_date,
        payment.payment_date,
      ]
    );
  }
}

async function seedIncomeOptions() {
  const { rows } = await pool.query("SELECT COUNT(*)::int AS count FROM select_options WHERE section = 'renda'");
  if (rows[0].count > 0) return;

  const defaults = {
    fonte: ['Salário', 'Freelance', 'Aluguel Recebido', 'Investimentos', 'Outros'],
    categoria: ['Fixa', 'Variável', 'Extra'],
    tipo: ['Recorrente', 'Pontual'],
  };

  for (const [field, labels] of Object.entries(defaults)) {
    for (const label of labels) {
      await pool.query('INSERT INTO select_options (section, field, label) VALUES ($1, $2, $3)', [
        'renda',
        field,
        label,
      ]);
    }
  }
}

let readyPromise = null;

// No banco serverless (Vercel), cada cold start precisa garantir que o schema e os
// dados iniciais existam antes de atender a primeira requisição. A promise é
// memorizada para que as chamadas seguintes (mesma instância "quente") não repitam o trabalho.
export function ensureReady() {
  if (!readyPromise) {
    readyPromise = (async () => {
      await pool.query(SCHEMA_SQL);
      await seedDemoPayments();
      await seedIncomeOptions();
    })().catch((err) => {
      readyPromise = null;
      throw err;
    });
  }
  return readyPromise;
}
