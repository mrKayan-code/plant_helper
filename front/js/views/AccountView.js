// js/views/AccountView.js

// Кнопка аккаунта (видна на всех экранах) + модалка поверх контента.
// Не блокирует доступ к приложению — просто открывается/закрывается.
// Содержимое модалки зависит от viewModel.state.isAuthenticated:
// форма входа/регистрации — если не вошли, инфо об аккаунте + "Выйти" — если вошли.
export class AccountView {
  constructor(viewModel) {
    this.vm = viewModel;

    this.els = {
      btn: document.getElementById("accountBtn"),
      btnLabel: document.getElementById("accountBtnLabel"),
      backdrop: document.getElementById("accountModalBackdrop"),
      closeBtn: document.getElementById("accountModalClose"),

      authBlock: document.getElementById("authFormBlock"),
      form: document.getElementById("authForm"),
      email: document.getElementById("authEmail"),
      password: document.getElementById("authPassword"),
      submitBtn: document.getElementById("authSubmitBtn"),
      toggleBtn: document.getElementById("authToggleBtn"),
      subtitle: document.getElementById("authSubtitle"),
      error: document.getElementById("authError"),

      accountBlock: document.getElementById("accountInfoBlock"),
      accountEmail: document.getElementById("accountEmail"),
      logoutBtn: document.getElementById("logoutBtn"),
    };

    this.els.btn.addEventListener("click", () => this.vm.openModal());
    this.els.closeBtn.addEventListener("click", () => this.vm.closeModal());

    this.els.backdrop.addEventListener("click", (e) => {
      if (e.target === this.els.backdrop) this.vm.closeModal();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.vm.state.modalOpen) this.vm.closeModal();
    });

    this.els.form.addEventListener("submit", (e) => {
      e.preventDefault();
      this.vm.submit(this.els.email.value.trim(), this.els.password.value);
    });
    this.els.toggleBtn.addEventListener("click", () => this.vm.toggleMode());
    this.els.logoutBtn.addEventListener("click", () => this.vm.logout());

    this.vm.on("change", (state) => this.render(state));
    this.render(this.vm.state);
  }

  render(state) {
    this.els.btnLabel.textContent = state.isAuthenticated ? "Аккаунт" : "Войти";
    this.els.backdrop.hidden = !state.modalOpen;

    this.els.authBlock.hidden = state.isAuthenticated;
    this.els.accountBlock.hidden = !state.isAuthenticated;

    if (state.isAuthenticated) {
      this.els.accountEmail.textContent = state.email || "";
      return;
    }

    const isLogin = state.mode === "login";
    this.els.subtitle.textContent = isLogin ? "Войдите, чтобы продолжить" : "Создайте аккаунт";
    this.els.submitBtn.disabled = state.submitting;
    this.els.submitBtn.textContent = state.submitting
      ? "Секунду…"
      : isLogin ? "Войти" : "Зарегистрироваться";
    this.els.toggleBtn.textContent = isLogin
      ? "Нет аккаунта? Зарегистрироваться"
      : "Уже есть аккаунт? Войти";

    this.els.error.hidden = !state.error;
    if (state.error) this.els.error.textContent = state.error;

    if (!state.modalOpen) this.els.form.reset();
  }
}
