import { EventEmitter } from "../core/EventEmitter.js";
import { todayISO, addDaysISO, daysBetweenISO } from "../utils/dateUtils.js";

// ViewModel экрана "Задачи". Три вкладки: срочно / завтра / все (по умолчанию — срочно).
// Задачи читает из remindersStore, отметки — через collectionStore (с подтверждением).
// "Выполнено сегодня" — сессионный ЖУРНАЛ (не фильтр): после отметки срок задачи
// сам уезжает вперёд и она покидает "Срочно" естественно, а не прячется искусственно.
export class TasksViewModel extends EventEmitter {
  constructor(collectionStore, remindersStore, notifier, careConfirm) {
    super();
    this.collectionStore = collectionStore;
    this.remindersStore = remindersStore;
    this.notifier = notifier;
    this.careConfirm = careConfirm;

    this.state = {
      filter: "today", // "today" (Срочно) | "tomorrow" (Завтра) | "all" (Все)
      loading: true,
      error: null,
      urgent: [],   // due <= сегодня (просрочено + сегодня)
      tomorrow: [], // due === завтра
      all: [],      // все задачи, по возрастанию срока
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
    const byDate = (a, b) => (a.dueDate < b.dueDate ? -1 : a.dueDate > b.dueDate ? 1 : 0);

    this.state = {
      ...this.state,
      loading: false,
      error: null,
      urgent: reminders.filter((r) => r.dueDate <= today).sort(byDate),
      tomorrow: reminders.filter((r) => r.dueDate === tomorrow).sort(byDate),
      all: [...reminders].sort(byDate),
    };
    this.emit("change", this.state);
  }

  setFilter(filter) {
    this.state = { ...this.state, filter };
    this.emit("change", this.state);
  }

  // Отметить задачу — через единую форму подтверждения. Она сама вызовет
  // collectionStore после подтверждения; onDone добавит запись в журнал.
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
