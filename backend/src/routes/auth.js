import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { pool, logActivity } from '../db.js';
import { signToken, requireAuth } from '../auth.js';

export const authRouter = Router();

authRouter.post('/login', async (req, res) => {
  const { username, password } = req.body ?? {};

  if (typeof username !== 'string' || typeof password !== 'string' || !username.trim() || !password) {
    return res.status(400).json({ message: 'Informe usuário e senha.' });
  }

  const { rows } = await pool.query('SELECT * FROM users WHERE username = $1', [username.trim()]);
  const user = rows[0];

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    await logActivity(user?.id, 'login_failed', { username });
    return res.status(401).json({ message: 'Usuário ou senha inválidos.' });
  }

  await logActivity(user.id, 'login_success');

  const token = signToken(user);
  res.json({
    token,
    user: { id: user.id, username: user.username },
  });
});

authRouter.post('/register', async (req, res) => {
  const { username, password, confirmPassword } = req.body ?? {};

  if (typeof username !== 'string' || username.trim().length < 3) {
    return res.status(400).json({ message: 'O usuário deve ter pelo menos 3 caracteres.' });
  }
  if (typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ message: 'A senha deve ter pelo menos 6 caracteres.' });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ message: 'A confirmação de senha não confere.' });
  }

  const trimmedUsername = username.trim();

  const existing = await pool.query('SELECT id FROM users WHERE username = $1', [trimmedUsername]);
  if (existing.rows.length > 0) {
    return res.status(409).json({ message: 'Esse usuário já existe.' });
  }

  const passwordHash = bcrypt.hashSync(password, 10);

  let user;
  try {
    const { rows } = await pool.query(
      'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username',
      [trimmedUsername, passwordHash]
    );
    user = rows[0];
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ message: 'Esse usuário já existe.' });
    }
    throw err;
  }

  await logActivity(user.id, 'register_success');

  const token = signToken(user);
  res.status(201).json({
    token,
    user: { id: user.id, username: user.username },
  });
});

authRouter.get('/me', requireAuth, async (req, res) => {
  const { rows } = await pool.query('SELECT id, username, created_at FROM users WHERE id = $1', [req.user.sub]);
  const user = rows[0];

  if (!user) {
    return res.status(404).json({ message: 'Usuário não encontrado.' });
  }

  res.json({ user });
});
