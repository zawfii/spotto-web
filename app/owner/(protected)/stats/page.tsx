// app/owner/(protected)/stats/page.tsx
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { getOwnerVenue, fetchStats, fetchAnalytics } from '@/lib/owner';

export default async function StatsPage() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/owner/login');

  const venue = await getOwnerVenue(supabase, user.id);
  if (!venue) redirect('/owner/login');

  const [stats, analytics] = await Promise.all([
    fetchStats(supabase, venue.place_id),
    fetchAnalytics(supabase, venue.place_id),
  ]);

  const maxViews = analytics.best_days.reduce((m, d) => Math.max(m, d.count), 1);
  const totalSocial = analytics.saves_tiktok + analytics.saves_instagram;

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-lg font-bold text-[#1a1a1a]">Statystyki</h1>

      {/* Wyświetlenia */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 pt-5 pb-2">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Wyświetlenia profilu (30 dni)</p>
          <p className="text-4xl font-extrabold text-[#1a1a1a] mt-1">{analytics.views_30d.toLocaleString('pl-PL')}</p>
        </div>
        <div className="flex items-end gap-1.5 px-5 pb-5 h-24 mt-2">
          {analytics.best_days.map((d) => (
            <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full bg-[#D4892A] rounded-t-sm transition-all"
                style={{ height: `${Math.max((d.count / maxViews) * 64, d.count > 0 ? 4 : 0)}px` }}
              />
              <span className="text-[9px] text-gray-400">{d.day}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Konwersje */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Zapisania', value: stats.savedCount },
          { label: 'Kliknięcia menu', value: analytics.menu_clicks_30d },
          { label: 'Ocena', value: stats.avgRating > 0 ? stats.avgRating : '—' },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-2xl p-4 border border-gray-100 text-center">
            <div className="text-2xl font-extrabold text-[#1a1a1a]">{c.value}</div>
            <div className="text-[10px] text-gray-400 font-bold tracking-wide mt-1">{c.label.toUpperCase()}</div>
          </div>
        ))}
      </div>

      {/* Źródła social */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-50">
          <span className="text-sm font-bold text-[#1a1a1a]">Źródła zapisań</span>
        </div>
        <div className="p-5 space-y-3">
          {[
            { label: 'TikTok', count: analytics.saves_tiktok, color: '#010101' },
            { label: 'Instagram', count: analytics.saves_instagram, color: '#C13584' },
            {
              label: 'W aplikacji',
              count: Math.max(0, analytics.saves_total - totalSocial),
              color: '#D4892A',
            },
          ].map(s => {
            const pct = analytics.saves_total > 0
              ? Math.round((s.count / analytics.saves_total) * 100)
              : 0;
            return (
              <div key={s.label} className="flex items-center gap-3">
                <span className="text-sm text-[#1a1a1a] w-24 flex-shrink-0">{s.label}</span>
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, backgroundColor: s.color }}
                  />
                </div>
                <span className="text-xs text-gray-400 w-6 text-right">{s.count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
