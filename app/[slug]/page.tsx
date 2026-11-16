import type { Metadata, Viewport } from 'next';
import type { CSSProperties } from 'react';
import { notFound } from 'next/navigation';
import { getPlaceExtras, isRealPhoto, supabase } from '@/lib/supabase';
import { formatPrice } from '@/lib/format';
import { allergenLabels } from '@/lib/owner';
import { isValidSlug } from '@/lib/website-packages';
import { DishThumb } from '../place/[id]/PlaceClient';
import { HoursList, OpenStatus, type Hours } from './SiteClient';

// Strona lokalu pod spootme.pl/<slug> (panel → „Strona dla lokalu”). Nie ma własnych treści:
// przy każdym wejściu czyta te same tabele, które zapisuje panel — zmiana ceny czy godzin widać od razu.
// Świeżość danych zapewnia klient w lib/supabase.ts (fetch z cache: 'no-store').

// Identyfikacja Bistro Pokazowego: granat, krem, pomarańcz, geometryczny znak, krój w duchu Futury.
// ponytail: jedna paleta i jeden znak w kodzie; gdy dojdzie druga strona — motyw per lokal (kolumna w website_requests).
const NAVY = '#0A1A3F';
const NAVY2 = '#12265A';
const CREAM = '#F8E6B8';
const PAPER = '#FBF3DC';
const ORANGE = '#E8431B';
const SOFT = 'rgba(248,230,184,0.78)'; // krem na granacie, tekst drugorzędny
const INK2 = 'rgba(10,26,63,0.78)'; // granat na kremie, tekst drugorzędny
const HAIR_DARK = 'rgba(248,230,184,0.28)';
const FONT = "'Jost', 'Futura', 'Century Gothic', system-ui, sans-serif";
const PAD = 'clamp(64px, 9vw, 128px)';
const SLANT = 'clamp(28px, 5vw, 72px)';

type Props = { params: { slug: string } };

export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: NAVY };

type Deal = {
  id: string; dish_name: string; description: string | null; price: number; original_price: number | null;
  days_of_week: string[] | null; valid_until: string | null; start_time: string | null; end_time: string | null;
};

