// js/home.js

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

function renderTaskRow(reminder, urgent) {
  const row = document.createElement("div");
  row.className = "task-row" + (urgent ? " task-row--urgent" : "");
  row.innerHTML = `
    <span class="task-icon">${taskIcon(reminder.action)}</span>
    <div class="task-info">
      <div class="task-plant-name"></div>
      <div class="task-action">${taskActionLabel(reminder.action)}</div>
    </div>
  `;
  // название через textContent — не innerHTML, данные не должны рендериться как HTML
  row.querySelector(".task-plant-name").textContent = reminder.name;
  return row;
}

function renderTaskList(containerEl, items, urgent) {
  containerEl.innerHTML = "";
  if (items.length === 0) {
    const p = document.createElement("p");
    p.className = "empty-hint";
    p.textContent = urgent ? "Срочных задач нет 🌿" : "На завтра ничего не запланировано";
    containerEl.appendChild(p);
    return;
  }
  items.forEach((r) => containerEl.appendChild(renderTaskRow(r, urgent)));
}

function renderPlantTile(collectionItem) {
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
  img.src = collectionItem.plant.imageUrl || "";
  img.alt = collectionItem.plant.name;
  img.onerror = () => { img.style.display = "none"; };

  tile.querySelector(".plant-tile-name").textContent = collectionItem.plant.name;
  tile.querySelector(".plant-tile-note").textContent = collectionItem.note || "Без заметок";
  return tile;
}

async function renderHome() {
  document.getElementById("greetingText").textContent = greetingByTime();

  try {
    const [collection, reminders] = await Promise.all([
      api("/collection"),
      api("/reminders"),
    ]);
    state.collection = collection;
    state.reminders = reminders;

    // --- статистика ---
    document.getElementById("statTotal").textContent = collection.length;
    const plantsNeedingCare = new Set(reminders.map((r) => r.collectionId)).size;
    document.getElementById("statNeedsCare").textContent = plantsNeedingCare;

    // --- срочные (today) vs ближайшие (завтра) ---
    const today = new Date().toISOString().slice(0, 10);
    const urgent = reminders.filter((r) => r.dueDate <= today);
    const upcoming = reminders.filter((r) => r.dueDate > today);

    renderTaskList(document.getElementById("urgentTasks"), urgent, true);
    renderTaskList(document.getElementById("upcomingTasks"), upcoming, false);

    // --- последние добавленные растения (плитки) ---
    const recent = [...collection]
      .sort((a, b) => (a.addedAt < b.addedAt ? 1 : -1))
      .slice(0, 6);

    const grid = document.getElementById("recentPlants");
    grid.innerHTML = "";
    if (recent.length === 0) {
      grid.innerHTML = `<p class="empty-hint">В саду пока пусто — добавьте первое растение из энциклопедии</p>`;
    } else {
      recent.forEach((item) => grid.appendChild(renderPlantTile(item)));
    }
  } catch (err) {
    console.error("Не удалось загрузить данные главного экрана:", err);
  }
}

onScreenShow.home = renderHome;

// первичная отрисовка при загрузке страницы (экран "Главная" открыт по умолчанию)
document.addEventListener("DOMContentLoaded", renderHome);