// js/viewmodels/TasksViewModel.js
import { EventEmitter } from "../core/EventEmitter.js";
import { todayISO } from "../utils/dateUtils.js";

// ViewModel экрана "Задачи". Срочные/предстоящие задачи берём из
// remindersService (та же абстракция, что уже используется на Главной —
// сейчас мок, при готовности бэка станет реальным без правок здесь).
// "Выполнено сегодня" бэк не хранит (нет истории действий), поэтому это
// чисто сессионный список на фронте — пропадает при перезагрузке страницы,
// это осознанное решение, не баг.
export class TasksViewModel extends EventEmitter {
  constructor(remindersService, collectionService, notifier) {
    super();
    this.remindersService = remindersService;
    this.collectionService = collectionService;
    this.notifier = notifier;

    this.state = {
      filter: "all", // "today" | "tomorrow" | "all"
      loading: true,
      error: null,
      urgent: [],   // Reminder[] — due <= сегодня
      upcoming: [], // Reminder[] — due завтра
      completedToday: [], // { name, action }[] — только в рамках этой сессии
      completingKey: null, // "<collectionId>:<action>" — что сейчас отмечается
    };
  }

  async load() {
    this.state = { ...this.state, loading: true, error: null, completingKey: null };
    this.emit("change", this.state);

    try {
      const reminders = await this.remindersService.getAll();
      const today = todayISO();

      this.state = {
        ...this.state,
        loading: false,
        urgent: reminders.filter((r) => r.dueDate <= today),
        upcoming: reminders.filter((r) => r.dueDate > today),
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
        completedToday: [...this.state.completedToday, { name: reminder.name, action: reminder.action }],
      };
      await this.load();
    } catch (err) {
      console.error(err);
      this.state = { ...this.state, completingKey: null };
      this.emit("change", this.state);
    }
  }
}