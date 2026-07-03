// js/core/Notifier.js
// Абстракция уведомлений. ViewModel зовёт notifier.show("текст") и не знает,
// что это всплывающий toast и как он рисуется — за это отвечает только
// этот класс. При желании можно подменить на другую реализацию
// (например баннер вместо toast) не трогая ViewModel.

export class Notifier {
  constructor(toastElementId, durationMs) {
    this.el = document.getElementById(toastElementId);
    this.durationMs = durationMs;
    this._timer = null;
  }

  show(message) {
    if (!this.el) return;
    this.el.textContent = message;
    this.el.classList.add("visible");
    clearTimeout(this._timer);
    this._timer = setTimeout(() => this.el.classList.remove("visible"), this.durationMs);
  }
}
