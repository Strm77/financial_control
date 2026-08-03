import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db, logActivity } from '../db.js';
import { signToken, requireAuth } from '../auth.js';

export const authRouter = Router();

authRouter.post('/login', (req, res) => {
  const { username, password } = req.body ?? {};

  if (typeof username !== 'string' || typeof password !== 'string' || !username.trim() || !password) {
    return res.status(400).json({ message: 'Informe usuário e senha.' });
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username.trim());

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    logActivity(user?.id, 'login_failed', { username });
    return res.status(401).json({ message: 'Usuário ou senha inválidos.' });
  }

  logActivity(user.id, 'login_success');

  const token = signToken(user);
  res.json({
    token,
    user: { id: user.id, username: user.username },
  });
});

authRouter.get('/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT id, username, created_at FROM users WHERE id = ?').get(req.user.sub);

  if (!user) {
    return res.status(404).json({ message: 'Usuário não encontrado.' });
  }

  res.json({ user });
});
