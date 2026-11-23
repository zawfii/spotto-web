import type { Metadata, Viewport } from 'next';
import { Manrope } from 'next/font/google';
import Link from 'next/link';
import { getPlaceExtras, supabase } from '@/lib/supabase';
import { Wordmark } from '@/components/SpootLogo';
import { AppBridge } from '@/components/AppBridge';
import { MenuCard } from '../MenuCard';
import { PlaceCard } from '../PlaceClient';

// Sama karta lokalu — tu prowadzi kod QR ze stolika (panel właściciela → Menu → Kod QR).
// Gość przy stoliku chce od razu menu: apka nie otwiera się sama (AASA wyklucza /place/*/menu),
// na dole jest tylko pasek „Otwórz”, który otwiera apkę na zakładce Menu.

const manrope = Manrope({ subsets: ['latin', 'latin-ext'], weight: ['400', '500', '600', '700'], variable: '--font-manrope' });

// ID z eas.json (submit.production.ios.ascAppId) i pakiet z app.json.
const APP_STORE_URL = 'https://apps.apple.com/pl/app/id6822473524';
const PLAY_URL = 'https://play.google.com/store/apps/details?id=com.spoot.app';

const GREEN = '#164938';
const INK = '#03271a';
const INK2 = '#1e3028';
const CREAM = '#fdf5ec';
const CARD = '#eae5de';
const MANROPE = 'var(--font-manrope), sans-serif';

type Props = { params: { id: string } };

export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: CREAM };

async function getPlace(id: string) {
  const { data } = await supabase
    .from('places')
    .select('id, name, district, category, image_url, avg_spotto_rating, google_rating')
    .eq('id', id)
    .maybeSingle();
  return data;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const place = await getPlace(params.id);
  return { title: place ? `Menu — ${place.name} · Spoot` : 'Menu · Spoot' };
}

export default async function PlaceMenuPage({ params }: Props) {
  const [place, { menu }] = await Promise.all([getPlace(params.id), getPlaceExtras(params.id)]);
  const meta = place ? [place.district, place.category].filter(Boolean).join(' · ') : '';

  return (
    <main className={manrope.variable} style={{ minHeight: '100vh', background: CREAM, color: INK, fontFamily: `${MANROPE}, system-ui`, paddingBottom: 'calc(100px + env(safe-area-inset-bottom))' }}>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <header style={{ height: 56, display: 'flex', alignItems: 'center' }}>
          <Wordmark size={22} />
        </header>

        {!place ? (
          <p style={{ margin: '24px 0', fontSize: 15, color: INK2 }}>Nie znaleźliśmy tego lokalu. Link mógł się zdezaktualizować.</p>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, paddingBottom: 8 }}>
              <span style={{ fontWeight: 700, fontSize: 11, letterSpacing: 1.2, color: INK2 }}>MENU</span>
              <h1 style={{ margin: 0, fontWeight: 700, fontSize: 28, lineHeight: '34px' }}>{place.name}</h1>
              <p style={{ margin: 0, fontSize: 13, color: INK2 }}>{meta}</p>
            </div>

            {menu.sections.length === 0 ? (
              <div style={{ background: CARD, borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span style={{ fontSize: 15 }}>Ten lokal nie dodał jeszcze karty w Spoot.</span>
                {menu.url && <a href={menu.url} style={{ fontWeight: 700, fontSize: 14, color: GREEN, padding: '8px 0' }}>Zobacz menu na stronie lokalu</a>}
              </div>
            ) : (
              <MenuCard menu={menu} />
            )}

            <Link href={`/place/${place.id}`} style={{ alignSelf: 'flex-start', marginTop: 16, padding: '12px 0', fontWeight: 700, fontSize: 14, color: GREEN, textDecoration: 'underline', textUnderlineOffset: 4 }}>
              Opinie i informacje o lokalu w Spoot
            </Link>
          </>
        )}
      </div>

      {place && (
        <AppBridge
          autoOpen={false}
          content={{
            appPath: `place-detail?id=${encodeURIComponent(place.id)}&tab=menu`,
            barTitle: `${place.name} w Spoot`,
            barText: 'Oceń, co zjesz, i zapisz lokal.',
            card: (
              <PlaceCard
                place={{
                  id: place.id,
                  name: place.name,
                  meta,
                  imageUrl: place.image_url ?? null,
                  spootRating: place.avg_spotto_rating != null ? Number(place.avg_spotto_rating).toFixed(1) : null,
                  googleRating: place.google_rating != null ? Number(place.google_rating).toFixed(1).replace('.', ',') : null,
                }}
              />
            ),
            openingText: 'Za chwilę zobaczysz kartę tam, gdzie możesz ocenić, co zjesz.',
            browserLabel: 'Zostań przy karcie w przeglądarce',
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
              </>
            ),
            sheetTitle: `Oceń, co zjesz w ${place.name}`,
            benefits: [
              { title: 'Oceniaj, co jesz', text: 'Mięso, sos, bułka — każde osobno, w skali 1–10.', icon: <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" /> },
              { title: 'Zapisz na później', text: 'Lokal trafi do Twoich zapisanych miejsc.', icon: <path d="M6 4h12v17l-6-4-6 4z" /> },
              { title: 'Polecenia pod Twój gust', text: 'Im więcej ocenisz, tym trafniej podpowiadamy.', icon: <><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" /><path d="M19 15l.8 2.2 2.2.8-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z" /></> },
            ],
          }}
          appStoreUrl={APP_STORE_URL}
          playUrl={PLAY_URL}
        />
      )}
    </main>
  );
}
