// app/owner/(protected)/page.tsx
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { getOwnerVenue, fetchStats, fetchAnalytics, fetchReviews } from '@/lib/owner';
import { redirect } from 'next/navigation';

function StatCard({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="bg-white rounded-2xl p-4 text-center border border-gray-100">
      <div className="text-2xl font-extrabold text-[#1a1a1a]">{value}</div>
      <div className="text-[10px] font-bold text-gray-400 tracking-widest mt-1">{label}</div>
    </div>
  );
}

function formatDate(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 3600) return `${Math.floor(diff / 60)} min.`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} godz.`;
  if (diff < 172800) return 'wczoraj';
  return `${Math.floor(diff / 86400)} dni temu`;
}

export default async function DashboardPage() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/owner/login');

  const venue = await getOwnerVenue(supabase, user.id);
  if (!venue) redirect('/owner/login');

  const [stats, analytics, reviews] = await Promise.all([
    fetchStats(supabase, venue.place_id),
    fetchAnalytics(supabase, venue.place_id),
    fetchReviews(supabase, venue.place_id),
  ]);

  const avgRatingDisplay = stats.avgRating > 0 ? stats.avgRating : '—';
  const recentReviews = reviews.slice(0, 5);
  const maxViews = Math.max(...analytics.best_days.map(d => d.count), 1);

  return (
    <div className="max-w-3xl space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard value={stats.savedCount > 999 ? `${(stats.savedCount / 1000).toFixed(1)}k` : stats.savedCount} label="ZAPISANE" />
        <StatCard value={avgRatingDisplay} label="OCENA" />
        <StatCard value={stats.reviewCount} label="OPINIE" />
      </div>

      {/* Promote CTA */}
      <div className="bg-[#1a1a1a] rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl">🚀</span>
          <div>
            <p className="text-sm font-bold text-white">Wyróżnij lokal w Spoot</p>
            <p className="text-xs text-white/50 mt-0.5">Zwiększ widoczność w wyszukiwaniu i mapie</p>
          </div>
        </div>
        <span className="text-white/40 text-lg">›</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Ostatnie opinie */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
            <span className="text-sm font-bold text-[#1a1a1a]">Ostatnie opinie</span>
          </div>
          {recentReviews.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Brak opinii</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentReviews.map(r => (
                <div key={r.id} className="flex gap-3 px-4 py-3">
                  <div className="w-8 h-8 rounded-full bg-[#D4892A] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {r.display_name[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#1a1a1a]">{r.display_name}</span>
                      <span className="text-[10px] text-gray-400">{formatDate(r.created_at)}</span>
                    </div>
                    <div className="text-[10px] text-[#D4892A] mt-0.5">
                      {'★'.repeat(Math.round(r.rating / 2))}{'☆'.repeat(5 - Math.round(r.rating / 2))}
                    </div>
                    {r.opinion && (
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{r.opinion}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Wyświetlenia — mini wykres */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
            <span className="text-sm font-bold text-[#1a1a1a]">Wyświetlenia profilu</span>
            <span className="text-xs text-gray-400">30 dni</span>
          </div>
          <div className="p-4">
            <div className="text-2xl font-extrabold text-[#1a1a1a]">{analytics.views_30d.toLocaleString('pl-PL')}</div>
            <div className="text-xs text-gray-400 mb-3">wyświetleń w tym miesiącu</div>
            {analytics.views_30d > 0 && (
              <div className="flex items-end gap-1 h-12">
                {analytics.best_days.map((d, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full bg-[#D4892A] rounded-sm"
                      style={{ height: `${Math.max((d.count / maxViews) * 40, d.count > 0 ? 4 : 0)}px` }}
                    />
                    <span className="text-[8px] text-gray-400">{d.day}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Szybkie akcje */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-50">
          <span className="text-sm font-bold text-[#1a1a1a]">Szybkie akcje</span>
        </div>
        <div className="grid grid-cols-4 gap-2 p-4">
          {[
            { icon: '🍽', label: 'Edytuj menu', href: '/owner/menu' },
            { icon: '🕐', label: 'Godziny', href: '/owner/settings' },
            { icon: '📸', label: 'Zdjęcia', href: '/owner/settings' },
            { icon: '📊', label: 'Statystyki', href: '/owner/stats' },
          ].map(a => (
            <a
              key={a.label}
              href={a.href}
              className="flex flex-col items-center gap-1.5 bg-[#f7f7f5] rounded-xl p-3 hover:bg-gray-100 transition-colors"
            >
              <span className="text-xl">{a.icon}</span>
              <span className="text-[10px] text-gray-500 font-medium text-center leading-tight">{a.label}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
