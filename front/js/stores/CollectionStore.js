import { EventEmitter } from "../core/EventEmitter.js";

export class CollectionStore extends EventEmitter {
  #items = [];
  #loaded = false;

  constructor(collectionService) {
    super();
    this.service = collectionService;
  }

  get items() { return this.#items; }
  get loaded() { return this.#loaded; }

  async load() {
    this.#items = await this.service.getAll();
    this.#loaded = true;
    this.emit("change", this.#items);
  }

  async add(payload) { await this.service.add(payload); await this.load(); }
  async update(id, patch) { await this.service.update(id, patch); await this.load(); }
  async remove(id) { await this.service.remove(id); await this.load(); }
  async markWatered(id) { await this.service.markWatered(id); await this.load(); }
  async markRepotted(id) { await this.service.markRepotted(id); await this.load(); }

  clear() {
    this.#items = [];
    this.#loaded = false;
    this.emit("change", this.#items);
  }
}
