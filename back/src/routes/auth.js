import { Router } from 'express';
import { db } from '../db.js';
import { hashPassword, verifyPassword, signToken } from '../auth.js';
import { serializeUser } from '../serialize.js';

const router = Router();

// Простая проверка формата email (достаточно для хакатона)
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/auth/register — { email, password } → { token, user }
router.post('/register', (req, res) => {
  const { email, password } = req.body ?? {};

  if (!email || !password) {
    return res.status(400).json({ error: 'Нужны email и пароль' });
  }
  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'Некорректный email' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Пароль минимум 6 символов' });
  }

  const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (exists) {
    return res.status(409).json({ error: 'Email уже занят' });
  }

  const info = db
    .prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)')
    .run(email, hashPassword(password));

  const user = { id: info.lastInsertRowid, email };
  res.status(201).json({ token: signToken(user.id), user: serializeUser(user) });
});

// POST /api/auth/login — { email, password } → { token, user }
router.post('/login', (req, res) => {
  const { email, password } = req.body ?? {};

  if (!email || !password) {
    return res.status(400).json({ error: 'Нужны email и пароль' });
  }

  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  // Одинаковый ответ и при отсутствии юзера, и при неверном пароле — не палим, есть ли email
  if (!row || !verifyPassword(password, row.password_hash)) {
    return res.status(401).json({ error: 'Неверный email или пароль' });
  }

  res.json({ token: signToken(row.id), user: serializeUser(row) });
});

export default router;
