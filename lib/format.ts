// Jak utils/plural.ts w apce.
export function pluralPl(n: number, one: string, few: string, many: string) {
  const abs = Math.abs(n);
  if (abs === 1) return one;
  const last = abs % 10;
  const lastTwo = abs % 100;
  return last >= 2 && last <= 4 && !(lastTwo >= 12 && lastTwo <= 14) ? few : many;
}

// Jak ratingColor w apce (components/RatingSlider.tsx).
export function ratingColor(v: number) {
  if (v >= 8) return '#2E7D32';
  if (v >= 5) return '#D4892A';
  return '#ff751f';
}
