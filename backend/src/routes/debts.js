import { Router } from 'express';
import { pool } from '../db.js';
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

debtsRouter.get('/', requireAuth, async (_req, res) => {
  const { rows } = await pool.query('SELECT * FROM debts ORDER BY due_date ASC');
  res.json({ debts: rows.map(toResponse) });
});

debtsRouter.post('/', requireAuth, async (req, res) => {
  const error = validate(req.body);
  if (error) {
    return res.status(400).json({ message: error });
  }

  const { credor, valorContratadoCents, valorParcelaCents, numeroParcelas, parcelaAtual, jurosPercent, dueDate, recorrente } =
    req.body;

  const { rows } = await pool.query(
    `INSERT INTO debts (credor, valor_contratado_cents, valor_parcela_cents, numero_parcelas, parcela_atual, juros_percent, due_date, recorrente)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [
      credor.trim(),
      Math.round(valorContratadoCents),
      Math.round(valorParcelaCents),
      numeroParcelas,
      parcelaAtual,
      jurosPercent ?? null,
      dueDate,
      Boolean(recorrente),
    ]
  );

  res.status(201).json({ debt: toResponse(rows[0]) });
});

debtsRouter.patch('/:id', requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ message: 'Identificador inválido.' });
  }

  const existingResult = await pool.query('SELECT id FROM debts WHERE id = $1', [id]);
  if (existingResult.rows.length === 0) {
    return res.status(404).json({ message: 'Dívida não encontrada.' });
  }

  const error = validate(req.body);
  if (error) {
    return res.status(400).json({ message: error });
  }

  const { credor, valorContratadoCents, valorParcelaCents, numeroParcelas, parcelaAtual, jurosPercent, dueDate, recorrente } =
    req.body;

  const { rows } = await pool.query(
    `UPDATE debts SET credor = $1, valor_contratado_cents = $2, valor_parcela_cents = $3, numero_parcelas = $4,
     parcela_atual = $5, juros_percent = $6, due_date = $7, recorrente = $8 WHERE id = $9 RETURNING *`,
    [
      credor.trim(),
      Math.round(valorContratadoCents),
      Math.round(valorParcelaCents),
      numeroParcelas,
      parcelaAtual,
      jurosPercent ?? null,
      dueDate,
      Boolean(recorrente),
      id,
    ]
  );

  res.json({ debt: toResponse(rows[0]) });
});

debtsRouter.delete('/:id', requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ message: 'Identificador inválido.' });
  }

  await pool.query('DELETE FROM debts WHERE id = $1', [id]);
  res.status(204).send();
});
