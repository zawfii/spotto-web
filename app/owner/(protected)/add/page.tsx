// app/owner/(protected)/add/page.tsx
import { notFound } from 'next/navigation';
import { requireVenue } from '@/lib/owner-server';
import ClaimVenue from '@/components/owner/ClaimVenue';
import { Card, CardTitle, PageHeader } from '@/components/owner/ui';

type Claim = { place_id: string; status: string; admin_note: string | null; places: { name: string } | null };

const STATUS: Record<string, { label: string; cls: string }> = {
  pending: { label: 'Czeka na weryfikację', cls: 'bg-spoot-chip text-spoot-ink' },
  rejected: { label: 'Odrzucone', cls: 'bg-spoot-danger/10 text-spoot-danger' },
};

// Kolejny lokal na tym samym koncie: zgłoszenia w toku/odrzucone + formularz zgłoszenia.
export default async function AddVenuePage() {
  if (process.env.ADD_VENUE_LIVE !== '1') notFound();
  const ctx = await requireVenue();
  if (!ctx) return null;
  const { supabase, user, venues } = ctx;

  const { data } = await supabase
    .from('ownership_requests')
    .select('place_id, status, admin_note, places(name)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  // Najnowsze zgłoszenie na lokal; zatwierdzone lokale są już na liście lokali konta.
  const owned = new Set(venues.map(v => v.place_id));
  const seen = new Set<string>();
  const claims = ((data ?? []) as unknown as Claim[]).filter(c => {
    if (seen.has(c.place_id)) return false;
    seen.add(c.place_id);
    return !owned.has(c.place_id) && (c.status === 'pending' || c.status === 'rejected');
  });

  return (
    <>
      <PageHeader
        eyebrow="Lokale"
        title="Dodaj lokal"
        sub="Zgłoś kolejny lokal. Po weryfikacji pojawi się na liście lokali w panelu."
      />
      {claims.length > 0 && (
        <Card className="flex max-w-2xl flex-col gap-2">
          <CardTitle>Twoje zgłoszenia</CardTitle>
          <ul>
            {claims.map(c => (
              <li key={c.place_id} className="flex flex-col gap-1.5 border-t border-spoot-line py-3 first:border-0 last:pb-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-display font-bold">{c.places?.name ?? 'Lokal'}</span>
                  <span className={`rounded-full px-2.5 py-0.5 font-display text-[11px] font-bold leading-4 ${STATUS[c.status].cls}`}>
                    {STATUS[c.status].label}
                  </span>
                </div>
                {c.status === 'rejected' && c.admin_note && (
                  <p className="text-sm text-spoot-ink2">
                    <strong className="font-display text-spoot-ink">Powód: </strong>{c.admin_note}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}
      <Card className="max-w-2xl">
        {/* key: po wysłanym zgłoszeniu (nowy wiersz) formularz startuje od zera */}
        <ClaimVenue
          key={data?.length ?? 0}
          userId={user.id}
          defaultPhone={typeof user.user_metadata?.phone === 'string' ? user.user_metadata.phone : ''}
        />
      </Card>
    </>
  );
}
