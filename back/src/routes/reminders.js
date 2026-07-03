import { Router } from 'express';
import { collectionRepo } from '../repositories/collection.repo.js';
import { serializeCollectionItem } from '../serialize.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();
router.use(requireAuth);

// Дата в формате YYYY-MM-DD (строки такого вида сравниваются лексикографически = хронологически)
function addDays(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// Одно действие → следующая дата ухода (или null, если посчитать нельзя).
// Окном НЕ ограничиваем: отдаём всё расписание, фронт сам раскладывает
// по бакетам "сегодня / завтра / все" (см. TasksViewModel).
function buildReminder(item, action, lastDate, interval) {
  if (!lastDate || !interval) return null; // нет даты/интервала — посчитать нельзя
  return {
    collectionId: item.id,
    plantId: item.plant.id,
    name: item.plant.name,
    action,
    dueDate: addDays(lastDate, interval),
  };
}

// GET /api/reminders — полное расписание ухода по личному списку.
// Для каждого растения: следующий полив и следующая пересадка (dueDate).
// Просрочённые приходят с dueDate в прошлом — фронт покажет их как "срочные".
router.get('/', (req, res) => {
  const items = collectionRepo.findByUser(req.userId).map(serializeCollectionItem);

  const reminders = [];
  for (const item of items) {
    // effective interval: переопределение из collection, иначе из карточки справочника
    const waterInterval = item.waterIntervalDays ?? item.plant.waterIntervalDays;
    const repotInterval = item.repotIntervalDays ?? item.plant.repotIntervalDays;

    const water = buildReminder(item, 'water', item.lastWateredAt, waterInterval);
    if (water) reminders.push(water);

    const repot = buildReminder(item, 'repot', item.lastRepottedAt, repotInterval);
    if (repot) reminders.push(repot);
  }

  res.json(reminders);
});

export default router;
