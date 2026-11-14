import type { Metadata, Viewport } from 'next';
import type { CSSProperties, ReactNode } from 'react';
import { Manrope } from 'next/font/google';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Wordmark } from '@/components/SpootLogo';
import { AppBridge, StoreLink, TodayHours } from './PlaceClient';

// Plus Jakarta Sans z apki odpada: next/font 14.2 wywraca się na jej plikach z Google Fonts.
const manrope = Manrope({ subsets: ['latin', 'latin-ext'], weight: ['400', '500', '600', '700'], variable: '--font-manrope' });

// ID z eas.json (submit.production.ios.ascAppId) i pakiet z app.json.
const APP_STORE_URL = 'https://apps.apple.com/pl/app/id6822473524';
const PLAY_URL = 'https://play.google.com/store/apps/details?id=com.spoot.app';

const GREEN = '#164938';
const INK = '#03271a';
const INK2 = '#1e3028';
const CREAM = '#fdf5ec';
const CARD = '#eae5de';
const HAIR = 'rgba(3,39,26,0.15)';
const MANROPE = 'var(--font-manrope), sans-serif';

interface PlacePageProps {
  params: { id: string };
}

export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: CREAM };

async function getPlaceData(id: string) {
  try {
    const { data, error } = await supabase
      .from('places')
      .select('id, name, category, venue_type, district, address, phone, hours, price_range, image_url, google_rating, google_ratings_count, avg_spotto_rating, spotto_ratings_count, editorial_summary, tags, atmosphere')
      .eq('id', id)
      .maybeSingle();

    if (error || !data) return null;
    return data;
  } catch (err) {
    console.error('Error fetching place:', err);
    return null;
  }
}

export async function generateMetadata({ params }: PlacePageProps): Promise<Metadata> {
  const place = await getPlaceData(params.id);

  if (!place) {
    return { title: 'Miejsce nie znalezione - Spoot' };
  }

  return {
    title: `${place.name} - Spoot`,
    description: place.editorial_summary || `${place.name} · ${place.category} · ${place.district}`,
    openGraph: {
      title: `${place.name} - Spoot`,
      description: place.editorial_summary || `${place.name} · ${place.category} · ${place.district}`,
      images: place.image_url ? [{ url: place.image_url }] : [],
      type: 'website',
    },
  };
}

// Jak utils/plural.ts w apce.
function pluralPl(n: number, one: string, few: string, many: string) {
  const abs = Math.abs(n);
  if (abs === 1) return one;
  const last = abs % 10;
  const lastTwo = abs % 100;
  return last >= 2 && last <= 4 && !(lastTwo >= 12 && lastTwo <= 14) ? few : many;
}

// Jak ratingLabel / ratingColor w apce (components/RatingSlider.tsx). Średni i niski kolor
// przyciemnione, żeby duża cyfra na szarej karcie miała kontrast co najmniej 3:1.
function ratingLabel(v: number) {
  if (v <= 2) return 'Nie polecam';
  if (v <= 4) return 'Słabe';
  if (v <= 6) return 'Może być';
  if (v <= 8) return 'Dobre';
  return 'Rewelacja';
}

function ratingColor(v: number) {
  if (v >= 8) return '#2e7d32';
  if (v >= 5) return '#9a5b12';
  return '#b23c00';
}

