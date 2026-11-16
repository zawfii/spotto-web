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
// Bez tego Next 14 trzymałby odpowiedzi supabase-js w cache.
export const dynamic = 'force-dynamic';

const ACCENT = '#8E1B3A';
const INK = '#1B1A19';
const INK2 = '#4A4640';
const STONE = '#F1EFEA';
const BLOCK = '#DAD6CD';
const HAIR = 'rgba(27,26,25,0.18)';
const DISPLAY = "'Bricolage Grotesque', system-ui, sans-serif";

type Props = { params: { slug: string } };

export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: STONE };

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

  return (
    <main style={{ minHeight: '100vh', background: STONE, color: INK, fontFamily: "'Instrument Sans', system-ui, sans-serif", fontSize: 16, lineHeight: 1.5 }}>
      {/* ponytail: zwykły <link> zamiast next/font — next/font 14.2 wywraca build na części rodzin z Google Fonts. */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700&family=Instrument+Sans:wght@400;600;700&display=swap" />

      <header style={{ ...s.wrap, padding: '12px 24px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4px 24px' }}>
        <a href="#top" style={{ ...s.navLink, flexGrow: 1, fontFamily: DISPLAY, fontWeight: 700, fontSize: 20 }}>{site.name}</a>
        <nav aria-label="Sekcje strony" style={{ display: 'flex', flexWrap: 'wrap', gap: '0 20px' }}>
          {nav.map(([href, label]) => <a key={href} href={href} style={s.navLink}>{label}</a>)}
        </nav>
      </header>

      <section id="top" style={{ ...s.wrap, padding: '0 24px', display: 'flex', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ flex: '3 1 340px', minWidth: 0, boxSizing: 'border-box', padding: 'clamp(28px, 6vw, 72px)', borderRadius: 8, background: ACCENT, color: STONE, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {site.eyebrow && <span style={{ fontWeight: 600, fontSize: 13, letterSpacing: 1.4, textTransform: 'uppercase' }}>{site.eyebrow}</span>}
          <h1 style={{ margin: 0, fontFamily: DISPLAY, fontWeight: 700, fontSize: 'clamp(52px, 10vw, 128px)', lineHeight: 0.92, letterSpacing: '-0.02em', overflowWrap: 'anywhere' }}>{site.name}</h1>
          {site.description && <p style={{ margin: 0, maxWidth: 520, fontSize: 19, lineHeight: 1.45 }}>{site.description}</p>}
          {site.hours && <OpenStatus hours={site.hours} />}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 8 }}>
            {site.menu.length > 0 && <a href="#menu" style={{ ...s.button, background: STONE, color: INK }}>Zobacz menu</a>}
            {tel && <a href={tel} style={{ ...s.button, border: `1.5px solid ${STONE}` }}>Zadzwoń</a>}
          </div>
        </div>
        {site.photos[0] && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={site.photos[0]} alt={`Zdjęcie: ${site.name}`} style={{ flex: '2 1 300px', minWidth: 0, minHeight: 300, maxHeight: 640, borderRadius: 8, objectFit: 'cover', background: BLOCK }} />
        )}
      </section>

      {site.deals.length > 0 && (
        <section id="oferty" style={s.section}>
          <h2 style={s.h2}>Oferty</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: 16 }}>
            {site.deals.map((d) => (
              <article key={d.id} style={{ padding: 24, borderRadius: 8, background: '#fff', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontWeight: 600, fontSize: 13, letterSpacing: 1.2, textTransform: 'uppercase', color: ACCENT }}>{dealWhen(d)}</span>
                <h3 style={{ margin: 0, fontFamily: DISPLAY, fontWeight: 700, fontSize: 26, lineHeight: 1.15 }}>{d.dish_name}</h3>
                <p style={{ margin: 0, flexGrow: 1, color: INK2 }}>{d.description}</p>
                <p style={{ margin: '12px 0 0', display: 'flex', alignItems: 'baseline', gap: 12, fontVariantNumeric: 'tabular-nums' }}>
                  <span style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 32, lineHeight: 1 }}>{price(d.price)}</span>
                  {d.original_price != null && Number(d.original_price) > Number(d.price) && (
                    <s style={{ color: INK2 }}><span style={s.srOnly}>zamiast </span>{price(d.original_price)}</s>
                  )}
                </p>
              </article>
            ))}
          </div>
        </section>
      )}

      {site.menu.length > 0 && (
        <section id="menu" style={{ ...s.section, gap: 8 }}>
          <h2 style={s.h2}>Menu</h2>
          {site.menu.map((sec) => (
            <div key={sec.id} style={{ display: 'flex', flexWrap: 'wrap', gap: '0 48px', paddingTop: 32 }}>
              <h3 style={{ flex: '1 1 200px', margin: 0, padding: '16px 0 8px', borderTop: `2px solid ${INK}`, fontFamily: DISPLAY, fontWeight: 700, fontSize: 24, lineHeight: 1.2 }}>{sec.name}</h3>
              <ul style={{ flex: '3 1 420px', minWidth: 0, listStyle: 'none', margin: 0, padding: 0, borderTop: `2px solid ${INK}` }}>
                {sec.items.map((it) => (
                  <li key={it.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 16, padding: '16px 0', borderBottom: `1px solid ${HAIR}` }}>
                    {it.image_url && <DishThumb src={it.image_url} />}
                    <div style={{ flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span style={{ fontWeight: 600, fontSize: 18, lineHeight: 1.3 }}>
                        {it.name}
                        {it.is_vege && <span style={{ marginLeft: 8, padding: '2px 8px', borderRadius: 999, background: '#DDE9DD', color: '#1F5B3A', fontSize: 12, fontWeight: 700, verticalAlign: 2 }}>wege</span>}
                      </span>
                      {it.description && <span style={{ color: INK2 }}>{it.description}</span>}
                      {!!it.allergens?.length && <span style={{ fontSize: 13, color: INK2 }}>Alergeny: {allergenLabels(it.allergens)}</span>}
                    </div>
                    {Number(it.price) > 0 && (
                      <span style={{ flexShrink: 0, fontWeight: 700, fontSize: 18, lineHeight: 1.3, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{price(it.price)}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}

      {site.photos.length > 1 && (
        <section style={s.section}>
          <h2 style={s.h2}>Galeria</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: 16 }}>
            {site.photos.slice(1).map((url) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={url} src={url} alt={`Zdjęcie: ${site.name}`} loading="lazy" style={{ width: '100%', height: 280, borderRadius: 8, objectFit: 'cover', background: BLOCK }} />
            ))}
          </div>
        </section>
      )}

      <section style={{ ...s.section, paddingBottom: 'clamp(56px, 8vw, 104px)', flexDirection: 'row', flexWrap: 'wrap', gap: 48 }}>
        {site.hours && (
          <div id="godziny" style={s.column}>
            <h2 style={s.h2}>Godziny</h2>
            <HoursList hours={site.hours} />
          </div>
        )}
        <div id="kontakt" style={s.column}>
          <h2 style={s.h2}>Kontakt</h2>
          <address style={{ fontStyle: 'normal', borderTop: `2px solid ${INK}`, display: 'flex', flexDirection: 'column' }}>
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
                style={{ display: 'block', width: '100%', height: 220, border: 0, borderRadius: 8, background: BLOCK }}
              />
              <a href={`https://www.google.com/maps/search/?api=1&query=${mapsQuery}`} target="_blank" rel="noopener noreferrer" style={{ ...s.button, alignSelf: 'flex-start', background: INK, color: STONE }}>
                Wyznacz trasę
              </a>
            </>
          )}
        </div>
      </section>

      <footer style={{ background: INK, color: STONE }}>
        <div style={{ ...s.wrap, padding: '20px 24px calc(20px + env(safe-area-inset-bottom))', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4px 24px', fontSize: 14 }}>
          <span style={{ flexGrow: 1 }}>© {new Date().getFullYear()} {site.name}</span>
          <a href={`/place/${site.id}`} style={{ minHeight: 44, display: 'flex', alignItems: 'center', color: STONE, textDecoration: 'underline', textUnderlineOffset: 4 }}>
            Strona działa ze Spoot — zobacz opinie gości
          </a>
        </div>
      </footer>
    </main>
  );
}

const s: Record<string, CSSProperties> = {
  wrap: { maxWidth: 1200, margin: '0 auto' },
  section: { maxWidth: 1200, margin: '0 auto', padding: 'clamp(56px, 8vw, 104px) 24px 0', display: 'flex', flexDirection: 'column', gap: 24 },
  column: { flex: '1 1 300px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 20 },
  h2: { margin: 0, fontFamily: DISPLAY, fontWeight: 700, fontSize: 'clamp(34px, 5vw, 56px)', lineHeight: 1, letterSpacing: '-0.01em' },
  navLink: { minHeight: 44, display: 'flex', alignItems: 'center', fontWeight: 600, fontSize: 15, color: INK, textDecoration: 'none' },
  button: { minHeight: 52, padding: '0 28px', boxSizing: 'border-box', display: 'flex', alignItems: 'center', borderRadius: 999, fontWeight: 700, color: 'inherit', textDecoration: 'none' },
  contactRow: { minHeight: 48, padding: '8px 0', boxSizing: 'border-box', display: 'flex', alignItems: 'center', borderBottom: `1px solid ${HAIR}`, fontSize: 17, color: INK },
  srOnly: { position: 'absolute', width: 1, height: 1, overflow: 'hidden', clipPath: 'inset(50%)', whiteSpace: 'nowrap' },
};
