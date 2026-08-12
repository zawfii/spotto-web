import { Metadata } from 'next';
import { Manrope } from 'next/font/google';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import Image from 'next/image';
import ListMap from '@/components/ListMapClient';

const manrope = Manrope({ subsets: ['latin', 'latin-ext'], weight: ['400', '500', '600', '700', '800'] });

interface ListPageProps {
  params: { slug: string };
}

async function getListData(slug: string) {
  try {
    const { data, error } = await supabase.rpc('get_public_list_by_slug', { p_slug: slug });
    if (error || !data || data.length === 0) return null;
    return data[0];
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: ListPageProps): Promise<Metadata> {
  const list = await getListData(params.slug);
  if (!list) return { title: 'Lista nie znaleziona - Spoot' };
  return {
    title: `${list.name} - Spoot`,
    description: `Lista miejsc "${list.name}" polecana przez ${list.username} na Spoot`,
    openGraph: {
      title: `${list.name} - Spoot`,
      description: `Lista miejsc polecana przez ${list.username}`,
      type: 'website',
    },
  };
}

export default async function ListPage({ params }: ListPageProps) {
  const list = await getListData(params.slug);
  const places = list ? (list.places || []).filter((p: any) => p.id) : [];

  return (
    <main className={manrope.className} style={{ minHeight: '100vh', backgroundColor: '#fbfaeb', color: '#03271a' }}>
      {/* Topbar */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '0 20px', height: '60px',
        backgroundColor: '#fbfaeb',
        borderBottom: '1px solid #D0CCC6',
      }}>
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

      {!list && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '12px' }}>
          <p style={{ fontSize: '18px', fontWeight: 600 }}>Lista nie znaleziona</p>
          <Link href="/" style={{ fontSize: '14px', color: '#03271a', opacity: 0.6 }}>← Strona główna</Link>
        </div>
      )}

      {list && (
        <>
          <ListMap places={places.map((p: any) => ({ id: p.id, name: p.name, lat: p.lat, lng: p.lng }))} />
          <div style={{ maxWidth: '600px', margin: '0 auto', padding: '24px 20px 48px' }}>
          {/* Owner + list name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            {list.avatar_url
              ? <img src={list.avatar_url} alt={list.username} style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
              : <div style={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: '#D0CCC6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>👤</div>
            }
            <div>
              <p style={{ fontSize: '13px', color: '#03271a', opacity: 0.6, fontWeight: 500 }}>{list.username || 'Użytkownik Spoot'}</p>
              <p style={{ fontSize: '20px', fontWeight: 700, lineHeight: 1.2 }}>{list.name}</p>
              <p style={{ fontSize: '12px', color: '#03271a', opacity: 0.5, marginTop: '2px' }}>{places.length} {places.length === 1 ? 'miejsce' : places.length < 5 ? 'miejsca' : 'miejsc'}</p>
            </div>
          </div>

          {/* Places */}
          {places.length === 0 && (
            <p style={{ textAlign: 'center', padding: '40px 0', color: '#03271a', opacity: 0.4 }}>Lista jest pusta</p>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '40px' }}>
            {places.map((place: any) => (
              <div key={place.id} style={{
                display: 'flex', gap: '12px', alignItems: 'flex-start',
                backgroundColor: '#fff', borderRadius: '12px', padding: '12px',
                boxShadow: '0 1px 4px rgba(3,39,26,0.07)',
              }}>
                {place.image
                  ? <img src={place.image} alt={place.name} style={{ width: 80, height: 80, borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} />
                  : <div style={{ width: 80, height: 80, borderRadius: '8px', backgroundColor: '#D0CCC6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', flexShrink: 0 }}>🍽️</div>
                }
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 700, fontSize: '15px', marginBottom: '2px' }}>{place.name}</p>
                  <p style={{ fontSize: '12px', color: '#03271a', opacity: 0.5 }}>{place.category}</p>
                  {place.rating && <p style={{ fontSize: '13px', color: '#ff751f', fontWeight: 600, marginTop: '4px' }}>⭐ {place.rating}</p>}
                  {place.review && <p style={{ fontSize: '13px', color: '#03271a', opacity: 0.65, marginTop: '4px', fontStyle: 'italic', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any }}>{place.review}</p>}
                </div>
              </div>
            ))}
          </div>

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
        </>
      )}
    </main>
  );
}
