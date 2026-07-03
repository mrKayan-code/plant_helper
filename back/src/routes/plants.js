import { Router } from 'express';
import { db } from '../db.js';
import { serializePlant } from '../serialize.js';

const router = Router();

// GET /api/plants  (+ ?q=строка — поиск по названию)
// Публичный: токен не нужен.
router.get('/', (req, res) => {
  const q = req.query.q;
  let rows;
  if (q) {
    rows = db
      .prepare('SELECT * FROM plants WHERE name LIKE ? ORDER BY name')
      .all(`%${q}%`);
  } else {
    rows = db.prepare('SELECT * FROM plants ORDER BY name').all();
  }
  res.json(rows.map(serializePlant));
});

// GET /api/plants/:id — одна карточка
router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM plants WHERE id = ?').get(req.params.id);
  if (!row) {
    return res.status(404).json({ error: 'Растение не найдено' });
  }
  res.json(serializePlant(row));
});

export default router;
