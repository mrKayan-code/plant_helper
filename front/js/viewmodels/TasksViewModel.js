import { EventEmitter } from "../core/EventEmitter.js";
import { todayISO, addDaysISO } from "../utils/dateUtils.js";

export class TasksViewModel extends EventEmitter {
  constructor(remindersService, collectionService, notifier) {
    super();
    this.remindersService = remindersService;
    this.collectionService = collectionService;
    this.notifier = notifier;

    this.state = {
      filter: "all", 
      loading: true,
      error: null,
      urgent: [], 
      tomorrow: [], 
      upcoming: [], 
      completedToday: [],
      completingKey: null,
    };
  }

  async load() {
    this.state = { ...this.state, loading: true, error: null, completingKey: null };
    this.emit("change", this.state);

    try {
      const reminders = await this.remindersService.getAll();
      const today = todayISO();
      const tomorrow = addDaysISO(today, 1);

      const completedKeys = new Set(this.state.completedToday.map((c) => c.key));
      const notCompleted = (r) => !completedKeys.has(`${r.collectionId}:${r.action}`);

      this.state = {
        ...this.state,
        loading: false,
        urgent: reminders.filter((r) => r.dueDate <= today && notCompleted(r)),
        tomorrow: reminders.filter((r) => r.dueDate === tomorrow && notCompleted(r)),
        upcoming: reminders.filter((r) => r.dueDate > today && notCompleted(r)),
      };
    } catch (err) {
      const message = err.message === "Unauthorized"
        ? "Войдите, чтобы увидеть задачи"
        : "Не удалось загрузить задачи";
      this.state = { ...this.state, loading: false, error: message };
      console.error(err);
    }

    this.emit("change", this.state);
  }

  setFilter(filter) {
    this.state = { ...this.state, filter };
    this.emit("change", this.state);
  }

  async completeTask(reminder) {
    const key = `${reminder.collectionId}:${reminder.action}`;
    this.state = { ...this.state, completingKey: key };
    this.emit("change", this.state);

    try {
      if (reminder.action === "water") {
        await this.collectionService.markWatered(reminder.collectionId);
      } else {
        await this.collectionService.markRepotted(reminder.collectionId);
      }
      this.notifier.show(reminder.action === "water" ? "Отмечено: полито 💧" : "Отмечено: пересажено 🪴");

      this.state = {
        ...this.state,
        completedToday: [...this.state.completedToday, { key, name: reminder.name, action: reminder.action }],
      };
      await this.load();
    } catch (err) {
      console.error(err);
      this.state = { ...this.state, completingKey: null };
      this.emit("change", this.state);
    }
  }
}