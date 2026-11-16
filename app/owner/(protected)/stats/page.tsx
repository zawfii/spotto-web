// app/owner/(protected)/stats/page.tsx
import Link from 'next/link';
import { fetchStats, fetchAnalytics, lastDays } from '@/lib/owner';
import type { StatsRange } from '@/lib/owner';
import { requireVenue } from '@/lib/owner-server';
import { Card, CardTitle, PageHeader, StatCard, WeekdayBars, btnCls, inputCls, labelCls } from '@/components/owner/ui';

type Search = { range?: string; from?: string; to?: string };

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const fmt = (d: Date) => d.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' });

/** Okres z adresu: ?range=year, ?range=custom&from=…&to=…, domyślnie 30 dni. Złe daty → 30 dni. */
function resolveRange(q: Search): { key: '30d' | 'year' | 'custom'; range: StatsRange; label: string } {
  if (q.range === 'year') return { key: 'year', range: lastDays(365), label: 'Ostatni rok' };
  if (q.range === 'custom' && DATE_RE.test(q.from ?? '') && DATE_RE.test(q.to ?? '')) {
    const from = new Date(`${q.from}T00:00:00`);
    const to = new Date(`${q.to}T23:59:59.999`);
    if (!isNaN(from.getTime()) && !isNaN(to.getTime()) && from <= to) {
      return { key: 'custom', range: { from, to }, label: `${fmt(from)} – ${fmt(to)}` };
    }
  }
  return { key: '30d', range: lastDays(30), label: 'Ostatnie 30 dni' };
}

export default async function StatsPage({ searchParams }: { searchParams: Search }) {
  const ctx = await requireVenue();
  if (!ctx) return null;
  const { supabase, venue, base } = ctx;
  const { key, range, label } = resolveRange(searchParams);

  const [stats, analytics] = await Promise.all([
    fetchStats(supabase, venue.place_id),
    fetchAnalytics(supabase, venue.place_id, range),
  ]);

  const best = analytics.best_days.reduce((b, d) => (d.count > b.count ? d : b), analytics.best_days[0]);
  const sources = [
    { label: 'TikTok', count: analytics.saves_tiktok, color: '#010101' },
    { label: 'Instagram', count: analytics.saves_instagram, color: '#c13584' },
    { label: 'W aplikacji', count: Math.max(0, analytics.saves_total - analytics.saves_tiktok - analytics.saves_instagram), color: '#03271a' },
  ];
  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      <PageHeader eyebrow="Statystyki" title="Kto Cię ogląda i skąd przychodzi" sub={label} />

      <Card className="flex flex-wrap items-end gap-x-6 gap-y-3">
        <div className="flex flex-wrap gap-2">
          <Link href={`${base}/stats`} aria-current={key === '30d' ? 'true' : undefined} className={btnCls(key === '30d' ? 'primary' : 'outline', 'sm')}>30 dni</Link>
          <Link href={`${base}/stats?range=year`} aria-current={key === 'year' ? 'true' : undefined} className={btnCls(key === 'year' ? 'primary' : 'outline', 'sm')}>Rok</Link>
        </div>
        <form method="get" action={`${base}/stats`} className="flex flex-wrap items-end gap-2">
          <input type="hidden" name="range" value="custom" />
          <label className={labelCls}>
            Od
            <input type="date" name="from" required max={today} defaultValue={key === 'custom' ? searchParams.from : ''} className={`${inputCls} !h-9 !w-40`} />
          </label>
          <label className={labelCls}>
            Do
            <input type="date" name="to" required max={today} defaultValue={key === 'custom' ? searchParams.to : ''} className={`${inputCls} !h-9 !w-40`} />
          </label>
          <button type="submit" className={btnCls(key === 'custom' ? 'primary' : 'outline', 'sm')}>Pokaż własny okres</button>
        </form>
      </Card>

      <section aria-label="Liczby" className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
        <StatCard label="Wyświetlenia profilu" value={analytics.views.toLocaleString('pl-PL')} hint="w wybranym okresie" />
        <StatCard label="Kliknęło menu" value={analytics.menu_clicks} hint="w wybranym okresie" />
        <StatCard label="Zapisało" value={analytics.saves_total} hint="łącznie, od początku" />
        <StatCard label="Ocena" value={stats.avgRating > 0 ? stats.avgRating : '—'} hint={`łącznie, z ${stats.reviewCount} opinii`} />
      </section>

      <div className="flex flex-wrap items-start gap-6">
        <Card className="flex min-w-0 flex-[2_1_480px] flex-col gap-5">
          <div className="flex flex-col gap-1">
            <CardTitle>Wyświetlenia profilu według dnia tygodnia</CardTitle>
            <p className="text-spoot-ink2">
              {analytics.views === 0
                ? 'W tym okresie nikt nie otworzył profilu. Wybierz inny okres albo wróć za kilka dni.'
                : best.count > 0 ? `Najwięcej osób zagląda w dniu: ${best.day}.` : label}
            </p>
          </div>
          {analytics.views > 0 && <WeekdayBars days={analytics.best_days} height={220} />}
        </Card>

        <Card className="flex min-w-0 flex-[1_1_320px] flex-col gap-5">
          <div className="flex flex-col gap-1">
            <CardTitle>Źródło zapisów</CardTitle>
            <p className="text-spoot-ink2">Skąd goście dodali Cię do zapisanych — łącznie, od początku</p>
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
    </>
  );
}
