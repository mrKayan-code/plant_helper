export class AuthApiService {
  constructor(httpClient, tokenStorage) {
    this.http = httpClient;
    this.tokenStorage = tokenStorage;
  }

  async register(email, password) {
    const res = await this.http.post("/auth/register", { email, password });
    this.tokenStorage.set(res.token);
    return res.user;
  }

  async login(email, password) {
    const res = await this.http.post("/auth/login", { email, password });
    this.tokenStorage.set(res.token);
    return res.user;
  }

  async me() {
    return this.http.get("/auth/me");
  }

  logout() {
    this.tokenStorage.clear();
  }
}
