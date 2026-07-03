import { verifyToken } from '../auth.js';

// Защита роутов: проверяет заголовок Authorization: Bearer <token>.
// При успехе кладёт req.userId и пускает дальше. Иначе — 401.
// По контракту 401 ВСЕГДА означает проблему с токеном → фронт чистит токен и на логин.
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Требуется авторизация' });
  }

  try {
    const { userId } = verifyToken(token);
    req.userId = userId;
    next();
  } catch {
    return res.status(401).json({ error: 'Недействительный или просроченный токен' });
  }
}
