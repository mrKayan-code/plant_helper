import { Plant } from "./Plant.js";

export class CollectionItem {
  constructor({ id, addedAt, note, waterIntervalDays, repotIntervalDays,
                lastWateredAt, lastRepottedAt, plant }) {
    this.id = id;
    this.addedAt = addedAt;
    this.note = note;
    this.waterIntervalDays = waterIntervalDays;
    this.repotIntervalDays = repotIntervalDays;
    this.lastWateredAt = lastWateredAt;
    this.lastRepottedAt = lastRepottedAt;
    this.plant = plant instanceof Plant ? plant : Plant.fromJSON(plant);
  }

  static fromJSON(json) {
    return new CollectionItem(json);
  }
}
