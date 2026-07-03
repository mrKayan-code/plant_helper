// js/services/mocks/CollectionMockService.js
import { CollectionItem } from "../../models/CollectionItem.js";
import { mockCollectionSeed } from "./mockData.js";
import { todayISO } from "../../utils/dateUtils.js";

// ВАЖНО: публичный интерфейс идентичен CollectionApiService — те же имена
// методов, те же параметры, те же типы возврата. ViewModel вызывает эти
// методы одинаково независимо от того, какая реализация подставлена.
//
// Зависит от plantsService (абстракция, не конкретный класс) — использует
// его, чтобы при добавлении растения в коллекцию подставить настоящие
// данные из уже работающего /api/plants, а не заглушку "Растение".
export class CollectionMockService {
  constructor(plantsService) {
    this.plantsService = plantsService;
    this._data = structuredClone(mockCollectionSeed);
  }

  async getAll() {
    return this._data.map(CollectionItem.fromJSON);
  }

  async add({ plantId, note, waterIntervalDays, repotIntervalDays }) {
    let plantJson;
    try {
      plantJson = { ...(await this.plantsService.getById(plantId)) };
    } catch {
      plantJson = { id: plantId, name: "Растение" };
    }

    const raw = {
      id: Date.now(),
      addedAt: todayISO(),
      note: note || "",
      waterIntervalDays: waterIntervalDays ?? null,
      repotIntervalDays: repotIntervalDays ?? null,
      lastWateredAt: null,
      lastRepottedAt: null,
      plant: plantJson,
    };
    this._data.push(raw);
    return CollectionItem.fromJSON(raw);
  }

  async update(id, patch) {
    const item = this._data.find((c) => c.id === id);
    if (item) Object.assign(item, patch);
    return item ? CollectionItem.fromJSON(item) : null;
  }

  async remove(id) {
    this._data = this._data.filter((c) => c.id !== id);
  }

  async markWatered(id) {
    const item = this._data.find((c) => c.id === id);
    if (item) item.lastWateredAt = todayISO();
    return item ? CollectionItem.fromJSON(item) : null;
  }

  async markRepotted(id) {
    const item = this._data.find((c) => c.id === id);
    if (item) item.lastRepottedAt = todayISO();
    return item ? CollectionItem.fromJSON(item) : null;
  }
}
