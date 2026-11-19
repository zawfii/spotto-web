/**
 * Podpis zmiany względem poprzedniego okresu („+20% od poprzednich 30 dni”).
 * Obie liczby ≥ 20 → procent (0% → null); mniejsze → tylko wzrost w sztukach, spadek → null.
 */
export function statDelta(cur: number, prev: number, label: string): { text: string; up: boolean } | null {
  if (cur >= 20 && prev >= 20) {
    const pct = Math.round(((cur - prev) / prev) * 100);
    if (pct === 0) return null;
    return { text: `${pct > 0 ? '+' : '−'}${Math.abs(pct)}% ${label}`, up: pct > 0 };
  }
  return cur > prev ? { text: `+${cur - prev} ${label}`, up: true } : null;
}
