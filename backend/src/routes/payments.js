import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../auth.js';

export const paymentsRouter = Router();

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function computeStatus(row) {
  const owedCents = Math.max(0, row.valor_cents - row.desconto_cents);

  if (row.valor_pago_cents >= owedCents && owedCents > 0) return 'pago';
  if (row.due_date < todayIso() && row.valor_pago_cents < owedCents) return 'atrasado';
  if (row.valor_pago_cents > 0) return 'parcial';
  return 'pendente';
}

function toResponse(row) {
  return {
    id: row.id,
    descricao: row.descricao,
    tipo: row.tipo,
    categoria: row.categoria,
    valorCents: row.valor_cents,
    valorPagoCents: row.valor_pago_cents,
    descontoCents: row.desconto_cents,
    dueDate: row.due_date,
    paymentDate: row.payment_date,
    status: computeStatus(row),
  };
}

function validate(body) {
  const { descricao, tipo, categoria, valorCents, valorPagoCents, descontoCents, dueDate } = body ?? {};

  if (typeof descricao !== 'string' || !descricao.trim()) {
    return 'Informe a descrição.';
  }
  if (typeof tipo !== 'string' || !tipo.trim()) {
    return 'Informe o tipo.';
  }
  if (typeof categoria !== 'string' || !categoria.trim()) {
    return 'Informe a categoria.';
  }
  if (typeof valorCents !== 'number' || !Number.isFinite(valorCents) || valorCents <= 0) {
    return 'Informe um valor válido.';
  }
  if (valorPagoCents !== undefined && valorPagoCents !== null) {
    if (typeof valorPagoCents !== 'number' || !Number.isFinite(valorPagoCents) || valorPagoCents < 0) {
      return 'Informe um valor pago válido.';
    }
  }
  if (descontoCents !== undefined && descontoCents !== null) {
    if (typeof descontoCents !== 'number' || !Number.isFinite(descontoCents) || descontoCents < 0) {
      return 'Informe um desconto válido.';
    }
  }
  if (typeof dueDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
    return 'Informe uma data de vencimento válida.';
  }

  return null;
}

paymentsRouter.get('/', requireAuth, async (_req, res) => {
  const { rows } = await pool.query('SELECT * FROM payments ORDER BY due_date ASC');
  res.json({ payments: rows.map(toResponse) });
});

paymentsRouter.post('/', requireAuth, async (req, res) => {
  const error = validate(req.body);
  if (error) {
    return res.status(400).json({ message: error });
  }

  const { descricao, tipo, categoria, valorCents, valorPagoCents, descontoCents, dueDate } = req.body;
  const roundedValorPago = Math.round(valorPagoCents ?? 0);
  const paymentDate = roundedValorPago > 0 ? todayIso() : null;

  const { rows } = await pool.query(
    `INSERT INTO payments (descricao, tipo, categoria, valor_cents, valor_pago_cents, desconto_cents, due_date, payment_date)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [
      descricao.trim(),
      tipo.trim(),
      categoria.trim(),
      Math.round(valorCents),
      roundedValorPago,
      Math.round(descontoCents ?? 0),
      dueDate,
      paymentDate,
    ]
  );

  res.status(201).json({ payment: toResponse(rows[0]) });
});

paymentsRouter.patch('/:id', requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ message: 'Identificador inválido.' });
  }

  const existingResult = await pool.query('SELECT * FROM payments WHERE id = $1', [id]);
  const existing = existingResult.rows[0];
  if (!existing) {
    return res.status(404).json({ message: 'Pagamento não encontrado.' });
  }

  const error = validate(req.body);
  if (error) {
    return res.status(400).json({ message: error });
  }

  const { descricao, tipo, categoria, valorCents, valorPagoCents, descontoCents, dueDate } = req.body;
  const roundedValorPago = Math.round(valorPagoCents ?? 0);

  // A data do pagamento é registrada automaticamente na primeira vez que um valor pago é
  // lançado, e é limpa caso o pagamento volte a ficar zerado.
  let paymentDate = existing.payment_date;
  if (roundedValorPago <= 0) {
    paymentDate = null;
  } else if (!existing.payment_date) {
    paymentDate = todayIso();
  }

  const { rows } = await pool.query(
    `UPDATE payments SET descricao = $1, tipo = $2, categoria = $3, valor_cents = $4, valor_pago_cents = $5,
     desconto_cents = $6, due_date = $7, payment_date = $8 WHERE id = $9 RETURNING *`,
    [
      descricao.trim(),
      tipo.trim(),
      categoria.trim(),
      Math.round(valorCents),
      roundedValorPago,
      Math.round(descontoCents ?? 0),
      dueDate,
      paymentDate,
      id,
    ]
  );

  res.json({ payment: toResponse(rows[0]) });
});

paymentsRouter.delete('/:id', requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ message: 'Identificador inválido.' });
  }

  await pool.query('DELETE FROM payments WHERE id = $1', [id]);
  res.status(204).send();
});
