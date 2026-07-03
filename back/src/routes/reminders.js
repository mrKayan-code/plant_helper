import { Router } from 'express';
import { computeReminders } from '../reminders.service.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();
router.use(requireAuth);

// GET /api/reminders — полное расписание ухода по личному списку.
router.get('/', (req, res) => {
  res.json(computeReminders(req.userId));
});

export default router;