async function getSite(slug: string) {
  if (!isValidSlug(slug)) return null; // m.in. /favicon.ico, /robots.txt — bez pytania bazy
  const { data: site } = await supabase.rpc('get_site_by_slug', { p_slug: slug });
  const placeId = (site as { place_id: string }[] | null)?.[0]?.place_id;
  if (!placeId) return null;

  const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Warsaw' }); // RRRR-MM-DD
  const [place, venue, photos, deals, extras] = await Promise.all([
    supabase.from('places').select('id, name, category, district, address, phone, image_url').eq('id', placeId).maybeSingle(),
    supabase.from('venue_details').select('description, phone, address, instagram, hours').eq('place_id', placeId).maybeSingle(),
    supabase.from('venue_photos').select('url').eq('place_id', placeId).order('position'),
    supabase
      .from('deals')
      .select('id, dish_name, description, price, original_price, days_of_week, valid_until, start_time, end_time')
      .eq('place_id', placeId)
      .eq('status', 'approved')
      .or(`valid_until.is.null,valid_until.gte.${today}`)
      .order('created_at'),
    getPlaceExtras(placeId),
  ]);
  if (!place.data) return null;

  const v = venue.data;
  const urls = (photos.data ?? []).map((p) => p.url as string).filter((u) => /^https:\/\//.test(u));
  if (!urls.length && isRealPhoto(place.data.image_url)) urls.push(place.data.image_url);
  return {
    id: place.data.id as string,
    name: place.data.name as string,
    eyebrow: [place.data.category, place.data.district].filter(Boolean).join(' · '),
    description: (v?.description as string | null)?.trim() || null,
    phone: ((v?.phone || place.data.phone) as string | null) || null,
    address: ((v?.address || place.data.address) as string | null)?.replace(/,\s*Polska$/, '') || null,
    district: (place.data.district as string | null) ?? null,
    instagram: (v?.instagram as string | null)?.replace(/^@|^https?:\/\/(www\.)?instagram\.com\/|\/$/g, '') || null,
    hours: (v?.hours as Hours | null) ?? null,
    photos: urls,
    deals: (deals.data ?? []) as Deal[],
    menu: extras.menu.sections,
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const site = await getSite(params.slug);
  if (!site) return { title: 'Nie znaleziono strony' };
  const description = site.description ?? site.eyebrow;
  return {
    title: `${site.name} — ${site.eyebrow}`,
    description,
    openGraph: { title: site.name, description, type: 'website', images: site.photos.slice(0, 1) },
  };
}

const SHORT: Record<string, string> = { mon: 'pon.', tue: 'wt.', wed: 'śr.', thu: 'czw.', fri: 'pt.', sat: 'sob.', sun: 'niedz.' };
const WEEK = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

/** „pon.–pt. · 12:00–15:00”, „wt. · cały dzień”, „codziennie · cały dzień”. */
function dealWhen(d: Deal) {
  const days = WEEK.filter((k) => d.days_of_week?.includes(k));
  const first = WEEK.indexOf(days[0]);
  const run = days.length > 2 && days.every((k, i) => WEEK.indexOf(k) === first + i); // kolejne dni → zakres
  const dayText = !days.length || days.length === 7 ? 'codziennie'
    : run ? `${SHORT[days[0]]}–${SHORT[days[days.length - 1]]}`
    : days.map((k) => SHORT[k]).join(', ');
  const time = d.start_time && d.end_time ? `${d.start_time.slice(0, 5)}–${d.end_time.slice(0, 5)}` : 'cały dzień';
  return `${dayText} · ${time}`;
}

// „42 zł”, a gdy są grosze — „42,50 zł”.
const price = (n: number) => (Number.isInteger(Number(n)) ? `${Number(n)} zł` : formatPrice(n));

// Znak lokalu: dwie płaszczyzny i koło. Kolory z palety, więc działa na granacie i na pomarańczu.
function Mark({ size, shape = CREAM, dot = ORANGE }: { size: number | string; shape?: string; dot?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 100 100" style={{ width: size, height: size, display: 'block', flexShrink: 0 }}>
      <polygon points="4,0 62,22 62,36 38,36 38,90 4,100" fill={shape} />
      <circle cx="52" cy="54" r="14" fill={dot} />
      <polygon points="58,44 96,34 96,100 58,88" fill={shape} />
    </svg>
  );
}

// Nagłówek sekcji jak podpis w logotypie: wersaliki, szeroko, z numerem.
function Heading({ n, children, color, sub, half }: { n: string; children: string; color: string; sub: string; half?: boolean }) {
  return (
    <h2 style={{ margin: 0, display: 'flex', alignItems: 'baseline', gap: 'clamp(12px, 2vw, 24px)', color, fontWeight: 800, fontSize: half ? 'clamp(40px, 5.4vw, 72px)' : 'clamp(44px, 9vw, 120px)', lineHeight: 0.9, letterSpacing: '0.02em', textTransform: 'uppercase' }}>
      <span aria-hidden="true" style={{ fontWeight: 500, fontSize: 'clamp(18px, 2vw, 24px)', letterSpacing: '0.2em', color: sub }}>{n}</span>
      {children}
    </h2>
  );
}

export default async function SitePage({ params }: Props) {
  const site = await getSite(params.slug);
  if (!site) notFound();

  const tel = site.phone ? `tel:${site.phone.replace(/\s/g, '')}` : null;
  const mapsQuery = encodeURIComponent([site.name, site.address].filter(Boolean).join(', '));
  const nav: [string, string][] = [];
  if (site.deals.length) nav.push(['#oferty', 'Oferty']);
  if (site.menu.length) nav.push(['#menu', 'Menu']);
  if (site.hours) nav.push(['#godziny', 'Godziny']);
  nav.push(['#kontakt', 'Kontakt']);
  // Rozmiar nazwy tak, żeby najdłuższe słowo mieściło się w kolumnie w jednej linii, a podpis w jednej linii
  // z kreskami po bokach. 0.82 i 0.9 em to szerokość znaku w Jost (wersaliki 800 / 500 ze spacjowaniem 0.24em).
  // ponytail: przybliżenie po liczbie znaków; bardzo długie słowo zejdzie do 34 px i dopiero wtedy się złamie.
  const longest = Math.max(...site.name.split(/\s+/).map((w) => w.length), 4);
  const titleCqi = (100 / (longest * 0.82)).toFixed(2);
  const eyebrowCqi = (76 / (Math.max(site.eyebrow.length, 12) * 0.9)).toFixed(2);
  let no = 0;
  const next = () => String(++no).padStart(2, '0');

  return (
    <main style={{ minHeight: '100vh', background: NAVY, color: CREAM, fontFamily: FONT, fontSize: 17, lineHeight: 1.5, overflowX: 'clip' }}>
      {/* ponytail: zwykły <link> zamiast next/font — next/font 14.2 wywraca build na części rodzin z Google Fonts. */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Jost:wght@400;500;600;800&display=swap" />

      {/* ── Granat: nagłówek i wejście ── */}
      <header style={{ ...s.wrap, padding: '16px 24px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4px 28px' }}>
        <a href="#top" style={{ ...s.navLink, flexGrow: 1, gap: 12, fontWeight: 800, fontSize: 17, letterSpacing: '0.06em' }}>
          <Mark size={32} />
          {site.name}
        </a>
        <nav aria-label="Sekcje strony" style={{ display: 'flex', flexWrap: 'wrap', gap: '0 24px' }}>
          {nav.map(([href, label]) => <a key={href} href={href} style={s.navLink}>{label}</a>)}
        </nav>
      </header>

      <section id="top" style={{ ...s.wrap, padding: `clamp(32px, 6vw, 88px) 24px ${PAD}`, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'clamp(32px, 5vw, 72px)' }}>
        {/* Kolumna jest kontenerem: nazwa i podpis skalują się do JEJ szerokości (cqi), nie do okna. */}
        <div style={{ flex: '3 1 340px', minWidth: 0, containerType: 'inline-size', display: 'flex', flexDirection: 'column', gap: 24 }}>
          <h1 style={{ margin: 0, fontWeight: 800, fontSize: `clamp(34px, ${titleCqi}cqi, 112px)`, lineHeight: 0.9, letterSpacing: '0.01em', textTransform: 'uppercase', overflowWrap: 'break-word' }}>{site.name}</h1>
          {site.eyebrow && (
            <p style={{ margin: 0, maxWidth: 560, display: 'flex', alignItems: 'center', gap: 16, fontWeight: 500, fontSize: `clamp(10px, ${eyebrowCqi}cqi, 15px)`, letterSpacing: '0.24em', whiteSpace: 'nowrap', textTransform: 'uppercase' }}>
              <span aria-hidden="true" style={{ flex: '1 1 0', minWidth: 16, height: 1.5, background: CREAM }} />
              {site.eyebrow}
              <span aria-hidden="true" style={{ flex: '1 1 0', minWidth: 16, height: 1.5, background: CREAM }} />
            </p>
          )}
          {site.description && <p style={{ margin: 0, maxWidth: 520, fontSize: 21, lineHeight: 1.4, color: SOFT }}>{site.description}</p>}
          {site.hours && <OpenStatus hours={site.hours} />}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {site.menu.length > 0 && <a href="#menu" style={{ ...s.button, background: ORANGE, color: NAVY }}>Zobacz menu</a>}
            {tel && <a href={tel} style={{ ...s.button, border: `2px solid ${CREAM}`, color: CREAM }}>Zadzwoń</a>}
          </div>
        </div>
        <div style={{ flex: '2 1 220px', minWidth: 0, display: 'flex', justifyContent: 'center' }}>
          <Mark size="min(72%, 440px)" />
        </div>
      </section>

      {/* ── Pomarańcz: oferty. Skośna krawędź jak płaszczyzny w znaku. ── */}
      {site.deals.length > 0 && (
        <div id="oferty" style={{ background: ORANGE, color: NAVY, clipPath: `polygon(0 ${SLANT}, 100% 0, 100% 100%, 0 100%)`, marginTop: `calc(-1 * ${SLANT})` }}>
          <section style={{ ...s.section, paddingTop: `calc(${PAD} + ${SLANT})` }}>
            <Heading n={next()} color={NAVY} sub={NAVY}>Oferty</Heading>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: 20 }}>
              {site.deals.map((d) => (
                <article key={d.id} style={{ padding: 'clamp(24px, 3vw, 40px)', background: NAVY, color: CREAM, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <span style={{ fontWeight: 500, fontSize: 14, letterSpacing: '0.22em', textTransform: 'uppercase' }}>{dealWhen(d)}</span>
                  <h3 style={{ margin: 0, fontWeight: 800, fontSize: 'clamp(26px, 3vw, 36px)', lineHeight: 1.05, textTransform: 'uppercase' }}>{d.dish_name}</h3>
                  <p style={{ margin: 0, flexGrow: 1, color: SOFT }}>{d.description}</p>
                  <p style={{ margin: '16px 0 0', display: 'flex', alignItems: 'center', gap: 16, fontVariantNumeric: 'tabular-nums' }}>
                    <span style={{ minWidth: 104, height: 104, padding: '0 14px', boxSizing: 'border-box', borderRadius: 999, background: ORANGE, color: NAVY, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 28, whiteSpace: 'nowrap' }}>{price(d.price)}</span>
                    {d.original_price != null && Number(d.original_price) > Number(d.price) && (
                      <s style={{ color: SOFT, fontSize: 20 }}><span style={s.srOnly}>zamiast </span>{price(d.original_price)}</s>
                    )}
                  </p>
                </article>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* ── Krem: karta, jak papierowe menu na stoliku ── */}
      {site.menu.length > 0 && (
        <div id="menu" style={{ background: PAPER, color: NAVY }}>
          <section style={s.section}>
            <Heading n={next()} color={NAVY} sub={ORANGE}>Menu</Heading>
            {site.menu.map((sec) => (
              <div key={sec.id} style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 56px', paddingTop: 16 }}>
                <h3 style={{ flex: '1 1 220px', margin: 0, padding: '18px 0 0', borderTop: `3px solid ${NAVY}`, fontWeight: 800, fontSize: 24, lineHeight: 1.15, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{sec.name}</h3>
                <ul style={{ flex: '3 1 440px', minWidth: 0, listStyle: 'none', margin: 0, padding: 0, borderTop: `3px solid ${NAVY}` }}>
                  {sec.items.map((it) => (
                    <li key={it.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 16, padding: '18px 0', borderBottom: '1px solid rgba(10,26,63,0.2)' }}>
                      {it.image_url && <DishThumb src={it.image_url} />}
                      <div style={{ flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ fontWeight: 600, fontSize: 21, lineHeight: 1.25 }}>
                          {it.name}
                          {it.is_vege && <span style={{ marginLeft: 10, padding: '1px 8px', border: `1.5px solid ${NAVY}`, borderRadius: 999, fontSize: 12, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', verticalAlign: 3 }}>wege</span>}
                        </span>
                        {it.description && <span style={{ color: INK2 }}>{it.description}</span>}
                        {!!it.allergens?.length && <span style={{ fontSize: 14, color: INK2 }}>Alergeny: {allergenLabels(it.allergens)}</span>}
                      </div>
                      {Number(it.price) > 0 && (
                        <span style={{ flexShrink: 0, fontWeight: 800, fontSize: 21, lineHeight: 1.25, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{price(it.price)}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        </div>
      )}

      {/* Zdjęcia z Profilu lokalu: równe kafle 4:3 w siatce, nigdy na całą szerokość —
          przycięty baner z dowolnego zdjęcia (np. logo) wyglądał źle. */}
      {site.photos.length > 0 && (
        <div style={{ background: PAPER, padding: '0 24px', paddingBottom: PAD }}>
          <div style={{ ...s.wrap, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 260px), 1fr))', gap: 12 }}>
            {site.photos.map((url) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={url} src={url} alt={`Zdjęcie: ${site.name}`} loading="lazy" style={{ width: '100%', aspectRatio: '4 / 3', objectFit: 'cover', background: CREAM }} />
            ))}
          </div>
        </div>
      )}

      {/* ── Granat: godziny i kontakt ── */}
      <div style={{ background: PAPER }}>
        <div style={{ background: NAVY, clipPath: `polygon(0 0, 100% ${SLANT}, 100% 100%, 0 100%)` }}>
          <section style={{ ...s.section, paddingTop: `calc(${PAD} + ${SLANT})`, flexDirection: 'row', flexWrap: 'wrap', gap: 'clamp(48px, 6vw, 96px)' }}>
            {site.hours && (
              <div id="godziny" style={s.column}>
                <Heading half n={next()} color={CREAM} sub={CREAM}>Godziny</Heading>
                <HoursList hours={site.hours} />
              </div>
            )}
            <div id="kontakt" style={s.column}>
              <Heading half n={next()} color={CREAM} sub={CREAM}>Kontakt</Heading>
              <address style={{ fontStyle: 'normal', borderTop: `3px solid ${CREAM}`, display: 'flex', flexDirection: 'column' }}>
                {site.address && <span style={s.contactRow}>{[site.address, site.district].filter(Boolean).join(', ')}</span>}
                {tel && <a href={tel} style={{ ...s.contactRow, fontWeight: 600 }}>{site.phone}</a>}
                {site.instagram && (
                  <a href={`https://instagram.com/${encodeURIComponent(site.instagram)}`} target="_blank" rel="noopener noreferrer" style={{ ...s.contactRow, fontWeight: 600 }}>
                    Instagram: @{site.instagram}
                  </a>
                )}
              </address>
              {site.address && (
                <>
                  {/* ponytail: embed Google bez klucza, jak w /place/[id] — gdyby przestał działać, Maps Embed API. */}
                  <iframe
                    title={`Mapa: ${site.name}`}
                    src={`https://maps.google.com/maps?q=${mapsQuery}&z=16&hl=pl&output=embed`}
                    loading="lazy"
                    style={{ display: 'block', width: '100%', height: 240, border: 0, background: NAVY2 }}
                  />
                  <a href={`https://www.google.com/maps/search/?api=1&query=${mapsQuery}`} target="_blank" rel="noopener noreferrer" style={{ ...s.button, alignSelf: 'flex-start', background: ORANGE, color: NAVY }}>
                    Wyznacz trasę
                  </a>
                </>
              )}
            </div>
          </section>
        </div>
      </div>

      <footer style={{ borderTop: `1px solid ${HAIR_DARK}` }}>
        <div style={{ ...s.wrap, padding: '24px 24px calc(24px + env(safe-area-inset-bottom))', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px 24px', fontSize: 15 }}>
          <span style={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: 12 }}><Mark size={28} />© {new Date().getFullYear()} {site.name}</span>
          <a href={`/place/${site.id}`} style={{ minHeight: 44, display: 'flex', alignItems: 'center', color: CREAM, textDecoration: 'underline', textUnderlineOffset: 4 }}>
            Strona działa ze Spoot — zobacz opinie gości
          </a>
        </div>
      </footer>
    </main>
  );
}

const s: Record<string, CSSProperties> = {
  wrap: { maxWidth: 1240, margin: '0 auto' },
  section: { maxWidth: 1240, margin: '0 auto', padding: `${PAD} 24px`, display: 'flex', flexDirection: 'column', gap: 'clamp(28px, 4vw, 48px)' },
  column: { flex: '1 1 320px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 28 },
  navLink: { minHeight: 44, display: 'flex', alignItems: 'center', fontWeight: 500, fontSize: 14, letterSpacing: '0.18em', textTransform: 'uppercase', color: CREAM, textDecoration: 'none' },
  // 19 px / 800: „duży tekst” wg WCAG, więc granat na pomarańczu (4:1) przechodzi.
  button: { minHeight: 56, padding: '0 32px', boxSizing: 'border-box', display: 'flex', alignItems: 'center', fontWeight: 800, fontSize: 19, letterSpacing: '0.1em', textTransform: 'uppercase', textDecoration: 'none' },
  contactRow: { minHeight: 52, padding: '10px 0', boxSizing: 'border-box', display: 'flex', alignItems: 'center', borderBottom: `1px solid ${HAIR_DARK}`, fontSize: 19, color: CREAM },
  srOnly: { position: 'absolute', width: 1, height: 1, overflow: 'hidden', clipPath: 'inset(50%)', whiteSpace: 'nowrap' },
};
