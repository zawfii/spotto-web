'use client';

import { useState, type CSSProperties } from 'react';
import Link from 'next/link';
import { pluralPl, ratingColor } from '@/lib/format';
import { Icon, ICONS } from '@/components/ui';

export type ListPlace = { id: string; name: string; category: string | null; image: string | null; rating: number | null; review: string | null };

// Tyle miejsc widać od razu, reszta po „Pokaż wszystkie”.
const VISIBLE = 8;

const GREEN = '#164938';
const INK = '#03271a';
const INK2 = '#1e3028';
const CREAM = '#fdf5ec';
const CARD = '#eae5de';
const HAIR = 'rgba(3,39,26,0.15)';
const MANROPE = 'var(--font-manrope), sans-serif';
const ellipsis: CSSProperties = { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };

export function ListPlaces({ places }: { places: ListPlace[] }) {
  const [filter, setFilter] = useState('all');
  const [showAll, setShowAll] = useState(false);

  const rated = places.filter((p) => p.rating != null).length;
  const counts = new Map<string, number>();
  for (const p of places) if (p.category) counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
  // Chip ma sens tylko, gdy coś odsiewa: kategoria z ≥2 miejscami, ale nie cała lista.
  const categories = Array.from(counts).filter(([, n]) => n >= 2 && n < places.length).sort((a, b) => b[1] - a[1]).map(([c]) => c);
  const chips = [
    { id: 'all', label: 'Wszystkie' },
    ...(rated > 0 && rated < places.length ? [{ id: 'rated', label: 'Ocenione' }] : []),
    ...categories.map((c) => ({ id: c, label: c })),
  ];

  const shown = places.filter((p) => filter === 'all' || (filter === 'rated' ? p.rating != null : p.category === filter));
  const visible = showAll ? shown : shown.slice(0, VISIBLE);

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <h2 style={{ margin: 0, fontFamily: MANROPE, fontWeight: 700, fontSize: 16 }}>Miejsca · {places.length}</h2>

      {chips.length > 1 && (
        <div style={{ margin: '0 -16px', padding: '0 16px', display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none' }}>
          {chips.map((c) => {
            const active = c.id === filter;
            return (
              <button
                key={c.id}
                type="button"
                aria-pressed={active}
                onClick={() => setFilter(c.id)}
                style={{ flexShrink: 0, minHeight: 36, padding: '0 14px', borderRadius: 999, background: active ? INK : CARD, color: active ? '#fff' : INK, fontFamily: MANROPE, fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap' }}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      )}

      {places.length === 0 ? (
        <p style={{ margin: 0, padding: '24px 0', textAlign: 'center', fontSize: 15, color: INK2 }}>Ta lista jest jeszcze pusta</p>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {visible.map((p) => <PlaceRow key={p.id} p={p} />)}
        </ul>
      )}

      {!showAll && shown.length > VISIBLE && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          style={{ width: '100%', minHeight: 44, marginTop: 4, borderRadius: 16, background: CARD, border: `1.5px solid ${GREEN}`, color: GREEN, fontFamily: MANROPE, fontWeight: 700, fontSize: 14 }}
        >
          Pokaż wszystkie {shown.length} {pluralPl(shown.length, 'miejsce', 'miejsca', 'miejsc')}
        </button>
      )}
    </section>
  );
}

function PlaceRow({ p }: { p: ListPlace }) {
  return (
    <li style={{ borderBottom: `1px solid ${HAIR}` }}>
      <Link href={`/place/${p.id}`} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0' }}>
        {p.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.image} alt="" loading="lazy" style={{ width: 64, height: 64, borderRadius: 12, objectFit: 'cover', flexShrink: 0 }} />
        ) : (
          <span aria-hidden="true" style={{ width: 64, height: 64, borderRadius: 12, background: CARD, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon color={INK2} size={24}>{ICONS.fork}</Icon>
          </span>
        )}
        <span style={{ flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ ...ellipsis, fontFamily: MANROPE, fontWeight: 700, fontSize: 16, lineHeight: '22px' }}>{p.name}</span>
          {p.category && <span style={{ ...ellipsis, fontSize: 13, color: INK2 }}>{p.category}</span>}
          {p.review && <span style={{ ...ellipsis, fontSize: 13, color: INK2 }}>„{p.review}”</span>}
        </span>
        {p.rating != null ? (
          <span role="img" aria-label={`Ocena ${p.rating} na 10`} style={{ width: 44, height: 44, borderRadius: '50%', border: `3px solid ${ratingColor(p.rating)}`, background: CREAM, boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: MANROPE, fontWeight: 700, fontSize: 17, flexShrink: 0 }}>
            {p.rating}
          </span>
        ) : (
          <Icon color={INK2} size={16}>{ICONS.chevron}</Icon>
        )}
      </Link>
    </li>
  );
}

// Telefon: systemowe udostępnianie. Komputer: kopiuje link.
export function ShareButton({ title, style }: { title: string; style?: CSSProperties }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = `${location.origin}${location.pathname}`;
    if (navigator.share) {
      await navigator.share({ title, url }).catch(() => {});
      return;
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button type="button" onClick={share} aria-label={copied ? 'Link skopiowany' : 'Udostępnij listę'} style={style}>
      <Icon color="#fff">{copied ? ICONS.check : ICONS.share}</Icon>
    </button>
  );
}
