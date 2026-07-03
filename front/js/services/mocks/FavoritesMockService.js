// js/services/mocks/FavoritesMockService.js

export class FavoritesMockService {
  constructor(plantsService) {
    this.plantsService = plantsService;
    this._favoriteIds = new Set([1]);
  }

  async getAll() {
    const all = await this.plantsService.getAll();
    return all.filter((p) => this._favoriteIds.has(p.id));
  }

  async add(plantId) {
    this._favoriteIds.add(plantId);
  }

  async remove(plantId) {
    this._favoriteIds.delete(plantId);
  }
}
