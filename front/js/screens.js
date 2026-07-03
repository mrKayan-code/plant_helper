// js/screens.js
// Переключение между <section class="screen">.
// Каждый экран при показе может определить window.onScreenShow[id] —
// функцию, которая перерисует его данные заново (а не один раз при загрузке).

const onScreenShow = {};

function showScreen(id) {
  document.querySelectorAll(".screen").forEach((el) => el.classList.remove("active"));
  document.querySelectorAll(".drawer-link").forEach((el) => el.classList.remove("active"));

  const target = document.getElementById(`screen-${id}`);
  if (target) target.classList.add("active");

  const link = document.querySelector(`.drawer-link[data-screen="${id}"]`);
  if (link) link.classList.add("active");

  if (typeof onScreenShow[id] === "function") onScreenShow[id]();

  closeDrawer();
}

// Клик по любой кнопке-ссылке на экран (в меню и внутри контента, напр. "Весь сад →")
document.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-screen]");
  if (btn) showScreen(btn.dataset.screen);
});