import { db } from '../db.js';

// Весь доступ к таблице users — только здесь.
export const usersRepo = {
  /** Полная строка по email (с password_hash — нужен для проверки пароля). */
  findByEmail(email) {
    return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  },

  /** Пользователь по id (без password_hash — для /me). */
  findById(id) {
    return db.prepare('SELECT id, email, created_at FROM users WHERE id = ?').get(id);
  },

  /** Создаёт пользователя, возвращает { id, email }. */
  create(email, passwordHash) {
    const info = db
      .prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)')
      .run(email, passwordHash);
    return { id: info.lastInsertRowid, email };
  },
};
