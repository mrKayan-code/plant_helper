import { db } from '../db.js';

// JOIN collection + plants. Колонки растения — с префиксом p_,
// чтобы не путались с одноимёнными полями collection (water_interval_days и т.п.).
const SELECT = `
  SELECT
    c.id, c.user_id, c.plant_id, c.added_at, c.note,
    c.water_interval_days, c.repot_interval_days,
    c.last_watered_at, c.last_repotted_at,
    p.id   AS p_id,
    p.name AS p_name,
    p.watering  AS p_watering,
    p.light     AS p_light,
    p.repotting AS p_repotting,
    p.toxicity  AS p_toxicity,
    p.notes     AS p_notes,
    p.water_interval_days AS p_water_interval_days,
    p.repot_interval_days AS p_repot_interval_days,
    p.image_url AS p_image_url
  FROM collection c
  JOIN plants p ON p.id = c.plant_id
`;

// Поля, которые можно менять через PATCH: camelCase (API) → колонка БД.
const PATCHABLE = {
  note: 'note',
  waterIntervalDays: 'water_interval_days',
  repotIntervalDays: 'repot_interval_days',
  lastWateredAt: 'last_watered_at',
  lastRepottedAt: 'last_repotted_at',
};

export const collectionRepo = {
  /** Весь список пользователя (свежие сверху). */
  findByUser(userId) {
    return db
      .prepare(`${SELECT} WHERE c.user_id = ? ORDER BY c.added_at DESC, c.id DESC`)
      .all(userId);
  },

  /** Один элемент пользователя (или undefined). Проверяет владение. */
  findOne(userId, id) {
    return db
      .prepare(`${SELECT} WHERE c.id = ? AND c.user_id = ?`)
      .get(id, userId);
  },

  /** Добавить растение в список, вернуть готовый элемент (с карточкой). */
  create(userId, { plantId, note, waterIntervalDays, repotIntervalDays }) {
    const info = db
      .prepare(`
        INSERT INTO collection (user_id, plant_id, note, water_interval_days, repot_interval_days)
        VALUES (?, ?, ?, ?, ?)
      `)
      .run(userId, plantId, note ?? null, waterIntervalDays ?? null, repotIntervalDays ?? null);
    return this.findOne(userId, info.lastInsertRowid);
  },

  /**
   * Частичное обновление. Принимает объект в camelCase, берёт только
   * разрешённые поля. Возвращает обновлённый элемент или undefined (нет/чужой).
   */
  update(userId, id, fields) {
    const sets = [];
    const values = [];
    for (const [key, column] of Object.entries(PATCHABLE)) {
      if (key in fields) {
        sets.push(`${column} = ?`);
        values.push(fields[key]);
      }
    }
    if (sets.length > 0) {
      const info = db
        .prepare(`UPDATE collection SET ${sets.join(', ')} WHERE id = ? AND user_id = ?`)
        .run(...values, id, userId);
      if (info.changes === 0) return undefined; // не найдено / чужое
    }
    return this.findOne(userId, id);
  },

  /** Удалить свой элемент. Возвращает true, если что-то удалилось. */
  remove(userId, id) {
    const info = db
      .prepare('DELETE FROM collection WHERE id = ? AND user_id = ?')
      .run(id, userId);
    return info.changes > 0;
  },

  /** Отметить действие (полив/пересадку) сегодняшней датой. */
  markDone(userId, id, action) {
    const column = action === 'water' ? 'last_watered_at' : 'last_repotted_at';
    const info = db
      .prepare(`UPDATE collection SET ${column} = date('now') WHERE id = ? AND user_id = ?`)
      .run(id, userId);
    if (info.changes === 0) return undefined;
    return this.findOne(userId, id);
  },
};
