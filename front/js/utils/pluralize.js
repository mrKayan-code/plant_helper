// js/utils/pluralize.js
// Склонение существительных после числительных (русский язык):
// 1 день, 2 дня, 5 дней, 21 день...

export function pluralize(n, one, few, many) {
  const abs = Math.abs(n) % 100;
  const last = abs % 10;
  if (abs > 10 && abs < 20) return many;
  if (last === 1) return one;
  if (last >= 2 && last <= 4) return few;
  return many;
}

export function daysWord(n) {
  return pluralize(n, "день", "дня", "дней");
}