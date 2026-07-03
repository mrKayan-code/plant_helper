import { Router } from 'express';
import { db } from '../db.js';

// ⚠️ DEV-ONLY инструмент для отладки. Даёт полный доступ к БД без авторизации.
// Включается только при ADMIN_ENABLED=true. НЕ выкатывать в прод.
const router = Router();

// Белый список таблиц — имена таблиц нельзя параметризовать, поэтому строго проверяем.
const TABLES = ['users', 'plants', 'collection', 'favorites'];

function columnsOf(table) {
  return db.prepare(`PRAGMA table_info(${table})`).all().map((c) => c.name);
}

function ensureTable(req, res, next) {
  if (!TABLES.includes(req.params.name)) {
    return res.status(404).json({ error: 'Неизвестная таблица' });
  }
  next();
}

// Список таблиц + количество строк
router.get('/tables', (req, res) => {
  const out = TABLES.map((name) => ({
    name,
    count: db.prepare(`SELECT COUNT(*) AS c FROM ${name}`).get().c,
  }));
  res.json(out);
});

// Колонки + все строки таблицы
router.get('/table/:name', ensureTable, (req, res) => {
  const { name } = req.params;
  const columns = columnsOf(name);
  const rows = db.prepare(`SELECT * FROM ${name}`).all();
  const hasId = columns.includes('id'); // favorites без id (составной ключ) — только просмотр
  const payload = { table: name, columns, rows, editable: hasId };

  // Для collection добавляем дефолты из справочника (эффективный интервал, когда графа пустая).
  // hints: { <rowId>: { water_interval_days, repot_interval_days } }
  if (name === 'collection') {
    const defs = db.prepare(`
      SELECT c.id AS id,
             p.water_interval_days AS water_interval_days,
             p.repot_interval_days AS repot_interval_days
      FROM collection c JOIN plants p ON p.id = c.plant_id
    `).all();
    payload.hints = {};
    for (const d of defs) {
      payload.hints[d.id] = {
        water_interval_days: d.water_interval_days,
        repot_interval_days: d.repot_interval_days,
      };
    }
  }

  res.json(payload);
});

// Обновить строку по id (для collection/plants/users). Меняем только реальные колонки.
router.patch('/table/:name/:id', ensureTable, (req, res) => {
  const { name, id } = req.params;
  const columns = columnsOf(name);
  if (!columns.includes('id')) {
    return res.status(400).json({ error: 'У таблицы нет колонки id — правка не поддержана' });
  }
  const updates = Object.entries(req.body ?? {}).filter(
    ([k]) => columns.includes(k) && k !== 'id',
  );
  if (updates.length === 0) {
    return res.status(400).json({ error: 'Нет валидных полей для обновления' });
  }
  const sets = updates.map(([k]) => `${k} = ?`).join(', ');
  const values = updates.map(([, v]) => (v === '' ? null : v));
  const info = db.prepare(`UPDATE ${name} SET ${sets} WHERE id = ?`).run(...values, id);
  if (info.changes === 0) {
    return res.status(404).json({ error: 'Строка не найдена' });
  }
  res.json(db.prepare(`SELECT * FROM ${name} WHERE id = ?`).get(id));
});

// Удалить строку по id
router.delete('/table/:name/:id', ensureTable, (req, res) => {
  const { name, id } = req.params;
  if (!columnsOf(name).includes('id')) {
    return res.status(400).json({ error: 'У таблицы нет колонки id — удаление по id не поддержано' });
  }
  const info = db.prepare(`DELETE FROM ${name} WHERE id = ?`).run(id);
  if (info.changes === 0) {
    return res.status(404).json({ error: 'Строка не найдена' });
  }
  res.status(204).end();
});

export default router;
