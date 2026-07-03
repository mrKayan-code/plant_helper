# Что уже готово на бэке (для фронта) 🌱

Обновлено по мере готовности. Базовый URL: **`http://localhost:3000/api`**

## ✅ Готово сейчас — можно верстать справочник

| Метод | Эндпоинт | Что делает | Токен |
|---|---|---|---|
| GET | `/api/health` | проверка, что сервер жив → `{"ok":true}` | не нужен |
| GET | `/api/plants` | весь справочник растений (12 карточек) | не нужен |
| GET | `/api/plants?q=фикус` | поиск по названию | не нужен |
| GET | `/api/plants/:id` | одна карточка по id (напр. `/api/plants/1`) | не нужен |

## ⏳ Пока НЕ готово (не тратьте время, скоро будет)
- Регистрация / логин (`/api/auth/*`)
- Личный список (`/api/collection`)
- Избранное (`/api/favorites`)
- Напоминания (`/api/reminders`)

Форматы этих ответов уже зафиксированы в контракте `../plan.md` — можно готовить вёрстку заранее, но запросы ещё не отвечают.

---

## Как проверить за 1 минуту

1. Убедитесь, что бэк запущен (см. `../back/README.md`). Он должен крутиться в отдельном окне.
2. Откройте в браузере: **http://localhost:3000/api/plants** — увидите JSON-массив из 12 растений.
3. Одна карточка: **http://localhost:3000/api/plants/1**

Если вместо JSON — ошибка/пусто: бэк не запущен или занят порт (спросите бэкенд).

---

## Пример: получить и вывести справочник (Vanilla JS)

```js
const API = 'http://localhost:3000/api';

async function loadPlants() {
  const res = await fetch(`${API}/plants`);
  if (!res.ok) throw new Error('Не удалось загрузить справочник');
  const plants = await res.json();

  const root = document.getElementById('plants');
  root.innerHTML = plants.map(p => `
    <div class="card">
      <img src="${p.imageUrl}" alt="${p.name}" width="200">
      <h3>${p.name}</h3>
      <p><b>Полив:</b> ${p.watering}</p>
      <p><b>Свет:</b> ${p.light}</p>
      <p><b>Пересадка:</b> ${p.repotting}</p>
      <p><b>Ядовитость:</b> ${p.toxicity}</p>
      <p><b>Особенности:</b> ${p.notes}</p>
    </div>
  `).join('');
}

loadPlants().catch(err => console.error(err));
```

Поиск — тот же запрос с параметром:
```js
const res = await fetch(`${API}/plants?q=${encodeURIComponent('фикус')}`);
```

---

## Как выглядит одна карточка (поля ответа)

```json
{
  "id": 1,
  "name": "Монстера",
  "watering": "Раз в 5–7 дней, когда верхний слой грунта подсох на 2–3 см",
  "light": "Яркий рассеянный свет, без прямых лучей",
  "repotting": "Раз в 1–2 года весной, в горшок побольше",
  "toxicity": "Ядовита для кошек и собак (оксалаты кальция)",
  "notes": "Любит опрыскивание и опору для воздушных корней",
  "waterIntervalDays": 7,
  "repotIntervalDays": 540,
  "imageUrl": "https://images.unsplash.com/photo-1614594975525-e45190c55d0b"
}
```

Все поля — `camelCase`. `waterIntervalDays` / `repotIntervalDays` пригодятся позже для напоминаний.
