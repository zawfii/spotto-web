'use client';

import { useCallback, useEffect, useState } from 'react';
import { useOwnerVenue } from '@/lib/owner-client';
import { Btn, Card, CardTitle, Eyebrow, Loading, PageHeader } from '@/components/owner/ui';

type PackageId = '7d' | '14d' | '30d';
type Scope = 'district' | 'city';
type Promotion = {
  id: string;
  package: PackageId;
  scope: Scope;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  active_until: string | null;
  admin_note: string | null;
  created_at: string;
};

// Jak app/promote-venue.tsx.
const PACKAGES: { id: PackageId; label: string; price: string; description: string }[] = [
  { id: '7d', label: '7 dni', price: '199 zł', description: 'Idealne na test — wyróżnienie przez tydzień' },
  { id: '14d', label: '14 dni', price: '349 zł', description: 'Najpopularniejszy wybór — dwa tygodnie widoczności' },
  { id: '30d', label: '30 dni', price: '599 zł', description: 'Pełny miesiąc sponsorowanego wyróżnienia' },
];

const optionCls = (on: boolean) =>
  `flex cursor-pointer gap-3 rounded-2xl border-2 bg-spoot-input p-4 ${on ? 'border-spoot-ink' : 'border-transparent hover:border-spoot-line'}`;

export default function PromotePage() {
  const { supabase, userId, venue, place, loading: venueLoading } = useOwnerVenue();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [pkg, setPkg] = useState<PackageId>('14d');
  const [scope, setScope] = useState<Scope>('district');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase
      .from('promotions')
      .select('id, package, scope, status, active_until, admin_note, created_at')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);
    setPromotions((data as Promotion[]) ?? []);
    setLoading(false);
  }, [supabase, userId]);

  useEffect(() => { load(); }, [load]);

  const active = promotions.find(p => p.status === 'approved' && p.active_until && new Date(p.active_until) > new Date());
  const pending = promotions.find(p => p.status === 'pending');
  const lastRejected = promotions[0]?.status === 'rejected' ? promotions[0] : null;
  const chosen = PACKAGES.find(p => p.id === pkg)!;
  const district = place?.district;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!venue || !userId) return;
    setSubmitting(true);
    const { error } = await supabase.from('promotions').insert({ owner_id: userId, place_id: venue.place_id, package: pkg, scope });
    setSubmitting(false);
    if (error) { alert('Nie udało się wysłać prośby. Spróbuj ponownie.'); return; }
    load();
  }

  if (venueLoading || loading) return <Loading />;

  const header = (
    <PageHeader
      eyebrow="Wyróżnienie"
      title="Wyróżnij restaurację"
      sub="Twój lokal pojawi się wyżej u gości, którzy szukają w Twojej okolicy — na Starcie i na górze Ofert dnia. Zawsze z etykietą „Sponsorowane”."
    />
  );

  if (active || pending) {
    const p = (active ?? pending)!;
    return (
      <>
        {header}
        <section className="flex max-w-2xl flex-col gap-3 rounded-3xl bg-spoot-green p-6 text-white">
          <Eyebrow className="text-white/80">{active ? 'Wyróżnienie aktywne' : 'Prośba w toku'}</Eyebrow>
          <h2 className="font-display text-[22px] font-bold leading-7">
            {active
              ? `Do ${new Date(active.active_until!).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long' })}`
              : 'Oczekuje na zatwierdzenie'}
          </h2>
          <p className="text-white/80">
            Pakiet {PACKAGES.find(x => x.id === p.package)?.label} · {p.scope === 'city' ? 'całe miasto' : 'Twoja dzielnica'}.
            {!active && ' Skontaktujemy się z Tobą w ciągu 24 godzin, aby potwierdzić szczegóły i płatność.'}
          </p>
        </section>
      </>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-6">
      {header}
      {lastRejected && (
        <p role="status" className="rounded-2xl bg-spoot-tint p-4">
          Poprzednia prośba nie została zatwierdzona{lastRejected.admin_note ? `: ${lastRejected.admin_note}` : '.'} Możesz wysłać nową.
        </p>
      )}

      <div className="flex flex-wrap items-start gap-6">
        <div className="flex min-w-0 flex-[2_1_480px] flex-col gap-6">
          <Card>
            <fieldset className="flex flex-col gap-3">
              <legend className="pb-3"><CardTitle>Gdzie Cię pokażemy</CardTitle></legend>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
                {([
                  ['district', district ? `Twoja dzielnica · ${district}` : 'Twoja dzielnica', 'Goście w pobliżu i z filtrem Twojej dzielnicy'],
                  ['city', 'Całe miasto', 'Wszyscy, którzy przeglądają Twoje miasto'],
                ] as const).map(([id, label, desc]) => (
                  <label key={id} className={optionCls(scope === id)}>
                    <input type="radio" name="scope" checked={scope === id} onChange={() => setScope(id)} className="mt-0.5 h-5 w-5 shrink-0 accent-spoot-ink" />
                    <span className="flex flex-col gap-0.5">
                      <span className="font-display font-bold">{label}</span>
                      <span className="text-[13px] text-spoot-ink2">{desc}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          </Card>

          <Card>
            <fieldset className="flex flex-col gap-3">
              <legend className="pb-3"><CardTitle>Wybierz pakiet</CardTitle></legend>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3">
                {PACKAGES.map(p => (
                  <label key={p.id} className={`${optionCls(pkg === p.id)} flex-col`}>
                    <span className="flex items-center gap-2">
                      <input type="radio" name="package" checked={pkg === p.id} onChange={() => setPkg(p.id)} className="h-5 w-5 accent-spoot-ink" />
                      <span className="grow font-display font-bold">{p.label}</span>
                      {p.id === '14d' && <span className="rounded-full bg-spoot-orange px-2 py-0.5 font-display text-[10px] font-bold tracking-[0.5px]">NAJCZĘŚCIEJ</span>}
                    </span>
                    <span className="font-display text-[26px] font-bold leading-[34px]">{p.price}</span>
                    <span className="text-[13px] text-spoot-ink2">{p.description}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          </Card>
        </div>

        <section className="flex min-w-0 flex-[1_1_320px] flex-col gap-4 rounded-3xl bg-spoot-green p-6 text-white">
          <h2 className="font-display text-lg font-bold">Twoja prośba</h2>
          <dl className="flex flex-col">
            {[
              ['Lokal', place?.name ?? '—'],
              ['Zasięg', scope === 'city' ? 'Całe miasto' : district ?? 'Twoja dzielnica'],
              ['Pakiet', chosen.label],
            ].map(([k, v]) => (
              <div key={k} className="flex gap-3 border-t border-white/50 py-3">
                <dt className="grow text-white/80">{k}</dt>
                <dd className="font-display font-bold">{v}</dd>
              </div>
            ))}
            <div className="flex items-baseline gap-3 border-t border-white/50 py-3">
              <dt className="grow text-white/80">Do zapłaty</dt>
              <dd className="font-display text-[32px] font-bold leading-10">{chosen.price}</dd>
            </div>
          </dl>
          <button
            type="submit"
            disabled={submitting}
            className="h-12 rounded-2xl bg-spoot-orange font-display font-bold text-spoot-ink transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? 'Wysyłam…' : 'Wyślij prośbę'}
          </button>
          <p className="text-xs text-white/80">Po wysłaniu prośba czeka na zatwierdzenie. Odezwiemy się w sprawie płatności.</p>
        </section>
      </div>
    </form>
  );
}
