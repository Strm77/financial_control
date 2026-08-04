import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../auth.js';

export const incomesRouter = Router();

incomesRouter.get('/', requireAuth, async (_req, res) => {
  const { rows } = await pool.query(
    `SELECT id, fonte, categoria, tipo, amount_cents AS "amountCents", received_date AS "receivedDate"
     FROM incomes
     ORDER BY received_date DESC, id DESC`
  );

  res.json({ incomes: rows });
});

incomesRouter.post('/', requireAuth, async (req, res) => {
  const { fonte, categoria, tipo, amountCents } = req.body ?? {};

  const isValidText = (value) => typeof value === 'string' && value.trim().length > 0;

  if (
    !isValidText(fonte) ||
    !isValidText(categoria) ||
    !isValidText(tipo) ||
    typeof amountCents !== 'number' ||
    !Number.isFinite(amountCents) ||
    amountCents <= 0
  ) {
    return res.status(400).json({ message: 'Preencha fonte, categoria, tipo e um valor válido.' });
  }

  // A data de recebimento é sempre a data em que o valor foi adicionado.
  const receivedDate = new Date().toISOString().slice(0, 10);
  const roundedAmount = Math.round(amountCents);

  const { rows } = await pool.query(
    `INSERT INTO incomes (fonte, categoria, tipo, amount_cents, received_date)
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [fonte.trim(), categoria.trim(), tipo.trim(), roundedAmount, receivedDate]
  );

  res.status(201).json({
    income: {
      id: rows[0].id,
      fonte: fonte.trim(),
      categoria: categoria.trim(),
      tipo: tipo.trim(),
      amountCents: roundedAmount,
      receivedDate,
    },
  });
});

incomesRouter.patch('/:id', requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ message: 'Identificador inválido.' });
  }

  const existingResult = await pool.query('SELECT * FROM incomes WHERE id = $1', [id]);
  const existing = existingResult.rows[0];
  if (!existing) {
    return res.status(404).json({ message: 'Renda não encontrada.' });
  }

  const { fonte, categoria, tipo, amountCents } = req.body ?? {};
  const isValidText = (value) => typeof value === 'string' && value.trim().length > 0;

  if (
    !isValidText(fonte) ||
    !isValidText(categoria) ||
    !isValidText(tipo) ||
    typeof amountCents !== 'number' ||
    !Number.isFinite(amountCents) ||
    amountCents <= 0
  ) {
    return res.status(400).json({ message: 'Preencha fonte, categoria, tipo e um valor válido.' });
  }

  // A data de recebimento não muda ao editar: continua sendo a data em que o lançamento foi criado.
  const roundedAmount = Math.round(amountCents);

  await pool.query('UPDATE incomes SET fonte = $1, categoria = $2, tipo = $3, amount_cents = $4 WHERE id = $5', [
    fonte.trim(),
    categoria.trim(),
    tipo.trim(),
    roundedAmount,
    id,
  ]);

  res.json({
    income: {
      id,
      fonte: fonte.trim(),
      categoria: categoria.trim(),
      tipo: tipo.trim(),
      amountCents: roundedAmount,
      receivedDate: existing.received_date,
    },
  });
});

incomesRouter.delete('/:id', requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ message: 'Identificador inválido.' });
  }

  await pool.query('DELETE FROM incomes WHERE id = $1', [id]);
  res.status(204).send();
});
