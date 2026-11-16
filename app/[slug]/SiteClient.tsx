'use client';

import { useEffect, useState } from 'react';

// Godziny z venue_details.hours (zapisuje je panel → Profil lokalu).
export type Hours = Record<string, { open: string; close: string; closed: boolean } | undefined>;

const DAYS = [
  ['mon', 'Poniedziałek'], ['tue', 'Wtorek'], ['wed', 'Środa'], ['thu', 'Czwartek'],
  ['fri', 'Piątek'], ['sat', 'Sobota'], ['sun', 'Niedziela'],
] as const;

const INK = '#1B1A19';
const STONE = '#F1EFEA';
const HAIR = 'rgba(27,26,25,0.18)';

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
  return (
    <span style={{ alignSelf: 'flex-start', padding: '8px 14px', borderRadius: 999, border: `1.5px solid ${STONE}`, fontWeight: 600, fontSize: 14 }}>
      {statusText(hours, now.day, now.hm)}
    </span>
  );
}

export function HoursList({ hours }: { hours: Hours }) {
  const now = useNow();
  return (
    <ul style={{ listStyle: 'none', margin: 0, padding: 0, borderTop: `2px solid ${INK}`, fontVariantNumeric: 'tabular-nums' }}>
      {DAYS.map(([key, name]) => {
        const t = hours[key];
        const today = now?.day === key;
        return (
          <li key={key} style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: `1px solid ${HAIR}`, fontSize: 17, fontWeight: today ? 700 : 400 }}>
            <span style={{ flexGrow: 1 }}>
              {name}
              {today && <span style={{ marginLeft: 10, padding: '2px 8px', borderRadius: 999, background: INK, color: STONE, fontSize: 12 }}>dziś</span>}
            </span>
            <span>{!t || t.closed ? 'zamknięte' : `${t.open}–${t.close}`}</span>
          </li>
        );
      })}
    </ul>
  );
}
