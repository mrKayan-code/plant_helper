import { Plant } from "../models/Plant.js";

export class PlantsApiService {
  constructor(httpClient) {
    this.http = httpClient;
  }

  async getAll(query = "") {
    const path = query ? `/plants?q=${encodeURIComponent(query)}` : "/plants";
    const json = await this.http.get(path);
    return json.map(Plant.fromJSON);
  }

  async getById(id) {
    const json = await this.http.get(`/plants/${id}`);
    return Plant.fromJSON(json);
  }
}
