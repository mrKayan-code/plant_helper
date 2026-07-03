// js/services/mocks/AuthMockService.js

export class AuthMockService {
  constructor(tokenStorage) {
    this.tokenStorage = tokenStorage;
  }

  async register(email) {
    this.tokenStorage.set("mock-token");
    return { id: 1, email };
  }

  async login(email) {
    this.tokenStorage.set("mock-token");
    return { id: 1, email };
  }

  async me() {
    return { id: 1, email: "guest@example.com" };
  }

  logout() {
    this.tokenStorage.clear();
  }
}
