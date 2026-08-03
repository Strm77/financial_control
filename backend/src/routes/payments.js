import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth } from '../auth.js';

export const paymentsRouter = Router();

paymentsRouter.get('/', requireAuth, (_req, res) => {
  const rows = db
    .prepare(
      'SELECT id, description, amount_cents AS amountCents, due_date AS dueDate, paid FROM payments ORDER BY due_date ASC'
    )
    .all();

  res.json({
    payments: rows.map((row) => ({ ...row, paid: Boolean(row.paid) })),
  });
});
