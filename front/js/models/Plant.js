// js/models/Plant.js
// Модель растения. Только данные + их разбор из ответа API.
// Никакой сетевой логики и никакого DOM здесь быть не должно.

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

  // Небольшое производное правило показа опасности — по тексту, т.к.
  // отдельного булева поля "ядовито" в БД нет (см. ../../plan.md).
  get isToxic() {
    if (!this.toxicity) return false;
    const t = this.toxicity.toLowerCase();
    return t.includes("ядовит") || t.includes("токсич");
  }
}
