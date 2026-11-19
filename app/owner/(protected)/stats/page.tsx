// app/owner/(protected)/stats/page.tsx
import Link from 'next/link';
import { fetchAnalytics, fetchCounts, lastDays, previousRange } from '@/lib/owner';
import type { StatsRange } from '@/lib/owner';
import { requireVenue } from '@/lib/owner-server';
import { statDelta } from '@/lib/statDelta';
import { Card, CardTitle, PageHeader, StatCard, WeekdayBars, btnCls, inputCls, labelCls } from '@/components/owner/ui';

type Search = { range?: string; from?: string; to?: string };

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
// Podpis porównania z okresem tej samej długości tuż przed wybranym.
const COMPARE = { '30d': 'od poprzednich 30 dni', year: 'od poprzedniego roku', custom: 'od poprzedniego okresu' };
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

  const [counts, prev, analytics] = await Promise.all([
    fetchCounts(supabase, venue.place_id, range),
    fetchCounts(supabase, venue.place_id, previousRange(range)),
    fetchAnalytics(supabase, venue.place_id, range),
  ]);

  const delta = (k: 'views' | 'menu_clicks') => (counts && prev ? statDelta(counts[k], prev[k], COMPARE[key]) : null);
  const viewsDelta = delta('views');
  const menuDelta = delta('menu_clicks');
  const hasViews = analytics.best_days.some(d => d.count > 0);
  const savesTotal = counts?.saves_total ?? 0;
  const best = analytics.best_days.reduce((b, d) => (d.count > b.count ? d : b), analytics.best_days[0]);
  // te same osoby co saves_total, każda raz — części sumują się do całości
  const tiktok = counts?.saves_tiktok ?? 0;
  const instagram = counts?.saves_instagram ?? 0;
  const sources = [
    { label: 'TikTok', count: tiktok, color: '#010101' },
    { label: 'Instagram', count: instagram, color: '#c13584' },
    { label: 'W aplikacji', count: savesTotal - tiktok - instagram, color: '#03271a' },
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
        <StatCard
          label="Wyświetlenia profilu"
          value={counts ? counts.views.toLocaleString('pl-PL') : '—'}
          hint={viewsDelta?.text ?? 'w wybranym okresie'}
          up={viewsDelta?.up}
        />
        <StatCard label="Kliknęło menu" value={counts?.menu_clicks ?? '—'} hint={menuDelta?.text ?? 'w wybranym okresie'} up={menuDelta?.up} />
        <StatCard
          label="Zapisało"
          value={counts?.saves_total ?? '—'}
          hint={counts && counts.saves_new > 0 ? `+${counts.saves_new} w wybranym okresie` : 'łącznie, od początku'}
          up={!!counts && counts.saves_new > 0}
        />
        <StatCard label="Ocena" value={counts?.rating_avg ?? '—'} hint={counts ? `łącznie, z ${counts.reviews_total} opinii` : undefined} />
      </section>

      <div className="flex flex-wrap items-start gap-6">
        <Card className="flex min-w-0 flex-[2_1_480px] flex-col gap-5">
          <div className="flex flex-col gap-1">
            <CardTitle>Wyświetlenia profilu według dnia tygodnia</CardTitle>
            <p className="text-spoot-ink2">
              {!hasViews
                ? 'W tym okresie nikt nie otworzył profilu. Wybierz inny okres albo wróć za kilka dni.'
                : `Najwięcej osób zagląda w dniu: ${best.day}.`}
            </p>
          </div>
          {hasViews && <WeekdayBars days={analytics.best_days} height={220} />}
        </Card>

        <Card className="flex min-w-0 flex-[1_1_320px] flex-col gap-5">
          <div className="flex flex-col gap-1">
            <CardTitle>Źródło zapisów</CardTitle>
            <p className="text-spoot-ink2">Skąd goście dodali Cię do zapisanych — łącznie, od początku</p>
          </div>
          {!counts ? (
            <p className="text-spoot-ink2">Brak danych o zapisach. Spróbuj odświeżyć stronę.</p>
          ) : sources.map(s => {
            const pct = savesTotal > 0 ? Math.round((s.count / savesTotal) * 100) : 0;
            return (
              <div key={s.label} className="flex flex-col gap-1.5">
                <div className="flex gap-2 font-display">
                  <span className="grow font-semibold">{s.label}</span>
                  <span className="font-bold">{s.count} · {pct}%</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-spoot-chip">
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
