# Plant Helper — Backend

Node.js + Express + `node:sqlite`. API-сервер для фронта.

## Требования

- **Node.js 22+** (нужен встроенный модуль `node:sqlite` и флаг `--env-file`). Проверить: `node --version`
- Пакетменеджер: **yarn** или **npm** (что есть — оба работают)

## Первый запуск (один раз)

**Linux / macOS:**

```bash
cd back
cp .env.example .env      # создать конфиг из шаблона
yarn install              # или: npm install
```

**Windows (PowerShell или CMD):**

```powershell
cd back
copy .env.example .env    :: создать конфиг из шаблона
npm install               :: или: yarn install
```

> В `.env` уже есть рабочие значения (`JWT_SECRET`, `PORT=3000`) — для локальной разработки менять не нужно.
> Файл `.env` в `.gitignore`, поэтому его нет в репозитории — создаётся из `.env.example`.

## Запуск сервера

Одинаково на всех ОС:

```bash
yarn start        # или: npm start
```

Сервер поднимется на **http://localhost:3000**. Флаг `--watch` — авто-перезапуск при изменении кода.

## Проверка, что работает

В браузере открыть http://localhost:3000/api/health — должно вернуть `{"ok":true}`.

Или в терминале:

```bash
curl http://localhost:3000/api/health
```

```powershell
# Windows PowerShell:
curl http://localhost:3000/api/health
# или, если curl нет:
Invoke-RestMethod http://localhost:3000/api/health
```

если увидишь странные ответы — проверь

```bash
ss -ltnp | grep 3000
```

, нет ли лишнего процесса.

## Для фронтендеров 🌱

Вам нужно, чтобы бэк работал у себя, а фронт открывать отдельно.

1. Запустить бэк по инструкции выше (`npm start`) — оставить это окно открытым.
2. Базовый URL API в вашем коде: `http://localhost:3000/api`
3. Проверить связь: открыть http://localhost:3000/api/health → `{"ok":true}`.

Если порт 3000 занят — поменять `PORT` в `back/.env` и использовать новый в URL.

## Что где

```
back/
├── src/
│   ├── server.js          # точка входа, Express
│   ├── db.js              # схема + seed (node:sqlite)
│   ├── auth.js            # scrypt-хеш, JWT
│   ├── middleware/
│   │   └── requireAuth.js # проверка Bearer-токена → req.userId
│   └── routes/
│       ├── auth.js        # register / login / me
│       ├── plants.js      # справочник (публичный)
│       ├── collection.js  # личный список (защищён)
│       ├── favorites.js   # избранное (защищён)
│       └── reminders.js   # напоминания (защищён)
└── data/
    ├── plants.json   # стартовые карточки
    └── plant_helper.db    # файл БД (в .gitignore)
```

Контракт API и модель данных — в корневом `../plan.md`. **Это общий договор с фронтом, менять только по согласованию.**
