import { EventEmitter } from "../core/EventEmitter.js";
import { todayISO, addDaysISO, daysBetweenISO } from "../utils/dateUtils.js";

export class GardenViewModel extends EventEmitter {
  constructor(collectionStore, favoritesStore, notifier, careConfirm) {
    super();
    this.collectionStore = collectionStore;
    this.favoritesStore = favoritesStore;
    this.notifier = notifier;
    this.careConfirm = careConfirm;

    this.state = {
      viewMode: "grid",
      loading: true,
      error: null,
      items: [],
      query: "",
      favoriteIds: new Set(),
      editingId: null,
      editForm: { note: "", waterIntervalDays: "", repotIntervalDays: "" },
      saving: false,
    };

    this.collectionStore.on("change", (items) => {
      this.state = { ...this.state, items, loading: false };
      this.emit("change", this.state);
    });
    this.favoritesStore.on("change", (ids) => {
      this.state = { ...this.state, favoriteIds: new Set(ids) };
      this.emit("change", this.state);
    });
  }

  async load() {
    this.state = { ...this.state, loading: true, error: null, saving: false };
    this.emit("change", this.state);

    try {
      await Promise.all([this.collectionStore.load(), this.favoritesStore.load()]);
    } catch (err) {
      const message = err.message === "Unauthorized"
        ? "Войдите, чтобы увидеть свой сад"
        : "Не удалось загрузить сад";
      this.state = { ...this.state, loading: false, error: message };
      this.emit("change", this.state);
      console.error(err);
    }
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

  async toggleFavorite(plantId) {
    const isFav = this.isFavorite(plantId);
    try {
      await this.favoritesStore.toggle(plantId);
      this.notifier.show(isFav ? "Убрано из избранного" : "Добавлено в избранное");
    } catch (err) {
      console.error(err);
    }
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

    const { note, waterIntervalDays, repotIntervalDays } = this.state.editForm;

    try {
      await this.collectionStore.update(item.id, {
        note,
        waterIntervalDays: waterIntervalDays === "" ? null : Number(waterIntervalDays),
        repotIntervalDays: repotIntervalDays === "" ? null : Number(repotIntervalDays),
      });
      this.notifier.show("Изменения сохранены");
      this.state = { ...this.state, editingId: null, saving: false };
      this.emit("change", this.state);
    } catch (err) {
      console.error(err);
      this.state = { ...this.state, saving: false };
      this.emit("change", this.state);
    }
  }

  async deleteItem(id) {
    try {
      await this.collectionStore.remove(id);
      this.notifier.show("Растение удалено из сада");
    } catch (err) {
      console.error(err);
    }
  }

  markWatered(id) {
    const item = this.state.items.find((i) => i.id === id);
    if (!item) return;
    const status = this.getCareStatus(item).water;
    this.careConfirm.request({
      collectionId: item.id,
      name: item.plant.name,
      action: "water",
      daysLeft: status.tracked ? status.daysLeft : null,
    });
  }

  markRepotted(id) {
    const item = this.state.items.find((i) => i.id === id);
    if (!item) return;
    const status = this.getCareStatus(item).repot;
    this.careConfirm.request({
      collectionId: item.id,
      name: item.plant.name,
      action: "repot",
      daysLeft: status.tracked ? status.daysLeft : null,
    });
  }
}
