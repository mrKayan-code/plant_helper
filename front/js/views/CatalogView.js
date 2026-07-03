import { config } from "../config.js";

const DETAIL_TABS = [
  { id: "care", label: "Уход" },
  { id: "repotting", label: "Пересадка" },
  { id: "danger", label: "Опасность" },
];

export class CatalogView {
  constructor(viewModel) {
    this.vm = viewModel;
    this._searchTimer = null;

    this.els = {
      listView: document.getElementById("catalogListView"),
      detailView: document.getElementById("catalogDetailView"),
      searchInput: document.getElementById("catalogSearchInput"),
      grid: document.getElementById("catalogGrid"),
      backBtn: document.getElementById("catalogBackBtn"),
      detailCard: document.getElementById("catalogDetailCard"),
      filterChips: document.querySelectorAll("[data-catalog-filter]"),
    };

    this.els.searchInput.addEventListener("input", () => {
      clearTimeout(this._searchTimer);
      const value = this.els.searchInput.value.trim();
      this._searchTimer = setTimeout(() => this.vm.search(value), config.search.debounceMs);
    });

    this.els.backBtn.addEventListener("click", () => this.vm.backToList());

    this.els.filterChips.forEach((btn) => {
      btn.addEventListener("click", () => this.vm.setViewFilter(btn.dataset.catalogFilter));
    });

    this.vm.on("change", (state) => this.render(state));
  }

  onShow() {
    if (this.vm.state.plants.length === 0 && !this.vm.state.error) {
      this.vm.init();
    } else {
      this.vm.reloadFavorites();
    }
  }

  render(state) {
    const isDetail = state.mode === "detail";
    this.els.listView.hidden = isDetail;
    this.els.detailView.hidden = !isDetail;

    this.els.filterChips.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.catalogFilter === state.viewFilter);
    });

    isDetail ? this.renderDetail(state) : this.renderList(state);
  }

  renderList(state) {
    const grid = this.els.grid;
    grid.innerHTML = "";

    if (state.loading) {
      grid.innerHTML = `<p class="empty-hint">Загрузка…</p>`;
      return;
    }
    if (state.error) {
      grid.innerHTML = `<p class="empty-hint">${state.error}</p>`;
      return;
    }

    const plants = this.vm.getVisiblePlants();
    if (plants.length === 0) {
      grid.innerHTML = state.viewFilter === "favorites"
        ? `<p class="empty-hint">Пока нет избранных растений — нажмите ★ на карточке, чтобы добавить</p>`
        : `<p class="empty-hint">Ничего не найдено — попробуйте другой запрос</p>`;
      return;
    }
    plants.forEach((plant) => grid.appendChild(this.buildCard(plant)));
  }

  buildCard(plant) {
    const card = document.createElement("div");
    card.className = "catalog-card";
    card.setAttribute("role", "button");
    card.tabIndex = 0;

    const isFav = this.vm.isFavorite(plant.id);

    card.innerHTML = `
      <div class="catalog-card-img-wrap">
        <img class="catalog-card-img" alt="">
        <button class="card-favorite-btn" title="В избранное">${isFav ? "★" : "☆"}</button>
        ${plant.isToxic ? '<span class="badge badge-toxic" title="Ядовито для животных">☠️</span>' : ""}
      </div>
      <div class="catalog-card-body">
        <div class="catalog-card-name"></div>
        <div class="icon-row">
          <span class="icon-chip" title="Полив">💧</span>
          <span class="icon-chip" title="Освещение">☀️</span>
        </div>
      </div>
    `;
    const img = card.querySelector(".catalog-card-img");
    img.src = plant.imageUrl || "";
    img.alt = plant.name;
    img.onerror = () => { img.style.display = "none"; };
    card.querySelector(".catalog-card-name").textContent = plant.name;

    const favBtn = card.querySelector(".card-favorite-btn");
    favBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.vm.toggleFavorite(plant.id);
    });

    card.addEventListener("click", () => this.vm.openDetail(plant.id));
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        this.vm.openDetail(plant.id);
      }
    });

    return card;
  }

  renderDetail(state) {
    const card = this.els.detailCard;

    if (!state.selectedPlant) {
      card.innerHTML = `<p class="empty-hint">${state.error || "Загрузка…"}</p>`;
      return;
    }

    const plant = state.selectedPlant;
    const isFav = this.vm.isFavorite(plant.id);

    card.innerHTML = `
      <div class="detail-header">
        <img class="detail-img" alt="">
        <div class="detail-header-info">
          <div class="detail-title-row">
            <h2 class="detail-name"></h2>
            <button class="favorite-btn" id="detailFavoriteBtn" title="В избранное">${isFav ? "★" : "☆"}</button>
          </div>
          <button class="btn-primary" id="detailAddBtn" ${state.addingToGarden ? "disabled" : ""}>
            ${state.addedToGarden ? "✓ В саду" : state.addingToGarden ? "Добавляем…" : "+ Добавить в мой сад"}
          </button>
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
    card.querySelector("#detailFavoriteBtn").addEventListener("click", () => this.vm.toggleFavorite(plant.id));
    card.querySelector("#detailAddBtn").addEventListener("click", () => this.vm.addSelectedToGarden());

    this.renderTabs(card, plant);

    const notesEl = card.querySelector("#detailNotes");
    if (plant.notes) {
      notesEl.innerHTML = `<h3 class="detail-notes-title">Особенности ухода</h3><p></p>`;
      notesEl.querySelector("p").textContent = plant.notes;
    }
  }

  renderTabs(card, plant) {
    const tabsWrap = card.querySelector(".tabs");
    const panelsWrap = card.querySelector(".tab-panels");

    const fieldsByTab = {
      care: [
        { icon: "💧", label: "Полив", value: plant.watering },
        { icon: "☀️", label: "Освещение", value: plant.light },
      ],
      repotting: [{ icon: "🌱", label: "Пересадка", value: plant.repotting }],
      danger: [{ icon: "⚠️", label: "Ядовитость", value: plant.toxicity }],
    };

    DETAIL_TABS.forEach((tab, i) => {
      const panel = document.createElement("div");
      panel.className = "tab-panel" + (i === 0 ? " active" : "");
      fieldsByTab[tab.id].forEach((f) => {
        const field = document.createElement("div");
        field.className = "detail-field";
        field.innerHTML = `<span class="detail-field-label">${f.icon} ${f.label}</span><p class="detail-field-value"></p>`;
        field.querySelector(".detail-field-value").textContent = f.value || "Нет данных";
        panel.appendChild(field);
      });
      panelsWrap.appendChild(panel);

      const tabBtn = document.createElement("button");
      tabBtn.className = "tab-btn" + (i === 0 ? " active" : "");
      tabBtn.textContent = tab.label;
      tabBtn.addEventListener("click", () => {
        tabsWrap.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
        panelsWrap.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("active"));
        tabBtn.classList.add("active");
        panel.classList.add("active");
      });
      tabsWrap.appendChild(tabBtn);
    });
  }
}