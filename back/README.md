# Plant Helper — Backend

Node.js + Express + `node:sqlite`. API-сервер для фронта.

## Запуск
```bash
cd back
yarn install
yarn start        # поднимает сервер на http://localhost:3000
```

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
    ├── seed-plants.json   # стартовые карточки
    └── plant_helper.db    # файл БД (в .gitignore)
```

Контракт API и модель данных — в корневом `../plan.md`. **Это общий договор с фронтом, менять только по согласованию.**
