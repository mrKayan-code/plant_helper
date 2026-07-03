export const config = {
  apiBaseUrl: "http://localhost:3000/api",

  useMocks: {
    auth: false,
    collection: false,
    favorites: true,
    reminders: false,
  },

  search: {
    debounceMs: 300,
  },

  toastDurationMs: 3000,
};