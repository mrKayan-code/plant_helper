export class AuthGateView {
  constructor(viewModel, onAuthenticated) {
    this.vm = viewModel;
    this.onAuthenticated = onAuthenticated;

    this.els = {
      gate: document.getElementById("authGate"),
      shell: document.getElementById("appShell"),
      form: document.getElementById("authForm"),
      email: document.getElementById("authEmail"),
      password: document.getElementById("authPassword"),
      submitBtn: document.getElementById("authSubmitBtn"),
      toggleBtn: document.getElementById("authToggleBtn"),
      subtitle: document.getElementById("authSubtitle"),
      error: document.getElementById("authError"),
      logoutBtn: document.getElementById("logoutBtn"),
    };

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

    if (state.isAuthenticated) {
      this.els.gate.hidden = true;
      this.els.shell.hidden = false;
      this.onAuthenticated?.();
    } else {
      this.els.gate.hidden = false;
      this.els.shell.hidden = true;
      this.els.form.reset();
    }
  }
}
