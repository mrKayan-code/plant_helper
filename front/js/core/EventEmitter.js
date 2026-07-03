// js/core/EventEmitter.js
// Минимальная шина событий. ViewModel наследуется от неё и через emit()
// сообщает View "состояние изменилось" — View сама решает, что перерисовать.
// Это и есть биндинг в MVVM без фреймворка.

export class EventEmitter {
  #listeners = new Map();

  on(event, handler) {
    if (!this.#listeners.has(event)) this.#listeners.set(event, new Set());
    this.#listeners.get(event).add(handler);
    return () => this.off(event, handler);
  }

  off(event, handler) {
    this.#listeners.get(event)?.delete(handler);
  }

  emit(event, payload) {
    this.#listeners.get(event)?.forEach((handler) => handler(payload));
  }
}
