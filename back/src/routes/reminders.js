import { Router } from 'express';
import { collectionRepo } from '../repositories/collection.repo.js';
import { serializeCollectionItem } from '../serialize.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();
router.use(requireAuth);

// Дата в формате YYYY-MM-DD (строки такого вида сравниваются лексикографически = хронологически)
function today() {
  return new Date().toISOString().slice(0, 10);
}
function addDays(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// Одно действие → элемент напоминания, если оно "пора" (due <= завтра).
function buildReminder(item, action, lastDate, interval, horizon) {
  if (!lastDate || !interval) return null; // нет даты/интервала — посчитать нельзя
  const due = addDays(lastDate, interval);
  if (due > horizon) return null;          // ещё рано
  return {
    collectionId: item.id,
    plantId: item.plant.id,
    name: item.plant.name,
    action,
    dueDate: due,
  };
}

// GET /api/reminders — что пора полить/пересадить по личному списку (до завтра включительно)
router.get('/', (req, res) => {
  const horizon = addDays(today(), 1); // сегодня + 1: покрывает "срочно сегодня" и "скоро завтра"
  const items = collectionRepo.findByUser(req.userId).map(serializeCollectionItem);

  const reminders = [];
  for (const item of items) {
    // effective interval: переопределение из collection, иначе из карточки справочника
    const waterInterval = item.waterIntervalDays ?? item.plant.waterIntervalDays;
    const repotInterval = item.repotIntervalDays ?? item.plant.repotIntervalDays;

    const water = buildReminder(item, 'water', item.lastWateredAt, waterInterval, horizon);
    if (water) reminders.push(water);

    const repot = buildReminder(item, 'repot', item.lastRepottedAt, repotInterval, horizon);
    if (repot) reminders.push(repot);
  }

  res.json(reminders);
});

export default router;
