import { db } from '../db.js';



export const plantsRepo = {
  
  findAll(q) {
    if (q) {
      return db
        .prepare('SELECT * FROM plants WHERE name LIKE ? ORDER BY name')
        .all(`%${q}%`);
    }
    return db.prepare('SELECT * FROM plants ORDER BY name').all();
  },

  
  findById(id) {
    return db.prepare('SELECT * FROM plants WHERE id = ?').get(id);
  },

  
  exists(id) {
    return !!db.prepare('SELECT 1 FROM plants WHERE id = ?').get(id);
  },
};
