// js/core/TokenStorage.js
// Единственная ответственность: где и как хранится токен. Ни HttpClient,
// ни сервисы не обращаются к localStorage напрямую — только через это.
// Если завтра токен нужно хранить иначе (cookie, память) — меняем один файл.

const STORAGE_KEY = "token";

export class TokenStorage {
  get() {
    return localStorage.getItem(STORAGE_KEY);
  }
  set(token) {
    localStorage.setItem(STORAGE_KEY, token);
  }
  clear() {
    localStorage.removeItem(STORAGE_KEY);
  }
}
