// js/config.js
// Единая точка конфигурации приложения. Ни один другой файл не должен
// содержать строку "http://localhost:3000" или булев флаг "использовать
// мок" напрямую — всё берётся отсюда.

export const config = {
  apiBaseUrl: "http://localhost:3000/api",

  // Отражает реальный статус бэка (see back/plan.md):
  // Шаг 5 (auth) и Шаг 7 (collection) готовы — идём в реальный API.
  // Шаг 8 (favorites) и Шаг 9 (reminders) — ещё нет, работаем на моках.
  useMocks: {
    auth: false,
    collection: false,
    favorites: true,
    reminders: true,
  },

  search: {
    debounceMs: 300,
  },

  toastDurationMs: 3000,
};
