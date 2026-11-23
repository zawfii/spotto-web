'use client';

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { menuPrice, pluralPl } from '@/lib/format';
import { allergenLabels } from '@/lib/owner';
import type { getPlaceExtras } from '@/lib/supabase';

// Karta dań jak zakładka Menu w apce (components/PlaceMenu.tsx): sekcje zawsze rozwinięte,
// dania ze zdjęciem w siatce kafli, reszta jak drukowana karta, dotknięcie kafla otwiera danie.

type Menu = Awaited<ReturnType<typeof getPlaceExtras>>['menu'];
type Item = Menu['sections'][number]['items'][number];
type Viewer = { section: string; items: Item[]; index: number };

const GREEN = '#164938';
const INK = '#03271a';
const INK2 = '#1e3028';
const CREAM = '#fdf5ec';
const CARD = '#eae5de';
const HAIR = 'rgba(3,39,26,0.15)';
const MANROPE = 'var(--font-manrope), sans-serif';
const SPICE = ['', 'lekko ostre', 'ostre', 'bardzo ostre'];
const CHIPS_H = 52;
// Na stronie lokalu dłuższa karta jest przycięta do „Pokaż całe menu”.
const PREVIEW_ITEMS = 8;

export function MenuCard({ menu, embedded = false }: { menu: Menu; embedded?: boolean }) {
  // zdjęcia dań bywają linkowane ze stron lokali — gdy któreś zniknie, danie wraca do zwykłego wiersza
  const [broken, setBroken] = useState<Set<string>>(new Set());
  const [active, setActive] = useState(menu.sections[0]?.id);
  const [viewer, setViewer] = useState<Viewer | null>(null);
  const total = menu.sections.reduce((n, sec) => n + sec.items.length, 0);
  const [expanded, setExpanded] = useState(!embedded || total <= PREVIEW_ITEMS);
  const H = embedded ? 'h3' : 'h2';

  function jumpTo(id: string) {
    setActive(id);
    setExpanded(true);
    requestAnimationFrame(() => document.getElementById(`menu-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  const date = menu.updatedAt ? new Date(menu.updatedAt).toLocaleDateString('pl-PL', { timeZone: 'Europe/Warsaw' }) : null;

  return (
    <div>
      {menu.sections.length > 1 && (
        <nav aria-label="Sekcje menu" style={st.chipsBar}>
          <div style={st.chips}>
            {menu.sections.map((sec) => {
              const on = sec.id === active;
              return (
                <button key={sec.id} type="button" aria-pressed={on} onClick={() => jumpTo(sec.id)} style={{ ...st.chip, ...(on ? st.chipOn : null) }}>
                  {sec.name}
                </button>
              );
            })}
          </div>
        </nav>
      )}

      <div style={expanded ? undefined : st.clipped}>
        {menu.sections.map((sec) => {
          const photos = sec.items.filter((it) => it.image_url && !broken.has(it.id));
          const rows = sec.items.filter((it) => !photos.includes(it));
          return (
            <section key={sec.id} id={`menu-${sec.id}`} style={{ paddingTop: 24, scrollMarginTop: CHIPS_H + 8 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
                <H style={{ ...st.sectionName, ...(embedded ? { fontSize: 20, lineHeight: '26px' } : null) }}>{sec.name}</H>
                <span style={{ fontSize: 13, color: INK2, flexShrink: 0 }}>
                  {sec.items.length} {pluralPl(sec.items.length, 'pozycja', 'pozycje', 'pozycji')}
                </span>
              </div>

              {photos.length > 0 && (
                <div style={st.grid}>
                  {photos.map((it, i) => (
                    <button key={it.id} type="button" onClick={() => setViewer({ section: sec.name, items: photos, index: i })} aria-label={`${it.name} — pokaż zdjęcie`} style={st.tile}>
                      <span style={st.tilePhoto}>
                        {/* Leniwe ładowanie: obrazek startuje po hydracji, więc onError zdąży się podpiąć. */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={it.image_url!} alt="" loading="lazy" onError={() => setBroken((prev) => new Set(prev).add(it.id))} style={st.cover} />
                        <span aria-hidden="true" style={st.tileExpand}><ExpandIcon size={14} /></span>
                      </span>
                      <span style={st.tileName}>{it.name}</span>
                      {it.description && <span style={st.tileDesc}>{it.description}</span>}
                      {Number(it.price) > 0 && <span style={st.tilePrice}>{menuPrice(it.price)}</span>}
                    </button>
                  ))}
                </div>
              )}

              {rows.map((it) => (
                <div key={it.id} style={{ padding: '10px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                    <span style={st.rowName}>{it.name}</span>
                    {Number(it.price) > 0 && (
                      <>
                        <span aria-hidden="true" style={st.leader} />
                        <span style={st.rowPrice}>{menuPrice(it.price)}</span>
                      </>
                    )}
                  </div>
                  {it.description && <p style={st.rowDesc}>{it.description}</p>}
                  {!!it.allergens?.length && <p style={st.rowDesc}>Alergeny: {allergenLabels(it.allergens)}</p>}
                  <Tags item={it} />
                </div>
              ))}
            </section>
          );
        })}
        {!expanded && <div aria-hidden="true" style={st.fade} />}
      </div>

      {!expanded && (
        <button type="button" onClick={() => setExpanded(true)} style={st.more}>
          Pokaż całe menu · {total} {pluralPl(total, 'pozycja', 'pozycje', 'pozycji')}
        </button>
      )}

      {(menu.source !== 'owner' || menu.url) && (
        <div style={{ paddingTop: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {menu.source !== 'owner' && (
            <span style={{ fontSize: 12, color: INK2 }}>
              {menu.source === 'photo' ? 'Ze zdjęcia karty od użytkownika' : 'Menu ze strony lokalu'}
              {date ? ` · stan na ${date}` : ''}
            </span>
          )}
          {menu.url && (
            <a href={menu.url} target="_blank" rel="noopener noreferrer" style={st.footLink}>
              Pełna karta na stronie lokalu
              <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
              </svg>
            </a>
          )}
        </div>
      )}

      {viewer && <DishViewer viewer={viewer} onClose={() => setViewer(null)} />}
    </div>
  );
}

function Tags({ item }: { item: Item }) {
  const spice = SPICE[item.spice_level ?? 0];
  if (!item.is_vege && !spice) return null;
  return (
    <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
      {item.is_vege && <span style={{ ...st.tag, background: '#dcebd9', color: '#2e7d32' }}>wege</span>}
      {spice && <span style={{ ...st.tag, background: '#ffe5d4', color: '#c9500c' }}>{spice}</span>}
    </div>
  );
}

// Otwarte danie: zdjęcie na całą szerokość, przesuwanie między daniami sekcji, miniatury, powiększenie.
function DishViewer({ viewer, onClose }: { viewer: Viewer; onClose: () => void }) {
  const { items, section } = viewer;
  const [index, setIndex] = useState(viewer.index);
  const [zoom, setZoom] = useState<string | null>(null);
  const track = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = track.current;
    if (el) el.scrollLeft = viewer.index * el.clientWidth;
  }, [viewer.index]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (zoom) setZoom(null);
      else onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [zoom, onClose]);

  function goTo(i: number) {
    setIndex(i);
    const el = track.current;
    el?.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' });
  }

  return (
    <div role="dialog" aria-modal="true" aria-label={`${section} — zdjęcia dań`} style={st.viewer}>
      <div style={st.viewerInner}>
        <div
          ref={track}
          onScroll={(e) => setIndex(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
          style={st.track}
        >
          {items.map((it) => (
            <article key={it.id} style={st.slide}>
              <button type="button" onClick={() => setZoom(it.image_url)} aria-label="Powiększ zdjęcie" style={st.slidePhoto}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={it.image_url!} alt={it.name} style={st.cover} />
              </button>
              <div style={{ padding: '20px 16px 24px' }}>
                <span style={st.eyebrow}>{section.toUpperCase()}</span>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginTop: 6 }}>
                  <h2 style={st.viewerName}>{it.name}</h2>
                  {Number(it.price) > 0 && <span style={st.viewerPrice}>{menuPrice(it.price)}</span>}
                </div>
                {it.description && <p style={{ margin: '10px 0 0', fontSize: 16, lineHeight: '24px', color: INK2 }}>{it.description}</p>}
                {!!it.allergens?.length && <p style={st.rowDesc}>Alergeny: {allergenLabels(it.allergens)}</p>}
                <Tags item={it} />
              </div>
            </article>
          ))}
        </div>

        {items.length > 1 && (
          <div style={st.thumbs}>
            <span style={{ padding: '0 16px', fontFamily: MANROPE, fontWeight: 700, fontSize: 13 }}>Więcej: {section}</span>
            <div style={st.thumbsRow}>
              {items.map((it, i) => (
                <button key={it.id} type="button" onClick={() => goTo(i)} aria-label={it.name} aria-pressed={i === index} style={{ ...st.thumb, ...(i === index ? { border: `3px solid ${INK}` } : null) }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={it.image_url!} alt="" style={st.cover} />
                </button>
              ))}
            </div>
          </div>
        )}

        {items.length > 1 && <span style={{ ...st.pill, left: 16 }}>{index + 1} z {items.length}</span>}
        <button type="button" autoFocus onClick={onClose} aria-label="Zamknij" style={{ ...st.round, right: 16 }}><CloseIcon /></button>
        <button type="button" onClick={() => setZoom(items[index]?.image_url ?? null)} style={st.zoomBtn}>
          <ExpandIcon size={16} />
          Powiększ
        </button>
      </div>

      {zoom && (
        // Szczypnięcie powiększa jak każde zdjęcie w przeglądarce.
        <div style={st.zoom}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={zoom} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          <button type="button" onClick={() => setZoom(null)} aria-label="Zamknij powiększenie" style={{ ...st.round, right: 16 }}><CloseIcon /></button>
        </div>
      )}
    </div>
  );
}

function ExpandIcon({ size }: { size: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

const DARK = 'rgba(0,0,0,0.6)';
const TOP = 'calc(8px + env(safe-area-inset-top))';

const st: Record<string, CSSProperties> = {
  chipsBar: { position: 'sticky', top: 0, zIndex: 5, background: CREAM, margin: '0 -16px', padding: '8px 0' },
  chips: { display: 'flex', gap: 8, overflowX: 'auto', padding: '0 16px', scrollbarWidth: 'none' },
  chip: {
    flexShrink: 0, minHeight: 36, padding: '0 14px', borderRadius: 999, border: 0, background: CARD, color: INK,
    fontFamily: MANROPE, fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', cursor: 'pointer',
  },
  chipOn: { background: INK, color: '#fff' },

  sectionName: { margin: 0, flexGrow: 1, minWidth: 0, fontFamily: MANROPE, fontWeight: 700, fontSize: 26, lineHeight: '34px', letterSpacing: -0.3 },

  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 16, rowGap: 20, marginBottom: 8 },
  tile: { display: 'flex', flexDirection: 'column', alignItems: 'stretch', minWidth: 0, padding: 0, border: 0, background: 'none', color: INK, textAlign: 'left', cursor: 'pointer', font: 'inherit' },
  tilePhoto: { position: 'relative', display: 'block', aspectRatio: '1 / 1', borderRadius: 16, overflow: 'hidden', background: CARD },
  cover: { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  tileExpand: {
    position: 'absolute', right: 8, bottom: 8, width: 28, height: 28, borderRadius: 14, background: DARK, color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  tileName: {
    marginTop: 10, fontFamily: MANROPE, fontWeight: 600, fontSize: 15, lineHeight: '20px',
    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
  },
  tileDesc: { marginTop: 2, fontSize: 12, lineHeight: '16px', color: INK2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  tilePrice: { marginTop: 6, fontFamily: MANROPE, fontWeight: 700, fontSize: 15, lineHeight: '20px' },

  rowName: { flexShrink: 1, minWidth: 0, fontFamily: MANROPE, fontWeight: 600, fontSize: 16, lineHeight: '22px' },
  // Kropki do ceny jak w drukowanej karcie.
  leader: { flexGrow: 1, minWidth: 12, marginBottom: 6, borderBottom: '2px dotted rgba(3,39,26,0.35)' },
  rowPrice: { flexShrink: 0, fontFamily: MANROPE, fontWeight: 700, fontSize: 16, lineHeight: '22px', whiteSpace: 'nowrap' },
  rowDesc: { margin: '2px 0 0', fontSize: 13, lineHeight: '18px', color: INK2 },
  tag: { padding: '1px 8px', borderRadius: 999, fontFamily: MANROPE, fontWeight: 700, fontSize: 11, lineHeight: '16px' },

  clipped: { position: 'relative', maxHeight: 640, overflow: 'hidden' },
  fade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 120, background: `linear-gradient(rgba(253,245,236,0), ${CREAM})` },
  more: {
    width: '100%', height: 48, marginTop: 4, borderRadius: 16, border: `1px solid ${HAIR}`, background: 'none', color: GREEN,
    fontFamily: MANROPE, fontWeight: 700, fontSize: 15, cursor: 'pointer',
  },
  footLink: { alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 6, padding: '8px 0', fontFamily: MANROPE, fontWeight: 700, fontSize: 13, color: GREEN, textDecoration: 'underline', textUnderlineOffset: 4 },

  viewer: { position: 'fixed', inset: 0, zIndex: 50, background: CREAM, color: INK },
  viewerInner: { position: 'relative', height: '100%', maxWidth: 560, margin: '0 auto', display: 'flex', flexDirection: 'column' },
  track: { flexGrow: 1, minHeight: 0, display: 'flex', overflowX: 'auto', scrollSnapType: 'x mandatory', scrollbarWidth: 'none' },
  slide: { flex: '0 0 100%', minWidth: 0, overflowY: 'auto', scrollSnapAlign: 'start' },
  slidePhoto: { position: 'relative', display: 'block', width: '100%', aspectRatio: '1 / 1', padding: 0, border: 0, background: CARD, cursor: 'zoom-in' },
  eyebrow: { fontFamily: MANROPE, fontWeight: 700, fontSize: 11, lineHeight: '16px', letterSpacing: 1.2, color: INK2 },
  viewerName: { margin: 0, flexGrow: 1, minWidth: 0, fontFamily: MANROPE, fontWeight: 700, fontSize: 26, lineHeight: '32px', letterSpacing: -0.3 },
  viewerPrice: { flexShrink: 0, fontFamily: MANROPE, fontWeight: 700, fontSize: 22, lineHeight: '32px', whiteSpace: 'nowrap' },
  thumbs: { flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8, padding: '12px 0 calc(12px + env(safe-area-inset-bottom))', borderTop: `1px solid ${HAIR}` },
  thumbsRow: { display: 'flex', gap: 10, overflowX: 'auto', padding: '0 16px', scrollbarWidth: 'none' },
  thumb: { position: 'relative', flexShrink: 0, boxSizing: 'border-box', width: 64, height: 64, padding: 0, border: 0, borderRadius: 12, overflow: 'hidden', background: CARD, cursor: 'pointer' },
  pill: { position: 'absolute', top: TOP, padding: '7px 12px', borderRadius: 999, background: DARK, color: '#fff', fontFamily: MANROPE, fontWeight: 700, fontSize: 12, lineHeight: '18px', letterSpacing: 0.4 },
  round: {
    position: 'absolute', top: TOP, width: 40, height: 40, borderRadius: 20, border: 0, background: DARK, color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
  },
  zoomBtn: {
    position: 'absolute', right: 16, top: 'calc(min(100vw, 560px) - 60px)', height: 44, padding: '0 16px', borderRadius: 999, border: 0,
    background: DARK, color: '#fff', display: 'flex', alignItems: 'center', gap: 8, fontFamily: MANROPE, fontWeight: 700, fontSize: 13, cursor: 'pointer',
  },
  zoom: { position: 'fixed', inset: 0, zIndex: 51, background: '#000' },
};
