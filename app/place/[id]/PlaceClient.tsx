'use client';

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Sygnet, Wordmark } from '@/components/SpootLogo';

type Platform = 'ios' | 'android' | 'other';

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
const CREAM = '#fdf5ec';
const CARD = '#eae5de';
const HAIR = 'rgba(3,39,26,0.15)';
const MANROPE = 'var(--font-manrope), sans-serif';
// Android bez apki wraca tu z tym parametrem (S.browser_fallback_url) — wtedy od razu arkusz.
const FALLBACK_PARAM = 'bez-aplikacji';

function detectPlatform(): Platform {
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) return 'android';
  if (/iphone|ipad|ipod/i.test(ua) || (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1)) return 'ios';
  return 'other';
}

export function StoreLink({ appStoreUrl, playUrl, style, children }: { appStoreUrl: string; playUrl: string; style?: CSSProperties; children: ReactNode }) {
  const [href, setHref] = useState(appStoreUrl);
  useEffect(() => {
    if (detectPlatform() === 'android') setHref(playUrl);
  }, [playUrl]);
  return <a href={href} style={style}>{children}</a>;
}

export function AppBridge({ place, appStoreUrl, playUrl }: { place: BridgePlace; appStoreUrl: string; playUrl: string }) {
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [phase, setPhase] = useState<'page' | 'opening' | 'sheet'>('page');
  const cancelAttempt = useRef<() => void>(() => {});
  const dialogRef = useRef<HTMLDivElement>(null);

  function openApp(p: Platform) {
    cancelAttempt.current();
    const path = `place-detail?id=${encodeURIComponent(place.id)}`;
    const fallback = `${location.origin}${location.pathname}?${FALLBACK_PARAM}=1`;
    const url = p === 'android'
      ? `intent://${path}#Intent;scheme=spoot;package=com.spoot.app;S.browser_fallback_url=${encodeURIComponent(fallback)};end`
      : `spoot://${path}`;
    // Apka się otworzyła = karta poszła w tło. Bez tego timer odpaliłby się dopiero
    // po powrocie z apki (iOS wstrzymuje timery w tle) i pokazał arkusz bez powodu.
    const onHide = () => {
      if (!document.hidden) return;
      stop();
      setPhase('page');
    };
    const timer = window.setTimeout(() => {
      stop();
      setPhase('sheet');
    }, 1600);
    function stop() {
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', onHide);
    }
    document.addEventListener('visibilitychange', onHide);
    cancelAttempt.current = stop;
    window.location.href = url;
  }

  function close() {
    cancelAttempt.current();
    setPhase('page');
  }

  useEffect(() => {
    const p = detectPlatform();
    setPlatform(p);
    if (p === 'other') return;
    if (new URLSearchParams(location.search).has(FALLBACK_PARAM)) {
      setPhase('sheet');
      return;
    }
    if (p === 'android') {
      setPhase('opening');
      openApp(p);
      return () => cancelAttempt.current();
    }
    // iPhone z apką otwiera ten link od razu w apce (Universal Links), więc kto tu trafił, najpewniej
    // jej nie ma. Nie strzelamy spoot:// bez kliknięcia — Safari bez apki pokazałby „nieprawidłowy adres”.
    const t = window.setTimeout(() => setPhase('sheet'), 1200);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (phase === 'page') return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const mobile = platform !== 'other';
  const android = platform === 'android';

  return (
    <>
      <aside aria-label="Aplikacja Spoot" style={styles.bar}>
        <div style={styles.barInner}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span aria-hidden="true" style={styles.appIcon}><Sygnet d={20} ring={CREAM} /></span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 }}>
              <span style={{ fontFamily: MANROPE, fontWeight: 700, fontSize: 15 }}>{place.name} czeka w Spoot</span>
              <span style={{ fontSize: 13, color: INK2 }}>Zapisz to miejsce i oceń, co zjesz.</span>
            </div>
          </div>
          {mobile ? (
            <>
              <button type="button" onClick={() => openApp(platform ?? 'ios')} style={styles.primary}>Otwórz w aplikacji</button>
              <span style={{ fontSize: 12, color: INK2, textAlign: 'center' }}>Nie masz Spoot? Pokażemy, skąd go pobrać.</span>
            </>
          ) : (
            <a href={appStoreUrl} style={styles.primary}>Pobierz aplikację Spoot</a>
          )}
        </div>
      </aside>

      {phase === 'opening' && (
        <div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Otwieranie aplikacji Spoot" style={styles.opening}>
          <div style={styles.openingInner}>
            <Wordmark size={28} />
            <div style={{ flexGrow: 1, width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 32, padding: '32px 0' }}>
              <PlaceCard place={place} />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
                <Sygnet d={14} animated />
                <p role="status" style={{ margin: 0, fontFamily: MANROPE, fontWeight: 700, fontSize: 18, textAlign: 'center' }}>Otwieram w aplikacji Spoot…</p>
                <p style={{ margin: 0, fontSize: 14, lineHeight: '20px', color: INK2, textAlign: 'center', maxWidth: 280 }}>
                  Za chwilę zobaczysz to miejsce tam, gdzie możesz je zapisać i ocenić.
                </p>
              </div>
            </div>
            <button type="button" onClick={close} style={styles.textButton}>Zobacz lokal w przeglądarce</button>
          </div>
        </div>
      )}

      {phase === 'sheet' && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 30 }}>
          <div className="spoot-fade" onClick={close} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} />
          <div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="spoot-sheet-title" className="spoot-sheet" style={styles.sheet}>
            <div aria-hidden="true" style={{ alignSelf: 'center', width: 40, height: 4, borderRadius: 999, background: '#d3cdc5' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 16, borderBottom: `1px solid ${HAIR}` }}>
              {place.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={place.imageUrl} alt="" style={{ width: 56, height: 56, borderRadius: 12, objectFit: 'cover', flexShrink: 0 }} />
              )}
              <div style={{ flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontFamily: MANROPE, fontWeight: 700, fontSize: 16 }}>{place.name}</span>
                <span style={{ fontSize: 13, color: INK2 }}>{place.meta}</span>
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}><Badges place={place} /></div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={styles.eyebrow}>NIE MASZ JESZCZE SPOOT?</span>
              <h2 id="spoot-sheet-title" style={{ margin: 0, fontFamily: MANROPE, fontWeight: 700, fontSize: 24, lineHeight: '30px' }}>
                Zapisz {place.name} i oceń, co zjesz
              </h2>
            </div>

            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Benefit title="Zapisz na później" text="Lokal trafi do Twoich zapisanych miejsc." icon={<path d="M6 4h12v17l-6-4-6 4z" />} />
              <Benefit title="Oceniaj, co jesz" text="Mięso, sos, bułka — każde osobno, w skali 1–10." icon={<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" />} />
              <Benefit
                title="Polecenia pod Twój gust"
                text="Im więcej ocenisz, tym trafniej podpowiadamy."
                icon={<><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" /><path d="M19 15l.8 2.2 2.2.8-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z" /></>}
              />
            </ul>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <a href={android ? playUrl : appStoreUrl} style={styles.primary}>Pobierz z {android ? 'Google Play' : 'App Store'}</a>
              <button type="button" onClick={() => openApp(platform ?? 'ios')} style={styles.ghost}>Mam już Spoot — otwórz</button>
            </div>

            <button type="button" onClick={close} style={styles.textButton}>Zostań w przeglądarce</button>
          </div>
        </div>
      )}
    </>
  );
}

