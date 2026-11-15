import type { Metadata, Viewport } from 'next';
import type { CSSProperties } from 'react';
import { Manrope } from 'next/font/google';
import Link from 'next/link';
import { getProfileByUsername, getProfileExtras, type Rating } from '@/lib/supabase';
import { dishName, pluralPl, ratingColor, relativePl } from '@/lib/format';
import { Wordmark } from '@/components/SpootLogo';
import { AppBridge, OpenAppButton } from '@/components/AppBridge';
import { ShowMore } from './ProfileClient';
import { Avatar, Icon, ICONS } from '@/components/ui';

// Tyle ocen widać od razu, reszta po „Pokaż wszystkie”.
const VISIBLE_RATINGS = 8;

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
      title: `${profile.display_name} (@${profile.username}) na Spoot`,
      description: profile.bio || 'Oceny, listy i topki na Spoot',
      type: 'profile',
    },
  };
}

// Jak metaLine w components/RatingFeedCard.tsx: dania z wynikami, a bez nich opinia.
function metaLine(r: Rating) {
  const dishes = r.dish_entries?.length
    ? r.dish_entries.slice(0, 2).map((d) => (d.score != null ? `${dishName(d.name)} ${d.score}` : dishName(d.name)))
    : (r.dishes ?? []).slice(0, 2).map(dishName);
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
  // Najpełniejsze topki pierwsze; puste listy nic nie mówią.
  const topki = [...profile.topki].sort((a, b) => b.total_count - a.total_count);
  const lists = profile.lists.filter((l) => l.place_count > 0).sort((a, b) => b.place_count - a.place_count);
  const ratings = extras?.ratings ?? [];
  const ratingsCount = extras?.ratingsCount ?? 0;

  return (
    <main className={fonts} style={{ ...s.page, paddingBottom: 'calc(100px + env(safe-area-inset-bottom))' }}>
      <div style={s.column}>
        <header style={{ height: 56, padding: '0 16px', display: 'flex', alignItems: 'center' }}>
          <Link href="/" aria-label="Spoot — strona główna" style={{ display: 'flex' }}><Wordmark size={22} /></Link>
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
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
                <h2 style={s.h2}>Topki</h2>
                <span style={{ fontSize: 13, color: INK2 }}>{topki.length} {pluralPl(topki.length, 'kategoria', 'kategorie', 'kategorii')}</span>
              </div>
              {/* Karuzela: kolejna karta wystaje zza krawędzi, więc widać, że jest ich więcej. */}
              <div style={{ margin: '0 -16px', padding: '0 16px', display: 'flex', gap: 12, overflowX: 'auto', scrollSnapType: 'x mandatory', scrollPaddingInline: 16, scrollbarWidth: 'none' }}>
                {topki.map((topka) => {
                  const places = topka.places ?? [];
                  const more = topka.total_count - places.length;
                  return (
                    <div key={topka.id} style={{ width: 248, flexShrink: 0, scrollSnapAlign: 'start', boxSizing: 'border-box', background: CARD, borderRadius: 16, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={s.eyebrow}>TOP 3</span>
                        <h3 style={{ ...s.ellipsis, margin: 0, fontFamily: MANROPE, fontWeight: 700, fontSize: 16, lineHeight: '22px' }}>{topka.title}</h3>
                      </div>
                      <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {places.map((place) => (
                          <li key={place.rank} style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                            <span aria-hidden="true" style={{ width: 24, height: 24, borderRadius: '50%', background: place.rank === 1 ? ORANGE : GREEN, color: place.rank === 1 ? INK : '#fff', fontFamily: MANROPE, fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              {place.rank}
                            </span>
                            <span style={{ ...s.ellipsis, fontSize: 15 }}>{place.name}</span>
                          </li>
                        ))}
                      </ol>
                      {more > 0 && <span style={{ marginTop: 'auto', paddingLeft: 34, fontSize: 13, color: INK2 }}>i {more} {pluralPl(more, 'kolejne', 'kolejne', 'kolejnych')} w aplikacji</span>}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          <section style={{ display: 'flex', flexDirection: 'column' }}>
            <h2 style={s.h2}>Oceny · {ratingsCount}</h2>
            {ratings.length === 0 ? (
              <p style={{ margin: 0, padding: '24px 0', textAlign: 'center', fontSize: 15, color: INK2 }}>Jeszcze tu nic nie ma</p>
            ) : (
              <>
                {ratings.slice(0, VISIBLE_RATINGS).map((r) => <RatingRow key={r.id} r={r} />)}
                {ratings.length > VISIBLE_RATINGS && (
                  <ShowMore
                    label={`Pokaż wszystkie ${ratings.length} ${pluralPl(ratings.length, 'ocenę', 'oceny', 'ocen')}`}
                    style={{ width: '100%', minHeight: 44, marginTop: 16, borderRadius: 16, background: CARD, border: `1.5px solid ${GREEN}`, color: GREEN, fontFamily: MANROPE, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
                  >
                    {ratings.slice(VISIBLE_RATINGS).map((r) => <RatingRow key={r.id} r={r} />)}
                  </ShowMore>
                )}
              </>
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

function RatingRow({ r }: { r: Rating }) {
  const meta = metaLine(r);
  return (
    <Link href={`/place/${r.place_id}`} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0', borderBottom: `1px solid ${HAIR}` }}>
      {r.place_image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={r.place_image} alt="" loading="lazy" style={{ width: 56, height: 56, borderRadius: 12, objectFit: 'cover', flexShrink: 0 }} />
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
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <span style={{ fontFamily: MANROPE, fontWeight: 700, fontSize: 20 }}>{value}</span>
      <span style={{ fontFamily: MANROPE, fontWeight: 700, fontSize: 10, letterSpacing: 0.5, color: 'rgba(255,255,255,0.75)' }}>{label}</span>
    </div>
  );
}

const s: Record<string, CSSProperties> = {
  page: { minHeight: '100vh', background: CREAM, color: INK, fontFamily: 'var(--font-manrope), system-ui, sans-serif' },
  column: { maxWidth: 480, margin: '0 auto' },
  eyebrow: { fontFamily: MANROPE, fontWeight: 700, fontSize: 11, letterSpacing: 1.2, color: INK2 },
  section: { display: 'flex', flexDirection: 'column', gap: 10 },
  h2: { margin: 0, fontFamily: MANROPE, fontWeight: 700, fontSize: 16 },
  ellipsis: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
};
