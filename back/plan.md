# Backend — локальный план (пошагово)

> Наша кухня. Общий контракт (API + модель данных) — в `../plan.md`, он священен.
> Здесь — конкретные шаги реализации бэка. Отмечаем `[x]` по мере готовности.

Стек: Node.js v26 · Express · `node:sqlite` (встроенный) · JWT · `crypto.scrypt` · yarn

---

## Шаг 0 — Инициализация проекта
- [ ] `cd back && yarn init -y`
- [ ] В `package.json`: `"type": "module"`, скрипт `"start": "node --watch src/server.js"`
- [ ] `yarn add express cors jsonwebtoken`
- [ ] Создать `.env` (в gitignore): `JWT_SECRET=...`, `PORT=3000`
- [ ] Пустые файлы по структуре из README

**Проверка:** `yarn start` не падает.

---

## Шаг 1 — Сервер-каркас (`src/server.js`)
- [ ] Express + `cors()` + `express.json()`
- [ ] `GET /api/health` → `{ ok: true }`
- [ ] Подключить роутеры (пока заглушки)
- [ ] Слушать `PORT`

**Проверка:** `curl localhost:3000/api/health` → `{"ok":true}`
👉 после этого шага фронт разблокирован — можно стучаться на сервер.

---

## Шаг 2 — БД и схема (`src/db.js`)
- [ ] `import { DatabaseSync } from 'node:sqlite'`
- [ ] Открыть `data/plant_helper.db`
- [ ] `CREATE TABLE IF NOT EXISTS` для: `users`, `plants`, `collection`, `favorites` (по модели из `../plan.md`)
- [ ] Экспортировать `db` для использования в роутерах

**Проверка:** файл `data/plant_helper.db` создаётся, таблицы есть (`sqlite3 data/plant_helper.db ".tables"`).

---

## Шаг 3 — Seed справочника
- [ ] `data/seed-plants.json` — 10-15 растений (name, watering, light, repotting, toxicity, notes, water_interval_days, image_url)
- [ ] В `db.js`: если таблица `plants` пуста — залить из seed
- [ ] Реальные данные (монстера, фикус, суккулент, спатифиллум, сансевиерия…)

**Проверка:** `SELECT COUNT(*) FROM plants` > 0.

---

## Шаг 4 — Справочник (`src/routes/plants.js`) — публичный
- [ ] `GET /api/plants` (+ `?q=` поиск `WHERE name LIKE`)
- [ ] `GET /api/plants/:id` (404 если нет)

**Проверка:** `curl localhost:3000/api/plants` возвращает массив карточек.

---

## Шаг 5 — Авторизация (`src/auth.js` + `src/routes/auth.js`)
- [ ] `auth.js`: `hashPassword` / `verifyPassword` через `crypto.scrypt` (формат `соль:хеш`)
- [ ] `auth.js`: `signToken(userId)` / `verifyToken(token)` через `jsonwebtoken`
- [ ] `POST /api/auth/register` — проверка занятости email, хеш, insert, вернуть `{token, user}`
- [ ] `POST /api/auth/login` — найти по email, verify, вернуть `{token, user}`
- [ ] Ошибки: 409 (email занят), 401 (неверные данные)

**Проверка:** register → приходит token; login с тем же паролем → token; с неверным → 401.

---

## Шаг 6 — Middleware защиты (`src/middleware/requireAuth.js`)
- [ ] Достать `Authorization: Bearer <token>`, verify, положить `req.userId`
- [ ] Нет/битый токен → 401
- [ ] `GET /api/auth/me` — вернуть пользователя по `req.userId`

**Проверка:** `/api/auth/me` без токена → 401, с токеном → данные юзера.

---

## Шаг 7 — Личный список (`src/routes/collection.js`) — защищён
- [ ] `GET /api/collection` — JOIN с plants, только `WHERE user_id = req.userId`
- [ ] `POST /api/collection` — `{ plantId, note?, waterIntervalDays? }`, added_at = сейчас
- [ ] `PATCH /api/collection/:id` — note / interval / last_watered_at / last_repotted_at
- [ ] `DELETE /api/collection/:id` — только своё (проверка user_id)

**Проверка:** добавил растение → GET показывает его с данными карточки.

---

## Шаг 8 — Избранное (`src/routes/favorites.js`) — защищён
- [ ] `GET /api/favorites` — JOIN с plants
- [ ] `POST /api/favorites` — `{ plantId }` (idempotent, INSERT OR IGNORE)
- [ ] `DELETE /api/favorites/:plantId`

**Проверка:** добавил/удалил избранное, GET отражает.

---

## Шаг 9 — Напоминания (`src/routes/reminders.js`) — защищён
- [ ] `GET /api/reminders` — по коллекции юзера вычислить `due`:
      полив: `last_watered_at + water_interval_days <= сегодня`
      пересадка: (простое правило, напр. раз в год) — по желанию
- [ ] `POST /api/collection/:id/watered` — выставить `last_watered_at = сегодня`

**Проверка:** растение с прошедшей датой полива попадает в `/api/reminders`; после `/watered` — исчезает.

---

## Шаг 10 — Стыковка с фронтом 🎯 (цель — рабочее демо)
- [ ] Прогнать весь путь: register → список растений → добавить в коллекцию → напоминание → отметить полив
- [ ] Пофиксить CORS/ошибки, которые всплывут при реальных запросах фронта

---

## Потом (усложнения, по одному, только после демо)
- [ ] Обмен растениями + чат
- [ ] Рекомендательная система
- [ ] Распознавание по фото

---

## Заметки / решения по ходу
<!-- сюда пишем нестандартные решения, костыли, договорённости -->
- node:sqlite синхронный (DatabaseSync) — async/await для БД не нужен.
