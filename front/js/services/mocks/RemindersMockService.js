// js/services/mocks/RemindersMockService.js
import { Reminder } from "../../models/Reminder.js";
import { todayISO, addDaysISO } from "../../utils/dateUtils.js";

// Зависит от абстракции "сервис коллекции" (getAll() -> CollectionItem[]),
// а не от конкретного CollectionMockService — благодаря этому будет
// работать одинаково, даже если коллекция уже реальная, а напоминания ещё
// мокнутые (edge-case, но архитектурно корректно — Dependency Inversion).
export class RemindersMockService {
  constructor(collectionService) {
    this.collectionService = collectionService;
  }

  async getAll() {
    const collection = await this.collectionService.getAll();
    const today = todayISO();
    const tomorrow = addDaysISO(today, 1);
    const out = [];

    for (const item of collection) {
      const waterInterval = item.waterIntervalDays ?? item.plant.waterIntervalDays;
      if (item.lastWateredAt && waterInterval) {
        const due = addDaysISO(item.lastWateredAt, waterInterval);
        if (due <= tomorrow) {
          out.push(Reminder.fromJSON({
            collectionId: item.id, plantId: item.plant.id,
            name: item.plant.name, action: "water", dueDate: due,
          }));
        }
      }
      const repotInterval = item.repotIntervalDays ?? item.plant.repotIntervalDays;
      if (item.lastRepottedAt && repotInterval) {
        const due = addDaysISO(item.lastRepottedAt, repotInterval);
        if (due <= tomorrow) {
          out.push(Reminder.fromJSON({
            collectionId: item.id, plantId: item.plant.id,
            name: item.plant.name, action: "repot", dueDate: due,
          }));
        }
      }
    }
    return out;
  }
}
