import { EventEmitter } from "../core/EventEmitter.js";

export class FavoritesStore extends EventEmitter {
  #ids = new Set();
  #loaded = false;

  constructor(favoritesService) {
    super();
    this.service = favoritesService;
  }

  get ids() { return this.#ids; }
  get loaded() { return this.#loaded; }
  has(plantId) { return this.#ids.has(plantId); }

  async load() {
    const favorites = await this.service.getAll();
    this.#ids = new Set(favorites.map((p) => p.id));
    this.#loaded = true;
    this.emit("change", this.#ids);
  }

  async add(plantId) {
    await this.service.add(plantId);
    this.#ids.add(plantId);
    this.emit("change", this.#ids);
  }

  async remove(plantId) {
    await this.service.remove(plantId);
    this.#ids.delete(plantId);
    this.emit("change", this.#ids);
  }

  async toggle(plantId) {
    if (this.#ids.has(plantId)) await this.remove(plantId);
    else await this.add(plantId);
  }

  clear() {
    this.#ids = new Set();
    this.#loaded = false;
    this.emit("change", this.#ids);
  }
}
