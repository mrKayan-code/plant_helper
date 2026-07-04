import { Router } from 'express';
import { collectionRepo } from '../repositories/collection.repo.js';
import { plantsRepo } from '../repositories/plants.repo.js';
import { serializeCollectionItem } from '../serialize.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();


router.use(requireAuth);


router.get('/', (req, res) => {
  const rows = collectionRepo.findByUser(req.userId);
  res.json(rows.map(serializeCollectionItem));
});


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


router.patch('/:id', (req, res) => {
  const item = collectionRepo.update(req.userId, req.params.id, req.body ?? {});
  if (!item) {
    return res.status(404).json({ error: 'Запись не найдена' });
  }
  res.json(serializeCollectionItem(item));
});


router.delete('/:id', (req, res) => {
  const ok = collectionRepo.remove(req.userId, req.params.id);
  if (!ok) {
    return res.status(404).json({ error: 'Запись не найдена' });
  }
  res.status(204).end();
});


router.post('/:id/watered', (req, res) => {
  const item = collectionRepo.markDone(req.userId, req.params.id, 'water');
  if (!item) {
    return res.status(404).json({ error: 'Запись не найдена' });
  }
  res.json(serializeCollectionItem(item));
});


router.post('/:id/repotted', (req, res) => {
  const item = collectionRepo.markDone(req.userId, req.params.id, 'repot');
  if (!item) {
    return res.status(404).json({ error: 'Запись не найдена' });
  }
  res.json(serializeCollectionItem(item));
});

export default router;
