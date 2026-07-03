import { Reminder } from "../models/Reminder.js";

export class RemindersApiService {
  constructor(httpClient) {
    this.http = httpClient;
  }

  async getAll() {
    const json = await this.http.get("/reminders");
    return json.map(Reminder.fromJSON);
  }
}
