# Plant Helper — План (бэкенд)

> Хакатон. Стратегия: **сначала база + сервер до рабочего демо, потом усложнения.**
> Фронт (Vanilla JS/HTML) — соседи по команде. Бэк (этот план) — я + Claude.

## Стек

| Слой | Выбор | Причина |
|---|---|---|
| Runtime | Node.js v26 | общий язык с фронтом |
| Веб-фреймворк | Express | самый документированный, быстрый старт |
| БД | SQLite через встроенный `node:sqlite` | ноль настройки, без нативной сборки |
| Пакетменеджер | yarn 1.22 | npm не установлен, yarn есть |
| Авторизация | **JWT** (email + пароль) | синхронизация между устройствами, задел под обмен растениями |
| Хеш паролей | встроенный `crypto.scrypt` | ноль зависимостей, без нативной сборки на Node 26 |
| Токены | `jsonwebtoken` | чистый JS, стандарт |

---

## Архитектура

```
Браузер (фронт соседей)
      │  HTTP/JSON, заголовок Authorization: Bearer <JWT>
      ▼
Express API  ──►  node:sqlite  ──►  plant_helper.db (файл)
```

- Пользователь регистрируется/логинится → получает JWT, фронт хранит его в localStorage и шлёт в заголовке `Authorization`.
- Все пользовательские данные (список, избранное) привязаны к `user_id` из токена.
- Справочник растений — общий (seed при старте), доступен без авторизации.

### Структура проекта

```
plant_helper/
├── plan.md
├── package.json
├── src/
│   ├── server.js          # точка входа, поднимает Express
│   ├── db.js              # инициализация node:sqlite, схема, seed
│   ├── auth.js            # scrypt-хеш, verify, выпуск/проверка JWT
│   ├── middleware/
│   │   └── requireAuth.js # проверяет Bearer-токен, кладёт req.userId
│   └── routes/
│       ├── auth.js        # регистрация / логин / me
│       ├── plants.js      # справочник (публичный)
│       ├── collection.js  # личный список (защищён)
│       ├── favorites.js   # избранное (защищён)
│       └── reminders.js   # напоминания (защищён)
├── data/
│   ├── seed-plants.json   # стартовые карточки растений
│   └── plant_helper.db    # (в .gitignore)
└── .gitignore
```

---

## Модель данных (SQLite)

```sql
-- Пользователи
users (
  id INTEGER PK,
  email TEXT UNIQUE,
  password_hash TEXT,    -- scrypt: соль:хеш
  created_at TEXT
)

-- Справочник (общий для всех)
plants (
  id INTEGER PK,
  name TEXT,              -- название
  watering TEXT,          -- рекомендации по поливу
  light TEXT,             -- рекомендации по освещению
  repotting TEXT,         -- информация о пересадке
  toxicity TEXT,          -- ядовитость
  notes TEXT,             -- доп. особенности
  water_interval_days INT,-- для напоминаний: как часто поливать
  image_url TEXT
)

-- Личный список пользователя
collection (
  id INTEGER PK,
  user_id INTEGER FK -> users.id,
  plant_id INTEGER FK -> plants.id,  -- ссылка на карточку справочника
  added_at TEXT,                     -- дата добавления
  note TEXT,                         -- заметки пользователя
  water_interval_days INT,           -- переопределение интервала
  last_watered_at TEXT,
  last_repotted_at TEXT
)

-- Избранное
favorites (
  user_id INTEGER FK -> users.id,
  plant_id INTEGER FK -> plants.id,
  PRIMARY KEY (user_id, plant_id)
)
```

Напоминания в базовой версии — **вычисляемые** (не отдельная таблица):
`due = last_watered_at + water_interval_days <= сегодня`. Считаем на лету в эндпоинте.

---

## API-контракт (для фронта)

Заголовок во всех защищённых запросах: `Authorization: Bearer <JWT>`

### Авторизация (публичные)
- `POST /api/auth/register` — `{ email, password }` → `{ token, user }`
- `POST /api/auth/login` — `{ email, password }` → `{ token, user }`
- `GET  /api/auth/me` — текущий пользователь по токену (защищён)

### Справочник (публичные — токен не нужен)
- `GET  /api/plants` — список карточек (поддержка `?q=` поиск по названию)
- `GET  /api/plants/:id` — одна карточка

### Личный список
- `GET    /api/collection` — растения пользователя (+ данные карточки)
- `POST   /api/collection` — добавить `{ plantId, note?, waterIntervalDays? }`
- `PATCH  /api/collection/:id` — правка заметок/интервала/дат полива
- `DELETE /api/collection/:id` — удалить

### Избранное
- `GET    /api/favorites` — избранные карточки
- `POST   /api/favorites` — `{ plantId }`
- `DELETE /api/favorites/:plantId`

### Напоминания
- `GET /api/reminders` — что «пора» сделать: полить/пересадить по личному списку
- `POST /api/collection/:id/watered` — отметить, что полил (сброс таймера)

---

## Этапы работы

### Этап 0 — Каркас (разблокирует фронт)
- [ ] `yarn init`, поставить `express`, `cors`, `jsonwebtoken`
- [ ] `src/server.js` — Express + CORS + health-check `GET /api/health`
- [ ] `src/db.js` — создать схему (users, plants, collection, favorites) через `node:sqlite`
- [ ] `data/seed-plants.json` — 10-15 карточек, seed при старте
- [ ] Согласовать контракт с фронтом (эту секцию отдать соседям)

### Этап 1 — Авторизация + справочник
- [ ] `src/auth.js` — scrypt-хеш/verify, выпуск/проверка JWT
- [ ] `src/middleware/requireAuth.js`
- [ ] `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- [ ] `GET /api/plants`, `GET /api/plants/:id`, поиск `?q=`

### Этап 2 — Личный список + избранное (защищённые)
- [ ] CRUD `/api/collection` (по `req.userId`)
- [ ] CRUD `/api/favorites` (по `req.userId`)

### Этап 3 — Напоминания
- [ ] `GET /api/reminders` — вычисление «пора полить/пересадить»
- [ ] `POST /api/collection/:id/watered`

### Этап 4 — Стыковка и рабочее демо end-to-end (цель)
- [ ] Прогнать весь путь: открыть карточку → добавить в список → получить напоминание

### Этап 5 — Усложнения (ТОЛЬКО после рабочего демо, по одному)
- [ ] Обмен растениями + чат (уже есть users — база готова)
- [ ] Рекомендательная система
- [ ] Распознавание по фото

---

## Правило хакатона
**Рабочее демо к середине времени.** Усложнения добавляем поштучно только поверх стабильной базы. Лучше 4 фичи, которые работают, чем 8 наполовину.
