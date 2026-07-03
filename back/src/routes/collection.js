import { Router } from 'express';
import { collectionRepo } from '../repositories/collection.repo.js';
import { plantsRepo } from '../repositories/plants.repo.js';
import { serializeCollectionItem } from '../serialize.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();

// Все роуты коллекции защищены — req.userId гарантированно есть.
router.use(requireAuth);

// GET /api/collection — весь список пользователя
router.get('/', (req, res) => {
  const rows = collectionRepo.findByUser(req.userId);
  res.json(rows.map(serializeCollectionItem));
});

// POST /api/collection — добавить растение
router.post('/', (req, res) => {
  const { plantId, note, waterIntervalDays, repotIntervalDays } = req.body ?? {};

  if (!plantId) {
    return res.status(400).json({ error: 'Нужен plantId' });
  }
  if (!plantsRepo.exists(plantId)) {
    return res.status(404).json({ error: 'Растение из справочника не найдено' });
  }

  const item = collectionRepo.create(req.userId, {
    plantId, note, waterIntervalDays, repotIntervalDays,
  });
  res.status(201).json(serializeCollectionItem(item));
});

// PATCH /api/collection/:id — правка заметок/интервалов/дат
router.patch('/:id', (req, res) => {
  const item = collectionRepo.update(req.userId, req.params.id, req.body ?? {});
  if (!item) {
    return res.status(404).json({ error: 'Запись не найдена' });
  }
  res.json(serializeCollectionItem(item));
});

// DELETE /api/collection/:id
router.delete('/:id', (req, res) => {
  const ok = collectionRepo.remove(req.userId, req.params.id);
  if (!ok) {
    return res.status(404).json({ error: 'Запись не найдена' });
  }
  res.status(204).end();
});

// POST /api/collection/:id/watered — отметить полив сегодня
router.post('/:id/watered', (req, res) => {
  const item = collectionRepo.markDone(req.userId, req.params.id, 'water');
  if (!item) {
    return res.status(404).json({ error: 'Запись не найдена' });
  }
  res.json(serializeCollectionItem(item));
});

// POST /api/collection/:id/repotted — отметить пересадку сегодня
router.post('/:id/repotted', (req, res) => {
  const item = collectionRepo.markDone(req.userId, req.params.id, 'repot');
  if (!item) {
    return res.status(404).json({ error: 'Запись не найдена' });
  }
  res.json(serializeCollectionItem(item));
});

export default router;
