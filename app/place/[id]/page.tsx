import type { Metadata, Viewport } from 'next';
import type { CSSProperties, ReactNode } from 'react';
import { Manrope } from 'next/font/google';
import Link from 'next/link';
import { getPlaceExtras, supabase, type PlaceReview } from '@/lib/supabase';
import { dishName, formatPrice, ratingColor as circleColor, relativePl } from '@/lib/format';
import { allergenLabels } from '@/lib/owner';
import { Wordmark } from '@/components/SpootLogo';
import { AppBridge, OpenAppButton, StoreLink } from '@/components/AppBridge';
import { Avatar } from '@/components/ui';
import { ShowMore } from '../../u/[username]/ProfileClient';
import { Badges, DishThumb, PlaceCard, TodayHours } from './PlaceClient';

// Tyle opinii widać od razu, reszta po „Pokaż wszystkie”.
const VISIBLE_REVIEWS = 5;

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
      .select('id, name, category, venue_type, district, address, phone, hours, price_range, image_url, google_rating, google_ratings_count, avg_spotto_rating, spotto_ratings_count, editorial_summary, tags, atmosphere, lat, lng')
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
  const [place, { reviews, menu }] = await Promise.all([getPlaceData(params.id), getPlaceExtras(params.id)]);
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

  const bridgePlace = { id: place.id, name: place.name, meta, imageUrl: place.image_url ?? null, spootRating: spootText, googleRating: googleText };

  const coords = place.lat != null && place.lng != null ? { lat: Number(place.lat), lng: Number(place.lng) } : null;
  const mapsQuery = address ? `${place.name}, ${place.address}` : `${coords?.lat},${coords?.lng}`;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery)}`;
  const menuDate = menu.updatedAt ? new Date(menu.updatedAt).toLocaleDateString('pl-PL', { timeZone: 'Europe/Warsaw' }) : null;
  const menuCaption = !menu.sections.length
    ? 'Kartę tego lokalu znajdziesz na jego stronie'
    : menu.source === 'website' || menu.source === 'photo'
      ? `${menu.source === 'website' ? 'Menu ze strony lokalu' : 'Ze zdjęcia karty od użytkownika'}${menuDate ? ` · stan na ${menuDate}` : ''}`
      : null;

  const rows: ReactNode[] = [];
  if (address) {
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
    <main className={fonts} style={{ ...s.page, paddingBottom: 'calc(100px + env(safe-area-inset-bottom))' }}>
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
                <a href="#opinie" style={s.ratingCard}>
                  <span style={s.eyebrow}>SPOOT</span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, color: ratingColor(spoot) }}>
                    <span style={s.ratingValue}>{spootText}</span>
                    <span style={{ fontFamily: MANROPE, fontWeight: 700, fontSize: 13 }}>{ratingLabel(spoot)}</span>
                  </div>
                  {place.spotto_ratings_count != null && (
                    <span style={s.ratingCount}>{place.spotto_ratings_count} {pluralPl(place.spotto_ratings_count, 'ocena', 'oceny', 'ocen')}</span>
                  )}
                </a>
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

          {(menu.sections.length > 0 || menu.url) && (
            <section id="menu" style={s.section}>
              <h2 style={s.h2}>Menu</h2>
              {(menuCaption || menu.url) && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <span style={{ fontSize: 13, color: INK2 }}>{menuCaption}</span>
                  {menu.url && <a href={menu.url} target="_blank" rel="noopener noreferrer" style={{ ...s.rowAction, padding: '12px 0 12px 8px' }}>Zobacz menu</a>}
                </div>
              )}
              {menu.sections.length > 0 && (
                <div style={{ background: CARD, borderRadius: 16, overflow: 'hidden' }}>
                  {menu.sections.map((sec, i) => (
                    <details key={sec.id} open={i === 0} style={{ borderTop: i ? `1px solid ${HAIR}` : undefined }}>
                      <summary style={{ minHeight: 52, padding: '0 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', listStyle: 'none' }}>
                        <span style={{ flexGrow: 1, minWidth: 0, padding: '14px 0', fontFamily: MANROPE, fontWeight: 700, fontSize: 15 }}>{sec.name}</span>
                        <span style={{ fontSize: 13, color: INK2, flexShrink: 0 }}>{sec.items.length} {pluralPl(sec.items.length, 'pozycja', 'pozycje', 'pozycji')}</span>
                        <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={INK2} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                          <path d="M6 9l6 6 6-6" />
                        </svg>
                      </summary>
                      <ul style={{ listStyle: 'none', margin: 0, padding: '0 16px 4px' }}>
                        {sec.items.map((it) => (
                          <li key={it.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 0', borderTop: `1px solid ${HAIR}` }}>
                            {it.image_url && <DishThumb src={it.image_url} />}
                            <div style={{ flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                              <span style={{ fontSize: 15, fontWeight: 600, lineHeight: '20px' }}>
                                {it.name}
                                {it.is_vege && <span style={{ marginLeft: 6, padding: '1px 7px', borderRadius: 999, background: '#dcebd9', color: '#2e7d32', fontSize: 11, fontWeight: 700, verticalAlign: 2 }}>wege</span>}
                              </span>
                              {it.description && <span style={{ fontSize: 13, lineHeight: '18px', color: INK2 }}>{it.description}</span>}
                              {!!it.allergens?.length && <span style={{ fontSize: 12, lineHeight: '16px', color: INK2 }}><strong>Alergeny:</strong> {allergenLabels(it.allergens)}</span>}
                            </div>
                            {Number(it.price) > 0 && (
                              <span style={{ fontFamily: MANROPE, fontWeight: 700, fontSize: 14, lineHeight: '20px', whiteSpace: 'nowrap', flexShrink: 0 }}>{formatPrice(it.price)}</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </details>
                  ))}
                </div>
              )}
            </section>
          )}

          {rows.length > 0 && (
            <div style={{ background: CARD, borderRadius: 16, overflow: 'hidden' }}>
              {rows.flatMap((row, i) => (i ? [<div key={`divider-${i}`} style={{ height: 1, marginLeft: 48, background: HAIR }} />, row] : [row]))}
            </div>
          )}

          <section id="opinie" style={s.section}>
            <h2 style={s.h2}>Opinie w Spoot</h2>
            {reviews.length > 0 ? (
              <div>
                {reviews.slice(0, VISIBLE_REVIEWS).map((r) => <ReviewRow key={r.id} r={r} />)}
                {reviews.length > VISIBLE_REVIEWS && (
                  <ShowMore
                    label={`Pokaż wszystkie ${reviews.length} ${pluralPl(reviews.length, 'ocenę', 'oceny', 'ocen')}`}
                    style={{ width: '100%', minHeight: 44, marginTop: 16, borderRadius: 16, background: CARD, border: `1.5px solid ${GREEN}`, color: GREEN, fontFamily: MANROPE, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
                  >
                    {reviews.slice(VISIBLE_REVIEWS).map((r) => <ReviewRow key={r.id} r={r} />)}
                  </ShowMore>
                )}
              </div>
            ) : (
              // Oceny grupowe liczą się do średniej, ale nie są publiczne — wtedy bez „nikt jeszcze”.
              <div style={{ background: CARD, borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontFamily: MANROPE, fontWeight: 700, fontSize: 16 }}>
                  {place.spotto_ratings_count ? `Oceń ${place.name} w Spoot` : `Nikt jeszcze nie ocenił ${place.name}`}
                </span>
                <span style={{ fontSize: 14, lineHeight: '20px', color: INK2 }}>
                  {place.spotto_ratings_count ? 'Każde danie osobno, w skali 1–10.' : 'Oceń jako pierwszy: każde danie osobno, w skali 1–10.'}
                </span>
                <OpenAppButton style={{ minHeight: 44, marginTop: 12, borderRadius: 999, border: 'none', background: GREEN, color: '#fff', fontFamily: MANROPE, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                  Oceń w Spoot
                </OpenAppButton>
              </div>
            )}
          </section>

          {atmosphere.length > 0 && (
            <div style={s.section}>
              <h2 style={s.h2}>Klimat</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {atmosphere.map((tag) => (
                  <span key={tag} style={{ background: CARD, borderRadius: 999, padding: '6px 12px', fontSize: 13 }}>{tag}</span>
                ))}
              </div>
            </div>
          )}

          {(address || coords) && (
            <section style={s.section}>
              <h2 style={s.h2}>Lokalizacja</h2>
              {/* Nieruchoma jak w apce — dotknięcie otwiera Mapy Google (ten sam adres co „Trasa”).
                  ponytail: embed Google bez klucza (output=embed) jest nieudokumentowany; gdyby przestał działać,
                  przejść na Maps Embed API (darmowe, klucz z ograniczeniem do spootme.pl). */}
              <a href={mapsUrl} aria-label={`${place.name} na mapie — otwórz w Mapach Google`} style={{ display: 'block', borderRadius: 16, overflow: 'hidden', background: CARD }}>
                <iframe
                  title={`Mapa: ${place.name}`}
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(mapsQuery)}&z=16&hl=pl&output=embed`}
                  loading="lazy"
                  tabIndex={-1}
                  aria-hidden="true"
                  style={{ display: 'block', width: '100%', height: 200, border: 0, pointerEvents: 'none' }}
                />
              </a>
            </section>
          )}
        </div>
      </div>

      <AppBridge
        content={{
          appPath: `place-detail?id=${encodeURIComponent(place.id)}`,
          barTitle: `${place.name} czeka w Spoot`,
          barText: 'Zapisz to miejsce i oceń, co zjesz.',
          card: <PlaceCard place={bridgePlace} />,
          openingText: 'Za chwilę zobaczysz to miejsce tam, gdzie możesz je zapisać i ocenić.',
          browserLabel: 'Zobacz lokal w przeglądarce',
          sheetHeader: (
            <>
              {place.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={place.image_url} alt="" style={{ width: 56, height: 56, borderRadius: 12, objectFit: 'cover', flexShrink: 0 }} />
              )}
              <div style={{ flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontFamily: MANROPE, fontWeight: 700, fontSize: 16 }}>{place.name}</span>
                <span style={{ fontSize: 13, color: INK2 }}>{meta}</span>
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}><Badges place={bridgePlace} /></div>
            </>
          ),
          sheetTitle: `Zapisz ${place.name} i oceń, co zjesz`,
          benefits: [
            { title: 'Zapisz na później', text: 'Lokal trafi do Twoich zapisanych miejsc.', icon: <path d="M6 4h12v17l-6-4-6 4z" /> },
            { title: 'Oceniaj, co jesz', text: 'Mięso, sos, bułka — każde osobno, w skali 1–10.', icon: ICONS.star },
            { title: 'Polecenia pod Twój gust', text: 'Im więcej ocenisz, tym trafniej podpowiadamy.', icon: ICONS.sparkle },
          ],
        }}
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

