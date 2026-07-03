import { EventEmitter } from "../core/EventEmitter.js";
import { todayISO, addDaysISO } from "../utils/dateUtils.js";

export class HomeViewModel extends EventEmitter {
  constructor(collectionService, remindersService) {
    super();
    this.collectionService = collectionService;
    this.remindersService = remindersService;

    this.state = {
      loading: true,
      error: null,
      totalPlants: 0,
      plantsNeedingCare: 0,
      urgentTasks: [],
      upcomingTasks: [],
      recentPlants: [],
    };
  }

  async load() {
    this.state = { ...this.state, loading: true, error: null };
    this.emit("change", this.state);

    try {
      const [collection, reminders] = await Promise.all([
        this.collectionService.getAll(),
        this.remindersService.getAll(),
      ]);

      const today = todayISO();
      const tomorrow = addDaysISO(today, 1);

      this.state = {
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
    } catch (err) {
      const message = err.message === "Unauthorized"
        ? "Войдите, чтобы увидеть свой сад"
        : "Не удалось загрузить данные";
      this.state = { ...this.state, loading: false, error: message };
      console.error(err);
    }

    this.emit("change", this.state);
  }
}