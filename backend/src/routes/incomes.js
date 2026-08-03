import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth } from '../auth.js';

export const incomesRouter = Router();

incomesRouter.get('/', requireAuth, (_req, res) => {
  const rows = db
    .prepare(
      `SELECT id, fonte, categoria, tipo, amount_cents AS amountCents, received_date AS receivedDate
       FROM incomes
       ORDER BY received_date DESC, id DESC`
    )
    .all();

  res.json({ incomes: rows });
});

incomesRouter.post('/', requireAuth, (req, res) => {
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

  const result = db
    .prepare(
      'INSERT INTO incomes (fonte, categoria, tipo, amount_cents, received_date) VALUES (?, ?, ?, ?, ?)'
    )
    .run(fonte.trim(), categoria.trim(), tipo.trim(), roundedAmount, receivedDate);

  res.status(201).json({
    income: {
      id: Number(result.lastInsertRowid),
      fonte: fonte.trim(),
      categoria: categoria.trim(),
      tipo: tipo.trim(),
      amountCents: roundedAmount,
      receivedDate,
    },
  });
});

incomesRouter.delete('/:id', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ message: 'Identificador inválido.' });
  }

  db.prepare('DELETE FROM incomes WHERE id = ?').run(id);
  res.status(204).send();
});
