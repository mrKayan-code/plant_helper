import { verifyToken } from '../auth.js';




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
