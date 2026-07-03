// js/app.js
import { ServiceContainer } from "./services/ServiceContainer.js";
import { Router } from "./core/Router.js";

import { HomeViewModel } from "./viewmodels/HomeViewModel.js";
import { CatalogViewModel } from "./viewmodels/CatalogViewModel.js";

import { HomeView } from "./views/HomeView.js";
import { CatalogView } from "./views/CatalogView.js";

// Composition root: единственное место во всём приложении, где создаются
// конкретные объекты и связываются друг с другом через конструкторы.
// Ни ViewModel, ни View не создают себе зависимости сами — это и есть
// Dependency Injection (без фреймворка, но принцип тот же).

const container = new ServiceContainer();
const router = new Router();

// Если токен протух в любом месте приложения — возвращаемся на главную
// (отдельного экрана логина пока нет, появится вместе с реальным /auth).
container.onUnauthorized = () => router.show("home");

const homeViewModel = new HomeViewModel(container.collectionService, container.remindersService);
router.register("home", new HomeView(homeViewModel));

const catalogViewModel = new CatalogViewModel(
  container.plantsService,
  container.favoritesService,
  container.collectionService,
  container.notifier
);
router.register("catalog", new CatalogView(catalogViewModel));

// Экран по умолчанию.
router.show("home");
