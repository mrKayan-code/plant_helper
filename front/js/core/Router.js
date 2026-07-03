// js/core/Router.js
// Единственная ответственность: показать нужный экран и спрятать
// остальные. Ничего не знает о содержимом экранов — просто переключает
// видимость и вызывает view.onShow(), если он есть у зарегистрированного View.
// Любая кнопка с data-screen="X" в любом месте приложения ведёт себя
// одинаково — обработчик здесь один, дублировать в каждом View не нужно.

export class Router {
  constructor() {
    this._views = new Map(); // screenId -> View (опционально реализует onShow())

    document.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-screen]");
      if (btn) this.show(btn.dataset.screen);
    });
  }

  register(screenId, view) {
    this._views.set(screenId, view);
  }

  show(screenId) {
    document.querySelectorAll(".screen").forEach((el) => el.classList.remove("active"));
    document.querySelectorAll(".sidebar-link").forEach((el) => el.classList.remove("active"));

    document.getElementById(`screen-${screenId}`)?.classList.add("active");
    document.querySelector(`.sidebar-link[data-screen="${screenId}"]`)?.classList.add("active");

    this._views.get(screenId)?.onShow?.();
  }
}
