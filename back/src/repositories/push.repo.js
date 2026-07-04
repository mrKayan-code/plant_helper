import { db } from '../db.js';

export const pushRepo = {
  
  save(userId, subscription) {
    db.prepare(`
      INSERT INTO push_subscriptions (user_id, endpoint, subscription)
      VALUES (?, ?, ?)
      ON CONFLICT(endpoint) DO UPDATE SET
        user_id = excluded.user_id,
        subscription = excluded.subscription
    `).run(userId, subscription.endpoint, JSON.stringify(subscription));
  },

  
  byUser(userId) {
    return db
      .prepare('SELECT subscription FROM push_subscriptions WHERE user_id = ?')
      .all(userId)
      .map((r) => JSON.parse(r.subscription));
  },

  
  subscribedUserIds() {
    return db
      .prepare('SELECT DISTINCT user_id FROM push_subscriptions')
      .all()
      .map((r) => r.user_id);
  },

  
  deleteByEndpoint(endpoint) {
    db.prepare('DELETE FROM push_subscriptions WHERE endpoint = ?').run(endpoint);
  },

  
  wasSent(userId, key) {
    return !!db
      .prepare('SELECT 1 FROM push_log WHERE user_id = ? AND reminder_key = ?')
      .get(userId, key);
  },

  markSent(userId, key) {
    db.prepare(
      'INSERT OR IGNORE INTO push_log (user_id, reminder_key) VALUES (?, ?)',
    ).run(userId, key);
  },
};