function PlaceCard({ place }: { place: BridgePlace }) {
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

function Badges({ place }: { place: BridgePlace }) {
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

function Benefit({ title, text, icon }: { title: string; text: string; icon: ReactNode }) {
  return (
    <li style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <span style={{ width: 40, height: 40, borderRadius: '50%', background: CARD, color: GREEN, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{icon}</svg>
      </span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <span style={{ fontFamily: MANROPE, fontWeight: 700, fontSize: 15 }}>{title}</span>
        <span style={{ fontSize: 13, color: INK2 }}>{text}</span>
      </div>
    </li>
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

const styles: Record<string, CSSProperties> = {
  bar: {
    position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 20,
    background: '#fffcf8', borderRadius: '24px 24px 0 0', boxShadow: '0 -4px 24px rgba(3,39,26,0.08)',
    padding: '16px 16px calc(16px + env(safe-area-inset-bottom))',
  },
  barInner: { maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 12 },
  appIcon: { width: 44, height: 44, borderRadius: 12, background: GREEN, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  primary: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: 50, borderRadius: 16,
    background: GREEN, color: '#fff', fontFamily: MANROPE, fontWeight: 700, fontSize: 16, textDecoration: 'none', cursor: 'pointer',
  },
  ghost: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: 44, borderRadius: 16,
    background: 'transparent', color: GREEN, fontFamily: MANROPE, fontWeight: 700, fontSize: 15, cursor: 'pointer',
  },
  textButton: {
    alignSelf: 'center', padding: '10px 12px', fontSize: 14, fontWeight: 500, color: GREEN, textDecoration: 'underline', cursor: 'pointer',
  },
  eyebrow: { fontFamily: MANROPE, fontWeight: 700, fontSize: 11, letterSpacing: 1.2, color: INK2 },
  opening: { position: 'fixed', inset: 0, zIndex: 40, background: CREAM, overflowY: 'auto', outline: 'none' },
  openingInner: {
    maxWidth: 480, minHeight: '100%', margin: '0 auto', boxSizing: 'border-box', padding: '56px 16px 40px',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
  },
  sheet: {
    position: 'absolute', left: 0, right: 0, bottom: 0, maxWidth: 480, maxHeight: '90vh', margin: '0 auto', overflowY: 'auto',
    background: CREAM, borderRadius: '24px 24px 0 0', padding: '10px 16px calc(24px + env(safe-area-inset-bottom))',
    display: 'flex', flexDirection: 'column', gap: 20, outline: 'none', boxSizing: 'border-box', color: INK,
  },
};
