import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth } from '../auth.js';

export const settingsRouter = Router();

const ALLOWED_SECTIONS = ['renda'];
const ALLOWED_FIELDS = ['fonte', 'categoria', 'tipo'];

settingsRouter.get('/options', requireAuth, (req, res) => {
  const section = String(req.query.section ?? '');
  if (!ALLOWED_SECTIONS.includes(section)) {
    return res.status(400).json({ message: 'Seção inválida.' });
  }

  const rows = db
    .prepare('SELECT id, field, label FROM select_options WHERE section = ? ORDER BY field, label')
    .all(section);

  res.json({ options: rows });
});

settingsRouter.post('/options', requireAuth, (req, res) => {
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
  const existing = db
    .prepare('SELECT id FROM select_options WHERE section = ? AND field = ? AND label = ?')
    .get(section, field, trimmedLabel);

  if (existing) {
    return res.status(409).json({ message: 'Essa opção já existe.' });
  }

  const result = db
    .prepare('INSERT INTO select_options (section, field, label) VALUES (?, ?, ?)')
    .run(section, field, trimmedLabel);

  res.status(201).json({
    option: { id: Number(result.lastInsertRowid), field, label: trimmedLabel },
  });
});

settingsRouter.delete('/options/:id', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ message: 'Identificador inválido.' });
  }

  db.prepare('DELETE FROM select_options WHERE id = ?').run(id);
  res.status(204).send();
});
