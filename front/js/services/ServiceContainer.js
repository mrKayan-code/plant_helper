// js/services/ServiceContainer.js
import { config } from "../config.js";
import { TokenStorage } from "../core/TokenStorage.js";
import { Notifier } from "../core/Notifier.js";
import { HttpClient } from "../core/HttpClient.js";

import { PlantsApiService } from "./PlantsApiService.js";
import { CollectionApiService } from "./CollectionApiService.js";
import { FavoritesApiService } from "./FavoritesApiService.js";
import { RemindersApiService } from "./RemindersApiService.js";
import { AuthApiService } from "./AuthApiService.js";

import { CollectionMockService } from "./mocks/CollectionMockService.js";
import { FavoritesMockService } from "./mocks/FavoritesMockService.js";
import { RemindersMockService } from "./mocks/RemindersMockService.js";
import { AuthMockService } from "./mocks/AuthMockService.js";

import { CollectionStore } from "../stores/CollectionStore.js";
import { FavoritesStore } from "../stores/FavoritesStore.js";
import { RemindersStore } from "../stores/RemindersStore.js";

// Composition root: единственное место во всём приложении, где решается,
// какая реализация сервиса (реальная или мок) используется. ViewModel
// получает уже готовый объект через конструктор и понятия не имеет,
// откуда он взялся (Dependency Inversion Principle из SOLID).
//
// Чтобы включить реальный /collection, когда бэк его доделает — меняете
// config.useMocks.collection на false. Ни один файл вне этого класса
// трогать не нужно.
export class ServiceContainer {
  constructor() {
    this.tokenStorage = new TokenStorage();
    this.notifier = new Notifier("toast", config.toastDurationMs);

    this.http = new HttpClient(
      config.apiBaseUrl,
      this.tokenStorage,
      this.notifier,
      () => this.onUnauthorized?.()
    );

    // Справочник — всегда реальный API, бэк отдаёт его с первого коммита.
    this.plantsService = new PlantsApiService(this.http);

    this.collectionService = config.useMocks.collection
      ? new CollectionMockService(this.plantsService)
      : new CollectionApiService(this.http);

    this.favoritesService = config.useMocks.favorites
      ? new FavoritesMockService(this.plantsService)
      : new FavoritesApiService(this.http);

    this.remindersService = config.useMocks.reminders
      ? new RemindersMockService(this.collectionService)
      : new RemindersApiService(this.http);

    this.authService = config.useMocks.auth
      ? new AuthMockService(this.tokenStorage)
      : new AuthApiService(this.http, this.tokenStorage);

    // --- Сторы: единый источник правды для доменных данных ---
    // Один экземпляр на всё приложение (singleton через контейнер).
    // ViewModel'и читают отсюда и подписываются, вместо своей копии.
    this.collectionStore = new CollectionStore(this.collectionService);
    this.favoritesStore = new FavoritesStore(this.favoritesService);
    // remindersStore зависит от collectionStore (производное состояние)
    this.remindersStore = new RemindersStore(this.remindersService, this.collectionStore);
  }
}
