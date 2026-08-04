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

authRouter.get('/me', requireAuth, async (req, res) => {
  const { rows } = await pool.query('SELECT id, username, created_at FROM users WHERE id = $1', [req.user.sub]);
  const user = rows[0];

  if (!user) {
    return res.status(404).json({ message: 'Usuário não encontrado.' });
  }

  res.json({ user });
});
