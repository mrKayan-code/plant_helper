// js/state.js
// Единый объект состояния — вместо того чтобы гонять данные
// через глобальные переменные в разных файлах.

const state = {
  user: null,        // { id, email } после логина
  plants: [],         // кэш справочника (GET /api/plants)
  collection: [],      // личный список (GET /api/collection)
  favorites: [],       // избранное (GET /api/favorites)
  reminders: [],       // что пора сделать (GET /api/reminders)
};