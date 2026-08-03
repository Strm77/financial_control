import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth } from '../auth.js';

export const debtsRouter = Router();

function addMonths(isoDate, months) {
  const [year, month, day] = isoDate.split('-').map(Number);
  const date = new Date(year, month - 1 + months, day);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// A dívida deve exibir a última parcela (data final) com base em quantas parcelas
// ainda restam a partir da data de vencimento informada (que é a próxima parcela em aberto).
function computeDataFinal(dueDate, numeroParcelas, parcelaAtual) {
  const remainingAfterThis = Math.max(0, numeroParcelas - parcelaAtual - 1);
  return addMonths(dueDate, remainingAfterThis);
}

function toResponse(row) {
  const valorPagoCents = row.parcela_atual * row.valor_parcela_cents;
  const faltaPagarCents = Math.max(0, row.valor_contratado_cents - valorPagoCents);
  const dataFinal = computeDataFinal(row.due_date, row.numero_parcelas, row.parcela_atual);

  return {
    id: row.id,
    credor: row.credor,
    valorContratadoCents: row.valor_contratado_cents,
    valorParcelaCents: row.valor_parcela_cents,
    numeroParcelas: row.numero_parcelas,
    parcelaAtual: row.parcela_atual,
    valorPagoCents,
    faltaPagarCents,
    jurosPercent: row.juros_percent,
    dueDate: row.due_date,
    recorrente: Boolean(row.recorrente),
    dataFinal,
  };
}

function validate(body) {
  const { credor, valorContratadoCents, valorParcelaCents, numeroParcelas, parcelaAtual, jurosPercent, dueDate } =
    body ?? {};

  if (typeof credor !== 'string' || !credor.trim()) {
    return 'Informe o credor.';
  }
  if (typeof valorContratadoCents !== 'number' || !Number.isFinite(valorContratadoCents) || valorContratadoCents <= 0) {
    return 'Informe um valor contratado válido.';
  }
  if (typeof valorParcelaCents !== 'number' || !Number.isFinite(valorParcelaCents) || valorParcelaCents <= 0) {
    return 'Informe um valor de parcela válido.';
  }
  if (!Number.isInteger(numeroParcelas) || numeroParcelas < 1) {
    return 'Informe um número de parcelas válido.';
  }
  if (!Number.isInteger(parcelaAtual) || parcelaAtual < 0 || parcelaAtual > numeroParcelas) {
    return 'A parcela atual deve estar entre 0 e o número de parcelas.';
  }
  if (typeof dueDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
    return 'Informe uma data de vencimento válida.';
  }
  if (jurosPercent !== null && jurosPercent !== undefined) {
    if (typeof jurosPercent !== 'number' || !Number.isFinite(jurosPercent) || jurosPercent < 0) {
      return 'Informe um percentual de juros válido.';
    }
  }

  return null;
}

debtsRouter.get('/', requireAuth, (_req, res) => {
  const rows = db.prepare('SELECT * FROM debts ORDER BY due_date ASC').all();
  res.json({ debts: rows.map(toResponse) });
});

debtsRouter.post('/', requireAuth, (req, res) => {
  const error = validate(req.body);
  if (error) {
    return res.status(400).json({ message: error });
  }

  const { credor, valorContratadoCents, valorParcelaCents, numeroParcelas, parcelaAtual, jurosPercent, dueDate, recorrente } =
    req.body;

  const result = db
    .prepare(
      `INSERT INTO debts (credor, valor_contratado_cents, valor_parcela_cents, numero_parcelas, parcela_atual, juros_percent, due_date, recorrente)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      credor.trim(),
      Math.round(valorContratadoCents),
      Math.round(valorParcelaCents),
      numeroParcelas,
      parcelaAtual,
      jurosPercent ?? null,
      dueDate,
      recorrente ? 1 : 0
    );

  const row = db.prepare('SELECT * FROM debts WHERE id = ?').get(Number(result.lastInsertRowid));
  res.status(201).json({ debt: toResponse(row) });
});

debtsRouter.patch('/:id', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ message: 'Identificador inválido.' });
  }

  const existing = db.prepare('SELECT id FROM debts WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ message: 'Dívida não encontrada.' });
  }

  const error = validate(req.body);
  if (error) {
    return res.status(400).json({ message: error });
  }

  const { credor, valorContratadoCents, valorParcelaCents, numeroParcelas, parcelaAtual, jurosPercent, dueDate, recorrente } =
    req.body;

  db.prepare(
    `UPDATE debts SET credor = ?, valor_contratado_cents = ?, valor_parcela_cents = ?, numero_parcelas = ?,
     parcela_atual = ?, juros_percent = ?, due_date = ?, recorrente = ? WHERE id = ?`
  ).run(
    credor.trim(),
    Math.round(valorContratadoCents),
    Math.round(valorParcelaCents),
    numeroParcelas,
    parcelaAtual,
    jurosPercent ?? null,
    dueDate,
    recorrente ? 1 : 0,
    id
  );

  const row = db.prepare('SELECT * FROM debts WHERE id = ?').get(id);
  res.json({ debt: toResponse(row) });
});

debtsRouter.delete('/:id', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ message: 'Identificador inválido.' });
  }

  db.prepare('DELETE FROM debts WHERE id = ?').run(id);
  res.status(204).send();
});
