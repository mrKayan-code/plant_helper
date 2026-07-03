import { Reminder } from "../../models/Reminder.js";
import { todayISO, addDaysISO } from "../../utils/dateUtils.js";

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
      if (item.lastWateredAt && waterInterval != null) {
        const due = addDaysISO(item.lastWateredAt, waterInterval);
        if (due <= tomorrow) {
          out.push(Reminder.fromJSON({
            collectionId: item.id, plantId: item.plant.id,
            name: item.plant.name, action: "water", dueDate: due,
          }));
        }
      }
      const repotInterval = item.repotIntervalDays ?? item.plant.repotIntervalDays;
      if (item.lastRepottedAt && repotInterval != null) {
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