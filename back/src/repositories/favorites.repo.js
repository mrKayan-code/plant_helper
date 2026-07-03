import { db } from '../db.js';

// Избранное = отметки (user_id, plant_id). Возвращаем карточки справочника.
export const favoritesRepo = {
  /** Избранные карточки пользователя (строки plants). */
  findByUser(userId) {
    return db
      .prepare(`
        SELECT p.*
        FROM favorites f
        JOIN plants p ON p.id = f.plant_id
        WHERE f.user_id = ?
        ORDER BY p.name
      `)
      .all(userId);
  },

  /** Добавить в избранное. Идемпотентно (повтор не ошибка). */
  add(userId, plantId) {
    db.prepare(
      'INSERT OR IGNORE INTO favorites (user_id, plant_id) VALUES (?, ?)',
    ).run(userId, plantId);
  },

  /** Убрать из избранного. */
  remove(userId, plantId) {
    db.prepare(
      'DELETE FROM favorites WHERE user_id = ? AND plant_id = ?',
    ).run(userId, plantId);
  },
};
