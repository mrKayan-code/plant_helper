// Преобразование строк из БД (snake_case) в формат API (camelCase).
// Держим маппинг в одном месте, чтобы контракт не разъезжался.

/** Карточка справочника: строка таблицы plants → объект API. */
export function serializePlant(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    watering: row.watering,
    light: row.light,
    repotting: row.repotting,
    toxicity: row.toxicity,
    notes: row.notes,
    waterIntervalDays: row.water_interval_days,
    repotIntervalDays: row.repot_interval_days,
    imageUrl: row.image_url,
  };
}
