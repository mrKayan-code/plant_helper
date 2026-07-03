export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function addDaysISO(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function daysBetweenISO(fromISO, toISO) {
  const from = new Date(fromISO + "T00:00:00Z");
  const to = new Date(toISO + "T00:00:00Z");
  return Math.round((to - from) / (1000 * 60 * 60 * 24));
}