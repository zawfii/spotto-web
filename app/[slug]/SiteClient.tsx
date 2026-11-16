'use client';

import { useEffect, useState } from 'react';

// Godziny z venue_details.hours (zapisuje je panel → Profil lokalu).
export type Hours = Record<string, { open: string; close: string; closed: boolean } | undefined>;

const DAYS = [
  ['mon', 'Poniedziałek'], ['tue', 'Wtorek'], ['wed', 'Środa'], ['thu', 'Czwartek'],
  ['fri', 'Piątek'], ['sat', 'Sobota'], ['sun', 'Niedziela'],
] as const;

const NAVY = '#0A1A3F';
const CREAM = '#F8E6B8';
const ORANGE = '#E8431B';
const HAIR = 'rgba(248,230,184,0.28)';

// Dzień i godzina w Warszawie, liczone w przeglądarce — po hydracji, żeby serwer i klient się nie rozjechały.
function useNow() {
  const [now, setNow] = useState<{ day: string; hm: string } | null>(null);
  useEffect(() => {
    const d = new Date();
    setNow({
      day: d.toLocaleDateString('en-US', { timeZone: 'Europe/Warsaw', weekday: 'short' }).toLowerCase(),
      hm: d.toLocaleTimeString('en-GB', { timeZone: 'Europe/Warsaw', hour: '2-digit', minute: '2-digit' }),
    });
  }, []);
  return now;
}

/** „Otwarte teraz · do 22:00” / „Teraz zamknięte · dziś 12:00–22:00”. Zamknięcie po północy (close < open) też działa. */
export function statusText(hours: Hours, day: string, hm: string): string {
  const t = hours[day];
  if (!t || t.closed) return 'Dziś zamknięte';
  const open = t.close > t.open ? hm >= t.open && hm < t.close : hm >= t.open;
  return open ? `Otwarte teraz · do ${t.close}` : `Teraz zamknięte · dziś ${t.open}–${t.close}`;
}

export function OpenStatus({ hours }: { hours: Hours }) {
  const now = useNow();
  if (!now) return null;
  const text = statusText(hours, now.day, now.hm);
  return (
    <span style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 10, fontWeight: 600, fontSize: 17 }}>
      {/* Koło ze znaku: pełne, gdy otwarte; sam obrys, gdy zamknięte — stan czytelny też bez koloru. */}
      <span aria-hidden="true" style={{ width: 14, height: 14, boxSizing: 'border-box', borderRadius: 999, border: `2px solid ${ORANGE}`, background: text.startsWith('Otwarte') ? ORANGE : 'transparent' }} />
      {text}
    </span>
  );
}

export function HoursList({ hours }: { hours: Hours }) {
  const now = useNow();
  return (
    <ul style={{ listStyle: 'none', margin: 0, padding: 0, borderTop: `3px solid ${CREAM}`, fontVariantNumeric: 'tabular-nums' }}>
      {DAYS.map(([key, name]) => {
        const t = hours[key];
        const today = now?.day === key;
        return (
          <li key={key} style={{ minHeight: 52, display: 'flex', alignItems: 'center', gap: 12, borderBottom: `1px solid ${HAIR}`, fontSize: 19, fontWeight: today ? 800 : 400 }}>
            <span style={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
              {name}
              {today && <span style={{ padding: '2px 10px', borderRadius: 999, background: CREAM, color: NAVY, fontSize: 14, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' }}>dziś</span>}
            </span>
            <span>{!t || t.closed ? 'zamknięte' : `${t.open}–${t.close}`}</span>
          </li>
        );
      })}
    </ul>
  );
}
