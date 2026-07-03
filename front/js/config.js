// js/config.js
// Единая точка конфигурации приложения. Ни один другой файл не должен
// содержать строку "http://localhost:3000" или булев флаг "использовать
// мок" напрямую — всё берётся отсюда.

export const config = {
  apiBaseUrl: "http://localhost:3000/api",

  // Пока бэк не готов отдавать эти ресурсы — сервис-контейнер подставит
  // мок-реализацию с тем же интерфейсом. Когда эндпоинт готов — меняете
  // true на false ЗДЕСЬ. ViewModel и View это изменение не затрагивает.
  useMocks: {
    auth: true,
    collection: true,
    favorites: true,
    reminders: true,
  },

  search: {
    debounceMs: 300,
  },

  toastDurationMs: 3000,
};
