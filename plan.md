# Plant Helper — Общий план команды

> Хакатон. Этот файл — **договорённость между фронтом и бэком.**
> Главное здесь — **контракт API и модель данных**: это точка стыковки.
> Дальше каждая команда работает в своей папке независимо.
>
> - **Фронт** (Vanilla JS/HTML) → папка `front/`, команда организует внутри как хочет.
> - **Бэк** (Node.js + Express) → папка `back/`, ведём я + Claude.
>
> ⚠️ Разделы «Контракт API» и «Модель данных» менять **только по взаимному согласованию** — от них зависят обе стороны.

## Разделение репозитория

```
plant_helper/
├── plan.md          ← этот файл: общий контракт (читают обе команды)
├── task.md          ← исходное ТЗ хакатона
├── front/           ← фронтенд (Vanilla JS/HTML) — команда фронта
│   └── README.md
└── back/            ← бэкенд (Node.js + Express) — наша команда
    ├── README.md
    ├── package.json
    ├── src/
    │   ├── server.js          # точка входа, Express
    │   ├── db.js              # схема + seed (node:sqlite)
    │   ├── auth.js            # scrypt-хеш, JWT
    │   ├── middleware/
    │   │   └── requireAuth.js # Bearer-токен → req.userId
    │   └── routes/
    │       ├── auth.js        # register / login / me
    │       ├── plants.js      # справочник (публичный)
    │       ├── collection.js  # личный список (защищён)
    │       ├── favorites.js   # избранное (защищён)
    │       └── reminders.js   # напоминания (защищён)
    └── data/
        ├── seed-plants.json   # стартовые карточки
        └── plant_helper.db    # файл БД (в .gitignore)
```

Фронт стучится на `http://localhost:3000/api`. CORS на бэке открыт для локальной разработки.

---

# ═══ ОБЩАЯ ЧАСТЬ (для обеих команд) ═══

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

# ═══ ПЛАНЫ КОМАНД ═══

- **Бэк:** пошаговый план реализации → `back/plan.md`
- **Фронт:** команда фронта ведёт свой план в `front/` по своему усмотрению

---

## Правило хакатона
**Рабочее демо к середине времени.** Усложнения добавляем поштучно только поверх стабильной базы. Лучше 4 фичи, которые работают, чем 8 наполовину.
