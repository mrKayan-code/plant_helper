// Общая модалка подтверждения ухода. Одна на всё приложение (как AccountView).
// Только DOM: читает состояние из CareConfirmViewModel, шлёт confirm/cancel.
export class CareConfirmView {
  constructor(viewModel) {
    this.vm = viewModel;

    this.els = {
      backdrop: document.getElementById("careConfirmBackdrop"),
      modal: document.getElementById("careConfirmModal"),
      emoji: document.getElementById("careConfirmEmoji"),
      title: document.getElementById("careConfirmTitle"),
      body: document.getElementById("careConfirmBody"),
      cancel: document.getElementById("careConfirmCancel"),
      ok: document.getElementById("careConfirmOk"),
    };

    this.els.cancel.addEventListener("click", () => this.vm.cancel());
    this.els.ok.addEventListener("click", () => this.vm.confirm());
    this.els.backdrop.addEventListener("click", (e) => {
      if (e.target === this.els.backdrop) this.vm.cancel();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.vm.state.open) this.vm.cancel();
    });

    this.vm.on("change", (state) => this.render(state));
  }

  render(state) {
    this.els.backdrop.hidden = !state.open;
    if (!state.open) return;

    this.els.modal.className = `confirm-modal tone-${state.tone}`;
    this.els.emoji.textContent = state.emoji;
    this.els.title.textContent = state.title;
    this.els.body.textContent = state.body;
    this.els.ok.textContent = state.confirmLabel;
    this.els.ok.focus();
  }
}
