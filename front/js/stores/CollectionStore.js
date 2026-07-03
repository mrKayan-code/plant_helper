import { EventEmitter } from "../core/EventEmitter.js";

// Единственный источник правды для личного сада пользователя.
// Владеет данными (одна копия на всё приложение), выполняет мутации
// и уведомляет подписчиков ("change"). ViewModel'и НЕ хранят свою копию —
// читают отсюда и подписываются. Мутация из любого экрана → один этот метод →
// авто-обновление всех подписчиков. Живёт как singleton через ServiceContainer.
export class CollectionStore extends EventEmitter {
  #items = [];
  #loaded = false;

  constructor(collectionService) {
    super();
    this.service = collectionService;
  }

  get items() { return this.#items; }
  get loaded() { return this.#loaded; }

  // Перечитать сад с бэка и разослать всем подписчикам.
  async load() {
    this.#items = await this.service.getAll();
    this.#loaded = true;
    this.emit("change", this.#items);
  }

  // --- мутации: сходили на бэк → перечитали → авто-рассылка ---
  async add(payload)      { await this.service.add(payload);      await this.load(); }
  async update(id, patch) { await this.service.update(id, patch); await this.load(); }
  async remove(id)        { await this.service.remove(id);        await this.load(); }
  async markWatered(id)   { await this.service.markWatered(id);   await this.load(); }
  async markRepotted(id)  { await this.service.markRepotted(id);  await this.load(); }

  // При логауте — очистить, чтобы не показывать чужой сад.
  clear() {
    this.#items = [];
    this.#loaded = false;
    this.emit("change", this.#items);
  }
}
