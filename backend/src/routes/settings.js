import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../auth.js';

export const settingsRouter = Router();

const ALLOWED_SECTIONS = ['renda'];
const ALLOWED_FIELDS = ['fonte', 'categoria', 'tipo'];

settingsRouter.get('/options', requireAuth, async (req, res) => {
  const section = String(req.query.section ?? '');
  if (!ALLOWED_SECTIONS.includes(section)) {
    return res.status(400).json({ message: 'Seção inválida.' });
  }

  const { rows } = await pool.query(
    'SELECT id, field, label FROM select_options WHERE section = $1 ORDER BY field, label',
    [section]
  );

  res.json({ options: rows });
});

settingsRouter.post('/options', requireAuth, async (req, res) => {
  const { section, field, label } = req.body ?? {};

  if (
    !ALLOWED_SECTIONS.includes(section) ||
    !ALLOWED_FIELDS.includes(field) ||
    typeof label !== 'string' ||
    !label.trim()
  ) {
    return res.status(400).json({ message: 'Informe uma seção, um campo e um rótulo válidos.' });
  }

  const trimmedLabel = label.trim();
  const existingResult = await pool.query(
    'SELECT id FROM select_options WHERE section = $1 AND field = $2 AND label = $3',
    [section, field, trimmedLabel]
  );

  if (existingResult.rows.length > 0) {
    return res.status(409).json({ message: 'Essa opção já existe.' });
  }

  const { rows } = await pool.query(
    'INSERT INTO select_options (section, field, label) VALUES ($1, $2, $3) RETURNING id',
    [section, field, trimmedLabel]
  );

  res.status(201).json({
    option: { id: rows[0].id, field, label: trimmedLabel },
  });
});

settingsRouter.delete('/options/:id', requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ message: 'Identificador inválido.' });
  }

  await pool.query('DELETE FROM select_options WHERE id = $1', [id]);
  res.status(204).send();
});
