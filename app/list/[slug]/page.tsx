import type { Metadata, Viewport } from 'next';
import type { CSSProperties, ReactNode } from 'react';
import { Manrope } from 'next/font/google';
import Link from 'next/link';
import { supabase, isRealPhoto } from '@/lib/supabase';
import { pluralPl } from '@/lib/format';
import { Wordmark } from '@/components/SpootLogo';
import { AppBridge, OpenAppButton } from '@/components/AppBridge';
import { Avatar, Icon, ICONS } from '@/components/ui';
import { ListPlaces, ShareButton, type ListPlace } from './ListClient';

const manrope = Manrope({ subsets: ['latin', 'latin-ext'], weight: ['400', '500', '600', '700'], variable: '--font-manrope' });

// Jak na stronie profilu (app/u/[username]/page.tsx).
const APP_STORE_URL = 'https://apps.apple.com/pl/app/id6822473524';
const PLAY_URL = 'https://play.google.com/store/apps/details?id=com.spoot.app';

const GREEN = '#164938';
const INK = '#03271a';
const INK2 = '#1e3028';
const CREAM = '#fdf5ec';
const MANROPE = 'var(--font-manrope), sans-serif';
const page: CSSProperties = { minHeight: '100vh', background: CREAM, color: INK, fontFamily: 'var(--font-manrope), system-ui, sans-serif' };

interface ListPageProps {
  params: { slug: string };
}

export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: CREAM };

type RpcPlace = { id: string; name: string; image: string; category: string; rating: string; review: string };

async function getListData(slug: string) {
  try {
    const { data, error } = await supabase.rpc('get_public_list_by_slug', { p_slug: slug });
    if (error || !data || data.length === 0) return null;
    const list = data[0];
    // RPC zwraca display_name jako „username”; prawdziwy nick do linku bierzemy z profiles (czytelne dla anon).
    const { data: owner } = await supabase.from('profiles').select('username').eq('id', list.user_id).maybeSingle();
    const places: ListPlace[] = ((list.places ?? []) as RpcPlace[])
      .filter((p) => p.id)
      .map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category || null,
        image: isRealPhoto(p.image) ? p.image : null,
        rating: p.rating ? Number(p.rating) : null,
        review: p.review || null,
      }));
    return {
      name: list.name as string,
      displayName: (list.username as string | null)?.trim() || null,
      avatarUrl: (list.avatar_url as string | null) ?? null,
      handle: (owner?.username as string | undefined) ?? null,
      places,
    };
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: ListPageProps): Promise<Metadata> {
  const list = await getListData(params.slug);
  if (!list) return { title: 'Lista nie znaleziona - Spoot' };
  const author = list.displayName || 'Użytkownik Spoot';
  return {
    title: `${list.name} - Spoot`,
    description: `Lista miejsc "${list.name}" polecana przez ${author} na Spoot`,
    openGraph: {
      title: `${list.name} - Spoot`,
      description: `Lista miejsc polecana przez ${author}`,
      type: 'website',
    },
  };
}

