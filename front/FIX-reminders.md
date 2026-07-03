# Фикс задач/напоминаний — для фронта

## Контекст
Бэк изменил поведение `/api/reminders` (в лучшую сторону):
- Раньше отдавал только задачи «до завтра».
- **Теперь отдаёт полное расписание** — для каждого растения следующий полив и
  следующую пересадку с `dueDate` (просрочённые — с датой в прошлом).
- Плюс при добавлении растения бэк сам ставит `lastWateredAt`/`lastRepottedAt` =
  сегодня, так что расписание появляется сразу (раньше было пусто → задачи не считались).

Из-за этого фронту надо разложить полный список по бакетам, иначе фильтр «Завтра»
и блок «Скоро, завтра» на Главной покажут ВСЁ будущее (включая пересадку через 1.5 года).

Формат ответа `/reminders` не изменился: `{ collectionId, plantId, name, action, dueDate }`.

---

## Фикс 1 — `viewmodels/HomeViewModel.js`

«Скоро, завтра» должно быть именно про завтра, а не про всё будущее.

```js
// вверху файла:
import { todayISO, addDaysISO } from "../utils/dateUtils.js";

// в load(), где считается state:
const today = todayISO();
const tomorrow = addDaysISO(today, 1);

this.state = {
  loading: false,
  error: null,
  totalPlants: collection.length,
  // счётчик "требуют ухода" — только просрочённые/сегодня, а не всё будущее
  plantsNeedingCare: new Set(
    reminders.filter((r) => r.dueDate <= today).map((r) => r.collectionId)
  ).size,
  urgentTasks: reminders.filter((r) => r.dueDate <= today),
  upcomingTasks: reminders.filter((r) => r.dueDate === tomorrow), // было: r.dueDate > today
  recentPlants: [...collection].sort((a, b) => (a.addedAt < b.addedAt ? 1 : -1)).slice(0, 4),
};
```

---

## Фикс 2 — `viewmodels/TasksViewModel.js`

Добавить отдельный бакет «завтра». «Все» пусть остаётся всем будущим.

```js
// вверху файла:
import { todayISO, addDaysISO } from "../utils/dateUtils.js";

// в load():
const today = todayISO();
const tomorrow = addDaysISO(today, 1);

this.state = {
  ...this.state,
  loading: false,
  urgent: reminders.filter((r) => r.dueDate <= today),   // сегодня + просрочено
  tomorrow: reminders.filter((r) => r.dueDate === tomorrow),
  upcoming: reminders.filter((r) => r.dueDate > today),  // всё будущее — для фильтра "все"
};
```
(в начальном `this.state` добавить `tomorrow: []`)

---

## Фикс 3 — `views/TasksView.js`

Для фильтра «Завтра» показывать бакет `tomorrow`, для «Все» — `upcoming`.

```js
// в render(), заменить строку рендера upcoming:
const upcomingData = state.filter === "tomorrow" ? state.tomorrow : state.upcoming;
this.renderList(this.els.upcomingList, upcomingData, state, "На завтра ничего не запланировано");
```

---

## Как проверить
1. Запустить бэк (`cd back && npm start`) и фронт.
2. Зарегистрироваться, добавить растение в «Мой сад».
3. «Задачи» → фильтр **«Все»**: должны появиться «Полить» и «Пересадить» с будущими сроками.
4. Отметить полив в «Мой сад» → срок полива сдвинется на +интервал.
5. Чтобы увидеть «срочную» задачу сегодня — в «Мой сад» временно поставить растению
   маленький интервал полива (напр. 1) и отметить, что поливали пару дней назад
   (или подождать) — задача уедет в «просрочено/сегодня».

## Примечание
Растения, добавленные ДО этого фикса бэка, имеют `lastWateredAt = null` и в задачах
не появятся. Проще всего удалить их из сада и добавить заново (или начать с чистой БД).

---

## Фикс 4 — тот же баг с интервалом `0` на фронте (`GardenViewModel._computeStatus`)

Здесь truthy-проверка тоже съедает интервал `0`:
```js
// было:
if (!lastDateISO || !intervalDays) return { tracked: false, daysLeft: null };
// стало (явная проверка на null/undefined):
if (lastDateISO == null || intervalDays == null) return { tracked: false, daysLeft: null };
```

## Фикс 5 — favorites можно вернуть на реальный API

Бэк чинил `POST /api/favorites`: раньше отдавал пустой `201`, из-за чего `HttpClient`
падал на `res.json()`. Теперь `POST` возвращает `201` + карточку растения — всё работает.
В `config.js` можно переключить:
```js
useMocks: { auth: false, collection: false, favorites: false, reminders: false }
```
