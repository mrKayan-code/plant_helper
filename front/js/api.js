const API_BASE = "http://localhost:3000/api";

const MOCKS_ENABLED = {
  auth: true,
  collection: true,
  favorites: true,
  reminders: true,
};

function getToken() {
  return localStorage.getItem("token");
}

function showToast(message) {
  const el = document.getElementById("toast");
  if (!el) return;
  el.textContent = message;
  el.classList.add("visible");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => el.classList.remove("visible"), 3000);
}

async function api(path, { method = "GET", body } = {}) {
  if (MOCKS_ENABLED.collection && path.startsWith("/collection")) {
    return mockCollection(path, method, body);
  }
  if (MOCKS_ENABLED.reminders && path.startsWith("/reminders")) {
    return mockReminders();
  }
  if (MOCKS_ENABLED.favorites && path.startsWith("/favorites")) {
    return mockFavorites(path, method, body);
  }
  if (MOCKS_ENABLED.auth && path.startsWith("/auth")) {
    return mockAuth(path, body);
  }

  const headers = {};
  if (body) headers["Content-Type"] = "application/json";
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(API_BASE + path, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (networkErr) {
    showToast("Нет связи с сервером — проверьте, запущен ли бэк");
    throw networkErr;
  }

  if (res.status === 401) {
    localStorage.removeItem("token");
    showToast("Сессия истекла, войдите заново");
    showScreen("home"); 
    throw new Error("Unauthorized");
  }

  if (res.status === 204) return null;

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    showToast(err.error || `Ошибка ${res.status}`);
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  return res.json();
}


let _mockCollectionData = [
  {
    id: 1,
    addedAt: "2026-06-25",
    note: "Стоит на подоконнике кухни",
    waterIntervalDays: 5,
    repotIntervalDays: null,
    lastWateredAt: "2026-06-27",
    lastRepottedAt: null,
    plant: {
      id: 1,
      name: "Монстера",
      watering: "Раз в 5–7 дней, когда верхний слой грунта подсох на 2–3 см",
      light: "Яркий рассеянный свет, без прямых лучей",
      repotting: "Раз в 1–2 года весной, в горшок побольше",
      toxicity: "Ядовита для кошек и собак (оксалаты кальция)",
      notes: "Любит опрыскивание и опору для воздушных корней",
      waterIntervalDays: 7,
      repotIntervalDays: 540,
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
      id: 2,
      name: "Сансевиерия",
      watering: "Раз в 2–3 недели, грунт должен полностью просыхать",
      light: "Переносит тень и яркий свет",
      repotting: "Раз в 2–3 года",
      toxicity: "Слабо токсична при поедании",
      notes: "Одно из самых неприхотливых растений",
      waterIntervalDays: 18,
      repotIntervalDays: 900,
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
      id: 3,
      name: "Фикус лировидный",
      watering: "Раз в 7–9 дней летом, реже зимой",
      light: "Яркий рассеянный свет",
      repotting: "Раз в 1–2 года",
      toxicity: "Ядовит для кошек и собак",
      notes: "Не любит переставление и сквозняки",
      waterIntervalDays: 8,
      repotIntervalDays: 400,
      imageUrl: "https://images.unsplash.com/photo-1614594895304-fe7116ef2ab7?w=300",
    },
  },
];

function daysAgo(dateStr) {
  const ms = Date.now() - new Date(dateStr).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}
function addDaysISO(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function mockCollection(path, method, body) {
  if (method === "GET") return Promise.resolve(structuredClone(_mockCollectionData));

  const idMatch = path.match(/^\/collection\/(\d+)(\/(watered|repotted))?$/);

  if (method === "POST" && path === "/collection") {
    const plant = state.plants.find((p) => p.id === body.plantId);
    const item = {
      id: Date.now(),
      addedAt: new Date().toISOString().slice(0, 10),
      note: body.note || "",
      waterIntervalDays: body.waterIntervalDays ?? null,
      repotIntervalDays: body.repotIntervalDays ?? null,
      lastWateredAt: null,
      lastRepottedAt: null,
      plant: plant || { id: body.plantId, name: "Растение" },
    };
    _mockCollectionData.push(item);
    return Promise.resolve(structuredClone(item));
  }

  if (idMatch && method === "POST" && idMatch[3] === "watered") {
    const item = _mockCollectionData.find((c) => c.id === Number(idMatch[1]));
    if (item) item.lastWateredAt = new Date().toISOString().slice(0, 10);
    return Promise.resolve(structuredClone(item));
  }

  if (idMatch && method === "POST" && idMatch[3] === "repotted") {
    const item = _mockCollectionData.find((c) => c.id === Number(idMatch[1]));
    if (item) item.lastRepottedAt = new Date().toISOString().slice(0, 10);
    return Promise.resolve(structuredClone(item));
  }

  if (idMatch && method === "PATCH") {
    const item = _mockCollectionData.find((c) => c.id === Number(idMatch[1]));
    if (item) Object.assign(item, body);
    return Promise.resolve(structuredClone(item));
  }

  if (idMatch && method === "DELETE") {
    _mockCollectionData = _mockCollectionData.filter((c) => c.id !== Number(idMatch[1]));
    return Promise.resolve(null);
  }

  return Promise.resolve(null);
}

function mockReminders() {
  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = addDaysISO(today, 1);
  const out = [];

  for (const item of _mockCollectionData) {
    const waterInterval = item.waterIntervalDays ?? item.plant.waterIntervalDays;
    if (item.lastWateredAt && waterInterval) {
      const due = addDaysISO(item.lastWateredAt, waterInterval);
      if (due <= tomorrow) {
        out.push({
          collectionId: item.id,
          plantId: item.plant.id,
          name: item.plant.name,
          action: "water",
          dueDate: due,
        });
      }
    }
    const repotInterval = item.repotIntervalDays ?? item.plant.repotIntervalDays;
    if (item.lastRepottedAt && repotInterval) {
      const due = addDaysISO(item.lastRepottedAt, repotInterval);
      if (due <= tomorrow) {
        out.push({
          collectionId: item.id,
          plantId: item.plant.id,
          name: item.plant.name,
          action: "repot",
          dueDate: due,
        });
      }
    }
  }
  return Promise.resolve(out);
}

let _mockFavoriteIds = new Set([1]);

function mockFavorites(path, method, body) {
  if (method === "GET") {
    return Promise.resolve(
      state.plants.filter((p) => _mockFavoriteIds.has(p.id))
    );
  }
  if (method === "POST") {
    _mockFavoriteIds.add(body.plantId);
    return Promise.resolve(null);
  }
  if (method === "DELETE") {
    const id = Number(path.split("/").pop());
    _mockFavoriteIds.delete(id);
    return Promise.resolve(null);
  }
  return Promise.resolve(null);
}

function mockAuth(path, body) {
  if (path === "/auth/register" || path === "/auth/login") {
    return Promise.resolve({
      token: "mock-token",
      user: { id: 1, email: body?.email || "guest@example.com" },
    });
  }
  if (path === "/auth/me") {
    return Promise.resolve({ id: 1, email: "guest@example.com" });
  }
  return Promise.resolve(null);
}