import { db } from '../db.js';


export const usersRepo = {
  
  findByEmail(email) {
    return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  },

  
  findById(id) {
    return db.prepare('SELECT id, email, created_at FROM users WHERE id = ?').get(id);
  },

  
  create(email, passwordHash) {
    const info = db
      .prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)')
      .run(email, passwordHash);
    return { id: info.lastInsertRowid, email };
  },
};
