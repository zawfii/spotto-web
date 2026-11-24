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

// Jak ratingLabel w apce: słowo do oceny 1–10.
export function ratingLabel(v: number) {
  if (v >= 9) return 'Rewelacja';
  if (v >= 7) return 'Dobre';
  if (v >= 5) return 'Może być';
  if (v >= 3) return 'Słabe';
  return 'Nie polecam';
}

// Jak utils/relativeTime.ts w apce.
export function relativePl(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = 60_000, hour = 60 * min, day = 24 * hour;
  if (diff < min) return 'przed chwilą';
  if (diff < hour) { const n = Math.floor(diff / min); return `${n} ${pluralPl(n, 'minutę', 'minuty', 'minut')} temu`; }
  if (diff < day) { const n = Math.floor(diff / hour); return `${n} ${pluralPl(n, 'godzinę', 'godziny', 'godzin')} temu`; }
  const days = Math.floor(diff / day);
  if (days < 7) return `${days} ${pluralPl(days, 'dzień', 'dni', 'dni')} temu`;
  if (days < 30) { const n = Math.floor(days / 7); return `${n} ${pluralPl(n, 'tydzień', 'tygodnie', 'tygodni')} temu`; }
  if (days < 365) { const n = Math.max(1, Math.floor(days / 30.44)); return `${n} ${pluralPl(n, 'miesiąc', 'miesiące', 'miesięcy')} temu`; }
  const n = Math.max(1, Math.floor(days / 365.25));
  return `${n} ${pluralPl(n, 'rok', 'lata', 'lat')} temu`;
}

// Apka zapisuje danie z wariantem w nawiasie, czasem tym samym: „Pad Thai (Pad Thai)” → „Pad Thai”.
export function dishName(d: string) {
  const m = d.match(/^(.+?) \((.+)\)$/);
  return m && m[1].trim().toLowerCase() === m[2].trim().toLowerCase() ? m[1] : d;
}

// Jak formatPrice w apce (types/menu.ts).
export function formatPrice(price: number) {
  return `${Number(price).toLocaleString('pl-PL', { minimumFractionDigits: 2 })} zł`;
}

// Instagram z panelu właściciela (venue_details.instagram): nazwa konta, @nazwa albo link → link do profilu.
export function instagramUrl(value: string | null | undefined) {
  const v = (value ?? '').trim().replace(/^@/, '');
  const handle = v.match(/instagram\.com\/([A-Za-z0-9._]{1,30})/)?.[1] ?? (/^[A-Za-z0-9._]{1,30}$/.test(v) ? v : null);
  return handle ? `https://www.instagram.com/${handle}/` : null;
}

// Cena w karcie dań jak menuPrice w apce: „28 zł”, ale „23,90 zł”.
export function menuPrice(price: number) {
  const n = Number(price);
  return `${n.toLocaleString('pl-PL', { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 })} zł`;
}
