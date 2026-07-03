// Преобразование строк из БД (snake_case) в формат API (camelCase).
// Держим маппинг в одном месте, чтобы контракт не разъезжался.

/** Пользователь: наружу отдаём только безопасные поля (без password_hash). */
export function serializeUser(row) {
  if (!row) return null;
  return { id: row.id, email: row.email };
}

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

/**
 * Элемент личного списка: JOIN-строка collection + plants → объект API.
 * Пользовательские поля — снаружи, карточка справочника — вложена в `plant`.
 * Колонки растения приходят с префиксом p_ (см. collection.repo.js).
 */
export function serializeCollectionItem(row) {
  if (!row) return null;
  return {
    id: row.id,
    addedAt: row.added_at,
    note: row.note,
    waterIntervalDays: row.water_interval_days,
    repotIntervalDays: row.repot_interval_days,
    lastWateredAt: row.last_watered_at,
    lastRepottedAt: row.last_repotted_at,
    plant: {
      id: row.p_id,
      name: row.p_name,
      watering: row.p_watering,
      light: row.p_light,
      repotting: row.p_repotting,
      toxicity: row.p_toxicity,
      notes: row.p_notes,
      waterIntervalDays: row.p_water_interval_days,
      repotIntervalDays: row.p_repot_interval_days,
      imageUrl: row.p_image_url,
    },
  };
}
