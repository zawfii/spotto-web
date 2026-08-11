import { Metadata } from 'next';
import { Manrope } from 'next/font/google';
import { getProfileByUsername } from '@/lib/supabase';
import Link from 'next/link';
import Image from 'next/image';

const manrope = Manrope({ subsets: ['latin', 'latin-ext'], weight: ['400', '500', '600', '700', '800'] });

interface ProfilePageProps {
  params: { username: string };
}

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

const topbarStyle: React.CSSProperties = {
  position: 'sticky', top: 0, zIndex: 10,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: '0 20px', height: '60px',
  backgroundColor: '#fbfaeb',
  borderBottom: '1px solid #D0CCC6',
};

export default async function ProfilePage({ params }: ProfilePageProps) {
  const profile = await getProfileByUsername(params.username);

  return (
    <main className={manrope.className} style={{ minHeight: '100vh', backgroundColor: '#fbfaeb', color: '#03271a' }}>
      {/* Topbar */}
      <div style={topbarStyle}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center' }}>
          <Image src="/logo_spoot_zielony.png" alt="Spoot" width={90} height={36} style={{ objectFit: 'contain' }} />
        </Link>
        <a
          href="https://apps.apple.com"
          style={{
            position: 'absolute', right: '20px',
            backgroundColor: '#03271a', color: '#fbfaeb',
            padding: '6px 14px', borderRadius: '20px',
            fontSize: '13px', fontWeight: 600,
          }}
        >
          Pobierz ↗
        </a>
      </div>

      {!profile && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '12px' }}>
          <p style={{ fontSize: '18px', fontWeight: 600 }}>Profil nie znaleziony</p>
          <Link href="/" style={{ fontSize: '14px', color: '#03271a', opacity: 0.6 }}>← Strona główna</Link>
        </div>
      )}

      {profile && (
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '24px 20px 48px' }}>
          {/* Hero */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            {profile.avatar_url
              ? <img src={profile.avatar_url} alt={profile.display_name} style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', margin: '0 auto 12px', display: 'block' }} />
              : <div style={{ width: 80, height: 80, borderRadius: '50%', backgroundColor: '#D0CCC6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', margin: '0 auto 12px' }}>👤</div>
            }
            <h1 style={{ fontSize: '22px', fontWeight: 700 }}>{profile.display_name}</h1>
            <p style={{ fontSize: '13px', color: '#03271a', opacity: 0.5, marginTop: '2px' }}>@{profile.username}</p>
            {profile.bio && <p style={{ fontSize: '14px', color: '#03271a', opacity: 0.7, marginTop: '8px', maxWidth: '300px', margin: '8px auto 0' }}>{profile.bio}</p>}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '12px', flexWrap: 'wrap' }}>
              <span style={{ backgroundColor: 'rgba(3,39,26,0.07)', borderRadius: '20px', padding: '4px 12px', fontSize: '13px', fontWeight: 500 }}>
                {profile.lists.length} {profile.lists.length === 1 ? 'lista' : profile.lists.length < 5 ? 'listy' : 'list'}
              </span>
              <span style={{ backgroundColor: 'rgba(3,39,26,0.07)', borderRadius: '20px', padding: '4px 12px', fontSize: '13px', fontWeight: 500 }}>
                {profile.topki.length} {profile.topki.length === 1 ? 'topka' : profile.topki.length < 5 ? 'topki' : 'topek'}
              </span>
            </div>
          </div>

          {/* Listy */}
          {profile.lists.length > 0 && (
            <section style={{ marginBottom: '32px' }}>
              <h2 style={{ fontSize: '13px', fontWeight: 700, opacity: 0.4, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '12px' }}>Listy</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {profile.lists.map((list) => (
                  <Link
                    key={list.id}
                    href={`/list/${list.slug}`}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      backgroundColor: '#fff', borderRadius: '12px', padding: '14px 16px',
                      boxShadow: '0 1px 4px rgba(3,39,26,0.07)',
                    }}
                  >
                    <span style={{ fontSize: '20px', flexShrink: 0 }}>📍</span>
                    <span style={{ flex: 1, fontWeight: 600, fontSize: '15px' }}>{list.name}</span>
                    <span style={{ fontSize: '13px', color: '#03271a', opacity: 0.45, flexShrink: 0 }}>{list.place_count}</span>
                    <span style={{ color: '#03271a', opacity: 0.3, flexShrink: 0, fontSize: '16px' }}>›</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Topki */}
          {profile.topki.length > 0 && (
            <section id="topki" style={{ marginBottom: '32px' }}>
              <h2 style={{ fontSize: '13px', fontWeight: 700, opacity: 0.4, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '12px' }}>Topki</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {profile.topki.map((topka) => (
                  <div key={topka.id} style={{
                    backgroundColor: '#fff', borderRadius: '12px', padding: '16px',
                    boxShadow: '0 1px 4px rgba(3,39,26,0.07)',
                  }}>
                    <p style={{ fontWeight: 700, fontSize: '15px', marginBottom: '10px' }}>🥇 {topka.title}</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {(topka.places || []).map((place) => (
                        <div key={place.rank} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{
                            width: '22px', height: '22px', borderRadius: '50%',
                            backgroundColor: place.rank === 1 ? '#ff751f' : place.rank === 2 ? '#D4892A' : '#03271a',
                            color: '#fff', fontSize: '11px', fontWeight: 700,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                          }}>{place.rank}</span>
                          <span style={{ fontSize: '14px', fontWeight: 500 }}>{place.name}</span>
                        </div>
                      ))}
                      {topka.total_count > 3 && (
                        <p style={{ fontSize: '12px', color: '#03271a', opacity: 0.45, marginTop: '4px', paddingLeft: '32px' }}>
                          i {topka.total_count - 3} więcej...
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Empty state */}
          {profile.lists.length === 0 && profile.topki.length === 0 && (
            <p style={{ textAlign: 'center', padding: '40px 0', color: '#03271a', opacity: 0.4 }}>
              Ten użytkownik nie udostępnił jeszcze żadnych list.
            </p>
          )}

          {/* CTA */}
          <div style={{
            backgroundColor: '#03271a', borderRadius: '16px',
            padding: '24px', textAlign: 'center', color: '#fbfaeb',
          }}>
            <p style={{ fontWeight: 700, fontSize: '18px', marginBottom: '8px' }}>Dołącz do Spoot</p>
            <p style={{ fontSize: '14px', opacity: 0.7, marginBottom: '20px' }}>Twórz własne listy i odkrywaj miejsca polecane przez znajomych</p>
            <a
              href="https://apps.apple.com"
              style={{
                display: 'inline-block',
                backgroundColor: '#fbfaeb', color: '#03271a',
                padding: '12px 28px', borderRadius: '24px',
                fontWeight: 700, fontSize: '14px',
              }}
            >
              Pobierz na iPhone
            </a>
          </div>
        </div>
      )}
    </main>
  );
}
