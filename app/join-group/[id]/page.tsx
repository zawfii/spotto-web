import { Metadata } from 'next';
import { Manrope } from 'next/font/google';
import { getRatingGroupPreview } from '@/lib/supabase';
import Link from 'next/link';
import Image from 'next/image';

const manrope = Manrope({ subsets: ['latin', 'latin-ext'], weight: ['400', '500', '600', '700', '800'] });

interface JoinGroupPageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: JoinGroupPageProps): Promise<Metadata> {
  const group = await getRatingGroupPreview(params.id);
  if (!group) return { title: 'Grupa nie znaleziona - Spoot' };
  return {
    title: `Dołącz do "${group.name}" - Spoot`,
    description: `Oceniajcie razem miejsca i dania w grupie "${group.name}" na Spoot`,
    openGraph: {
      title: `Dołącz do "${group.name}" na Spoot`,
      description: 'Oceniajcie razem miejsca i dania, a Spoot policzy waszą wspólną ocenę.',
      type: 'website',
    },
  };
}

export default async function JoinGroupPage({ params }: JoinGroupPageProps) {
  const group = await getRatingGroupPreview(params.id);
  const appLink = `spoot://join-group/${params.id}`;

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
      </div>

      <div style={{ maxWidth: '440px', margin: '0 auto', padding: '48px 20px', textAlign: 'center' }}>
        {!group ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', paddingTop: '60px' }}>
            <p style={{ fontSize: '18px', fontWeight: 600 }}>Grupa nie znaleziona</p>
            <p style={{ fontSize: '14px', color: '#03271a', opacity: 0.6 }}>Ten link może być nieaktualny.</p>
            <Link href="/" style={{ fontSize: '14px', color: '#03271a', opacity: 0.6, marginTop: '8px' }}>← Strona główna</Link>
          </div>
        ) : (
          <>
            <div style={{ fontSize: '48px', marginBottom: '8px' }}>👥</div>
            <p style={{ fontSize: '13px', color: '#03271a', opacity: 0.6, fontWeight: 500 }}>Zaproszenie do grupy</p>
            <p style={{ fontSize: '24px', fontWeight: 700, lineHeight: 1.2, marginBottom: '4px' }}>{group.name}</p>
            <p style={{ fontSize: '13px', color: '#03271a', opacity: 0.5, marginBottom: '32px' }}>
              {group.member_count} {group.member_count === 1 ? 'osoba ocenia' : 'osób ocenia'} razem
            </p>

            <div style={{
              backgroundColor: '#03271a', borderRadius: '16px',
              padding: '24px', color: '#fbfaeb',
            }}>
              <p style={{ fontWeight: 700, fontSize: '16px', marginBottom: '8px' }}>Oceniajcie razem miejsca i dania</p>
              <p style={{ fontSize: '13px', opacity: 0.7, marginBottom: '20px' }}>
                Każdy ocenia na swoim koncie, a Spoot liczy waszą wspólną ocenę.
              </p>
              <a
                href={appLink}
                style={{
                  display: 'block',
                  backgroundColor: '#fbfaeb', color: '#03271a',
                  padding: '12px 28px', borderRadius: '24px',
                  fontWeight: 700, fontSize: '14px', marginBottom: '10px',
                }}
              >
                Otwórz w aplikacji Spoot
              </a>
              <a
                href="https://apps.apple.com"
                style={{
                  display: 'block',
                  color: '#fbfaeb', opacity: 0.8,
                  fontWeight: 600, fontSize: '13px',
                  padding: '8px',
                }}
              >
                Nie masz appki? Pobierz Spoot
              </a>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