export default async function PlacePage({ params }: PlacePageProps) {
  const place = await getPlaceData(params.id);
  const fonts = manrope.variable;

  if (!place) {
    return (
      <main className={fonts} style={s.page}>
        <div style={{ ...s.column, minHeight: '100vh', padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, textAlign: 'center' }}>
          <Wordmark size={28} />
          <h1 style={{ margin: '24px 0 0', fontFamily: MANROPE, fontWeight: 700, fontSize: 22 }}>Nie znaleźliśmy tego miejsca</h1>
          <p style={{ margin: 0, fontSize: 14, color: INK2 }}>Mogło zostać usunięte albo link jest nieaktualny.</p>
          <Link href="/" style={{ padding: 12, fontSize: 14, color: GREEN, textDecoration: 'underline' }}>Strona główna</Link>
        </div>
      </main>
    );
  }

  const meta = [place.district, place.venue_type && place.venue_type !== place.category ? place.venue_type : null, place.category]
    .filter(Boolean)
    .join(' · ');
  const spoot = place.avg_spotto_rating != null ? Number(place.avg_spotto_rating) : null;
  const google = place.google_rating != null ? Number(place.google_rating) : null;
  const spootText = spoot != null ? spoot.toFixed(1) : null;
  const googleText = google != null ? google.toFixed(1).replace('.', ',') : null;
  const address = place.address ? String(place.address).replace(/,\s*Polska$/, '') : null;
  const atmosphere: string[] = place.atmosphere ?? [];

  const rows: ReactNode[] = [];
  if (address) {
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place.name}, ${place.address}`)}`;
    rows.push(<InfoRow key="address" icon={ICONS.pin} action={<a href={mapsUrl} style={s.rowAction}>Trasa</a>}>{address}</InfoRow>);
  }
  if (place.hours) rows.push(<TodayHours key="hours" hours={place.hours} />);
  if (place.phone) {
    rows.push(
      <InfoRow key="phone" icon={ICONS.phone} action={<a href={`tel:${String(place.phone).replace(/\s/g, '')}`} style={s.rowAction}>Zadzwoń</a>}>
        {place.phone}
      </InfoRow>,
    );
  }
  if (place.price_range) rows.push(<InfoRow key="price" icon={ICONS.cash}>{place.price_range}</InfoRow>);

  return (
    <main className={fonts} style={{ ...s.page, paddingBottom: 'calc(200px + env(safe-area-inset-bottom))' }}>
      <div style={s.column}>
        <header style={{ height: 56, padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" aria-label="Spoot — strona główna" style={{ display: 'flex' }}><Wordmark size={22} /></Link>
          <StoreLink appStoreUrl={APP_STORE_URL} playUrl={PLAY_URL} style={{ ...s.eyebrow, color: GREEN, padding: '12px 0 12px 12px' }}>
            POBIERZ APLIKACJĘ
          </StoreLink>
        </header>

        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {place.image_url ? (
            <div style={{ position: 'relative', height: 230, borderRadius: 24, overflow: 'hidden', background: CARD }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={place.image_url} alt={`Zdjęcie: ${place.name}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '14px 16px', background: 'rgba(0,0,0,0.55)', color: '#fff', display: 'flex', flexDirection: 'column', gap: 2 }}>
                <h1 style={{ margin: 0, fontFamily: MANROPE, fontWeight: 700, fontSize: 26, lineHeight: '32px' }}>{place.name}</h1>
                <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>{meta}</p>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, paddingTop: 8 }}>
              <h1 style={{ margin: 0, fontFamily: MANROPE, fontWeight: 700, fontSize: 26, lineHeight: '32px' }}>{place.name}</h1>
              <p style={{ margin: 0, fontSize: 13, color: INK2 }}>{meta}</p>
            </div>
          )}

          {(spoot != null || google != null) && (
            <div style={{ display: 'flex', gap: 12 }}>
              {spoot != null && (
                <div style={s.ratingCard}>
                  <span style={s.eyebrow}>SPOOT</span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, color: ratingColor(spoot) }}>
                    <span style={s.ratingValue}>{spootText}</span>
                    <span style={{ fontFamily: MANROPE, fontWeight: 700, fontSize: 13 }}>{ratingLabel(spoot)}</span>
                  </div>
                  {place.spotto_ratings_count != null && (
                    <span style={s.ratingCount}>{place.spotto_ratings_count} {pluralPl(place.spotto_ratings_count, 'ocena', 'oceny', 'ocen')}</span>
                  )}
                </div>
              )}
              {google != null && (
                <div style={s.ratingCard}>
                  <span style={s.eyebrow}>GOOGLE</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="#ff751f">
                      <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" />
                    </svg>
                    <span style={s.ratingValue}>{googleText}</span>
                  </div>
                  {place.google_ratings_count != null && (
                    <span style={s.ratingCount}>
                      {Number(place.google_ratings_count).toLocaleString('pl-PL')} {pluralPl(place.google_ratings_count, 'ocena', 'oceny', 'ocen')}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {place.editorial_summary && (
            <p style={{ margin: 0, fontSize: 15, lineHeight: '22px', color: INK2 }}>{place.editorial_summary}</p>
          )}

          {rows.length > 0 && (
            <div style={{ background: CARD, borderRadius: 16, overflow: 'hidden' }}>
              {rows.flatMap((row, i) => (i ? [<div key={`divider-${i}`} style={{ height: 1, marginLeft: 48, background: HAIR }} />, row] : [row]))}
            </div>
          )}

          {atmosphere.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <h2 style={{ margin: 0, fontFamily: MANROPE, fontWeight: 700, fontSize: 16 }}>Klimat</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {atmosphere.map((tag) => (
                  <span key={tag} style={{ background: CARD, borderRadius: 999, padding: '6px 12px', fontSize: 13 }}>{tag}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <AppBridge
        place={{ id: place.id, name: place.name, meta, imageUrl: place.image_url ?? null, spootRating: spootText, googleRating: googleText }}
        appStoreUrl={APP_STORE_URL}
        playUrl={PLAY_URL}
      />
    </main>
  );
}

function InfoRow({ icon, action, children }: { icon: ReactNode; action?: ReactNode; children: ReactNode }) {
  return (
    <div style={{ minHeight: 52, padding: '0 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
      <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
        {icon}
      </svg>
      <span style={{ flexGrow: 1, padding: '14px 0', fontSize: 15 }}>{children}</span>
      {action}
    </div>
  );
}

const ICONS = {
  pin: <><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></>,
  phone: <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />,
  cash: <><rect x="3" y="6" width="18" height="12" rx="2" /><circle cx="12" cy="12" r="2.5" /></>,
};

const s: Record<string, CSSProperties> = {
  page: { minHeight: '100vh', background: CREAM, color: INK, fontFamily: 'var(--font-manrope), system-ui, sans-serif' },
  column: { maxWidth: 480, margin: '0 auto' },
  eyebrow: { fontFamily: MANROPE, fontWeight: 700, fontSize: 11, letterSpacing: 1.2, color: INK2 },
  ratingCard: { flex: 1, background: CARD, borderRadius: 16, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 2 },
  ratingValue: { fontFamily: MANROPE, fontWeight: 700, fontSize: 28, lineHeight: '34px' },
  ratingCount: { fontSize: 12, color: INK2 },
  rowAction: { padding: '14px 0 14px 8px', fontFamily: MANROPE, fontWeight: 700, fontSize: 13, color: GREEN, flexShrink: 0 },
};
