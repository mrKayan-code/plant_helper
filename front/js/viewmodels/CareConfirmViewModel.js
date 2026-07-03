import { EventEmitter } from "../core/EventEmitter.js";

// Единая форма подтверждения ухода (полив/пересадка). Один экземпляр на всё
// приложение. Любой экран, вместо прямого collectionStore.markWatered,
// вызывает request(...) — форма показывает подходящее сообщение (от лица
// растения), а собственно мутацию делает только после подтверждения.
// Так поливать можно откуда угодно, а UX подтверждения — единый и в одном месте.

// Тексты собраны здесь, чтобы легко править. n — |daysLeft| (дней просрочки / до срока).
const COPY = {
  water: {
    overdue: (name, n) => ({
      emoji: "🥵",
      title: `«${name}» хочет пить`,
      body: `«${name}»: «Пить! Я уже ${n} дн. как без воды.» Загляни — не пересох ли грунт, всё ли в порядке?`,
      confirm: "Полить 💧",
    }),
    early: (name, n) => ({
      emoji: "🌊",
      title: "Ещё рановато",
      body: `«${name}»: «Мне пока хватает воды — зальёшь, и я утону.» Полить на ${n} дн. раньше срока?`,
      confirm: "Всё равно полить",
    }),
    due: (name) => ({
      emoji: "💧",
      title: `Полить «${name}»?`,
      body: "Как раз пора освежить. Польём?",
      confirm: "Полить 💧",
    }),
  },
  repot: {
    overdue: (name, n) => ({
      emoji: "🪴",
      title: `«${name}» перерос горшок`,
      body: `«${name}»: «Тесно мне тут, корни уже наружу лезут (${n} дн. просрочки).» Пересадим?`,
      confirm: "Пересадить 🪴",
    }),
    early: (name, n) => ({
      emoji: "😌",
      title: "Пересадка — это стресс",
      body: `«${name}»: «Мне ещё уютно в этом горшке.» Пересадить на ${n} дн. раньше срока?`,
      confirm: "Всё равно пересадить",
    }),
    due: (name) => ({
      emoji: "🪴",
      title: `Пересадить «${name}»?`,
      body: "Пора обновить горшок. Пересадим?",
      confirm: "Пересадить 🪴",
    }),
  },
};

// Насколько раньше срока считается "рано" (дней до due). Для пересадки больше — интервалы длинные.
const EARLY_THRESHOLD = { water: 2, repot: 14 };

export class CareConfirmViewModel extends EventEmitter {
  constructor(collectionStore, notifier) {
    super();
    this.collectionStore = collectionStore;
    this.notifier = notifier;

    this.state = {
      open: false,
      tone: "due", // "overdue" | "early" | "due" — для акцентного цвета
      emoji: "",
      title: "",
      body: "",
      confirmLabel: "",
      pending: null, // { collectionId, action, onDone }
    };
  }

  // Открыть подтверждение. daysLeft: дней до срока (минус = просрочено), null = не отследить.
  request({ collectionId, name, action, daysLeft, onDone = null }) {
    const tone = this.#tone(action, daysLeft);
    const n = daysLeft == null ? null : Math.abs(daysLeft);
    const copy = COPY[action][tone](name, n);

    this.state = {
      open: true,
      tone,
      emoji: copy.emoji,
      title: copy.title,
      body: copy.body,
      confirmLabel: copy.confirm,
      pending: { collectionId, action, onDone },
    };
    this.emit("change", this.state);
  }

  #tone(action, daysLeft) {
    if (daysLeft == null) return "due";
    if (daysLeft < 0) return "overdue";
    if (daysLeft >= EARLY_THRESHOLD[action]) return "early";
    return "due";
  }

  async confirm() {
    const p = this.state.pending;
    this.state = { ...this.state, open: false, pending: null };
    this.emit("change", this.state);
    if (!p) return;

    try {
      if (p.action === "water") await this.collectionStore.markWatered(p.collectionId);
      else await this.collectionStore.markRepotted(p.collectionId);
      this.notifier.show(p.action === "water" ? "Отмечено: полито 💧" : "Отмечено: пересажено 🌱");
      p.onDone?.(); // экран-инициатор может доделать своё (напр. "выполнено сегодня")
    } catch (err) {
      console.error(err);
    }
  }

  cancel() {
    this.state = { ...this.state, open: false, pending: null };
    this.emit("change", this.state);
  }
}
