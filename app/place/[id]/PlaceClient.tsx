'use client';

import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';

// Zdjęcie dania jest linkowane ze strony lokalu i może zniknąć — wtedy chowamy je jak w apce.
export function DishThumb({ src }: { src: string }) {
  const [broken, setBroken] = useState(false);
  if (broken) return null;
  // Leniwe ładowanie: obrazek startuje po hydracji, więc onError zdąży się podpiąć.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" loading="lazy" onError={() => setBroken(true)} style={{ width: 56, height: 56, borderRadius: 12, objectFit: 'cover', flexShrink: 0 }} />;
}

export type BridgePlace = {
  id: string;
  name: string;
  meta: string;
  imageUrl: string | null;
  spootRating: string | null;
  googleRating: string | null;
};

const GREEN = '#164938';
const INK = '#03271a';
const INK2 = '#1e3028';
const CARD = '#eae5de';
const HAIR = 'rgba(3,39,26,0.15)';
const MANROPE = 'var(--font-manrope), sans-serif';

export function PlaceCard({ place }: { place: BridgePlace }) {
  const hasBadges = place.spootRating || place.googleRating;
  return (
    <div style={{ width: '100%', borderRadius: 24, overflow: 'hidden', background: CARD }}>
      {place.imageUrl ? (
        <div style={{ position: 'relative', height: 220 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={place.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '14px 16px', background: 'rgba(0,0,0,0.55)', color: '#fff', display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontFamily: MANROPE, fontWeight: 700, fontSize: 22 }}>{place.name}</span>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>{place.meta}</span>
          </div>
        </div>
      ) : (
        <div style={{ padding: '16px 16px 0', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontFamily: MANROPE, fontWeight: 700, fontSize: 22 }}>{place.name}</span>
          <span style={{ fontSize: 13, color: INK2 }}>{place.meta}</span>
        </div>
      )}
      {hasBadges ? <div style={{ display: 'flex', gap: 8, padding: '12px 16px' }}><Badges place={place} /></div> : <div style={{ height: 16 }} />}
    </div>
  );
}

export function Badges({ place }: { place: BridgePlace }) {
  const base: CSSProperties = { display: 'inline-flex', gap: 4, alignItems: 'center', borderRadius: 999, padding: '3px 9px', fontFamily: MANROPE, fontWeight: 700, fontSize: 12 };
  return (
    <>
      {place.spootRating && (
        <span role="img" aria-label={`Ocena Spoot: ${place.spootRating}`} style={{ ...base, background: GREEN, color: '#fff' }}>
          <span aria-hidden="true">S</span><span aria-hidden="true">{place.spootRating}</span>
        </span>
      )}
      {place.googleRating && (
        <span role="img" aria-label={`Ocena Google: ${place.googleRating}`} style={{ ...base, background: '#fff', color: INK, boxShadow: `inset 0 0 0 1px ${HAIR}` }}>
          <span aria-hidden="true">G</span><span aria-hidden="true">{place.googleRating}</span>
        </span>
      )}
    </>
  );
}

type Today = { day: string; text: ReactNode };

function describeToday(days: string[]): Today | null {
  const now = new Date();
  const fmt = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('pl-PL', { timeZone: 'Europe/Warsaw', ...o }).format(now);
  const day = fmt({ weekday: 'long' });
  const line = days.find((d) => d.toLowerCase().startsWith(day));
  if (!line) return null;
  const value = line.slice(line.indexOf(':') + 1).trim();
  const ranges = Array.from(value.matchAll(/(\d{1,2}):(\d{2})\s*[–-]\s*(\d{1,2}):(\d{2})/g));
  if (!ranges.length) return { day, text: `Dziś: ${value}` };
  const [h, m] = fmt({ hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).split(':').map(Number);
  const nowMin = h * 60 + m;
  // ponytail: nie widzi wczorajszej zmiany trwającej po północy (bar „do 2:00” o 1:00 pokaże „Zamknięte”);
  // do poprawy, jeśli takich lokali będzie dużo.
  const open = ranges.find(([, sh, sm, eh, em]) => {
    const start = +sh * 60 + +sm;
    let end = +eh * 60 + +em;
    if (end <= start) end += 24 * 60;
    return nowMin >= start && nowMin < end;
  });
  return open
    ? { day, text: <><strong style={{ fontWeight: 600, color: '#2e7d32' }}>Otwarte</strong> · do {open[3]}:{open[4]}</> }
    : { day, text: <><strong style={{ fontWeight: 600 }}>Zamknięte</strong> · dziś {value}</> };
}

export function TodayHours({ hours }: { hours: string }) {
  const days = hours.split(';').map((s) => s.trim()).filter(Boolean);
  const [today, setToday] = useState<Today | null>(null);
  // Dzień i godzina liczone w przeglądarce — strona może być zcache'owana na serwerze.
  useEffect(() => setToday(describeToday(days)), [hours]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <details>
      <summary style={{ minHeight: 52, padding: '0 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', listStyle: 'none' }}>
        <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
        </svg>
        <span style={{ flexGrow: 1, fontSize: 15 }}>{today?.text ?? 'Godziny otwarcia'}</span>
        <span style={{ fontSize: 13, color: INK2 }}>{today?.day ?? 'pokaż'}</span>
        <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={INK2} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </summary>
      <ul style={{ listStyle: 'none', margin: 0, padding: '0 16px 14px 48px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {days.map((d) => (
          <li key={d} style={{ fontSize: 14, color: INK2 }}>{d}</li>
        ))}
      </ul>
    </details>
  );
}
