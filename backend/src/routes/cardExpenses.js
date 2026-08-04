import { Router } from 'express';
import multer from 'multer';
import { pool } from '../db.js';
import { requireAuth } from '../auth.js';
import { parseFaturaPdf } from '../services/faturaParser.js';

export const cardExpensesRouter = Router();

// Vercel Serverless Functions limitam o corpo da requisição a ~4.5MB — manter a
// margem evita um 413 genérico da plataforma antes mesmo do multer responder.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024 },
});

function toResponse(row) {
  return {
    id: row.id,
    paymentId: row.payment_id,
    descricao: row.descricao,
    valorCents: row.valor_cents,
    parcelaAtual: row.parcela_atual,
    numeroParcelas: row.numero_parcelas,
    data: row.data,
  };
}

cardExpensesRouter.get('/', requireAuth, async (req, res) => {
  if (req.query.paymentId === undefined) {
    const { rows } = await pool.query('SELECT * FROM card_expenses ORDER BY created_at DESC, id DESC');
    return res.json({ expenses: rows.map(toResponse) });
  }

  const paymentId = Number(req.query.paymentId);
  if (!Number.isInteger(paymentId)) {
    return res.status(400).json({ message: 'Informe um paymentId válido.' });
  }

  const { rows } = await pool.query(
    'SELECT * FROM card_expenses WHERE payment_id = $1 ORDER BY created_at DESC, id DESC',
    [paymentId]
  );

  res.json({ expenses: rows.map(toResponse) });
});

function validateExpense(body) {
  const { paymentId, descricao, valorCents, parcelaAtual, numeroParcelas } = body ?? {};

  if (!Number.isInteger(paymentId)) return 'Informe um paymentId válido.';
  if (typeof descricao !== 'string' || !descricao.trim()) return 'Informe a descrição do gasto.';
  if (typeof valorCents !== 'number' || !Number.isFinite(valorCents) || valorCents <= 0) {
    return 'Informe um valor válido.';
  }
  const hasParcelaAtual = parcelaAtual !== null && parcelaAtual !== undefined;
  const hasNumeroParcelas = numeroParcelas !== null && numeroParcelas !== undefined;
  if (hasParcelaAtual !== hasNumeroParcelas) {
    return 'Informe a parcela atual e o número de parcelas juntos, ou deixe ambos em branco.';
  }
  if (hasParcelaAtual) {
    if (!Number.isInteger(parcelaAtual) || parcelaAtual < 1) return 'Parcela atual inválida.';
    if (!Number.isInteger(numeroParcelas) || numeroParcelas < 1) return 'Número de parcelas inválido.';
    if (parcelaAtual > numeroParcelas) return 'A parcela atual não pode ser maior que o número de parcelas.';
  }

  return null;
}

cardExpensesRouter.post('/', requireAuth, async (req, res) => {
  const error = validateExpense(req.body);
  if (error) {
    return res.status(400).json({ message: error });
  }

  const paymentResult = await pool.query('SELECT id FROM payments WHERE id = $1', [req.body.paymentId]);
  if (paymentResult.rows.length === 0) {
    return res.status(404).json({ message: 'Pagamento (cartão) não encontrado.' });
  }

  const { paymentId, descricao, valorCents, parcelaAtual, numeroParcelas, data } = req.body;

  const { rows } = await pool.query(
    `INSERT INTO card_expenses (payment_id, descricao, valor_cents, parcela_atual, numero_parcelas, data)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [paymentId, descricao.trim(), Math.round(valorCents), parcelaAtual ?? null, numeroParcelas ?? null, data ?? null]
  );

  res.status(201).json({ expense: toResponse(rows[0]) });
});

cardExpensesRouter.delete('/:id', requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ message: 'Identificador inválido.' });
  }

  await pool.query('DELETE FROM card_expenses WHERE id = $1', [id]);
  res.status(204).send();
});

cardExpensesRouter.post('/import', requireAuth, upload.single('file'), async (req, res) => {
  const paymentId = Number(req.body.paymentId);
  if (!Number.isInteger(paymentId)) {
    return res.status(400).json({ message: 'Informe um paymentId válido.' });
  }

  const paymentResult = await pool.query('SELECT id FROM payments WHERE id = $1', [paymentId]);
  if (paymentResult.rows.length === 0) {
    return res.status(404).json({ message: 'Pagamento (cartão) não encontrado.' });
  }

  if (!req.file) {
    return res.status(400).json({ message: 'Envie o arquivo da fatura em PDF.' });
  }

  const isPdf = req.file.mimetype === 'application/pdf' || req.file.originalname?.toLowerCase().endsWith('.pdf');
  if (!isPdf) {
    return res.status(400).json({ message: 'No momento só é possível ler faturas em PDF com texto selecionável.' });
  }

  let items;
  try {
    items = await parseFaturaPdf(req.file.buffer);
  } catch {
    return res.status(422).json({ message: 'Não foi possível ler este PDF. Tente anexar os gastos manualmente.' });
  }

  if (items.length === 0) {
    return res.status(200).json({
      expenses: [],
      message: 'Não foi possível identificar itens automaticamente nesta fatura. Adicione os gastos manualmente.',
    });
  }

  const inserted = [];
  for (const item of items) {
    const { rows } = await pool.query(
      `INSERT INTO card_expenses (payment_id, descricao, valor_cents, parcela_atual, numero_parcelas)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [paymentId, item.descricao, item.valorCents, item.parcelaAtual, item.numeroParcelas]
    );
    inserted.push(toResponse(rows[0]));
  }

  res.status(201).json({ expenses: inserted, message: `${inserted.length} itens importados da fatura.` });
});
