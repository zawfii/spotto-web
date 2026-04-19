// app/owner/(protected)/reviews/page.tsx
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { getOwnerVenue, fetchReviews } from '@/lib/owner';

function Stars({ rating }: { rating: number }) {
  // rating is 1-10, display as 1-5 stars
  const stars = Math.round(rating / 2);
  return (
    <span className="text-xs text-[#D4892A]">
      {'★'.repeat(stars)}{'☆'.repeat(5 - stars)}
    </span>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pl-PL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default async function ReviewsPage() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/owner/login');

  const venue = await getOwnerVenue(supabase, user.id);
  if (!venue) redirect('/owner/login');

  const reviews = await fetchReviews(supabase, venue.place_id);

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-[#1a1a1a]">Opinie</h1>
        <span className="text-sm text-gray-400">{reviews.length} opinii</span>
      </div>

      {reviews.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <div className="text-4xl mb-3">⭐</div>
          <p className="text-sm text-gray-500">Brak opinii — będą tu gdy użytkownicy ocenią Twój lokal.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50 overflow-hidden">
          {reviews.map(r => (
            <div key={r.id} className="flex gap-3 p-4">
              <div className="w-9 h-9 rounded-full bg-[#D4892A] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                {(r.display_name?.[0] ?? '?').toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-[#1a1a1a] truncate">{r.display_name}</span>
                  <span className="text-xs text-gray-400 flex-shrink-0">{formatDate(r.created_at)}</span>
                </div>
                <Stars rating={r.rating} />
                {r.opinion && (
                  <p className="text-sm text-gray-600 mt-1">{r.opinion}</p>
                )}
                {r.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {r.tags.map(tag => (
                      <span key={tag} className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
