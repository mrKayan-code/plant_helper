import { config } from "../config.js";
import { daysWord } from "../utils/pluralize.js";

export class GardenView {
  constructor(viewModel) {
    this.vm = viewModel;

    this.els = {
      title: document.getElementById("gardenTitle"),
      searchInput: document.getElementById("gardenSearchInput"),
      viewGridBtn: document.getElementById("gardenViewGridBtn"),
      viewListBtn: document.getElementById("gardenViewListBtn"),
      content: document.getElementById("gardenContent"),

      drawerOverlay: document.getElementById("editDrawerOverlay"),
      drawer: document.getElementById("editDrawer"),
      editPlantName: document.getElementById("editPlantName"),
      editNote: document.getElementById("editNote"),
      editWaterInterval: document.getElementById("editWaterInterval"),
      editRepotInterval: document.getElementById("editRepotInterval"),
      editSaveBtn: document.getElementById("editSaveBtn"),
      editCancelBtn: document.getElementById("editCancelBtn"),
    };

    this._searchTimer = null;
    this.els.searchInput.addEventListener("input", () => {
      clearTimeout(this._searchTimer);
      const value = this.els.searchInput.value;
      this._searchTimer = setTimeout(() => this.vm.search(value), config.search.debounceMs);
    });

    this.els.viewGridBtn.addEventListener("click", () => this.vm.setViewMode("grid"));
    this.els.viewListBtn.addEventListener("click", () => this.vm.setViewMode("list"));

    this.els.drawerOverlay.addEventListener("click", () => this.vm.closeEdit());
    this.els.editCancelBtn.addEventListener("click", () => this.vm.closeEdit());
    this.els.editSaveBtn.addEventListener("click", () => this.vm.saveEdit());

    this.els.editNote.addEventListener("input", () => this.vm.updateEditField("note", this.els.editNote.value));
    this.els.editWaterInterval.addEventListener("input", () => this.vm.updateEditField("waterIntervalDays", this.els.editWaterInterval.value));
    this.els.editRepotInterval.addEventListener("input", () => this.vm.updateEditField("repotIntervalDays", this.els.editRepotInterval.value));

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.vm.state.editingId !== null) this.vm.closeEdit();
    });

    this.vm.on("change", (state) => this.render(state));
  }

  onShow() {
    this.vm.load();
  }

  render(state) {
    this.els.viewGridBtn.classList.toggle("active", state.viewMode === "grid");
    this.els.viewListBtn.classList.toggle("active", state.viewMode === "list");

    this.renderContent(state);
    this.renderEditDrawer(state);
  }

  renderContent(state) {
    const content = this.els.content;

    if (state.loading) {
      this.els.title.textContent = "Моя коллекция";
      content.className = "garden-grid";
      content.innerHTML = `<p class="empty-hint">Загрузка…</p>`;
      return;
    }
    if (state.error) {
      this.els.title.textContent = "Моя коллекция";
      content.className = "garden-grid";
      content.innerHTML = `<p class="empty-hint">${state.error}</p>`;
      return;
    }

    this.els.title.textContent = `Моя коллекция (${state.items.length} растений)`;

    const items = this.vm.getVisibleItems();
    content.className = state.viewMode === "grid" ? "garden-grid" : "garden-list";
    content.innerHTML = "";

    if (items.length === 0) {
      content.innerHTML = state.query
        ? `<p class="empty-hint">Ничего не найдено по запросу «${state.query}»</p>`
        : `<p class="empty-hint">В саду пока пусто — добавьте растение из энциклопедии</p>`;
      return;
    }

    items.forEach((item) => {
      content.appendChild(
        state.viewMode === "grid" ? this.buildGridCard(item) : this.buildListRow(item)
      );
    });
  }

  buildBadgesHTML(item) {
    const status = this.vm.getCareStatus(item);
    return this.formatCareBadge("water", status.water) + this.formatCareBadge("repot", status.repot);
  }

  formatCareBadge(action, status) {
    const icon = action === "water" ? "💧" : "🪴";
    const label = action === "water" ? "Полить" : "Пересадить";

    if (!status.tracked) {
      return `<span class="garden-badge garden-badge--muted">${icon} Не отслеживается</span>`;
    }

    const { daysLeft } = status;

    if (daysLeft < 0) {
      const overdueBy = Math.abs(daysLeft);
      return `<span class="garden-badge garden-badge--urgent">${icon} ${label}: просрочено на ${overdueBy} ${daysWord(overdueBy)}</span>`;
    }
    if (daysLeft === 0) {
      return `<span class="garden-badge garden-badge--urgent">${icon} ${label} сегодня</span>`;
    }
    if (daysLeft === 1) {
      return `<span class="garden-badge garden-badge--soon">${icon} ${label} завтра</span>`;
    }
    return `<span class="garden-badge garden-badge--ok">${icon} через ${daysLeft} ${daysWord(daysLeft)}</span>`;
  }

  buildActions(item) {
    const wrap = document.createElement("div");
    wrap.className = "garden-actions";
    wrap.innerHTML = `
      <button class="icon-btn" data-action="water" title="Полить">💧</button>
      <button class="icon-btn" data-action="repot" title="Пересадить">🪴</button>
      <button class="icon-btn" data-action="edit" title="Редактировать">✏️</button>
      <button class="icon-btn icon-btn--danger" data-action="delete" title="Удалить">🗑️</button>
    `;
    wrap.querySelector('[data-action="water"]').addEventListener("click", () => this.vm.markWatered(item.id));
    wrap.querySelector('[data-action="repot"]').addEventListener("click", () => this.vm.markRepotted(item.id));
    wrap.querySelector('[data-action="edit"]').addEventListener("click", () => this.vm.openEdit(item.id));
    wrap.querySelector('[data-action="delete"]').addEventListener("click", () => {
      if (confirm(`Удалить «${item.plant.name}» из сада?`)) this.vm.deleteItem(item.id);
    });
    return wrap;
  }

  buildGridCard(item) {
    const card = document.createElement("div");
    card.className = "garden-card";
    const isFav = this.vm.isFavorite(item.plant.id);
    card.innerHTML = `
      <div class="garden-card-img-wrap">
        <img class="garden-card-img" alt="">
        <button class="card-favorite-btn" title="В избранное">${isFav ? "★" : "☆"}</button>
      </div>
      <div class="garden-card-body">
        <div class="garden-card-name"></div>
        <div class="garden-card-note"></div>
        <div class="garden-badges">${this.buildBadgesHTML(item)}</div>
      </div>
    `;
    const img = card.querySelector(".garden-card-img");
    img.src = item.plant.imageUrl || "";
    img.alt = item.plant.name;
    img.onerror = () => { img.style.display = "none"; };
    card.querySelector(".garden-card-name").textContent = item.plant.name;
    card.querySelector(".garden-card-note").textContent = item.note || "Без заметок";
    card.querySelector(".card-favorite-btn").addEventListener("click", () => this.vm.toggleFavorite(item.plant.id));
    card.querySelector(".garden-card-body").appendChild(this.buildActions(item));
    return card;
  }

  buildListRow(item) {
    const row = document.createElement("div");
    row.className = "garden-row";
    const isFav = this.vm.isFavorite(item.plant.id);
    row.innerHTML = `
      <img class="garden-row-img" alt="">
      <div class="garden-row-info">
        <div class="garden-row-top">
          <span class="garden-row-name"></span>
        </div>
        <div class="garden-row-note"></div>
        <div class="garden-badges">${this.buildBadgesHTML(item)}</div>
      </div>
      <button class="card-favorite-btn card-favorite-btn--inline" title="В избранное">${isFav ? "★" : "☆"}</button>
    `;
    const img = row.querySelector(".garden-row-img");
    img.src = item.plant.imageUrl || "";
    img.alt = item.plant.name;
    img.onerror = () => { img.style.display = "none"; };
    row.querySelector(".garden-row-name").textContent = item.plant.name;
    row.querySelector(".garden-row-note").textContent = item.note || "Без заметок";
    row.querySelector(".card-favorite-btn").addEventListener("click", () => this.vm.toggleFavorite(item.plant.id));
    row.appendChild(this.buildActions(item));
    return row;
  }

  renderEditDrawer(state) {
    const isOpen = state.editingId !== null;
    this.els.drawerOverlay.hidden = !isOpen;
    this.els.drawer.classList.toggle("open", isOpen);

    if (!isOpen) return;

    const item = state.items.find((i) => i.id === state.editingId);
    if (!item) return;

    this.els.editPlantName.textContent = item.plant.name;

    if (document.activeElement !== this.els.editNote) {
      this.els.editNote.value = state.editForm.note;
    }
    if (document.activeElement !== this.els.editWaterInterval) {
      this.els.editWaterInterval.value = state.editForm.waterIntervalDays;
    }
    if (document.activeElement !== this.els.editRepotInterval) {
      this.els.editRepotInterval.value = state.editForm.repotIntervalDays;
    }

    this.els.editSaveBtn.disabled = state.saving;
    this.els.editSaveBtn.textContent = state.saving ? "Сохраняем…" : "Сохранить";
  }
}