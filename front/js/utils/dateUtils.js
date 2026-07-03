// js/utils/dateUtils.js

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function addDaysISO(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
