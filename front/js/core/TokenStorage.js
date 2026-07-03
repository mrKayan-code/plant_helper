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
