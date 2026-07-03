import { ServiceContainer } from "./services/ServiceContainer.js";
import { Router } from "./core/Router.js";

import { AuthViewModel } from "./viewmodels/AuthViewModel.js";
import { HomeViewModel } from "./viewmodels/HomeViewModel.js";
import { CatalogViewModel } from "./viewmodels/CatalogViewModel.js";
import { GardenViewModel } from "./viewmodels/GardenViewModel.js";
import { TasksViewModel } from "./viewmodels/TasksViewModel.js";

import { AccountView } from "./views/AccountView.js";
import { HomeView } from "./views/HomeView.js";
import { CatalogView } from "./views/CatalogView.js";
import { GardenView } from "./views/GardenView.js";
import { TasksView } from "./views/TasksView.js";


const container = new ServiceContainer();
const router = new Router();

const authViewModel = new AuthViewModel(container.authService, container.tokenStorage);

container.onUnauthorized = () => authViewModel.logout();

new AccountView(authViewModel);
authViewModel.init();

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
  container.notifier
);
router.register("garden", new GardenView(gardenViewModel));

const tasksViewModel = new TasksViewModel(
  container.remindersService,
  container.collectionService,
  container.notifier
);
router.register("tasks", new TasksView(tasksViewModel));

let wasAuthenticated = authViewModel.state.isAuthenticated;
authViewModel.on("change", (state) => {
  if (state.isAuthenticated !== wasAuthenticated) {
    wasAuthenticated = state.isAuthenticated;
    homeViewModel.load();
    gardenViewModel.load();
    tasksViewModel.load();
  }
});

router.show("home");