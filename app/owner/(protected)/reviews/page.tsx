// app/owner/(protected)/reviews/page.tsx
import { fetchReviews } from '@/lib/owner';
import type { Review } from '@/lib/owner';
import { requireVenue } from '@/lib/owner-server';
import { pluralPl } from '@/lib/format';
import { Card, Initial, PageHeader, RatingBadge } from '@/components/owner/ui';
import ReviewReply from '@/components/owner/ReviewReply';

const FIRST = 20;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' });
}

function ReviewRow({ r, placeId }: { r: Review; placeId: string }) {
  return (
    <li className="flex gap-3 border-t border-spoot-line py-4 first:border-0">
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
        <ReviewReply ratingId={r.id} placeId={placeId} initial={r.reply} />
      </div>
    </li>
  );
}

export default async function ReviewsPage() {
  const ctx = await requireVenue();
  if (!ctx) return null;
  const { supabase, venue } = ctx;
  const reviews = await fetchReviews(supabase, venue.place_id);
  const rest = reviews.slice(FIRST);
  const unanswered = reviews.filter(r => !r.reply).length;

  return (
    <>
      <PageHeader
        eyebrow="Opinie"
        title="Co goście piszą o Twoim lokalu"
        sub={reviews.length > 0
          ? `${reviews.length} ${pluralPl(reviews.length, 'opinia', 'opinie', 'opinii')} · ${unanswered} bez odpowiedzi. Twoje odpowiedzi goście widzą pod opinią w aplikacji Spoot.`
          : undefined}
      />

      {reviews.length === 0 ? (
        <Card className="text-center text-spoot-ink2">Brak opinii. Pojawią się tu, gdy goście ocenią Twój lokal.</Card>
      ) : (
        <Card className="py-1">
          <ul>
            {reviews.slice(0, FIRST).map(r => <ReviewRow key={r.id} r={r} placeId={venue.place_id} />)}
          </ul>
          {rest.length > 0 && (
            <details className="border-t border-spoot-line">
              <summary className="cursor-pointer py-4 font-display font-bold hover:text-spoot-green">
                Pokaż starsze opinie ({rest.length})
              </summary>
              <ul className="border-t border-spoot-line">
                {rest.map(r => <ReviewRow key={r.id} r={r} placeId={venue.place_id} />)}
              </ul>
            </details>
          )}
        </Card>
      )}
    </>
  );
}
