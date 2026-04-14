import { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface ListPageProps {
  params: { slug: string };
}

async function getListData(slug: string) {
  try {
    const { data, error } = await supabase.rpc('get_public_list_by_slug', { p_slug: slug });
    if (error || !data || data.length === 0) {
      return null;
    }
    return data[0];
  } catch (err) {
    console.error('Error fetching list:', err);
    return null;
  }
}

export async function generateMetadata({
  params,
}: ListPageProps): Promise<Metadata> {
  const list = await getListData(params.slug);

  if (!list) {
    return {
      title: 'List not found - Spotto',
    };
  }

  return {
    title: `${list.name} - Spotto`,
    description: `Check out ${list.username}'s "${list.name}" list on Spotto`,
    openGraph: {
      title: `${list.name} - Spotto`,
      description: `Check out ${list.username}'s "${list.name}" list on Spotto`,
      type: 'website',
    },
  };
}

export default async function ListPage({ params }: ListPageProps) {
  const list = await getListData(params.slug);

  if (!list) {
    return (
      <main style={styles.container}>
        <div style={styles.errorContainer}>
          <h1 style={styles.errorTitle}>List not found</h1>
          <p style={styles.errorDesc}>
            This list might not exist or is not accessible.
          </p>
          <Link href="/" style={styles.backLink}>
            ← Back to home
          </Link>
        </div>
      </main>
    );
  }

  const places = (list.places || []).filter((p: any) => p.id);

  return (
    <main style={styles.container}>
      <header style={styles.header}>
        <Link href="/" style={styles.backLink}>
          ← Back
        </Link>
        <h1 style={styles.title}>{list.name}</h1>
      </header>

      <div style={styles.content}>
        {/* Owner info */}
        <div style={styles.ownerCard}>
          {list.avatar_url && (
            <img
              src={list.avatar_url}
              alt={list.username}
              style={styles.avatar}
            />
          )}
          {!list.avatar_url && (
            <div style={styles.avatarPlaceholder}>👤</div>
          )}
          <div>
            <p style={styles.ownerName}>{list.username || 'Anonymous'}</p>
            <p style={styles.placeCount}>
              {places.length} place{places.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Places */}
        {places.length === 0 && (
          <div style={styles.emptyState}>
            <p>This list is empty</p>
          </div>
        )}

        <div style={styles.placesList}>
          {places.map((place: any) => (
            <div key={place.id} style={styles.placeCard}>
              {place.image && (
                <img
                  src={place.image}
                  alt={place.name}
                  style={styles.placeImage}
                />
              )}
              {!place.image && (
                <div style={styles.placeImagePlaceholder}>🍽️</div>
              )}
              <div style={styles.placeInfo}>
                <h3 style={styles.placeName}>{place.name}</h3>
                <p style={styles.placeCategory}>{place.category}</p>
                {place.rating && (
                  <p style={styles.rating}>⭐ {place.rating}</p>
                )}
                {place.review && (
                  <p style={styles.review}>{place.review}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={styles.ctaSection}>
          <a href="https://apps.apple.com" style={styles.ctaButton}>
            Download Spotto
          </a>
          <p style={styles.ctaText}>Create and share your own food lists</p>
        </div>
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#fbfaeb',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    color: '#03271a',
  },
  header: {
    padding: '16px 20px',
    borderBottom: '1px solid #D0CCC6',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  backLink: {
    color: '#03271a',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: '500',
  },
  title: {
    flex: 1,
    fontSize: '20px',
    fontWeight: '600',
    margin: 0,
  },
  content: {
    maxWidth: '600px',
    margin: '0 auto',
    padding: '20px',
  },
  ownerCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    backgroundColor: 'rgba(3, 39, 26, 0.05)',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '24px',
  },
  avatar: {
    width: '48px',
    height: '48px',
    borderRadius: '24px',
    objectFit: 'cover',
  },
  avatarPlaceholder: {
    width: '48px',
    height: '48px',
    borderRadius: '24px',
    backgroundColor: '#D0CCC6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    flexShrink: 0,
  },
  ownerName: {
    fontSize: '14px',
    fontWeight: '600',
    margin: 0,
  },
  placeCount: {
    fontSize: '12px',
    color: '#666',
    margin: '4px 0 0 0',
  },
  placesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  placeCard: {
    display: 'flex',
    gap: '12px',
    backgroundColor: 'white',
    borderRadius: '8px',
    overflow: 'hidden',
    padding: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  placeImage: {
    width: '72px',
    height: '72px',
    borderRadius: '8px',
    objectFit: 'cover',
    flexShrink: 0,
  },
  placeImagePlaceholder: {
    width: '72px',
    height: '72px',
    borderRadius: '8px',
    backgroundColor: '#D0CCC6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '28px',
    flexShrink: 0,
  },
  placeInfo: {
    flex: 1,
  },
  placeName: {
    fontSize: '14px',
    fontWeight: '600',
    margin: '0 0 4px 0',
  },
  placeCategory: {
    fontSize: '12px',
    color: '#666',
    margin: 0,
  },
  rating: {
    fontSize: '12px',
    color: '#ff751f',
    margin: '4px 0 0 0',
  },
  review: {
    fontSize: '12px',
    color: '#666',
    margin: '4px 0 0 0',
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px 20px',
    color: '#999',
  },
  ctaSection: {
    textAlign: 'center',
    marginTop: '32px',
    paddingBottom: '40px',
  },
  ctaButton: {
    display: 'inline-block',
    backgroundColor: '#03271a',
    color: '#fbfaeb',
    padding: '12px 24px',
    borderRadius: '8px',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: '600',
  },
  ctaText: {
    fontSize: '12px',
    color: '#666',
    margin: '12px 0 0 0',
  },
  errorContainer: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  },
  errorTitle: {
    fontSize: '24px',
    fontWeight: '600',
    margin: '0 0 12px 0',
  },
  errorDesc: {
    fontSize: '14px',
    color: '#666',
    margin: '0 0 24px 0',
  },
};
