// js/views/HomeView.js

function greetingByTime() {
  const h = new Date().getHours();
  if (h < 6) return "Доброй ночи!";
  if (h < 12) return "Доброе утро!";
  if (h < 18) return "Добрый день!";
  return "Добрый вечер!";
}

function taskIcon(action) {
  return action === "water" ? "💧" : "🌱";
}

function taskActionLabel(action) {
  return action === "water" ? "Пора полить" : "Пора пересадить";
}

// View Главного экрана. Единственная ответственность: отрисовать то, что
// лежит в viewModel.state, и передать пользовательский клик обратно во
// ViewModel. Сеть, подсчёт статистики, фильтрация задач — НЕ здесь.
export class HomeView {
  constructor(viewModel) {
    this.vm = viewModel;

    this.els = {
      greeting: document.getElementById("greetingText"),
      statTotal: document.getElementById("statTotal"),
      statNeedsCare: document.getElementById("statNeedsCare"),
      urgent: document.getElementById("urgentTasks"),
      upcoming: document.getElementById("upcomingTasks"),
      recent: document.getElementById("recentPlants"),
    };

    this.vm.on("change", (state) => this.render(state));
  }

  // Вызывается Router'ом каждый раз при показе экрана — поэтому данные
  // всегда свежие, а не те, что были при первой загрузке страницы.
  onShow() {
    this.els.greeting.textContent = greetingByTime();
    this.vm.load();
  }

  render(state) {
    this.els.statTotal.textContent = state.loading ? "–" : state.totalPlants;
    this.els.statNeedsCare.textContent = state.loading ? "–" : state.plantsNeedingCare;

    this.renderTaskList(this.els.urgent, state.urgentTasks, state.loading, "Срочных задач нет 🌿");
    this.renderTaskList(this.els.upcoming, state.upcomingTasks, state.loading, "На завтра ничего не запланировано");
    this.renderPlantTiles(state.recentPlants, state.loading);
  }

  renderTaskList(container, tasks, loading, emptyText) {
    container.innerHTML = "";
    if (loading) {
      container.innerHTML = `<p class="empty-hint">Загрузка…</p>`;
      return;
    }
    if (tasks.length === 0) {
      container.innerHTML = `<p class="empty-hint">${emptyText}</p>`;
      return;
    }
    tasks.forEach((task) => container.appendChild(this.buildTaskRow(task)));
  }

  buildTaskRow(task) {
    const row = document.createElement("div");
    row.className = "task-row";
    row.innerHTML = `
      <span class="task-icon">${taskIcon(task.action)}</span>
      <div class="task-info">
        <div class="task-plant-name"></div>
        <div class="task-action">${taskActionLabel(task.action)}</div>
      </div>
    `;
    row.querySelector(".task-plant-name").textContent = task.name; // textContent — не innerHTML
    return row;
  }

  renderPlantTiles(items, loading) {
    const grid = this.els.recent;
    grid.innerHTML = "";
    if (loading) {
      grid.innerHTML = `<p class="empty-hint">Загрузка…</p>`;
      return;
    }
    if (items.length === 0) {
      grid.innerHTML = `<p class="empty-hint">В саду пока пусто — добавьте первое растение из энциклопедии</p>`;
      return;
    }
    items.forEach((item) => grid.appendChild(this.buildPlantTile(item)));
  }

  buildPlantTile(item) {
    const tile = document.createElement("div");
    tile.className = "plant-tile";
    tile.innerHTML = `
      <img class="plant-tile-img" alt="">
      <div class="plant-tile-body">
        <div class="plant-tile-name"></div>
        <div class="plant-tile-note"></div>
      </div>
    `;
    const img = tile.querySelector(".plant-tile-img");
    img.src = item.plant.imageUrl || "";
    img.alt = item.plant.name;
    img.onerror = () => { img.style.display = "none"; };
    tile.querySelector(".plant-tile-name").textContent = item.plant.name;
    tile.querySelector(".plant-tile-note").textContent = item.note || "Без заметок";
    return tile;
  }
}
