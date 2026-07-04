import { db } from '../db.js';


export const favoritesRepo = {
  
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

  
  add(userId, plantId) {
    db.prepare(
      'INSERT OR IGNORE INTO favorites (user_id, plant_id) VALUES (?, ?)',
    ).run(userId, plantId);
  },

  
  remove(userId, plantId) {
    db.prepare(
      'DELETE FROM favorites WHERE user_id = ? AND plant_id = ?',
    ).run(userId, plantId);
  },
};
