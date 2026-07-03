import { db } from '../db.js';

// Весь доступ к таблице plants — только здесь.
// Роуты не знают про SQL, работают через эти методы.
export const plantsRepo = {
  /** Все растения; если задан q — фильтр по названию. */
  findAll(q) {
    if (q) {
      return db
        .prepare('SELECT * FROM plants WHERE name LIKE ? ORDER BY name')
        .all(`%${q}%`);
    }
    return db.prepare('SELECT * FROM plants ORDER BY name').all();
  },

  /** Одна карточка по id (или undefined). */
  findById(id) {
    return db.prepare('SELECT * FROM plants WHERE id = ?').get(id);
  },

  /** Есть ли растение с таким id (для валидации ссылок из collection/favorites). */
  exists(id) {
    return !!db.prepare('SELECT 1 FROM plants WHERE id = ?').get(id);
  },
};
