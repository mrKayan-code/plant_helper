// js/viewmodels/AuthViewModel.js
import { EventEmitter } from "../core/EventEmitter.js";

// ViewModel аккаунта. Не знает про DOM — только состояние (вошли/не вошли,
// открыта ли модалка, режим формы, ошибка, email) и вызовы authService.
export class AuthViewModel extends EventEmitter {
  constructor(authService, tokenStorage) {
    super();
    this.authService = authService;
    this.tokenStorage = tokenStorage;

    this.state = {
      isAuthenticated: !!this.tokenStorage.get(),
      modalOpen: false,
      mode: "login", // "login" | "register"
      submitting: false,
      error: null,
      email: null,
    };
  }

  openModal() {
    this.state = { ...this.state, modalOpen: true, error: null };
    this.emit("change", this.state);
  }

  closeModal() {
    this.state = { ...this.state, modalOpen: false, error: null };
    this.emit("change", this.state);
  }

  toggleMode() {
    this.state = {
      ...this.state,
      mode: this.state.mode === "login" ? "register" : "login",
      error: null,
    };
    this.emit("change", this.state);
  }

  async submit(email, password) {
    this.state = { ...this.state, submitting: true, error: null };
    this.emit("change", this.state);

    try {
      const user = this.state.mode === "login"
        ? await this.authService.login(email, password)
        : await this.authService.register(email, password);

      this.state.isAuthenticated = true;
      this.state.email = user?.email ?? email;
      this.state.modalOpen = false; // успешный вход/регистрация — закрываем модалку сами
    } catch (err) {
      this.state.error = err.message || "Не удалось войти";
    }

    this.state.submitting = false;
    this.emit("change", this.state);
  }

  logout() {
    this.authService.logout();
    this.state = { ...this.state, isAuthenticated: false, email: null, modalOpen: false };
    this.emit("change", this.state);
  }
}
