import { DatabaseSync } from 'node:sqlite';
import { join } from 'node:path';
import { readFileSync } from 'node:fs';

// Файл БД: по умолчанию back/data/plant_helper.db, можно переопределить DB_PATH
// (удобно для изолированных тестов, чтобы не трогать рабочую базу).
const DB_PATH = process.env.DB_PATH || join(import.meta.dirname, '..', 'data', 'plant_helper.db');

export const db = new DatabaseSync(DB_PATH);

// Включаем контроль внешних ключей (по умолчанию в SQLite выключен)
db.exec('PRAGMA foreign_keys = ON;');

// --- Схема (см. общий контракт в ../plan.md) ---
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,           -- scrypt: соль:хеш
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS plants (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    slug                TEXT UNIQUE,        -- стабильный ключ (напр. "rose") — по нему upsert
    name                TEXT NOT NULL,      -- название
    watering            TEXT,               -- рекомендации по поливу
    light               TEXT,               -- рекомендации по освещению
    repotting           TEXT,               -- информация о пересадке
    toxicity            TEXT,               -- ядовитость
    notes               TEXT,               -- доп. особенности
    water_interval_days INTEGER,            -- как часто поливать, дни (для напоминаний)
    repot_interval_days INTEGER,            -- как часто пересаживать, дни (для напоминаний)
    image_url           TEXT
  );

  CREATE TABLE IF NOT EXISTS collection (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id             INTEGER NOT NULL,
    plant_id            INTEGER NOT NULL,   -- ссылка на карточку справочника
    added_at            TEXT NOT NULL DEFAULT (date('now')),  -- YYYY-MM-DD (без времени)
    note                TEXT,               -- заметки пользователя
    water_interval_days INTEGER,            -- переопределение интервала полива (иначе из plants)
    repot_interval_days INTEGER,            -- переопределение интервала пересадки (иначе из plants)
    last_watered_at     TEXT,
    last_repotted_at    TEXT,
    FOREIGN KEY (user_id)  REFERENCES users(id)  ON DELETE CASCADE,
    FOREIGN KEY (plant_id) REFERENCES plants(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS favorites (
    user_id  INTEGER NOT NULL,
    plant_id INTEGER NOT NULL,
    PRIMARY KEY (user_id, plant_id),
    FOREIGN KEY (user_id)  REFERENCES users(id)  ON DELETE CASCADE,
    FOREIGN KEY (plant_id) REFERENCES plants(id) ON DELETE CASCADE
  );

  -- Подписки на web-push (одна на устройство/браузер)
  CREATE TABLE IF NOT EXISTS push_subscriptions (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id      INTEGER NOT NULL,
    endpoint     TEXT NOT NULL UNIQUE,   -- уникальный URL пуш-сервиса
    subscription TEXT NOT NULL,          -- полный объект подписки (JSON)
    created_at   TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  -- Журнал отправленных пушей (чтобы не слать одно и то же повторно)
  CREATE TABLE IF NOT EXISTS push_log (
    user_id      INTEGER NOT NULL,
    reminder_key TEXT NOT NULL,          -- collectionId:action:dueDate
    sent_at      TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (user_id, reminder_key),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  -- Индексы под частые выборки "данные текущего пользователя"
  CREATE INDEX IF NOT EXISTS idx_collection_user ON collection(user_id);
  CREATE INDEX IF NOT EXISTS idx_favorites_user  ON favorites(user_id);
  CREATE INDEX IF NOT EXISTS idx_push_subs_user  ON push_subscriptions(user_id);
`);

// --- Seed/sync справочника: upsert по slug при каждом старте ---
// Идентичность растения — slug (не автоинкремент id), поэтому пересев НЕ ломает
// ссылки collection.plant_id (id существующей строки сохраняется при обновлении).
// Так 3-й тим может регенерировать plants.json сколько угодно — данные обновятся
// без сноса БД и без потери коллекций пользователей.
const ASSET_BASE_URL = process.env.ASSET_BASE_URL || 'http://localhost:3000';

// Относительный путь картинки → абсолютный URL на бэк (который раздаёт /assets).
function toImageUrl(raw) {
  if (!raw) return null;
  if (/^https?:\/\//.test(raw)) return raw;              // уже абсолютный — не трогаем
  return `${ASSET_BASE_URL}/${raw.replace(/^\//, '')}`;
}

{
  const seedPath = join(import.meta.dirname, '..', 'data', 'plants.json');
  const plants = JSON.parse(readFileSync(seedPath, 'utf8'));

  const upsert = db.prepare(`
    INSERT INTO plants
      (slug, name, watering, light, repotting, toxicity, notes,
       water_interval_days, repot_interval_days, image_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(slug) DO UPDATE SET
      name = excluded.name,
      watering = excluded.watering,
      light = excluded.light,
      repotting = excluded.repotting,
      toxicity = excluded.toxicity,
      notes = excluded.notes,
      water_interval_days = excluded.water_interval_days,
      repot_interval_days = excluded.repot_interval_days,
      image_url = excluded.image_url
  `);

  db.exec('BEGIN');
  for (const p of plants) {
    upsert.run(
      p.slug, p.name, p.watering ?? null, p.light ?? null, p.repotting ?? null,
      p.toxicity ?? null, p.notes ?? null,
      p.waterIntervalDays ?? null, p.repotIntervalDays ?? null, toImageUrl(p.imageUrl),
    );
  }
  db.exec('COMMIT');

  console.log(`Справочник синхронизирован: ${plants.length} растений (upsert по slug)`);
}

console.log('БД инициализирована:', DB_PATH);
