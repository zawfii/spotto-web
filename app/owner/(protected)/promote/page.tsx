'use client';

import { useCallback, useEffect, useState } from 'react';
import { useOwnerVenue } from '@/lib/owner-client';
import { Eyebrow, Loading, PageHeader } from '@/components/owner/ui';

type PackageId = '7d' | '14d' | '30d';
type Promotion = {
  id: string;
  package: PackageId;
  scope: 'district' | 'city';
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  active_until: string | null;
};

const PACKAGE_LABELS: Record<PackageId, string> = { '7d': '7 dni', '14d': '14 dni', '30d': '30 dni' };

// Płatne wyróżnienie jeszcze nie ruszyło: nowych próśb nie przyjmujemy,
// pokazujemy tylko status tych, które już są w bazie.
export default function PromotePage() {
  const { supabase, userId, venue, loading: venueLoading } = useOwnerVenue();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId || !venue) return;
    const { data } = await supabase
      .from('promotions')
      .select('id, package, scope, status, active_until')
      .eq('owner_id', userId)
      .eq('place_id', venue.place_id)
      .order('created_at', { ascending: false })
      .limit(5);
    setPromotions((data as Promotion[]) ?? []);
    setLoading(false);
  }, [supabase, userId, venue]);

  useEffect(() => { load(); }, [load]);

  if (venueLoading || (venue && loading)) return <Loading />;

  const active = promotions.find(p => p.status === 'approved' && p.active_until && new Date(p.active_until) > new Date());
  const p = active ?? promotions.find(x => x.status === 'pending');

  return (
    <>
      <PageHeader
        eyebrow="Wyróżnienie"
        title="Wyróżnij restaurację"
        sub="Twój lokal pojawi się wyżej u gości, którzy szukają w Twojej okolicy — na Starcie i na górze Ofert dnia. Zawsze z etykietą „Sponsorowane”."
      />
      <section className="flex max-w-2xl flex-col items-start gap-3 rounded-3xl bg-spoot-green p-6 text-white">
        {p ? (
          <>
            <Eyebrow className="text-white/80">{active ? 'Wyróżnienie aktywne' : 'Prośba w toku'}</Eyebrow>
            <h2 className="font-display text-[22px] font-bold leading-7">
              {active
                ? `Do ${new Date(active.active_until!).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long' })}`
                : 'Oczekuje na zatwierdzenie'}
            </h2>
            <p className="text-white/80">
              Pakiet {PACKAGE_LABELS[p.package]} · {p.scope === 'city' ? 'całe miasto' : 'Twoja dzielnica'}.
              {!active && ' Skontaktujemy się z Tobą, aby potwierdzić szczegóły.'}
            </p>
          </>
        ) : (
          <>
            <span className="rounded-full bg-spoot-orange px-2.5 py-0.5 font-display text-[11px] font-bold tracking-[0.5px] text-spoot-ink">WKRÓTCE</span>
            <h2 className="font-display text-[22px] font-bold leading-7">Wyróżnienie ruszy wkrótce</h2>
            <p className="text-white/80">Pracujemy nad tym. Damy znać, gdy będzie można wyróżnić lokal.</p>
          </>
        )}
      </section>
    </>
  );
}
