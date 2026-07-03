export class Plant {
  constructor({ id, name, watering, light, repotting, toxicity, notes,
                waterIntervalDays, repotIntervalDays, imageUrl }) {
    this.id = id;
    this.name = name;
    this.watering = watering;
    this.light = light;
    this.repotting = repotting;
    this.toxicity = toxicity;
    this.notes = notes;
    this.waterIntervalDays = waterIntervalDays;
    this.repotIntervalDays = repotIntervalDays;
    this.imageUrl = imageUrl;
  }

  static fromJSON(json) {
    return new Plant(json);
  }

  get isToxic() {
    if (!this.toxicity) return false;
    const t = this.toxicity.toLowerCase();
    return t.includes("ядовит") || t.includes("токсич");
  }
}
