import { todayISO } from "../utils/dateUtils.js";

const ACTION_ICON = { water: "💧", repot: "🌱" };
const ACTION_LABEL = { water: "Полить", repot: "Пересадить" };

export class TasksView {
  constructor(viewModel) {
    this.vm = viewModel;
    this._today = todayISO();

    this.els = {
      filters: document.getElementById("tasksFilters"),
      urgentSection: document.getElementById("tasksUrgentSection"),
      urgentList: document.getElementById("tasksUrgentList"),
      upcomingSection: document.getElementById("tasksUpcomingSection"),
      upcomingTitle: document.getElementById("tasksUpcomingTitle"),
      upcomingList: document.getElementById("tasksUpcomingList"),
      completedSection: document.getElementById("tasksCompletedSection"),
      completedList: document.getElementById("tasksCompletedList"),
    };

    this.els.filters.querySelectorAll("[data-filter]").forEach((btn) => {
      btn.addEventListener("click", () => this.vm.setFilter(btn.dataset.filter));
    });

    this.vm.on("change", (state) => this.render(state));
  }

  onShow() {
    this.vm.load();
  }

  render(state) {
    this._today = todayISO();

    this.els.filters.querySelectorAll("[data-filter]").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.filter === state.filter);
    });

    const isUrgent = state.filter === "today"; // вкладка "Срочно"
    this.els.urgentSection.hidden = !isUrgent;
    this.els.upcomingSection.hidden = isUrgent;

    if (state.loading) {
      (isUrgent ? this.els.urgentList : this.els.upcomingList).innerHTML = `<p class="empty-hint">Загрузка…</p>`;
      this.els.completedSection.hidden = true;
      return;
    }
    if (state.error) {
      (isUrgent ? this.els.urgentList : this.els.upcomingList).innerHTML = `<p class="empty-hint">${state.error}</p>`;
      this.els.completedSection.hidden = true;
      return;
    }

    if (isUrgent) {
      this.renderList(this.els.urgentList, state.urgent, state, "Срочных задач нет 🌿");
    } else if (state.filter === "tomorrow") {
      this.els.upcomingTitle.textContent = "Завтра";
      this.renderList(this.els.upcomingList, state.tomorrow, state, "На завтра ничего не запланировано");
    } else {
      this.els.upcomingTitle.textContent = "Все задачи";
      this.renderList(this.els.upcomingList, state.all, state, "Задач нет 🌿");
    }

    this.els.completedSection.hidden = state.completedToday.length === 0;
    this.renderCompleted(state.completedToday);
  }

  renderList(container, reminders = [], state, emptyText) {
    container.innerHTML = "";
    if (reminders.length === 0) {
      container.innerHTML = `<p class="empty-hint">${emptyText}</p>`;
      return;
    }
    reminders.forEach((r) => container.appendChild(this.buildTaskRow(r, state)));
  }

  buildTaskRow(reminder, state) {
    const key = `${reminder.collectionId}:${reminder.action}`;
    const busy = state.completingKey === key;
    const isUrgent = reminder.dueDate <= this._today; // просрочено/сегодня — везде выделяем

    const row = document.createElement("label");
    row.className = "task-row task-row--checkable" + (isUrgent ? " task-row--urgent" : "");
    row.innerHTML = `
      <input type="checkbox" class="task-checkbox" ${busy ? "disabled" : ""}>
      <span class="task-icon">${ACTION_ICON[reminder.action]}</span>
      <div class="task-info">
        <div class="task-plant-name"></div>
        <div class="task-action"></div>
      </div>
    `;
    row.querySelector(".task-plant-name").textContent = reminder.name;
    row.querySelector(".task-action").textContent = busy
      ? "Отмечаем…"
      : `${ACTION_LABEL[reminder.action]} · срок ${reminder.dueDate}`;

    row.querySelector(".task-checkbox").addEventListener("change", () => this.vm.completeTask(reminder));

    return row;
  }

  renderCompleted(items) {
    const list = this.els.completedList;
    list.innerHTML = "";
    items.forEach((c) => {
      const row = document.createElement("div");
      row.className = "task-row task-row--done";
      row.innerHTML = `
        <span class="task-icon">✅</span>
        <div class="task-info">
          <div class="task-plant-name"></div>
          <div class="task-action"></div>
        </div>
      `;
      row.querySelector(".task-plant-name").textContent = c.name;
      row.querySelector(".task-action").textContent = ACTION_LABEL[c.action];
      list.appendChild(row);
    });
  }
}
