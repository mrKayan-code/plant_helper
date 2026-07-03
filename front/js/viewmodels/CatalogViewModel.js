// js/viewmodels/CatalogViewModel.js
import { EventEmitter } from "../core/EventEmitter.js";

// ViewModel экрана "Энциклопедия". Хранит режим (список/детали), запрос
// поиска, выбранное растение, избранное. View только читает state и зовёт
// эти методы в ответ на клики — сама ничего не решает и не ходит в сеть.
export class CatalogViewModel extends EventEmitter {
  constructor(plantsService, favoritesService, collectionService, notifier) {
    super();
    this.plantsService = plantsService;
    this.favoritesService = favoritesService;
    this.collectionService = collectionService;
    this.notifier = notifier;

    this.state = {
      mode: "list",           // "list" | "detail"
      loading: true,
      error: null,
      plants: [],
      query: "",
      favoriteIds: new Set(),
      selectedPlant: null,
      addingToGarden: false,
      addedToGarden: false,
    };
  }

  async init() {
    try {
      const favorites = await this.favoritesService.getAll();
      this.state.favoriteIds = new Set(favorites.map((p) => p.id));
    } catch (err) {
      console.error("Не удалось загрузить избранное:", err);
    }
    await this.search(this.state.query);
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

  isFavorite(plantId) {
    return this.state.favoriteIds.has(plantId);
  }

  async toggleFavorite(plantId) {
    const isFav = this.isFavorite(plantId);
    try {
      if (isFav) {
        await this.favoritesService.remove(plantId);
        this.state.favoriteIds.delete(plantId);
        this.notifier.show("Убрано из избранного");
      } else {
        await this.favoritesService.add(plantId);
        this.state.favoriteIds.add(plantId);
        this.notifier.show("Добавлено в избранное");
      }
    } catch (err) {
      console.error(err);
    }
    this.emit("change", this.state);
  }

  async addSelectedToGarden() {
    const plant = this.state.selectedPlant;
    if (!plant) return;

    this.state.addingToGarden = true;
    this.emit("change", this.state);

    try {
      await this.collectionService.add({ plantId: plant.id });
      this.state.addedToGarden = true;
      this.notifier.show(`«${plant.name}» добавлено в мой сад`);
    } catch (err) {
      console.error(err);
    }
    this.state.addingToGarden = false;
    this.emit("change", this.state);
  }
}
