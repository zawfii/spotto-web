'use client';

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Sygnet, Wordmark } from '@/components/SpootLogo';

type Platform = 'ios' | 'android' | 'other';

export type Benefit = { title: string; text: string; icon: ReactNode };

// Co pokazać przy otwieraniu apki z linku (lokal, profil…).
export type BridgeContent = {
  appPath: string; // ścieżka w apce po spoot://, np. place-detail?id=…
  barTitle: string;
  barText: string;
  card: ReactNode; // podgląd na ekranie „Otwieram w aplikacji Spoot…”
  openingText: string;
  browserLabel: string; // „Zobacz lokal w przeglądarce”
  sheetHeader: ReactNode;
  sheetTitle: string;
  benefits: Benefit[];
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

const OPEN_EVENT = 'spoot-open-app';

export function OpenAppButton({ style, children }: { style?: CSSProperties; children: ReactNode }) {
  return <button type="button" onClick={() => window.dispatchEvent(new Event(OPEN_EVENT))} style={style}>{children}</button>;
}

export function AppBridge({ content, appStoreUrl, playUrl }: { content: BridgeContent; appStoreUrl: string; playUrl: string }) {
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [phase, setPhase] = useState<'page' | 'opening' | 'sheet'>('page');
  const cancelAttempt = useRef<() => void>(() => {});
  const dialogRef = useRef<HTMLDivElement>(null);

  function openApp(p: Platform) {
    cancelAttempt.current();
    const path = content.appPath;
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

  // Przyciski w treści strony (OpenAppButton) otwierają apkę tak samo jak pasek.
  useEffect(() => {
    const onOpen = () => {
      const p = detectPlatform();
      if (p === 'other') window.location.href = appStoreUrl;
      else openApp(p);
    };
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_EVENT, onOpen);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
              <span style={{ fontFamily: MANROPE, fontWeight: 700, fontSize: 15 }}>{content.barTitle}</span>
              <span style={{ fontSize: 13, color: INK2 }}>{content.barText}</span>
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
              {content.card}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
                <Sygnet d={14} animated />
                <p role="status" style={{ margin: 0, fontFamily: MANROPE, fontWeight: 700, fontSize: 18, textAlign: 'center' }}>Otwieram w aplikacji Spoot…</p>
                <p style={{ margin: 0, fontSize: 14, lineHeight: '20px', color: INK2, textAlign: 'center', maxWidth: 280 }}>{content.openingText}</p>
              </div>
            </div>
            <button type="button" onClick={close} style={styles.textButton}>{content.browserLabel}</button>
          </div>
        </div>
      )}

      {phase === 'sheet' && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 30 }}>
          <div className="spoot-fade" onClick={close} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} />
          <div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="spoot-sheet-title" className="spoot-sheet" style={styles.sheet}>
            <div aria-hidden="true" style={{ alignSelf: 'center', width: 40, height: 4, borderRadius: 999, background: '#d3cdc5' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 16, borderBottom: `1px solid ${HAIR}` }}>
              {content.sheetHeader}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={styles.eyebrow}>NIE MASZ JESZCZE SPOOT?</span>
              <h2 id="spoot-sheet-title" style={{ margin: 0, fontFamily: MANROPE, fontWeight: 700, fontSize: 24, lineHeight: '30px' }}>
                {content.sheetTitle}
              </h2>
            </div>

            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {content.benefits.map((b) => <BenefitRow key={b.title} {...b} />)}
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

function BenefitRow({ title, text, icon }: Benefit) {
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
