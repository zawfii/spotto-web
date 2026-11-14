import type { Metadata, Viewport } from 'next';
import type { CSSProperties, ReactNode } from 'react';
import { Manrope } from 'next/font/google';
import Link from 'next/link';
import { getProfileByUsername, supabase } from '@/lib/supabase';
import { Wordmark } from '@/components/SpootLogo';
import { AppBridge, OpenAppButton, StoreLink } from '@/components/AppBridge';

const manrope = Manrope({ subsets: ['latin', 'latin-ext'], weight: ['400', '500', '600', '700'], variable: '--font-manrope' });

// Jak na stronie lokalu (app/place/[id]/page.tsx).
const APP_STORE_URL = 'https://apps.apple.com/pl/app/id6822473524';
const PLAY_URL = 'https://play.google.com/store/apps/details?id=com.spoot.app';

const GREEN = '#164938';
const ORANGE = '#ff751f';
const INK = '#03271a';
const INK2 = '#1e3028';
const CREAM = '#fdf5ec';
const CARD = '#eae5de';
const HAIR = 'rgba(3,39,26,0.15)';
const MANROPE = 'var(--font-manrope), sans-serif';

interface ProfilePageProps {
  params: { username: string };
}

export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: CREAM };

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const profile = await getProfileByUsername(params.username);
  if (!profile) return { title: 'Profil nie znaleziony - Spoot' };
  return {
    title: `${profile.display_name} (@${profile.username}) - Spoot`,
    description: profile.bio || `Odkryj miejsca polecane przez ${profile.display_name} na Spoot`,
    openGraph: {
      title: `${profile.display_name} - Spoot`,
      description: profile.bio || `Listy i topki ${profile.display_name}`,
      type: 'profile',
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

type Rating = {
  id: string;
  place_id: string;
  place_name: string;
  place_image: string | null;
  place_category: string | null;
  rating: number;
  opinion: string | null;
  dishes: string[] | null;
  dish_entries: { name: string; score?: number }[] | null;
  created_at: string;
};

// To samo co ekran profilu znajomego w apce (app/user-profile.tsx) — profiles, ratings i follows są czytelne dla anon.
async function getProfileExtras(username: string) {
  const { data: p } = await supabase.from('profiles').select('id, city').eq('username', username.toLowerCase()).maybeSingle();
  if (!p) return null;
  const [ratings, followers, following] = await Promise.all([
    supabase
      .from('ratings')
      .select('id, place_id, place_name, place_image, place_category, rating, opinion, dishes, dish_entries, created_at', { count: 'exact' })
      .eq('user_id', p.id)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', p.id),
    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', p.id),
  ]);
  return {
    city: (p.city as string | null) ?? null,
    ratings: (ratings.data ?? []) as Rating[],
    ratingsCount: ratings.count ?? ratings.data?.length ?? 0,
    followers: followers.count ?? 0,
    following: following.count ?? 0,
  };
}

// Jak ratingColor w apce (components/RatingSlider.tsx).
function ratingColor(v: number) {
  if (v >= 8) return '#2E7D32';
  if (v >= 5) return '#D4892A';
  return ORANGE;
}

// Jak utils/relativeTime.ts w apce.
function relativePl(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = 60_000, hour = 60 * min, day = 24 * hour;
  if (diff < min) return 'przed chwilą';
  if (diff < hour) { const n = Math.floor(diff / min); return `${n} ${pluralPl(n, 'minutę', 'minuty', 'minut')} temu`; }
  if (diff < day) { const n = Math.floor(diff / hour); return `${n} ${pluralPl(n, 'godzinę', 'godziny', 'godzin')} temu`; }
  const days = Math.floor(diff / day);
  if (days < 7) return `${days} ${pluralPl(days, 'dzień', 'dni', 'dni')} temu`;
  if (days < 30) { const n = Math.floor(days / 7); return `${n} ${pluralPl(n, 'tydzień', 'tygodnie', 'tygodni')} temu`; }
  if (days < 365) { const n = Math.max(1, Math.floor(days / 30.44)); return `${n} ${pluralPl(n, 'miesiąc', 'miesiące', 'miesięcy')} temu`; }
  const n = Math.max(1, Math.floor(days / 365.25));
  return `${n} ${pluralPl(n, 'rok', 'lata', 'lat')} temu`;
}

// Jak metaLine w components/RatingFeedCard.tsx: dania z wynikami, a bez nich opinia.
function metaLine(r: Rating) {
  const dishes = r.dish_entries?.length
    ? r.dish_entries.slice(0, 2).map((d) => (d.score != null ? `${d.name} ${d.score}` : d.name))
    : (r.dishes ?? []).slice(0, 2);
  if (dishes.length) return dishes.join(' · ');
  return r.opinion ? `„${r.opinion}”` : '';
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const [profile, extras] = await Promise.all([getProfileByUsername(params.username), getProfileExtras(params.username)]);
  const fonts = manrope.variable;

  if (!profile) {
    return (
      <main className={fonts} style={s.page}>
        <div style={{ ...s.column, minHeight: '100vh', padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, textAlign: 'center' }}>
          <Wordmark size={28} />
          <h1 style={{ margin: '24px 0 0', fontFamily: MANROPE, fontWeight: 700, fontSize: 22 }}>Nie znaleźliśmy tego profilu</h1>
          <p style={{ margin: 0, fontSize: 14, color: INK2 }}>Nick mógł się zmienić albo link jest nieaktualny.</p>
          <Link href="/" style={{ padding: 12, fontSize: 14, color: GREEN, textDecoration: 'underline' }}>Strona główna</Link>
        </div>
      </main>
    );
  }

  const name = profile.display_name?.trim() || `@${profile.username}`;
  const handle = `@${profile.username}`;
  const { lists, topki } = profile;
  const ratings = extras?.ratings ?? [];
  const ratingsCount = extras?.ratingsCount ?? 0;

  return (
    <main className={fonts} style={{ ...s.page, paddingBottom: 'calc(200px + env(safe-area-inset-bottom))' }}>
      <div style={s.column}>
        <header style={{ height: 56, padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" aria-label="Spoot — strona główna" style={{ display: 'flex' }}><Wordmark size={22} /></Link>
          <StoreLink appStoreUrl={APP_STORE_URL} playUrl={PLAY_URL} style={{ ...s.eyebrow, color: GREEN, padding: '12px 0 12px 12px' }}>
            POBIERZ APLIKACJĘ
          </StoreLink>
        </header>

        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Karta jak profil znajomego w apce (app/user-profile.tsx). */}
          <section style={{ background: GREEN, color: '#fff', borderRadius: 24, padding: '32px 24px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <Avatar url={profile.avatar_url} name={name} size={84} onDark />
            <h1 style={{ margin: '12px 0 0', fontFamily: MANROPE, fontWeight: 700, fontSize: 26, lineHeight: '32px' }}>{name}</h1>
            <p style={{ margin: '2px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>{[handle, extras?.city].filter(Boolean).join(' · ')}</p>
            {profile.bio && <p style={{ margin: '10px 0 0', fontSize: 15, lineHeight: '22px', color: 'rgba(255,255,255,0.9)' }}>{profile.bio}</p>}
            <div style={{ alignSelf: 'stretch', display: 'flex', alignItems: 'center', marginTop: 20 }}>
              <Stat value={ratingsCount} label="OCENY" />
              <div style={{ width: 1, height: 32, background: 'rgba(255,255,255,0.2)' }} />
              <Stat value={extras?.followers ?? 0} label="OBSERWUJĄCY" />
              <div style={{ width: 1, height: 32, background: 'rgba(255,255,255,0.2)' }} />
              <Stat value={extras?.following ?? 0} label="OBSERWOWANI" />
            </div>
            <OpenAppButton style={{ alignSelf: 'stretch', minHeight: 44, marginTop: 24, borderRadius: 999, background: '#fff', color: GREEN, fontFamily: MANROPE, fontWeight: 700, fontSize: 14 }}>
              Obserwuj
            </OpenAppButton>
          </section>

          {topki.length > 0 && (
            <section id="topki" style={s.section}>
              <h2 style={s.h2}>Topki</h2>
              {topki.map((topka) => {
                const places = topka.places ?? [];
                const more = topka.total_count - places.length;
                return (
                  <div key={topka.id} style={{ background: CARD, borderRadius: 16, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <h3 style={{ margin: 0, fontFamily: MANROPE, fontWeight: 700, fontSize: 16 }}>Top 3 {topka.title}</h3>
                    <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {places.map((place) => (
                        <li key={place.rank} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span aria-hidden="true" style={{ width: 24, height: 24, borderRadius: '50%', background: place.rank === 1 ? ORANGE : GREEN, color: '#fff', fontFamily: MANROPE, fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {place.rank}
                          </span>
                          <span style={{ fontSize: 15 }}>{place.name}</span>
                        </li>
                      ))}
                    </ol>
                    {more > 0 && <span style={{ paddingLeft: 34, fontSize: 13, color: INK2 }}>i {more} {pluralPl(more, 'kolejne', 'kolejne', 'kolejnych')} w aplikacji</span>}
                  </div>
                );
              })}
            </section>
          )}

          <section style={{ display: 'flex', flexDirection: 'column' }}>
            <h2 style={s.h2}>Oceny · {ratingsCount}</h2>
            {ratings.length === 0 ? (
              <p style={{ margin: 0, padding: '24px 0', textAlign: 'center', fontSize: 15, color: INK2 }}>Jeszcze tu nic nie ma</p>
            ) : (
              ratings.map((r) => {
                const meta = metaLine(r);
                return (
                  <Link key={r.id} href={`/place/${r.place_id}`} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0', borderBottom: `1px solid ${HAIR}` }}>
                    {r.place_image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={r.place_image} alt="" style={{ width: 56, height: 56, borderRadius: 12, objectFit: 'cover', flexShrink: 0 }} />
                    ) : (
                      <span aria-hidden="true" style={{ width: 56, height: 56, borderRadius: 12, background: CARD, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon color={INK2} size={22}>{ICONS.fork}</Icon>
                      </span>
                    )}
                    <div style={{ flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <span style={{ ...s.ellipsis, fontFamily: MANROPE, fontWeight: 700, fontSize: 16, lineHeight: '22px' }}>{r.place_name}</span>
                      <span style={{ ...s.ellipsis, fontSize: 13, color: INK2 }}>{[r.place_category, relativePl(r.created_at)].filter(Boolean).join(' · ')}</span>
                      {meta && <span style={{ ...s.ellipsis, fontSize: 13, color: INK2 }}>{meta}</span>}
                    </div>
                    <span role="img" aria-label={`Ocena ${r.rating} na 10`} style={{ width: 44, height: 44, borderRadius: '50%', border: `3px solid ${ratingColor(r.rating)}`, background: CREAM, boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: MANROPE, fontWeight: 700, fontSize: 17, flexShrink: 0 }}>
                      {r.rating}
                    </span>
                  </Link>
                );
              })
            )}
            {ratingsCount > ratings.length && (
              <p style={{ margin: 0, paddingTop: 14, fontSize: 13, color: INK2, textAlign: 'center' }}>Pozostałe oceny zobaczysz w aplikacji</p>
            )}
          </section>

          {lists.length > 0 && (
            <section style={s.section}>
              <h2 style={s.h2}>Listy</h2>
              <div style={{ background: CARD, borderRadius: 16, overflow: 'hidden' }}>
                {lists.map((list, i) => (
                  <Link key={list.id} href={`/list/${list.slug}`} style={{ minHeight: 56, padding: '0 16px', display: 'flex', alignItems: 'center', gap: 12, borderTop: i ? `1px solid ${HAIR}` : undefined }}>
                    <Icon>{ICONS.bookmark}</Icon>
                    <span style={{ ...s.ellipsis, flexGrow: 1, minWidth: 0, padding: '16px 0', fontSize: 15, fontWeight: 600 }}>{list.name}</span>
                    <span style={{ fontSize: 13, color: INK2, flexShrink: 0 }}>
                      {list.place_count} {pluralPl(list.place_count, 'miejsce', 'miejsca', 'miejsc')}
                    </span>
                    <Icon color={INK2} size={16}>{ICONS.chevron}</Icon>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      <AppBridge
        content={{
          appPath: `user-profile?username=${encodeURIComponent(profile.username)}`,
          barTitle: `${name} jest w Spoot`,
          barText: 'Obserwuj i zobacz, co ocenia.',
          card: (
            <div style={{ width: '100%', borderRadius: 24, background: GREEN, color: '#fff', padding: '28px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, textAlign: 'center' }}>
              <Avatar url={profile.avatar_url} name={name} size={72} onDark />
              <span style={{ marginTop: 10, fontFamily: MANROPE, fontWeight: 700, fontSize: 22 }}>{name}</span>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>{handle}</span>
            </div>
          ),
          openingText: 'Za chwilę zobaczysz ten profil tam, gdzie możesz go obserwować.',
          browserLabel: 'Zobacz profil w przeglądarce',
          sheetHeader: (
            <>
              <Avatar url={profile.avatar_url} name={name} size={56} />
              <div style={{ flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontFamily: MANROPE, fontWeight: 700, fontSize: 16 }}>{name}</span>
                <span style={{ fontSize: 13, color: INK2 }}>{handle}</span>
              </div>
            </>
          ),
          sheetTitle: `Zobacz, co ocenia ${name}`,
          benefits: [
            { title: 'Obserwuj znajomych', text: 'Ich oceny zobaczysz na Starcie, w sekcji „Ze znajomymi”.', icon: ICONS.people },
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

function Avatar({ url, name, size, onDark = false }: { url: string | null; name: string; size: number; onDark?: boolean }) {
  const box: CSSProperties = { width: size, height: size, borderRadius: '50%', flexShrink: 0 };
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt="" style={{ ...box, objectFit: 'cover', boxShadow: onDark ? '0 0 0 2px rgba(255,255,255,0.25)' : undefined }} />;
  }
  const initial = name.replace(/^@/, '').charAt(0).toUpperCase();
  return (
    <span aria-hidden="true" style={{ ...box, background: onDark ? 'rgba(255,255,255,0.15)' : GREEN, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: MANROPE, fontWeight: 700, fontSize: size * 0.4 }}>
      {initial}
    </span>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <span style={{ fontFamily: MANROPE, fontWeight: 700, fontSize: 20 }}>{value}</span>
      <span style={{ fontFamily: MANROPE, fontWeight: 700, fontSize: 10, letterSpacing: 0.5, color: 'rgba(255,255,255,0.75)' }}>{label}</span>
    </div>
  );
}

function Icon({ children, color = GREEN, size = 20 }: { children: ReactNode; color?: string; size?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      {children}
    </svg>
  );
}

const ICONS = {
  bookmark: <path d="M6 4h12v17l-6-4-6 4z" />,
  fork: <><path d="M7 3v8a2 2 0 0 0 2 2v8" /><path d="M11 3v8a2 2 0 0 1-2 2" /><path d="M17 21V3c-2 1.5-3 4-3 7v4h3" /></>,
  chevron: <path d="M9 6l6 6-6 6" />,
  people: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8" /><path d="M18 14a6.5 6.5 0 0 1 3.5 6" /></>,
  star: <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" />,
  sparkle: <><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" /><path d="M19 15l.8 2.2 2.2.8-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z" /></>,
};

const s: Record<string, CSSProperties> = {
  page: { minHeight: '100vh', background: CREAM, color: INK, fontFamily: 'var(--font-manrope), system-ui, sans-serif' },
  column: { maxWidth: 480, margin: '0 auto' },
  eyebrow: { fontFamily: MANROPE, fontWeight: 700, fontSize: 11, letterSpacing: 1.2, color: INK2 },
  section: { display: 'flex', flexDirection: 'column', gap: 10 },
  h2: { margin: 0, fontFamily: MANROPE, fontWeight: 700, fontSize: 16 },
  ellipsis: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
};
