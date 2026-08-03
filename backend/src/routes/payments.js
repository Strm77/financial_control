import { Router } from 'express';
import { db } from '../db.js';
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

paymentsRouter.get('/', requireAuth, (_req, res) => {
  const rows = db.prepare('SELECT * FROM payments ORDER BY due_date ASC').all();
  res.json({ payments: rows.map(toResponse) });
});

paymentsRouter.post('/', requireAuth, (req, res) => {
  const error = validate(req.body);
  if (error) {
    return res.status(400).json({ message: error });
  }

  const { descricao, tipo, categoria, valorCents, valorPagoCents, descontoCents, dueDate } = req.body;
  const roundedValorPago = Math.round(valorPagoCents ?? 0);
  const paymentDate = roundedValorPago > 0 ? todayIso() : null;

  const result = db
    .prepare(
      `INSERT INTO payments (descricao, tipo, categoria, valor_cents, valor_pago_cents, desconto_cents, due_date, payment_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      descricao.trim(),
      tipo.trim(),
      categoria.trim(),
      Math.round(valorCents),
      roundedValorPago,
      Math.round(descontoCents ?? 0),
      dueDate,
      paymentDate
    );

  const row = db.prepare('SELECT * FROM payments WHERE id = ?').get(Number(result.lastInsertRowid));
  res.status(201).json({ payment: toResponse(row) });
});

paymentsRouter.patch('/:id', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ message: 'Identificador inválido.' });
  }

  const existing = db.prepare('SELECT * FROM payments WHERE id = ?').get(id);
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

  db.prepare(
    `UPDATE payments SET descricao = ?, tipo = ?, categoria = ?, valor_cents = ?, valor_pago_cents = ?,
     desconto_cents = ?, due_date = ?, payment_date = ? WHERE id = ?`
  ).run(
    descricao.trim(),
    tipo.trim(),
    categoria.trim(),
    Math.round(valorCents),
    roundedValorPago,
    Math.round(descontoCents ?? 0),
    dueDate,
    paymentDate,
    id
  );

  const row = db.prepare('SELECT * FROM payments WHERE id = ?').get(id);
  res.json({ payment: toResponse(row) });
});

paymentsRouter.delete('/:id', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ message: 'Identificador inválido.' });
  }

  db.prepare('DELETE FROM payments WHERE id = ?').run(id);
  res.status(204).send();
});
