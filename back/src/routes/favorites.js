import { Router } from 'express';
import { favoritesRepo } from '../repositories/favorites.repo.js';
import { plantsRepo } from '../repositories/plants.repo.js';
import { serializePlant } from '../serialize.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();
router.use(requireAuth);

// GET /api/favorites — избранные карточки (форма как у /api/plants)
router.get('/', (req, res) => {
  const rows = favoritesRepo.findByUser(req.userId);
  res.json(rows.map(serializePlant));
});

// POST /api/favorites — { plantId } (идемпотентно)
router.post('/', (req, res) => {
  const { plantId } = req.body ?? {};
  if (!plantId) {
    return res.status(400).json({ error: 'Нужен plantId' });
  }
  if (!plantsRepo.exists(plantId)) {
    return res.status(404).json({ error: 'Растение из справочника не найдено' });
  }
  favoritesRepo.add(req.userId, plantId);
  res.status(201).end();
});

// DELETE /api/favorites/:plantId
router.delete('/:plantId', (req, res) => {
  favoritesRepo.remove(req.userId, req.params.plantId);
  res.status(204).end();
});

export default router;
