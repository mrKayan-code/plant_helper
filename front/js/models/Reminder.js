export class Reminder {
  constructor({ collectionId, plantId, name, action, dueDate }) {
    this.collectionId = collectionId;
    this.plantId = plantId;
    this.name = name;
    this.action = action;
    this.dueDate = dueDate;
  }

  static fromJSON(json) {
    return new Reminder(json);
  }
}
