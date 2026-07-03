let _catalogSearchTimer = null;

function toxicityIsDangerous(toxicityText) {
  if (!toxicityText) return false;
  const t = toxicityText.toLowerCase();
  return t.includes("ядовит") || t.includes("токсич");
}


function renderCatalogGrid(plants) {
  const grid = document.getElementById("catalogGrid");
  grid.innerHTML = "";

  if (plants.length === 0) {
    grid.innerHTML = `<p class="empty-hint">Ничего не найдено — попробуйте другой запрос</p>`;
    return;
  }

  plants.forEach((plant) => grid.appendChild(renderCatalogCard(plant)));
}

function renderCatalogCard(plant) {
  const card = document.createElement("button");
  card.className = "catalog-card";
  card.type = "button";
  card.dataset.plantId = plant.id;

  const dangerous = toxicityIsDangerous(plant.toxicity);

  card.innerHTML = `
    <div class="catalog-card-img-wrap">
      <img class="catalog-card-img" alt="">
      ${dangerous ? '<span class="badge badge-toxic" title="Ядовито для животных"></span>' : ""}
    </div>
    <div class="catalog-card-body">
      <div class="catalog-card-name"></div>
      <div class="icon-row">
        <span class="icon-chip" title="Полив"></span>
        <span class="icon-chip" title="Освещение"></span>
      </div>
    </div>
  `;

  const img = card.querySelector(".catalog-card-img");
  img.src = plant.imageUrl || "";
  img.alt = plant.name;
  img.onerror = () => { img.style.display = "none"; };

  card.querySelector(".catalog-card-name").textContent = plant.name;

  card.addEventListener("click", () => openPlantDetail(plant.id));

  return card;
}

async function loadCatalog(query) {
  const grid = document.getElementById("catalogGrid");
  grid.innerHTML = `<p class="empty-hint">Загрузка…</p>`;

  try {
    const path = query ? `/plants?q=${encodeURIComponent(query)}` : "/plants";
    const plants = await api(path);
    state.plants = query ? state.plants : plants;
    renderCatalogGrid(plants);
  } catch (err) {
    grid.innerHTML = `<p class="empty-hint">Не удалось загрузить справочник. Проверьте, запущен ли сервер.</p>`;
    console.error(err);
  }
}

function setupCatalogSearch() {
  const input = document.getElementById("catalogSearchInput");
  if (input.dataset.bound) return; 
  input.dataset.bound = "1";

  input.addEventListener("input", () => {
    clearTimeout(_catalogSearchTimer);
    const value = input.value.trim();
    _catalogSearchTimer = setTimeout(() => loadCatalog(value), 300);
  });

  const backBtn = document.getElementById("catalogBackBtn");
  backBtn.addEventListener("click", showCatalogList);
}

function showCatalogList() {
  document.getElementById("catalogListView").hidden = false;
  document.getElementById("catalogDetailView").hidden = true;
}

function showCatalogDetail() {
  document.getElementById("catalogListView").hidden = true;
  document.getElementById("catalogDetailView").hidden = false;
}


const DETAIL_TABS = [
  { id: "care", label: "Уход" },
  { id: "repotting", label: "Пересадка" },
  { id: "danger", label: "Опасность" },
];

function tabContent(plant, tabId) {
  if (tabId === "care") {
    return `
      <div class="detail-field">
        <span class="detail-field-label"> Полив</span>
        <p class="detail-field-value"></p>
      </div>
      <div class="detail-field">
        <span class="detail-field-label"> Освещение</span>
        <p class="detail-field-value"></p>
      </div>
    `;
  }
  if (tabId === "repotting") {
    return `
      <div class="detail-field">
        <span class="detail-field-label"> Пересадка</span>
        <p class="detail-field-value"></p>
      </div>
    `;
  }
  return `
    <div class="detail-field">
      <span class="detail-field-label"> Ядовитость</span>
      <p class="detail-field-value"></p>
    </div>
  `;
}

function fillTabValues(panelEl, plant, tabId) {
  const values = panelEl.querySelectorAll(".detail-field-value");
  if (tabId === "care") {
    values[0].textContent = plant.watering || "Нет данных";
    values[1].textContent = plant.light || "Нет данных";
  } else if (tabId === "repotting") {
    values[0].textContent = plant.repotting || "Нет данных";
  } else {
    values[0].textContent = plant.toxicity || "Нет данных";
  }
}

