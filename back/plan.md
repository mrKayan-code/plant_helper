# Backend — локальный план (пошагово)

> Наша кухня. Общий контракт (API + модель данных) — в `../plan.md`, он священен.
> Здесь — конкретные шаги реализации бэка. Отмечаем `[x]` по мере готовности.

Стек: Node.js v26 · Express · `node:sqlite` (встроенный) · JWT · `crypto.scrypt` · yarn

---

## Архитектура (слои)

Слоёная, каждый слой знает только про соседний снизу:

```
routes/*.js          — HTTP-слой: разбор запроса, валидация, коды ответов. SQL НЕ содержит.
   │
repositories/*.js    — доступ к данным: весь SQL живёт здесь (plantsRepo, usersRepo, ...)
   │
db.js                — соединение с SQLite + схема + seed (singleton `db`)

вспомогательные (сквозные):
  auth.js       — хеш пароля (scrypt) + JWT. Чистые функции.
  serialize.js  — строка БД (snake_case) → объект API (camelCase). Прячет формат.
  middleware/   — requireAuth и пр.
```

**Зачем так:** роут не знает про SQL, репозиторий не знает про HTTP — это чинит SRP и DIP.
Поменять запрос — правим только репозиторий. Поменять формат ответа — только `serialize.js`.
Правило: **новый роут не пишет SQL напрямую — только через `*.repo.js`.**

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

## Шаг 3 — Seed справочника ✅

- [x] `data/plants.json` — 12 растений (монстера, фикус, сансевиерия, спатифиллум, замиокулькас, хлорофитум, алоэ, орхидея, кактус, драцена, герань, фиалка)
- [x] В `db.js`: если `plants` пуста — залить из seed (в транзакции), маппинг camelCase→snake_case
- [x] Идемпотентно: повторный старт не дублирует

**Проверка:** ✅ `SELECT COUNT(*) FROM plants` = 12, повторный старт = 12.

---

## Шаг 4 — Справочник (`src/routes/plants.js`) — публичный ✅

- [x] `GET /api/plants` (+ `?q=` поиск `WHERE name LIKE`, сортировка по name)
- [x] `GET /api/plants/:id` (404 `{error}` если нет)
- [x] хелпер `serialize.js` → `serializePlant` (snake_case → camelCase, переиспользуем)
- [x] роутер смонтирован в server.js БЕЗ requireAuth (публичный)

**Проверка:** ✅ список=12, `?q=Фикус` находит, /1 = Монстера camelCase, /999 = 404 `{error}`.

---

## Шаг 5 — Авторизация (`src/auth.js` + `src/routes/auth.js`) ✅

- [x] `auth.js`: `hashPassword` / `verifyPassword` через `scryptSync` (формат `соль:хеш`, timing-safe)
- [x] `auth.js`: `signToken(userId)` / `verifyToken(token)` через `jsonwebtoken` (TTL 7д)
- [x] `POST /api/auth/register` — валидация email/пароля, 409 если занят, insert, `{token, user}`
- [x] `POST /api/auth/login` — verify, 401 (общий текст, не палим наличие email)
- [x] `serializeUser` — наружу только `{id, email}`, без хеша

**Проверка:** ✅ register→201+token; повтор→409; login→200; неверный→401; валидация→400.
В БД лежит хеш (не пароль), JWT декодируется в `{userId}`.

---

## Шаг 6 — Middleware защиты (`src/middleware/requireAuth.js`) ✅

- [x] Достать `Authorization: Bearer <token>`, verify, положить `req.userId`
- [x] Нет / без Bearer / битый / просроченный токен → 401 `{error}`
- [x] `GET /api/auth/me` — пользователь по `req.userId` (401 если юзер удалён)

**Проверка:** ✅ без токена/битый/без Bearer → 401; валидный → 200 `{id, email}`.

---

## Шаг 7 — Личный список (`src/routes/collection.js`) — защищён ✅

- [x] `GET /api/collection` — JOIN с plants, только `WHERE user_id = req.userId`
- [x] `POST /api/collection` — `{ plantId, note?, waterIntervalDays?, repotIntervalDays? }`; 400 без plantId, 404 если растения нет
- [x] `PATCH /api/collection/:id` — note / интервалы / даты (whitelist полей в repo)
- [x] `DELETE /api/collection/:id` — только своё (проверка user_id)
- [x] `POST /api/collection/:id/watered` и `/repotted` — дата = `date('now')`
- [x] `collectionRepo` + `serializeCollectionItem` (вложенный `plant`)

**Проверка:** ✅ 12 сценариев (CRUD + /watered + /repotted + изоляция юзеров + владение + 401/400/404).

---

## Шаг 8 — Избранное (`src/routes/favorites.js`) — защищён

- [ ] `GET /api/favorites` — JOIN с plants
- [ ] `POST /api/favorites` — `{ plantId }` (idempotent, INSERT OR IGNORE)
- [ ] `DELETE /api/favorites/:plantId`

**Проверка:** добавил/удалил избранное, GET отражает.

---

## Шаг 9 — Напоминания (`src/routes/reminders.js`) — защищён

- [ ] `GET /api/reminders` — по коллекции юзера вычислить `due` (полив + пересадка):
      `effective_interval` = из collection, иначе из plants; если интервал/дата пусты — пропускаем
- [x] ~~`/watered` и `/repotted`~~ — уже сделаны в Шаге 7

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
- **Даты ухода — только `YYYY-MM-DD`** (без времени). В БД `added_at` дефолт `date('now')`.
  При `/watered` и `/repotted` ставить `date('now')` (или `new Date().toISOString().slice(0,10)`).
  `users.created_at` — внутреннее, в API не отдаём.
- **`/repotted`** — гарантированный эндпоинт, симметричен `/watered` (кнопка «пересадил» на фронте).
- **Дубликаты в collection разрешены** (два фикуса), в favorites — нет (PK). Не добавлять UNIQUE в collection.
