import { EventEmitter } from "../core/EventEmitter.js";
import { todayISO, addDaysISO } from "../utils/dateUtils.js";

// ViewModel экрана "Задачи". Задачи читает из remindersStore, отметки
// "полито/пересажено" делает через collectionStore. Полил → коллекция
// изменилась → remindersStore сам перечитался → задачи пересчитались.
// "Выполнено сегодня" — сессионный список на фронте (бэк историю не хранит).
export class TasksViewModel extends EventEmitter {
  constructor(collectionStore, remindersStore, notifier) {
    super();
    this.collectionStore = collectionStore;
    this.remindersStore = remindersStore;
    this.notifier = notifier;

    this.state = {
      filter: "all", // "today" | "tomorrow" | "all"
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
      await this.remindersStore.load(); // разошлёт "change" → recompute()
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

    const completedKeys = new Set(this.state.completedToday.map((c) => c.key));
    const notCompleted = (r) => !completedKeys.has(`${r.collectionId}:${r.action}`);

    this.state = {
      ...this.state,
      loading: false,
      error: null,
      urgent: reminders.filter((r) => r.dueDate <= today && notCompleted(r)),
      tomorrow: reminders.filter((r) => r.dueDate === tomorrow && notCompleted(r)),
      upcoming: reminders.filter((r) => r.dueDate > today && notCompleted(r)),
    };
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
        await this.collectionStore.markWatered(reminder.collectionId);
      } else {
        await this.collectionStore.markRepotted(reminder.collectionId);
      }
      // collectionStore → remindersStore перечитались; фиксируем "выполнено" и пересчитываем
      this.notifier.show(reminder.action === "water" ? "Отмечено: полито 💧" : "Отмечено: пересажено 🌱");
      this.state = {
        ...this.state,
        completingKey: null,
        completedToday: [...this.state.completedToday, { key, name: reminder.name, action: reminder.action }],
      };
      this.recompute();
    } catch (err) {
      console.error(err);
      this.state = { ...this.state, completingKey: null };
      this.emit("change", this.state);
    }
  }
}
