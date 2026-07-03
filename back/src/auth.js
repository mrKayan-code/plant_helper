import { scryptSync, randomBytes, timingSafeEqual } from 'node:crypto';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_TTL = '7d'; // токен живёт неделю

// --- Пароли (scrypt, без внешних зависимостей) ---

/** Хеширует пароль. Возвращает строку "соль:хеш" (обе части — hex). */
export function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64);
  return `${salt.toString('hex')}:${hash.toString('hex')}`;
}

/** Проверяет пароль против сохранённого "соль:хеш". Timing-safe сравнение. */
export function verifyPassword(password, stored) {
  const [saltHex, hashHex] = stored.split(':');
  if (!saltHex || !hashHex) return false;
  const salt = Buffer.from(saltHex, 'hex');
  const expected = Buffer.from(hashHex, 'hex');
  const actual = scryptSync(password, salt, expected.length);
  return timingSafeEqual(expected, actual);
}

// --- JWT ---

/** Выпускает токен для пользователя. */
export function signToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: TOKEN_TTL });
}

/** Проверяет токен, возвращает payload ({ userId }) или бросает ошибку. */
export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}
