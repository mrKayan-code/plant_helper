// js/config.js
// Единая точка конфигурации приложения. Ни один другой файл не должен
// содержать строку "http://localhost:3000" или булев флаг "использовать
// мок" напрямую — всё берётся отсюда.

export const config = {
  apiBaseUrl: "http://localhost:3000/api",

  // Отражает реальный статус бэка (see back/plan.md):
  // Шаги 5,7,8,9 готовы — весь API реальный, моки выключены.
  useMocks: {
    auth: false,
    collection: false,
    favorites: false,
    reminders: false,
  },

  search: {
    debounceMs: 300,
  },

  toastDurationMs: 3000,
};
