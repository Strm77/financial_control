import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { authRouter } from './routes/auth.js';
import { paymentsRouter } from './routes/payments.js';
import { settingsRouter } from './routes/settings.js';
import { incomesRouter } from './routes/incomes.js';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/incomes', incomesRouter);

app.use((req, res) => {
  res.status(404).json({ message: 'Rota não encontrada.' });
});

app.listen(PORT, () => {
  console.log(`Financial Control API rodando em http://localhost:${PORT}`);
});
