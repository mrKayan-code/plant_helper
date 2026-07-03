// js/viewmodels/GardenViewModel.js
import { EventEmitter } from "../core/EventEmitter.js";

// ViewModel экрана "Мой сад". После любого мутирующего действия (сохранить,
// удалить, полить, пересадить) просто перезагружаем весь список из
// источника правды через load() — это чуть дороже по сети, чем точечно
// патчить локальный массив, но полностью исключает рассинхрон состояния.
export class GardenViewModel extends EventEmitter {
  constructor(collectionService, favoritesService, remindersService, notifier) {
    super();
    this.collectionService = collectionService;
    this.favoritesService = favoritesService;
    this.remindersService = remindersService;
    this.notifier = notifier;

    this.state = {
      viewMode: "grid", // "grid" | "list"
      loading: true,
      error: null,
      items: [],
      query: "",
      favoriteIds: new Set(),
      reminderMap: new Map(), // collectionId -> Reminder[]
      editingId: null,
      editForm: { note: "", waterIntervalDays: "", repotIntervalDays: "", isFavorite: false },
      saving: false,
    };
  }

  async load() {
    this.state = { ...this.state, loading: true, error: null, saving: false };
    this.emit("change", this.state);

    try {
      const [items, favorites, reminders] = await Promise.all([
        this.collectionService.getAll(),
        this.favoritesService.getAll(),
        this.remindersService.getAll(),
      ]);

      const reminderMap = new Map();
      reminders.forEach((r) => {
        if (!reminderMap.has(r.collectionId)) reminderMap.set(r.collectionId, []);
        reminderMap.get(r.collectionId).push(r);
      });

      this.state = {
        ...this.state,
        loading: false,
        items,
        favoriteIds: new Set(favorites.map((p) => p.id)),
        reminderMap,
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

  // Фильтрация — чистая функция над уже загруженными данными, отдельного
  // запроса не делает (коллекция обычно небольшая).
  getVisibleItems() {
    const q = this.state.query.trim().toLowerCase();
    if (!q) return this.state.items;
    return this.state.items.filter((item) => item.plant.name.toLowerCase().includes(q));
  }

  getRemindersFor(collectionItemId) {
    return this.state.reminderMap.get(collectionItemId) || [];
  }

  isFavorite(plantId) {
    return this.state.favoriteIds.has(plantId);
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
