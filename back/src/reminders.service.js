import { collectionRepo } from './repositories/collection.repo.js';
import { serializeCollectionItem } from './serialize.js';


export function addDays(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}


function buildReminder(item, action, lastDate, interval) {
  if (lastDate == null || lastDate === '' || interval == null) return null;
  return {
    collectionId: item.id,
    plantId: item.plant.id,
    name: item.plant.name,
    action,
    dueDate: addDays(lastDate, interval),
  };
}



export function computeReminders(userId) {
  const items = collectionRepo.findByUser(userId).map(serializeCollectionItem);
  const reminders = [];
  for (const item of items) {
    const waterInterval = item.waterIntervalDays ?? item.plant.waterIntervalDays;
    const repotInterval = item.repotIntervalDays ?? item.plant.repotIntervalDays;

    const water = buildReminder(item, 'water', item.lastWateredAt, waterInterval);
    if (water) reminders.push(water);

    const repot = buildReminder(item, 'repot', item.lastRepottedAt, repotInterval);
    if (repot) reminders.push(repot);
  }
  return reminders;
}
