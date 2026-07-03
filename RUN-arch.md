# Как запустить проект — Arch Linux (для бэкендера)

Нужно **два процесса**: бэкенд (API) и статический сервер для фронта.
Держи их в **двух отдельных терминалах** — каждый пишет свои логи, удобно следить.

Стек на этой машине: `node` (без `npm`), `yarn`, `python3`. Shell — fish.

---

## Разовая подготовка (только первый раз)

```fish
cd ~/Projects/plant_helper/back
cp .env.example .env      # конфиг: JWT_SECRET уже сгенерирован, PORT=3000
yarn install              # поставить express, cors, jsonwebtoken
```

> `.env` в `.gitignore` — его нет в репозитории, поэтому создаём из шаблона.
> Если `.env` уже есть — этот шаг пропускаем.

---

## Терминал 1 — Бэкенд (API)

```fish
cd ~/Projects/plant_helper/back
yarn start
```
Увидишь:
```
БД инициализирована: /home/.../back/data/plant_helper.db
Plant Helper API запущен: http://localhost:3000
```
`yarn start` идёт с `--watch` — сервер сам перезапускается при изменении кода в `src/`.
Оставь это окно открытым. Остановить — `Ctrl+C`.

**Проверка:** открой http://localhost:3000/api/health → `{"ok":true}`

---

## Терминал 2 — Клиент (фронт)

Фронт — статические файлы. Отдаём их простым http-сервером (лучше, чем `file://`).

```fish
cd ~/Projects/plant_helper/front
python3 -m http.server 5500
```
Оставь окно открытым. Остановить — `Ctrl+C`.

---

## Открыть приложение

Браузер → **http://localhost:5500**

Порядок важен: **сначала** запусти бэкенд (Терминал 1), **потом** фронт (Терминал 2).
Если фронт открыть без бэка — справочник `/plants` не загрузится (моки для остального будут работать).

---

## Быстрая проверка API (без фронта)

```fish
curl http://localhost:3000/api/health          # {"ok":true}
curl http://localhost:3000/api/plants           # 12 растений
curl http://localhost:3000/api/plants/1          # Монстера
```

---

## Остановить всё

В каждом терминале — `Ctrl+C`. Либо по портам:
```fish
for p in 3000 5500
    set pid (ss -ltnp | grep ":$p" | grep -oP 'pid=\K[0-9]+')
    if test -n "$pid"; kill $pid; end
end
```

---

## Если что-то не так

| Симптом | Причина | Решение |
|---|---|---|
| `address already in use :3000` | старый сервер не закрылся | `ss -ltnp \| grep 3000` → `kill <pid>` |
| ответы «Cannot GET …» (HTML) | висит старый инстанс на порту | убей процесс на 3000, перезапусти |
| `/api/plants` пусто | БД не засеялась | удали `back/data/plant_helper.db`, перезапусти бэк |
| фронт не грузит данные | бэк не запущен | проверь Терминал 1 и `/api/health` |