export default async function ListPage({ params }: ListPageProps) {
  const list = await getListData(params.slug);
  const fonts = manrope.variable;

  if (!list) {
    return (
      <main className={fonts} style={page}>
        <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100vh', padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, textAlign: 'center' }}>
          <Wordmark size={28} />
          <h1 style={{ margin: '24px 0 0', fontFamily: MANROPE, fontWeight: 700, fontSize: 22 }}>Nie znaleźliśmy tej listy</h1>
          <p style={{ margin: 0, fontSize: 14, color: INK2 }}>Mogła zostać usunięta albo link jest nieaktualny.</p>
          <Link href="/" style={{ padding: 12, fontSize: 14, color: GREEN, textDecoration: 'underline' }}>Strona główna</Link>
        </div>
      </main>
    );
  }

  const n = list.places.length;
  const count = `${n} ${pluralPl(n, 'miejsce', 'miejsca', 'miejsc')}`;
  const author = list.displayName || (list.handle ? `@${list.handle}` : 'Użytkownik Spoot');
  const authorMeta = [list.handle && `@${list.handle}`, count].filter(Boolean).join(' · ');

  const authorRow: ReactNode = (
    <>
      <Avatar url={list.avatarUrl} name={author} size={40} onDark />
      <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <span style={{ fontFamily: MANROPE, fontWeight: 700, fontSize: 15, lineHeight: '20px' }}>{author}</span>
        <span style={{ fontSize: 13, lineHeight: '18px', color: 'rgba(255,255,255,0.75)' }}>{authorMeta}</span>
      </span>
      {list.handle && <Icon color="rgba(255,255,255,0.75)" size={16}>{ICONS.chevron}</Icon>}
    </>
  );
  const authorStyle: CSSProperties = { alignSelf: 'flex-start', minHeight: 44, display: 'flex', alignItems: 'center', gap: 10 };

  return (
    <main className={fonts} style={{ ...page, paddingBottom: 'calc(100px + env(safe-area-inset-bottom))' }}>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>
        <header style={{ height: 56, padding: '0 16px', display: 'flex', alignItems: 'center' }}>
          <Link href="/" aria-label="Spoot — strona główna" style={{ display: 'flex' }}><Wordmark size={22} /></Link>
        </header>

        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 24 }}>
          <section style={{ background: GREEN, color: '#fff', borderRadius: 24, padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontFamily: MANROPE, fontWeight: 700, fontSize: 11, letterSpacing: 1.2, color: 'rgba(255,255,255,0.75)' }}>LISTA</span>
              <h1 style={{ margin: 0, fontFamily: MANROPE, fontWeight: 700, fontSize: 30, lineHeight: '36px', overflowWrap: 'anywhere' }}>{list.name}</h1>
            </div>
            {list.handle
              ? <Link href={`/u/${list.handle}`} style={authorStyle}>{authorRow}</Link>
              : <div style={authorStyle}>{authorRow}</div>}
            <div style={{ display: 'flex', gap: 8 }}>
              <OpenAppButton style={{ flexGrow: 1, minHeight: 48, borderRadius: 999, background: '#fff', color: GREEN, fontFamily: MANROPE, fontWeight: 700, fontSize: 15 }}>
                Otwórz w Spoot
              </OpenAppButton>
              <ShareButton title={list.name} style={{ width: 48, height: 48, flexShrink: 0, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
            </div>
          </section>

          <ListPlaces places={list.places} />
        </div>
      </div>

      <AppBridge
        content={{
          appPath: `list/${encodeURIComponent(params.slug)}`,
          barTitle: `Lista „${list.name}” w Spoot`,
          barText: 'Zobacz ją w aplikacji.',
          card: (
            <div style={{ width: '100%', borderRadius: 24, background: GREEN, color: '#fff', padding: '28px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, textAlign: 'center' }}>
              <span style={{ fontFamily: MANROPE, fontWeight: 700, fontSize: 11, letterSpacing: 1.2, color: 'rgba(255,255,255,0.75)' }}>LISTA · {count.toUpperCase()}</span>
              <span style={{ marginTop: 6, fontFamily: MANROPE, fontWeight: 700, fontSize: 22 }}>{list.name}</span>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>{author}</span>
            </div>
          ),
          openingText: 'Za chwilę zobaczysz tę listę w aplikacji.',
          browserLabel: 'Zobacz listę w przeglądarce',
          sheetHeader: (
            <>
              <Avatar url={list.avatarUrl} name={author} size={56} />
              <div style={{ flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontFamily: MANROPE, fontWeight: 700, fontSize: 16, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{list.name}</span>
                <span style={{ fontSize: 13, color: INK2 }}>{author} · {count}</span>
              </div>
            </>
          ),
          sheetTitle: 'Zbieraj takie listy w Spoot',
          benefits: [
            { title: 'Zapisuj miejsca', text: 'Z TikToka, Instagrama i od znajomych — w jednym miejscu.', icon: ICONS.bookmark },
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
