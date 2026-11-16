// app/owner/(protected)/reviews/page.tsx
import { fetchReviews } from '@/lib/owner';
import { requireVenue } from '@/lib/owner-server';
import { pluralPl } from '@/lib/format';
import { Card, Initial, PageHeader, RatingBadge } from '@/components/owner/ui';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default async function ReviewsPage() {
  const ctx = await requireVenue();
  if (!ctx) return null;
  const { supabase, venue } = ctx;
  const reviews = await fetchReviews(supabase, venue.place_id);

  return (
    <>
      <PageHeader
        eyebrow="Opinie"
        title="Co goście piszą o Twoim lokalu"
        sub={reviews.length > 0 ? `${reviews.length} ${pluralPl(reviews.length, 'ostatnia opinia', 'ostatnie opinie', 'ostatnich opinii')}` : undefined}
      />

      {reviews.length === 0 ? (
        <Card className="text-center text-spoot-ink2">Brak opinii. Pojawią się tu, gdy goście ocenią Twój lokal.</Card>
      ) : (
        <Card className="py-1">
          <ul>
            {reviews.map((r, i) => (
              <li key={r.id} className={`flex gap-3 py-4 ${i > 0 ? 'border-t border-spoot-line' : ''}`}>
                <Initial name={r.display_name} />
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-display font-bold">{r.display_name}</span>
                    <RatingBadge rating={r.rating} />
                    <span className="ml-auto text-xs text-spoot-ink2">{formatDate(r.created_at)}</span>
                  </div>
                  {r.opinion && <p className="text-spoot-ink2">{r.opinion}</p>}
                  {r.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {r.tags.map(tag => (
                        <span key={tag} className="rounded-full bg-spoot-chip px-2 py-0.5 text-xs">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}
