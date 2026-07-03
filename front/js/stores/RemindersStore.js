import { EventEmitter } from "../core/EventEmitter.js";

export class RemindersStore extends EventEmitter {
  #items = [];
  #loaded = false;

  constructor(remindersService, collectionStore) {
    super();
    this.service = remindersService;

    collectionStore.on("change", () => {
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
