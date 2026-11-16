import type { Metadata, Viewport } from 'next';
import { Manrope } from 'next/font/google';
import Link from 'next/link';
import { getPlaceExtras, supabase } from '@/lib/supabase';
import { formatPrice, pluralPl } from '@/lib/format';
import { allergenLabels } from '@/lib/owner';
import { Wordmark } from '@/components/SpootLogo';
import { DishThumb } from '../PlaceClient';

// Sama karta lokalu — tu prowadzi kod QR ze stolika (panel właściciela → Menu → Kod QR).
// Bez nakładki „otwórz w aplikacji”: gość przy stoliku chce od razu menu.

const manrope = Manrope({ subsets: ['latin', 'latin-ext'], weight: ['400', '500', '600', '700'], variable: '--font-manrope' });

const GREEN = '#164938';
const INK = '#03271a';
const INK2 = '#1e3028';
const CREAM = '#fdf5ec';
const CARD = '#eae5de';
const HAIR = 'rgba(3,39,26,0.15)';
const MANROPE = 'var(--font-manrope), sans-serif';

type Props = { params: { id: string } };

export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: CREAM };

async function getPlace(id: string) {
  const { data } = await supabase.from('places').select('id, name, district, category').eq('id', id).maybeSingle();
  return data;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const place = await getPlace(params.id);
  return { title: place ? `Menu — ${place.name} · Spoot` : 'Menu · Spoot' };
}

export default async function PlaceMenuPage({ params }: Props) {
  const [place, { menu }] = await Promise.all([getPlace(params.id), getPlaceExtras(params.id)]);

  return (
    <main className={manrope.variable} style={{ minHeight: '100vh', background: CREAM, color: INK, fontFamily: `${MANROPE}, system-ui`, paddingBottom: 'calc(32px + env(safe-area-inset-bottom))' }}>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <header style={{ height: 56, display: 'flex', alignItems: 'center' }}>
          <Wordmark size={22} />
        </header>

        {!place ? (
          <p style={{ margin: '24px 0', fontSize: 15, color: INK2 }}>Nie znaleźliśmy tego lokalu. Link mógł się zdezaktualizować.</p>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontWeight: 700, fontSize: 11, letterSpacing: 1.2, color: INK2 }}>MENU</span>
              <h1 style={{ margin: 0, fontWeight: 700, fontSize: 28, lineHeight: '34px' }}>{place.name}</h1>
              <p style={{ margin: 0, fontSize: 13, color: INK2 }}>{[place.district, place.category].filter(Boolean).join(' · ')}</p>
            </div>

            {menu.sections.length === 0 ? (
              <div style={{ background: CARD, borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span style={{ fontSize: 15 }}>Ten lokal nie dodał jeszcze karty w Spoot.</span>
                {menu.url && <a href={menu.url} style={{ fontWeight: 700, fontSize: 14, color: GREEN, padding: '8px 0' }}>Zobacz menu na stronie lokalu</a>}
              </div>
            ) : (
              <>
                <nav aria-label="Sekcje menu" style={{ display: 'flex', gap: 8, overflowX: 'auto', margin: '0 -16px', padding: '0 16px' }}>
                  {menu.sections.map((sec) => (
                    <a key={sec.id} href={`#s-${sec.id}`} style={{ flexShrink: 0, minHeight: 40, padding: '0 14px', display: 'flex', alignItems: 'center', borderRadius: 999, background: CARD, fontWeight: 700, fontSize: 13, color: INK, whiteSpace: 'nowrap' }}>
                      {sec.name}
                    </a>
                  ))}
                </nav>

                {menu.sections.map((sec) => (
                  <section key={sec.id} id={`s-${sec.id}`} style={{ background: CARD, borderRadius: 16, padding: '4px 16px', scrollMarginTop: 16 }}>
                    <h2 style={{ margin: 0, padding: '14px 0 10px', display: 'flex', alignItems: 'baseline', gap: 8, fontWeight: 700, fontSize: 18 }}>
                      <span style={{ flexGrow: 1 }}>{sec.name}</span>
                      <span style={{ fontWeight: 400, fontSize: 13, color: INK2 }}>{sec.items.length} {pluralPl(sec.items.length, 'pozycja', 'pozycje', 'pozycji')}</span>
                    </h2>
                    <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
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
                            <span style={{ fontWeight: 700, fontSize: 14, lineHeight: '20px', whiteSpace: 'nowrap', flexShrink: 0 }}>{formatPrice(it.price)}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </>
            )}

            <Link href={`/place/${place.id}`} style={{ alignSelf: 'flex-start', padding: '12px 0', fontWeight: 700, fontSize: 14, color: GREEN, textDecoration: 'underline', textUnderlineOffset: 4 }}>
              Opinie i informacje o lokalu w Spoot
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
