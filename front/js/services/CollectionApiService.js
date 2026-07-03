import { CollectionItem } from "../models/CollectionItem.js";

export class CollectionApiService {
  constructor(httpClient) {
    this.http = httpClient;
  }

  async getAll() {
    const json = await this.http.get("/collection");
    return json.map(CollectionItem.fromJSON);
  }

  async add({ plantId, note, waterIntervalDays, repotIntervalDays }) {
    const json = await this.http.post("/collection", { plantId, note, waterIntervalDays, repotIntervalDays });
    return CollectionItem.fromJSON(json);
  }

  async update(id, patch) {
    const json = await this.http.patch(`/collection/${id}`, patch);
    return CollectionItem.fromJSON(json);
  }

  async remove(id) {
    await this.http.delete(`/collection/${id}`);
  }

  async markWatered(id) {
    const json = await this.http.post(`/collection/${id}/watered`);
    return CollectionItem.fromJSON(json);
  }

  async markRepotted(id) {
    const json = await this.http.post(`/collection/${id}/repotted`);
    return CollectionItem.fromJSON(json);
  }
}