// Jak karta oceny w apce (app/place-ratings.tsx): autor, wynik, dania z wynikami, opinia, zdjęcia.
function ReviewRow({ r }: { r: PlaceReview }) {
  const dishes = r.dish_entries?.length
    ? r.dish_entries.map((d) => (d.score != null ? `${dishName(d.name)} ${d.score}` : dishName(d.name)))
    : (r.dishes ?? []).map(dishName);
  const authorStyle: CSSProperties = { flexGrow: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 12 };
  const author = (
    <>
      <Avatar url={r.author.avatar_url} name={r.author.name} size={40} />
      <span style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <span style={{ ...s.ellipsis, fontFamily: MANROPE, fontWeight: 700, fontSize: 15 }}>{r.author.name}</span>
        <span style={{ fontSize: 13, color: INK2 }}>{relativePl(r.created_at)}</span>
      </span>
    </>
  );
  return (
    <article style={{ padding: '14px 0', borderBottom: `1px solid ${HAIR}`, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {r.author.username ? <Link href={`/u/${r.author.username}`} style={authorStyle}>{author}</Link> : <div style={authorStyle}>{author}</div>}
        <span role="img" aria-label={`Ocena ${r.rating} na 10`} style={{ width: 44, height: 44, borderRadius: '50%', border: `3px solid ${circleColor(r.rating)}`, background: CREAM, boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: MANROPE, fontWeight: 700, fontSize: 17, flexShrink: 0 }}>
          {r.rating}
        </span>
      </div>
      {dishes.length > 0 && <p style={{ margin: 0, fontSize: 14, color: INK2 }}>{dishes.join(' · ')}</p>}
      {r.opinion && <p style={{ margin: 0, fontSize: 15, lineHeight: '22px' }}>„{r.opinion}”</p>}
      {r.photos.length > 0 && (
        <div style={{ display: 'flex', gap: 8 }}>
          {r.photos.slice(0, 4).map((url) => (
            <a key={url} href={url} target="_blank" rel="noopener noreferrer" style={{ display: 'block' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="Zdjęcie z oceny" loading="lazy" style={{ width: 64, height: 64, borderRadius: 12, objectFit: 'cover', display: 'block' }} />
            </a>
          ))}
        </div>
      )}
    </article>
  );
}

const ICONS = {
  pin: <><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></>,
  phone: <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />,
  cash: <><rect x="3" y="6" width="18" height="12" rx="2" /><circle cx="12" cy="12" r="2.5" /></>,
  star: <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" />,
  sparkle: <><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" /><path d="M19 15l.8 2.2 2.2.8-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z" /></>,
};

const s: Record<string, CSSProperties> = {
  page: { minHeight: '100vh', background: CREAM, color: INK, fontFamily: 'var(--font-manrope), system-ui, sans-serif' },
  column: { maxWidth: 480, margin: '0 auto' },
  eyebrow: { fontFamily: MANROPE, fontWeight: 700, fontSize: 11, letterSpacing: 1.2, color: INK2 },
  ratingCard: { flex: 1, background: CARD, borderRadius: 16, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 2 },
  ratingValue: { fontFamily: MANROPE, fontWeight: 700, fontSize: 28, lineHeight: '34px' },
  ratingCount: { fontSize: 12, color: INK2 },
  rowAction: { padding: '14px 0 14px 8px', fontFamily: MANROPE, fontWeight: 700, fontSize: 13, color: GREEN, flexShrink: 0 },
  section: { display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 },
  h2: { margin: 0, fontFamily: MANROPE, fontWeight: 700, fontSize: 18 },
  ellipsis: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
};
