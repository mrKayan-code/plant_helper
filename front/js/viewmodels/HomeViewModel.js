import { EventEmitter } from "../core/EventEmitter.js";
import { todayISO, addDaysISO } from "../utils/dateUtils.js";

// ViewModel Главного экрана. Не хранит свою копию данных — читает из
// collectionStore / remindersStore и пересчитывает представление по их
// "change". Полил растение из любого экрана → сторы обновились → Главная
// пересчиталась сама, без ручных перезагрузок.
export class HomeViewModel extends EventEmitter {
  constructor(collectionStore, remindersStore) {
    super();
    this.collectionStore = collectionStore;
    this.remindersStore = remindersStore;

    this.state = {
      loading: true,
      error: null,
      totalPlants: 0,
      plantsNeedingCare: 0,
      urgentTasks: [],
      upcomingTasks: [],
      recentPlants: [],
    };

    this.collectionStore.on("change", () => this.recompute());
    this.remindersStore.on("change", () => this.recompute());
  }

  async load() {
    this.state = { ...this.state, loading: true, error: null };
    this.emit("change", this.state);

    try {
      await Promise.all([this.collectionStore.load(), this.remindersStore.load()]);
      // сторы разошлют "change" → recompute() соберёт состояние
    } catch (err) {
      const message = err.message === "Unauthorized"
        ? "Войдите, чтобы увидеть свой сад"
        : "Не удалось загрузить данные";
      this.state = { ...this.state, loading: false, error: message };
      this.emit("change", this.state);
      console.error(err);
    }
  }

  // Чистый пересчёт представления из текущих данных сторов.
  recompute() {
    const collection = this.collectionStore.items;
    const reminders = this.remindersStore.items;
    const today = todayISO();
    const tomorrow = addDaysISO(today, 1);

    this.state = {
      ...this.state,
      loading: false,
      error: null,
      totalPlants: collection.length,
      plantsNeedingCare: new Set(
        reminders.filter((r) => r.dueDate <= today).map((r) => r.collectionId)
      ).size,
      urgentTasks: reminders.filter((r) => r.dueDate <= today),
      upcomingTasks: reminders.filter((r) => r.dueDate === tomorrow),
      recentPlants: [...collection]
        .sort((a, b) => (a.addedAt < b.addedAt ? 1 : -1))
        .slice(0, 4),
    };
    this.emit("change", this.state);
  }
}
