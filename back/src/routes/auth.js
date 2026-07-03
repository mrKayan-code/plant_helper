import { Router } from 'express';
import { usersRepo } from '../repositories/users.repo.js';
import { hashPassword, verifyPassword, signToken } from '../auth.js';
import { serializeUser } from '../serialize.js';
import { requireAuth } from '../middleware/requireAuth.js';

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

  if (usersRepo.findByEmail(email)) {
    return res.status(409).json({ error: 'Email уже занят' });
  }

  const user = usersRepo.create(email, hashPassword(password));
  res.status(201).json({ token: signToken(user.id), user: serializeUser(user) });
});

// POST /api/auth/login — { email, password } → { token, user }
router.post('/login', (req, res) => {
  const { email, password } = req.body ?? {};

  if (!email || !password) {
    return res.status(400).json({ error: 'Нужны email и пароль' });
  }

  const row = usersRepo.findByEmail(email);
  // Одинаковый ответ и при отсутствии юзера, и при неверном пароле — не палим, есть ли email
  if (!row || !verifyPassword(password, row.password_hash)) {
    return res.status(401).json({ error: 'Неверный email или пароль' });
  }

  res.json({ token: signToken(row.id), user: serializeUser(row) });
});

// GET /api/auth/me — текущий пользователь по токену (защищён)
router.get('/me', requireAuth, (req, res) => {
  const user = usersRepo.findById(req.userId);
  if (!user) {
    // токен валиден, но юзера уже нет (напр. удалён) — тоже разлогинить
    return res.status(401).json({ error: 'Пользователь не найден' });
  }
  res.json(serializeUser(user));
});

export default router;

