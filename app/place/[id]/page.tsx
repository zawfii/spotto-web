import { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface PlacePageProps {
  params: { id: string };
}

async function getPlaceData(id: string) {
  try {
    const { data, error } = await supabase
      .from('places')
      .select('id, name, category, venue_type, district, address, phone, hours, price_range, image_url, google_rating, google_ratings_count, avg_spotto_rating, spotto_ratings_count, editorial_summary, tags, atmosphere')
      .eq('id', id)
      .maybeSingle();

    if (error || !data) return null;
    return data;
  } catch (err) {
    console.error('Error fetching place:', err);
    return null;
  }
}

export async function generateMetadata({ params }: PlacePageProps): Promise<Metadata> {
  const place = await getPlaceData(params.id);

  if (!place) {
    return { title: 'Miejsce nie znalezione - Spoot' };
  }

  return {
    title: `${place.name} - Spoot`,
    description: place.editorial_summary || `${place.name} · ${place.category} · ${place.district}`,
    openGraph: {
      title: `${place.name} - Spoot`,
      description: place.editorial_summary || `${place.name} · ${place.category} · ${place.district}`,
      images: place.image_url ? [{ url: place.image_url }] : [],
      type: 'website',
    },
  };
}

export default async function PlacePage({ params }: PlacePageProps) {
  const place = await getPlaceData(params.id);

  if (!place) {
    return (
      <main style={styles.container}>
        <div style={styles.errorContainer}>
          <h1 style={styles.errorTitle}>Miejsce nie znalezione</h1>
          <p style={styles.errorDesc}>To miejsce mogło zostać usunięte lub jest niedostępne.</p>
          <Link href="/" style={styles.backLink}>← Wróć</Link>
        </div>
      </main>
    );
  }

  const spootRating = place.avg_spotto_rating;
  const googleRating = place.google_rating;

  return (
    <main style={styles.container}>
      {/* Hero */}
      {place.image_url && (
        <div style={styles.heroWrap}>
          <img src={place.image_url} alt={place.name} style={styles.heroImage} />
          <div style={styles.heroOverlay} />
          <div style={styles.heroContent}>
            {place.tags && place.tags.length > 0 && (
              <div style={styles.tagsRow}>
                {(place.tags as string[]).slice(0, 3).map((tag: string) => (
                  <span key={tag} style={styles.tag}>{tag}</span>
                ))}
              </div>
            )}
            <h1 style={styles.heroName}>{place.name}</h1>
            <p style={styles.heroMeta}>
              📍 {place.district} &nbsp;·&nbsp; {place.venue_type && place.venue_type !== place.category ? `${place.venue_type} · ${place.category}` : place.category}
            </p>
          </div>
        </div>
      )}

      {!place.image_url && (
        <div style={styles.headerNoImage}>
          <Link href="/" style={styles.backLinkSmall}>← Wróć</Link>
          <h1 style={styles.titleNoImage}>{place.name}</h1>
          <p style={styles.metaNoImage}>📍 {place.district} · {place.category}</p>
        </div>
      )}

      <div style={styles.content}>
        {place.image_url && (
          <Link href="/" style={styles.backLinkSmall}>← Wróć</Link>
        )}

        {/* Ratings */}
        <div style={styles.ratingsRow}>
          {spootRating != null && (
            <div style={styles.ratingCard}>
              <span style={styles.ratingValue}>{Number(spootRating).toFixed(1)}</span>
              <div>
                <p style={styles.ratingLabel}>Spoot</p>
                {place.spotto_ratings_count != null && (
                  <p style={styles.ratingCount}>{place.spotto_ratings_count} ocen</p>
                )}
              </div>
            </div>
          )}
          {googleRating != null && (
            <div style={styles.ratingCard}>
              <span style={styles.ratingValueGoogle}>★ {Number(googleRating).toFixed(1)}</span>
              <div>
                <p style={styles.ratingLabel}>Google</p>
                {place.google_ratings_count != null && (
                  <p style={styles.ratingCount}>{place.google_ratings_count.toLocaleString('pl-PL')} ocen</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Summary */}
        {place.editorial_summary && (
          <p style={styles.summary}>{place.editorial_summary}</p>
        )}

        {/* Info card */}
        <div style={styles.infoCard}>
          {place.address && (
            <div style={styles.infoRow}>
              <span style={styles.infoIcon}>📍</span>
              <span style={styles.infoText}>{place.address}</span>
            </div>
          )}
          {place.hours && (
            <>
              <div style={styles.infoDivider} />
              <div style={styles.infoRow}>
                <span style={styles.infoIcon}>🕐</span>
                <span style={styles.infoText}>{place.hours.split(';')[0]?.trim()}</span>
              </div>
            </>
          )}
          {place.phone && (
            <>
              <div style={styles.infoDivider} />
              <div style={styles.infoRow}>
                <span style={styles.infoIcon}>📞</span>
                <a href={`tel:${place.phone}`} style={styles.infoLink}>{place.phone}</a>
              </div>
            </>
          )}
          {place.price_range && (
            <>
              <div style={styles.infoDivider} />
              <div style={styles.infoRow}>
                <span style={styles.infoIcon}>💰</span>
                <span style={styles.infoText}>{place.price_range}</span>
              </div>
            </>
          )}
        </div>

        {/* Atmosphere */}
        {place.atmosphere && (place.atmosphere as string[]).length > 0 && (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Atmosfera</h2>
            <div style={styles.tagsRowWrap}>
              {(place.atmosphere as string[]).map((tag: string) => (
                <span key={tag} style={styles.atmosTag}>{tag}</span>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div style={styles.ctaSection}>
          <p style={styles.ctaTitle}>Odkrywaj więcej miejsc w Spoot</p>
          <a href="https://apps.apple.com" style={styles.ctaButton}>
            Pobierz aplikację
          </a>
          <p style={styles.ctaText}>Oceniaj, zapisuj i odkrywaj restauracje w Warszawie</p>
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
  heroWrap: {
    position: 'relative',
    height: '280px',
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  heroOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.55) 100%)',
  },
  heroContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: '20px',
  },
  tagsRow: {
    display: 'flex',
    gap: '6px',
    marginBottom: '6px',
    flexWrap: 'wrap' as const,
  },
  tag: {
    backgroundColor: 'rgba(3,39,26,0.75)',
    color: '#fbfaeb',
    borderRadius: '100px',
    padding: '3px 10px',
    fontSize: '11px',
    fontWeight: '600',
  },
  heroName: {
    color: '#fff',
    fontSize: '26px',
    fontWeight: '700',
    margin: '0 0 4px 0',
    lineHeight: '1.2',
  },
  heroMeta: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: '13px',
    margin: 0,
  },
  headerNoImage: {
    padding: '16px 20px 12px',
    borderBottom: '1px solid #D0CCC6',
  },
  titleNoImage: {
    fontSize: '24px',
    fontWeight: '700',
    margin: '8px 0 4px',
  },
  metaNoImage: {
    fontSize: '13px',
    color: '#666',
    margin: 0,
  },
  content: {
    maxWidth: '600px',
    margin: '0 auto',
    padding: '16px 20px',
  },
  backLink: {
    color: '#03271a',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: '500',
  },
  backLinkSmall: {
    display: 'inline-block',
    color: '#03271a',
    textDecoration: 'none',
    fontSize: '13px',
    fontWeight: '500',
    marginBottom: '12px',
    opacity: 0.7,
  },
  ratingsRow: {
    display: 'flex',
    gap: '12px',
    marginBottom: '16px',
  },
  ratingCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '12px 16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    flex: 1,
  },
  ratingValue: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#c84c4c',
    lineHeight: '1',
  },
  ratingValueGoogle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#f59e0b',
    lineHeight: '1',
  },
  ratingLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#03271a',
    margin: 0,
  },
  ratingCount: {
    fontSize: '11px',
    color: '#888',
    margin: '2px 0 0 0',
  },
  summary: {
    fontSize: '14px',
    color: '#444',
    lineHeight: '1.6',
    marginBottom: '16px',
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    marginBottom: '16px',
  },
  infoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 16px',
  },
  infoDivider: {
    height: '1px',
    backgroundColor: '#f0ede6',
    marginLeft: '42px',
  },
  infoIcon: {
    fontSize: '16px',
    width: '20px',
    textAlign: 'center' as const,
    flexShrink: 0,
  },
  infoText: {
    fontSize: '14px',
    color: '#03271a',
  },
  infoLink: {
    fontSize: '14px',
    color: '#03271a',
    textDecoration: 'none',
  },
  section: {
    marginBottom: '16px',
  },
  sectionTitle: {
    fontSize: '15px',
    fontWeight: '600',
    margin: '0 0 8px 0',
  },
  tagsRowWrap: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '8px',
  },
  atmosTag: {
    backgroundColor: 'white',
    border: '1px solid #D0CCC6',
    borderRadius: '100px',
    padding: '5px 14px',
    fontSize: '13px',
    color: '#03271a',
  },
  ctaSection: {
    textAlign: 'center' as const,
    marginTop: '32px',
    paddingBottom: '48px',
  },
  ctaTitle: {
    fontSize: '16px',
    fontWeight: '600',
    margin: '0 0 16px 0',
  },
  ctaButton: {
    display: 'inline-block',
    backgroundColor: '#03271a',
    color: '#fbfaeb',
    padding: '12px 28px',
    borderRadius: '100px',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: '600',
  },
  ctaText: {
    fontSize: '12px',
    color: '#888',
    margin: '12px 0 0 0',
  },
  errorContainer: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column' as const,
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
