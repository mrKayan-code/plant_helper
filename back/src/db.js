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

  -- Индексы под частые выборки "данные текущего пользователя"
  CREATE INDEX IF NOT EXISTS idx_collection_user ON collection(user_id);
  CREATE INDEX IF NOT EXISTS idx_favorites_user  ON favorites(user_id);
`);

// --- Seed справочника: заливаем, только если таблица plants пустая ---
const { count } = db.prepare('SELECT COUNT(*) AS count FROM plants').get();
if (count === 0) {
  const seedPath = join(import.meta.dirname, '..', 'data', 'plants.json');
  const plants = JSON.parse(readFileSync(seedPath, 'utf8'));

  const insert = db.prepare(`
    INSERT INTO plants
      (name, watering, light, repotting, toxicity, notes,
       water_interval_days, repot_interval_days, image_url)
    VALUES
      (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Транзакция: все вставки разом, быстрее и атомарно
  db.exec('BEGIN');
  for (const p of plants) {
    insert.run(
      p.name, p.watering ?? null, p.light ?? null, p.repotting ?? null,
      p.toxicity ?? null, p.notes ?? null,
      p.waterIntervalDays ?? null, p.repotIntervalDays ?? null, p.imageUrl ?? null,
    );
  }
  db.exec('COMMIT');

  console.log(`Справочник заполнен: ${plants.length} растений`);
}

console.log('БД инициализирована:', DB_PATH);
