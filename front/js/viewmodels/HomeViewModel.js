// js/viewmodels/HomeViewModel.js
import { EventEmitter } from "../core/EventEmitter.js";
import { todayISO } from "../utils/dateUtils.js";

// ViewModel Главного экрана. Не импортирует ничего связанного с DOM —
// только сервисы (через конструктор) и чистую бизнес-логику.
// View подписывается на "change" и решает, как это нарисовать.
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

      this.state = {
        loading: false,
        error: null,
        totalPlants: collection.length,
        plantsNeedingCare: new Set(reminders.map((r) => r.collectionId)).size,
        urgentTasks: reminders.filter((r) => r.dueDate <= today),
        upcomingTasks: reminders.filter((r) => r.dueDate > today),
        recentPlants: [...collection]
          .sort((a, b) => (a.addedAt < b.addedAt ? 1 : -1))
          .slice(0, 4),
      };
    } catch (err) {
      this.state = { ...this.state, loading: false, error: "Не удалось загрузить данные" };
      console.error(err);
    }

    this.emit("change", this.state);
  }
}
