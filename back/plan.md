# Backend — локальный план (пошагово)

> Наша кухня. Общий контракт (API + модель данных) — в `../plan.md`, он священен.
> Здесь — конкретные шаги реализации бэка. Отмечаем `[x]` по мере готовности.

Стек: Node.js v26 · Express · `node:sqlite` (встроенный) · JWT · `crypto.scrypt` · yarn

---

## Шаг 0 — Инициализация проекта ✅
- [x] `package.json`: `"type": "module"`, start = `node --watch --env-file=.env src/server.js`
- [x] `yarn add express cors jsonwebtoken` (Express 5)
- [x] `.env` (в gitignore) с рандомным `JWT_SECRET` + `PORT=3000`; `.env.example` для команды
- [x] Структура папок

**Проверка:** ✅ сервер запускается.

---

## Шаг 1 — Сервер-каркас (`src/server.js`) ✅
- [x] Express + `cors()` + `express.json()`
- [x] `GET /api/health` → `{ ok: true }`
- [ ] Подключить роутеры (по мере готовности — заготовка в коде)
- [x] Слушать `PORT` из env

**Проверка:** ✅ `curl localhost:3000/api/health` → `{"ok":true}` (200)
👉 фронт разблокирован — можно стучаться на сервер.

---

## Шаг 2 — БД и схема (`src/db.js`) ✅
- [x] `DatabaseSync` из `node:sqlite`, путь через `import.meta.dirname`
- [x] `PRAGMA foreign_keys = ON`
- [x] `CREATE TABLE IF NOT EXISTS`: `users`, `plants`, `collection`, `favorites` + FK + индексы
- [x] Экспорт `db`, инициализация при старте (import в server.js)

**Проверка:** ✅ таблицы созданы, `repot_interval_days` есть в plants и collection.

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
- **Именование:** в БД колонки `snake_case`, в JSON API — `camelCase` (по контракту).
  Значит в роутерах нужен маппинг при отдаче: `water_interval_days` → `waterIntervalDays`.
  Сделаем маленький хелпер-сериализатор на растение/элемент коллекции, чтобы не дублировать.
- **CORS:** `cors()` без опций = разрешены все origin (`*`). Для хакатон-демо ок; на прод сузить.
- **Публичность справочника:** `/api/plants*` монтируем БЕЗ `requireAuth` — работает даже если auth сломан.
- **Напоминания:** пересадка считается по `repot_interval_days` (добавлено в plants + override в collection).
