// js/menu.js
const drawer = document.getElementById("drawer");
const drawerOverlay = document.getElementById("drawerOverlay");
const burgerBtn = document.getElementById("burgerBtn");

function openDrawer() {
  drawer.classList.add("open");
  drawerOverlay.classList.add("visible");
  burgerBtn.setAttribute("aria-expanded", "true");
}

function closeDrawer() {
  drawer.classList.remove("open");
  drawerOverlay.classList.remove("visible");
  burgerBtn.setAttribute("aria-expanded", "false");
}

burgerBtn.addEventListener("click", () => {
  const isOpen = drawer.classList.contains("open");
  isOpen ? closeDrawer() : openDrawer();
});

drawerOverlay.addEventListener("click", closeDrawer);

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeDrawer();
});