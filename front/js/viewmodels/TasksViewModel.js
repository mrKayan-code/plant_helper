import { EventEmitter } from "../core/EventEmitter.js";
import { todayISO, addDaysISO, daysBetweenISO } from "../utils/dateUtils.js";

export class TasksViewModel extends EventEmitter {
  constructor(collectionStore, remindersStore, notifier, careConfirm) {
    super();
    this.collectionStore = collectionStore;
    this.remindersStore = remindersStore;
    this.notifier = notifier;
    this.careConfirm = careConfirm;

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

    this.remindersStore.on("change", () => this.recompute());
  }

  async load() {
    this.state = { ...this.state, loading: true, error: null, completingKey: null };
    this.emit("change", this.state);

    try {
      await this.remindersStore.load(); 
    } catch (err) {
      const message = err.message === "Unauthorized"
        ? "Войдите, чтобы увидеть задачи"
        : "Не удалось загрузить задачи";
      this.state = { ...this.state, loading: false, error: message };
      this.emit("change", this.state);
      console.error(err);
    }
  }

  recompute() {
    const reminders = this.remindersStore.items;
    const today = todayISO();
    const tomorrow = addDaysISO(today, 1);

    this.state = {
      ...this.state,
      loading: false,
      error: null,
      urgent: reminders.filter((r) => r.dueDate <= today),
      tomorrow: reminders.filter((r) => r.dueDate === tomorrow),
      upcoming: reminders.filter((r) => r.dueDate > today),
    };
    this.emit("change", this.state);
  }

  setFilter(filter) {
    this.state = { ...this.state, filter };
    this.emit("change", this.state);
  }

  completeTask(reminder) {
    const key = `${reminder.collectionId}:${reminder.action}`;
    const daysLeft = daysBetweenISO(todayISO(), reminder.dueDate);

    this.careConfirm.request({
      collectionId: reminder.collectionId,
      name: reminder.name,
      action: reminder.action,
      daysLeft,
      onDone: () => {
        this.state = {
          ...this.state,
          completedToday: [...this.state.completedToday, { key, name: reminder.name, action: reminder.action }],
        };
        this.recompute();
      },
    });

    this.emit("change", this.state);
  }
}