async function toggleFavorite(plantId, starBtn) {
  const isFav = starBtn.dataset.active === "1";
  try {
    if (isFav) {
      await api(`/favorites/${plantId}`, { method: "DELETE" });
      starBtn.dataset.active = "0";
      starBtn.textContent = "☆";
      showToast("Убрано из избранного");
    } else {
      await api("/favorites", { method: "POST", body: { plantId } });
      starBtn.dataset.active = "1";
      starBtn.textContent = "★";
      showToast("Добавлено в избранное");
    }
  } catch (err) {
    console.error(err);
  }
}

async function addToGarden(plant, btn) {
  btn.disabled = true;
  const originalText = btn.textContent;
  btn.textContent = "Добавляем…";
  try {
    await api("/collection", { method: "POST", body: { plantId: plant.id } });
    btn.textContent = "✓ В саду";
    showToast(`«${plant.name}» добавлено в мой сад`);
  } catch (err) {
    btn.textContent = originalText;
    btn.disabled = false;
    console.error(err);
  }
}

function renderDetailCard(plant) {
  const card = document.getElementById("catalogDetailCard");

  card.innerHTML = `
    <div class="detail-header">
      <img class="detail-img" alt="">
      <div class="detail-header-info">
        <div class="detail-title-row">
          <h2 class="detail-name"></h2>
          <button class="favorite-btn" id="detailFavoriteBtn" data-active="0" title="В избранное">☆</button>
        </div>
        <button class="btn-primary" id="detailAddBtn">+ Добавить в мой сад</button>
      </div>
    </div>

    <div class="tabs" role="tablist"></div>
    <div class="tab-panels"></div>

    <div class="detail-notes" id="detailNotes"></div>
  `;

  const img = card.querySelector(".detail-img");
  img.src = plant.imageUrl || "";
  img.alt = plant.name;
  img.onerror = () => { img.style.display = "none"; };

  card.querySelector(".detail-name").textContent = plant.name;

  const favBtn = card.querySelector("#detailFavoriteBtn");
  const isFav = state.favorites.some((f) => f.id === plant.id);
  favBtn.dataset.active = isFav ? "1" : "0";
  favBtn.textContent = isFav ? "★" : "☆";
  favBtn.addEventListener("click", () => toggleFavorite(plant.id, favBtn));

  card.querySelector("#detailAddBtn").addEventListener("click", (e) => addToGarden(plant, e.target));

  const tabsWrap = card.querySelector(".tabs");
  const panelsWrap = card.querySelector(".tab-panels");

  DETAIL_TABS.forEach((tab, i) => {
    const tabBtn = document.createElement("button");
    tabBtn.className = "tab-btn" + (i === 0 ? " active" : "");
    tabBtn.textContent = tab.label;
    tabBtn.dataset.tab = tab.id;
    tabBtn.addEventListener("click", () => {
      tabsWrap.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
      panelsWrap.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("active"));
      tabBtn.classList.add("active");
      panelsWrap.querySelector(`[data-panel="${tab.id}"]`).classList.add("active");
    });
    tabsWrap.appendChild(tabBtn);

    const panel = document.createElement("div");
    panel.className = "tab-panel" + (i === 0 ? " active" : "");
    panel.dataset.panel = tab.id;
    panel.innerHTML = tabContent(plant, tab.id);
    panelsWrap.appendChild(panel);
    fillTabValues(panel, plant, tab.id);
  });

  const notesEl = card.querySelector("#detailNotes");
  if (plant.notes) {
    notesEl.innerHTML = `<h3 class="detail-notes-title">Особенности ухода</h3><p></p>`;
    notesEl.querySelector("p").textContent = plant.notes;
  }
}

async function openPlantDetail(plantId) {
  showCatalogDetail();
  document.getElementById("catalogDetailCard").innerHTML = `<p class="empty-hint">Загрузка…</p>`;

  try {
    const plant = await api(`/plants/${plantId}`);
    renderDetailCard(plant);
  } catch (err) {
    document.getElementById("catalogDetailCard").innerHTML =
      `<p class="empty-hint">Не удалось загрузить карточку растения</p>`;
    console.error(err);
  }
}


async function renderCatalog() {
  setupCatalogSearch();
  showCatalogList();

  try {
    state.favorites = await api("/favorites");
  } catch (err) {
    console.error("Не удалось загрузить избранное:", err);
  }

  const currentQuery = document.getElementById("catalogSearchInput").value.trim();
  loadCatalog(currentQuery);
}

onScreenShow.catalog = renderCatalog;