// app/owner/(protected)/stats/page.tsx
import { fetchStats, fetchAnalytics } from '@/lib/owner';
import { requireVenue } from '@/lib/owner-server';
import { Card, CardTitle, PageHeader, StatCard, WeekdayBars } from '@/components/owner/ui';

export default async function StatsPage() {
  const ctx = await requireVenue();
  if (!ctx) return null;
  const { supabase, venue } = ctx;

  const [stats, analytics] = await Promise.all([
    fetchStats(supabase, venue.place_id),
    fetchAnalytics(supabase, venue.place_id),
  ]);

  const best = analytics.best_days.reduce((b, d) => (d.count > b.count ? d : b), analytics.best_days[0]);
  const sources = [
    { label: 'TikTok', count: analytics.saves_tiktok, color: '#010101' },
    { label: 'Instagram', count: analytics.saves_instagram, color: '#c13584' },
    { label: 'W aplikacji', count: Math.max(0, analytics.saves_total - analytics.saves_tiktok - analytics.saves_instagram), color: '#03271a' },
  ];

  return (
    <>
      <PageHeader eyebrow="Statystyki" title="Kto Cię ogląda i skąd przychodzi" sub="Ostatnie 30 dni" />

      <section aria-label="Konwersje" className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
        <StatCard label="Wyświetlenia profilu" value={analytics.views_30d.toLocaleString('pl-PL')} hint="w ostatnich 30 dniach" />
        <StatCard label="Zapisało" value={analytics.saves_total} hint="łącznie" />
        <StatCard label="Kliknęło menu" value={analytics.menu_clicks_30d} hint="w ostatnich 30 dniach" />
        <StatCard label="Ocena" value={stats.avgRating > 0 ? stats.avgRating : '—'} hint={`z ${stats.reviewCount} opinii`} />
      </section>

      {analytics.views_30d === 0 ? (
        <Card className="flex flex-col gap-2 text-center">
          <CardTitle>Zbieramy dane</CardTitle>
          <p className="text-spoot-ink2">Wróć za kilka dni — statystyki pojawią się, gdy przyjdą pierwsi odwiedzający.</p>
        </Card>
      ) : (
        <div className="flex flex-wrap items-start gap-6">
          <Card className="flex min-w-0 flex-[2_1_480px] flex-col gap-5">
            <div className="flex flex-col gap-1">
              <CardTitle>Wyświetlenia profilu według dnia tygodnia</CardTitle>
              {best.count > 0 && <p className="text-spoot-ink2">Najwięcej osób zagląda w dniu: {best.day}.</p>}
            </div>
            <WeekdayBars days={analytics.best_days} height={220} />
          </Card>

          <Card className="flex min-w-0 flex-[1_1_320px] flex-col gap-5">
            <div className="flex flex-col gap-1">
              <CardTitle>Źródło zapisów</CardTitle>
              <p className="text-spoot-ink2">Skąd goście dodali Cię do zapisanych</p>
            </div>
            {sources.map(s => {
              const pct = analytics.saves_total > 0 ? Math.round((s.count / analytics.saves_total) * 100) : 0;
              return (
                <div key={s.label} className="flex flex-col gap-1.5">
                  <div className="flex gap-2 font-display">
                    <span className="grow font-semibold">{s.label}</span>
                    <span className="font-bold">{s.count} · {pct}%</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-spoot-chip">
                    <div className="h-2.5 rounded-full" style={{ width: `${pct}%`, backgroundColor: s.color }} />
                  </div>
                </div>
              );
            })}
          </Card>
        </div>
      )}
    </>
  );
}
