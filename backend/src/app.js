import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { ensureReady } from './db.js';
import { authRouter } from './routes/auth.js';
import { paymentsRouter } from './routes/payments.js';
import { settingsRouter } from './routes/settings.js';
import { incomesRouter } from './routes/incomes.js';
import { debtsRouter } from './routes/debts.js';
import { cardExpensesRouter } from './routes/cardExpenses.js';

const app = express();

app.use(cors());
app.use(express.json());

// Em ambiente serverless (Vercel), cada cold start precisa garantir que o schema
// do Postgres e os dados iniciais existam antes de atender a requisição.
app.use(async (_req, res, next) => {
  try {
    await ensureReady();
    next();
  } catch (err) {
    console.error('Falha ao preparar o banco de dados:', err);
    res.status(503).json({ message: 'Banco de dados indisponível. Tente novamente em instantes.' });
  }
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/incomes', incomesRouter);
app.use('/api/debts', debtsRouter);
app.use('/api/card-expenses', cardExpensesRouter);

app.use((req, res) => {
  res.status(404).json({ message: 'Rota não encontrada.' });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ message: 'Arquivo muito grande. O limite é 4MB.' });
  }
  console.error(err);
  res.status(500).json({ message: 'Erro inesperado no servidor.' });
});

export default app;
