// js/services/mocks/mockData.js
// Тестовые данные для ресурсов, которые бэк ещё не отдаёт.
// Форма один в один повторяет контракт из ../../plan.md, чтобы переход
// на реальный API не потребовал правок ни в ViewModel, ни в View.

export const mockCollectionSeed = [
  {
    id: 1,
    addedAt: "2026-06-25",
    note: "Стоит на подоконнике кухни",
    waterIntervalDays: 5,
    repotIntervalDays: null,
    lastWateredAt: "2026-06-27",
    lastRepottedAt: null,
    plant: {
      id: 1, name: "Монстера",
      watering: "Раз в 5–7 дней, когда верхний слой грунта подсох на 2–3 см",
      light: "Яркий рассеянный свет, без прямых лучей",
      repotting: "Раз в 1–2 года весной, в горшок побольше",
      toxicity: "Ядовита для кошек и собак (оксалаты кальция)",
      notes: "Любит опрыскивание и опору для воздушных корней",
      waterIntervalDays: 7, repotIntervalDays: 540,
      imageUrl: "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=300",
    },
  },
  {
    id: 2,
    addedAt: "2026-06-20",
    note: "Подарок от мамы",
    waterIntervalDays: 14,
    repotIntervalDays: null,
    lastWateredAt: "2026-06-18",
    lastRepottedAt: null,
    plant: {
      id: 2, name: "Сансевиерия",
      watering: "Раз в 2–3 недели, грунт должен полностью просыхать",
      light: "Переносит тень и яркий свет",
      repotting: "Раз в 2–3 года",
      toxicity: "Слабо токсична при поедании",
      notes: "Одно из самых неприхотливых растений",
      waterIntervalDays: 18, repotIntervalDays: 900,
      imageUrl: "https://images.unsplash.com/photo-1572688984406-975f8a3a0b7c?w=300",
    },
  },
  {
    id: 3,
    addedAt: "2026-06-29",
    note: "",
    waterIntervalDays: null,
    repotIntervalDays: null,
    lastWateredAt: "2026-07-02",
    lastRepottedAt: "2026-01-10",
    plant: {
      id: 3, name: "Фикус лировидный",
      watering: "Раз в 7–9 дней летом, реже зимой",
      light: "Яркий рассеянный свет",
      repotting: "Раз в 1–2 года",
      toxicity: "Ядовит для кошек и собак",
      notes: "Не любит переставление и сквозняки",
      waterIntervalDays: 8, repotIntervalDays: 400,
      imageUrl: "https://images.unsplash.com/photo-1614594895304-fe7116ef2ab7?w=300",
    },
  },
];
