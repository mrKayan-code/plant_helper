import { EventEmitter } from "../core/EventEmitter.js";
import { todayISO, addDaysISO, daysBetweenISO } from "../utils/dateUtils.js";

// ViewModel экрана "Задачи". Задачи читает из remindersStore, отметки
// "полито/пересажено" делает через collectionStore. Полил → коллекция
// изменилась → remindersStore сам перечитался → задачи пересчитались.
// "Выполнено сегодня" — сессионный список на фронте (бэк историю не хранит).
export class TasksViewModel extends EventEmitter {
  constructor(collectionStore, remindersStore, notifier, careConfirm) {
    super();
    this.collectionStore = collectionStore;
    this.remindersStore = remindersStore;
    this.notifier = notifier;
    this.careConfirm = careConfirm;

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

  // Отметить задачу — через единую форму подтверждения. Она сама вызовет
  // collectionStore после подтверждения, а onDone добавит в "выполнено сегодня".
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

    // перерисовать список — сбросить только что кликнутый чекбокс (модалка сверху)
    this.emit("change", this.state);
  }
}
