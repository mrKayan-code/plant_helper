import { ServiceContainer } from "./services/ServiceContainer.js";
import { Router } from "./core/Router.js";

import { AuthViewModel } from "./viewmodels/AuthViewModel.js";
import { HomeViewModel } from "./viewmodels/HomeViewModel.js";
import { CatalogViewModel } from "./viewmodels/CatalogViewModel.js";
import { GardenViewModel } from "./viewmodels/GardenViewModel.js";
import { TasksViewModel } from "./viewmodels/TasksViewModel.js";
import { CareConfirmViewModel } from "./viewmodels/CareConfirmViewModel.js";

import { AccountView } from "./views/AccountView.js";
import { HomeView } from "./views/HomeView.js";
import { CatalogView } from "./views/CatalogView.js";
import { GardenView } from "./views/GardenView.js";
import { TasksView } from "./views/TasksView.js";
import { CareConfirmView } from "./views/CareConfirmView.js";


const container = new ServiceContainer();
const router = new Router();

const authViewModel = new AuthViewModel(container.authService, container.tokenStorage);

container.onUnauthorized = () => authViewModel.logout();

new AccountView(authViewModel);
authViewModel.init();

const careConfirmViewModel = new CareConfirmViewModel(container.collectionStore, container.notifier);
new CareConfirmView(careConfirmViewModel);

const homeViewModel = new HomeViewModel(container.collectionStore, container.remindersStore);
router.register("home", new HomeView(homeViewModel));

const catalogViewModel = new CatalogViewModel(
  container.plantsService,
  container.favoritesStore,
  container.collectionStore,
  container.notifier
);
router.register("catalog", new CatalogView(catalogViewModel));

const gardenViewModel = new GardenViewModel(
  container.collectionStore,
  container.favoritesStore,
  container.notifier,
  careConfirmViewModel
);
router.register("garden", new GardenView(gardenViewModel));

const tasksViewModel = new TasksViewModel(
  container.collectionStore,
  container.remindersStore,
  container.notifier,
  careConfirmViewModel
);
router.register("tasks", new TasksView(tasksViewModel));

let wasAuthenticated = authViewModel.state.isAuthenticated;
authViewModel.on("change", (state) => {
  if (state.isAuthenticated === wasAuthenticated) return;
  wasAuthenticated = state.isAuthenticated;

  if (state.isAuthenticated) {
    container.collectionStore.load().catch(() => {});
    container.favoritesStore.load().catch(() => {});
    container.remindersStore.load().catch(() => {});
  } else {
    container.collectionStore.clear();
    container.favoritesStore.clear();
    container.remindersStore.clear();
  }
});

router.show("home");