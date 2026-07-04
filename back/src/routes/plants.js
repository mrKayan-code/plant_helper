import { Router } from 'express';
import { plantsRepo } from '../repositories/plants.repo.js';
import { serializePlant } from '../serialize.js';

const router = Router();


router.get('/', (req, res) => {
  const rows = plantsRepo.findAll(req.query.q);
  res.json(rows.map(serializePlant));
});


router.get('/:id', (req, res) => {
  const row = plantsRepo.findById(req.params.id);
  if (!row) {
    return res.status(404).json({ error: 'Растение не найдено' });
  }
  res.json(serializePlant(row));
});

export default router;
