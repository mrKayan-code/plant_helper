import { EventEmitter } from "../core/EventEmitter.js";
import { todayISO, addDaysISO, daysBetweenISO } from "../utils/dateUtils.js";

export class GardenViewModel extends EventEmitter {
  constructor(collectionService, favoritesService, notifier) {
    super();
    this.collectionService = collectionService;
    this.favoritesService = favoritesService;
    this.notifier = notifier;

    this.state = {
      viewMode: "grid",
      loading: true,
      error: null,
      items: [],
      query: "",
      favoriteIds: new Set(),
      editingId: null,
      editForm: { note: "", waterIntervalDays: "", repotIntervalDays: "", isFavorite: false },
      saving: false,
    };
  }

  async load() {
    this.state = { ...this.state, loading: true, error: null, saving: false };
    this.emit("change", this.state);

    try {
      const [items, favorites] = await Promise.all([
        this.collectionService.getAll(),
        this.favoritesService.getAll(),
      ]);

      this.state = {
        ...this.state,
        loading: false,
        items,
        favoriteIds: new Set(favorites.map((p) => p.id)),
      };
    } catch (err) {
      const message = err.message === "Unauthorized"
        ? "Войдите, чтобы увидеть свой сад"
        : "Не удалось загрузить сад";
      this.state = { ...this.state, loading: false, error: message };
      console.error(err);
    }

    this.emit("change", this.state);
  }

  setViewMode(mode) {
    this.state = { ...this.state, viewMode: mode };
    this.emit("change", this.state);
  }

  search(query) {
    this.state = { ...this.state, query };
    this.emit("change", this.state);
  }

  getVisibleItems() {
    const q = this.state.query.trim().toLowerCase();
    if (!q) return this.state.items;
    return this.state.items.filter((item) => item.plant.name.toLowerCase().includes(q));
  }

  isFavorite(plantId) {
    return this.state.favoriteIds.has(plantId);
  }

  getCareStatus(item) {
    return {
      water: this._computeStatus(item.lastWateredAt, item.waterIntervalDays ?? item.plant.waterIntervalDays),
      repot: this._computeStatus(item.lastRepottedAt, item.repotIntervalDays ?? item.plant.repotIntervalDays),
    };
  }

  _computeStatus(lastDateISO, intervalDays) {
    if (!lastDateISO || intervalDays === null || intervalDays === undefined) {
      return { tracked: false, daysLeft: null };
    }
    const dueDate = addDaysISO(lastDateISO, intervalDays);
    const daysLeft = daysBetweenISO(todayISO(), dueDate);
    return { tracked: true, daysLeft };
  }

  openEdit(itemId) {
    const item = this.state.items.find((i) => i.id === itemId);
    if (!item) return;
    this.state = {
      ...this.state,
      editingId: itemId,
      editForm: {
        note: item.note || "",
        waterIntervalDays: item.waterIntervalDays ?? "",
        repotIntervalDays: item.repotIntervalDays ?? "",
        isFavorite: this.isFavorite(item.plant.id),
      },
    };
    this.emit("change", this.state);
  }

  closeEdit() {
    this.state = { ...this.state, editingId: null };
    this.emit("change", this.state);
  }

  updateEditField(field, value) {
    this.state = { ...this.state, editForm: { ...this.state.editForm, [field]: value } };
    this.emit("change", this.state);
  }

  async saveEdit() {
    const item = this.state.items.find((i) => i.id === this.state.editingId);
    if (!item) return;

    this.state = { ...this.state, saving: true };
    this.emit("change", this.state);

    const { note, waterIntervalDays, repotIntervalDays, isFavorite } = this.state.editForm;

    try {
      await this.collectionService.update(item.id, {
        note,
        waterIntervalDays: waterIntervalDays === "" ? null : Number(waterIntervalDays),
        repotIntervalDays: repotIntervalDays === "" ? null : Number(repotIntervalDays),
      });

      const wasFavorite = this.isFavorite(item.plant.id);
      if (isFavorite && !wasFavorite) {
        await this.favoritesService.add(item.plant.id);
      } else if (!isFavorite && wasFavorite) {
        await this.favoritesService.remove(item.plant.id);
      }

      this.notifier.show("Изменения сохранены");
      this.state = { ...this.state, editingId: null };
      await this.load();
    } catch (err) {
      console.error(err);
      this.state = { ...this.state, saving: false };
      this.emit("change", this.state);
    }
  }

  async deleteItem(id) {
    try {
      await this.collectionService.remove(id);
      this.notifier.show("Растение удалено из сада");
      await this.load();
    } catch (err) {
      console.error(err);
    }
  }

  async markWatered(id) {
    try {
      await this.collectionService.markWatered(id);
      this.notifier.show("Отмечено: полито 💧");
      await this.load();
    } catch (err) {
      console.error(err);
    }
  }

  async markRepotted(id) {
    try {
      await this.collectionService.markRepotted(id);
      this.notifier.show("Отмечено: пересажено 🪴");
      await this.load();
    } catch (err) {
      console.error(err);
    }
  }
}