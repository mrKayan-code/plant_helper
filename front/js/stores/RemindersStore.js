import { EventEmitter } from "../core/EventEmitter.js";

// Напоминания — ПРОИЗВОДНОЕ состояние от коллекции (даты + интервалы).
// Поэтому стор подписывается на collectionStore: полил / добавил / удалил
// растение → коллекция изменилась → напоминания сами перечитываются.
// Экранам (Главная, Задачи) достаточно подписаться сюда — синхронизация
// с любыми действиями над садом происходит автоматически.
export class RemindersStore extends EventEmitter {
  #items = [];
  #loaded = false;

  constructor(remindersService, collectionStore) {
    super();
    this.service = remindersService;

    collectionStore.on("change", () => {
      // Перечитываем только если уже был первичный load (иначе тянули бы
      // напоминания до авторизации). Ошибки глушим — не критично.
      if (this.#loaded) this.load().catch(() => {});
    });
  }

  get items() { return this.#items; }
  get loaded() { return this.#loaded; }

  async load() {
    this.#items = await this.service.getAll();
    this.#loaded = true;
    this.emit("change", this.#items);
  }

  clear() {
    this.#items = [];
    this.#loaded = false;
    this.emit("change", this.#items);
  }
}
