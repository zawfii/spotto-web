// app/owner/(protected)/page.tsx
import Link from 'next/link';
import { fetchStats, fetchAnalytics, fetchReviews } from '@/lib/owner';
import { requireVenue } from '@/lib/owner-server';
import { relativePl } from '@/lib/format';
import { Card, CardTitle, Eyebrow, Initial, NavIcon, NAV_ICONS, PageHeader, RatingBadge, StatCard, WeekdayBars, btnCls } from '@/components/owner/ui';

export default async function DashboardPage() {
  const ctx = await requireVenue();
  if (!ctx) return null;
  const { supabase, venue, base } = ctx;

  const [stats, analytics, reviews] = await Promise.all([
    fetchStats(supabase, venue.place_id),
    fetchAnalytics(supabase, venue.place_id),
    fetchReviews(supabase, venue.place_id),
  ]);

  const today = new Date().toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Warsaw' });
  const quickActions = [
    { label: 'Dodaj zdjęcie', href: `${base}/settings` },
    { label: 'Edytuj opis i godziny', href: `${base}/settings` },
    { label: 'Dodaj danie do menu', href: `${base}/menu` },
    { label: 'Zobacz statystyki', href: `${base}/stats` },
  ];

  return (
    <>
      <PageHeader eyebrow="Pulpit" title={venue.place_name} sub={today.charAt(0).toUpperCase() + today.slice(1)}>
        <a href={`https://spootme.pl/place/${venue.place_id}`} target="_blank" rel="noreferrer" className={btnCls('outline')}>
          Zobacz profil w Spoot
        </a>
      </PageHeader>

      <section aria-label="Liczby" className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
        <StatCard label="Zapisane" value={stats.savedCount > 999 ? `${(stats.savedCount / 1000).toFixed(1)}k` : stats.savedCount} hint="tyle osób ma Cię na liście" />
        <StatCard label="Ocena" value={stats.avgRating > 0 ? stats.avgRating : '—'} hint="średnia w Spoot, skala 1–10" />
        <StatCard label="Opinie" value={stats.reviewCount} />
        <StatCard label="Wyświetlenia profilu" value={analytics.views_30d.toLocaleString('pl-PL')} hint="w ostatnich 30 dniach" />
      </section>

      <div className="flex flex-wrap items-start gap-6">
        <div className="flex min-w-0 flex-[2_1_480px] flex-col gap-6">
          <Card className="pb-1">
            <div className="flex items-center gap-3 pb-3">
              <div className="grow"><CardTitle>Ostatnie opinie</CardTitle></div>
              <Link href={`${base}/reviews`} className="py-2"><Eyebrow>Zobacz wszystkie</Eyebrow></Link>
            </div>
            {reviews.length === 0 ? (
              <p className="border-t border-spoot-line py-6 text-spoot-ink2">Brak opinii. Pojawią się tu, gdy goście ocenią Twój lokal.</p>
            ) : (
              <ul>
                {reviews.slice(0, 5).map(r => (
                  <li key={r.id} className="flex gap-3 border-t border-spoot-line py-4">
                    <Initial name={r.display_name} />
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-display font-bold">{r.display_name}</span>
                        <RatingBadge rating={r.rating} />
                        <span className="ml-auto text-xs text-spoot-ink2">{relativePl(r.created_at)}</span>
                      </div>
                      {r.opinion && <p className="line-clamp-2 text-spoot-ink2">{r.opinion}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="grow"><CardTitle>Wyświetlenia według dnia tygodnia</CardTitle></div>
              <Link href={`${base}/stats`} className="py-2"><Eyebrow>Statystyki</Eyebrow></Link>
            </div>
            {analytics.views_30d === 0 ? (
              <p className="text-spoot-ink2">Zbieramy dane. Wróć za kilka dni — wykres pojawi się, gdy przyjdą pierwsi odwiedzający.</p>
            ) : (
              <WeekdayBars days={analytics.best_days} height={120} />
            )}
          </Card>
        </div>

        <Card className="flex min-w-0 flex-[1_1_320px] flex-col pb-2">
          <div className="pb-3"><CardTitle>Szybkie akcje</CardTitle></div>
          {quickActions.map(a => (
            <Link key={a.label} href={a.href} className="flex min-h-12 items-center gap-3 border-t border-spoot-line font-display font-semibold hover:text-spoot-green">
              <span className="grow">{a.label}</span>
              <NavIcon>{NAV_ICONS.chevron}</NavIcon>
            </Link>
          ))}
        </Card>
      </div>
    </>
  );
}
