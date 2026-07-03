import { EventEmitter } from "../core/EventEmitter.js";

// ViewModel энциклопедии. Справочник (plants) — read-only, тянется из
// plantsService. Избранное и добавление в сад — через сторы (единый
// источник правды), поэтому звёздочки всегда синхронны с "Мой сад",
// а добавленное растение сразу появляется в саду без ручных перезагрузок.
export class CatalogViewModel extends EventEmitter {
  constructor(plantsService, favoritesStore, collectionStore, notifier) {
    super();
    this.plantsService = plantsService;
    this.favoritesStore = favoritesStore;
    this.collectionStore = collectionStore;
    this.notifier = notifier;

    this.state = {
      mode: "list",
      viewFilter: "all",
      loading: true,
      error: null,
      plants: [],
      query: "",
      favoriteIds: new Set(this.favoritesStore.ids),
      selectedPlant: null,
      addingToGarden: false,
      addedToGarden: false,
    };

    // Избранное приходит из стора — подписка держит звёздочки актуальными
    // (в т.ч. если избранное поменяли в "Мой сад" или сменили аккаунт).
    this.favoritesStore.on("change", (ids) => {
      this.state = { ...this.state, favoriteIds: new Set(ids) };
      this.emit("change", this.state);
    });
  }

  async init() {
    await this.reloadFavorites();
    await this.search(this.state.query);
  }

  // Делегирует стору; оставлен, чтобы CatalogView.onShow не менять.
  async reloadFavorites() {
    try {
      await this.favoritesStore.load();
    } catch (err) {
      console.error("Не удалось загрузить избранное:", err);
    }
  }

  async search(query) {
    this.state = { ...this.state, query, loading: true, error: null };
    this.emit("change", this.state);

    try {
      this.state.plants = await this.plantsService.getAll(query);
    } catch (err) {
      this.state.error = "Не удалось загрузить справочник. Проверьте, запущен ли сервер.";
      console.error(err);
    }
    this.state.loading = false;
    this.emit("change", this.state);
  }

  async openDetail(plantId) {
    this.state = { ...this.state, mode: "detail", selectedPlant: null, addedToGarden: false, error: null };
    this.emit("change", this.state);

    try {
      this.state.selectedPlant = await this.plantsService.getById(plantId);
    } catch (err) {
      this.state.error = "Не удалось загрузить карточку растения";
      console.error(err);
    }
    this.emit("change", this.state);
  }

  backToList() {
    this.state = { ...this.state, mode: "list", selectedPlant: null };
    this.emit("change", this.state);
  }

  setViewFilter(filter) {
    this.state = { ...this.state, viewFilter: filter };
    this.emit("change", this.state);
  }

  getVisiblePlants() {
    if (this.state.viewFilter !== "favorites") return this.state.plants;
    return this.state.plants.filter((p) => this.isFavorite(p.id));
  }

  isFavorite(plantId) {
    return this.state.favoriteIds.has(plantId);
  }

  async toggleFavorite(plantId) {
    const isFav = this.isFavorite(plantId);
    try {
      await this.favoritesStore.toggle(plantId); // стор сам разошлёт "change"
      this.notifier.show(isFav ? "Убрано из избранного" : "Добавлено в избранное");
    } catch (err) {
      console.error(err);
    }
  }

  async addSelectedToGarden() {
    const plant = this.state.selectedPlant;
    if (!plant) return;

    this.state.addingToGarden = true;
    this.emit("change", this.state);

    try {
      await this.collectionStore.add({ plantId: plant.id }); // появится в "Мой сад" автоматически
      this.state.addedToGarden = true;
      this.notifier.show(`«${plant.name}» добавлено в мой сад`);
    } catch (err) {
      console.error(err);
    }
    this.state.addingToGarden = false;
    this.emit("change", this.state);
  }
}
