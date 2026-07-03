// js/app.js
import { ServiceContainer } from "./services/ServiceContainer.js";
import { Router } from "./core/Router.js";

import { AuthViewModel } from "./viewmodels/AuthViewModel.js";
import { HomeViewModel } from "./viewmodels/HomeViewModel.js";
import { CatalogViewModel } from "./viewmodels/CatalogViewModel.js";
import { GardenViewModel } from "./viewmodels/GardenViewModel.js";

import { AccountView } from "./views/AccountView.js";
import { HomeView } from "./views/HomeView.js";
import { CatalogView } from "./views/CatalogView.js";
import { GardenView } from "./views/GardenView.js";

// Composition root: единственное место во всём приложении, где создаются
// конкретные объекты и связываются друг с другом через конструкторы.
// Ни ViewModel, ни View не создают себе зависимости сами — это и есть
// Dependency Injection (без фреймворка, но принцип тот же).

const container = new ServiceContainer();
const router = new Router();

const authViewModel = new AuthViewModel(container.authService, container.tokenStorage);

// Если токен протух при попытке защищённого запроса — тихо разлогиниваем
// (кнопка вернётся в состояние "Войти"), но модалку НЕ открываем сами:
// это должно быть решением пользователя, а не принудительным попапом на
// каждой фоновой загрузке данных (иначе теряется весь смысл отказа от
// блокирующих ворот).
container.onUnauthorized = () => authViewModel.logout();

new AccountView(authViewModel);

const homeViewModel = new HomeViewModel(container.collectionService, container.remindersService);
router.register("home", new HomeView(homeViewModel));

const catalogViewModel = new CatalogViewModel(
  container.plantsService,
  container.favoritesService,
  container.collectionService,
  container.notifier
);
router.register("catalog", new CatalogView(catalogViewModel));

const gardenViewModel = new GardenViewModel(
  container.collectionService,
  container.favoritesService,
  container.remindersService,
  container.notifier
);
router.register("garden", new GardenView(gardenViewModel));

// HomeViewModel/GardenViewModel обновляются только при показе своего экрана
// (onShow). Если человек уже находится на одном из них и логинится/
// разлогинивается через модалку — экран сам об этом не узнает. Поэтому
// дополнительно перезагружаем данные при каждой смене статуса авторизации
// (но не при каждом открытии/закрытии модалки — для этого сравниваем
// с предыдущим значением isAuthenticated).
let wasAuthenticated = authViewModel.state.isAuthenticated;
authViewModel.on("change", (state) => {
  if (state.isAuthenticated !== wasAuthenticated) {
    wasAuthenticated = state.isAuthenticated;
    homeViewModel.load();
    gardenViewModel.load();
  }
});

// Приложение больше не блокируется до входа — справочник и общая
// навигация доступны сразу, экран по умолчанию — Главная.
router.show("home");
