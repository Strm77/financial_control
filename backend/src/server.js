import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { authRouter } from './routes/auth.js';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRouter);

app.use((req, res) => {
  res.status(404).json({ message: 'Rota não encontrada.' });
});

app.listen(PORT, () => {
  console.log(`Financial Control API rodando em http://localhost:${PORT}`);
});
