// js/services/FavoritesApiService.js
import { Plant } from "../models/Plant.js";

export class FavoritesApiService {
  constructor(httpClient) {
    this.http = httpClient;
  }

  async getAll() {
    const json = await this.http.get("/favorites");
    return json.map(Plant.fromJSON);
  }

  async add(plantId) {
    await this.http.post("/favorites", { plantId });
  }

  async remove(plantId) {
    await this.http.delete(`/favorites/${plantId}`);
  }
}
