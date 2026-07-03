// js/core/HttpClient.js
// Единственная ответственность: HTTP-транспорт. Не знает, что такое
// "растение" или "коллекция" — это уровень сервисов выше. Здесь только
// fetch, заголовки авторизации и единообразный разбор ошибок (SRP).

export class HttpClient {
  constructor(baseUrl, tokenStorage, notifier, onUnauthorized) {
    this.baseUrl = baseUrl;
    this.tokenStorage = tokenStorage;
    this.notifier = notifier;
    this.onUnauthorized = onUnauthorized;
  }

  async request(path, { method = "GET", body } = {}) {
    const headers = {};
    // Content-Type ставим только когда реально есть тело — иначе браузер
    // на пустом GET шлёт лишний CORS-preflight (OPTIONS).
    if (body) headers["Content-Type"] = "application/json";

    const token = this.tokenStorage.get();
    if (token) headers["Authorization"] = `Bearer ${token}`;

    let res;
    try {
      res = await fetch(this.baseUrl + path, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch (networkErr) {
      this.notifier?.show("Нет связи с сервером — проверьте, запущен ли бэк");
      throw networkErr;
    }

    if (res.status === 401) {
      this.tokenStorage.clear();
      this.notifier?.show("Войдите, чтобы продолжить");
      this.onUnauthorized?.();
      throw new Error("Unauthorized");
    }

    if (res.status === 204) return null;

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      this.notifier?.show(err.error || `Ошибка ${res.status}`);
      throw new Error(err.error || `HTTP ${res.status}`);
    }

    return res.json();
  }

  get(path) { return this.request(path); }
  post(path, body) { return this.request(path, { method: "POST", body }); }
  patch(path, body) { return this.request(path, { method: "PATCH", body }); }
  delete(path) { return this.request(path, { method: "DELETE" }); }
}
