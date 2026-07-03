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
