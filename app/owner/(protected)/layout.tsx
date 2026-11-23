// app/owner/(protected)/layout.tsx
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { getOwnerVenue } from '@/lib/owner';
import { panelBase } from '@/lib/owner-server';
import { VENUE_COOKIE } from '@/lib/panel';
import OwnerShell from '@/components/owner/OwnerShell';
import LogoutButton from '@/components/owner/LogoutButton';
import ClaimVenue from '@/components/owner/ClaimVenue';
import OwnerContact from '@/components/owner/OwnerContact';
import { CALL_TIMES, OWNER_CONTACT_PHONE } from '@/lib/contact';
import { Wordmark } from '@/components/SpootLogo';

// Stany sprzed wejścia do panelu — te same co w apce (app/owner-panel.tsx).
const GATE: Record<string, { title: string; text: string }> = {
  none: {
    title: 'Zgłoś swój lokal',
    text: 'Znajdź swój lokal i zostaw numer telefonu. Zadzwonimy, żeby potwierdzić, że jest Twój, a po rozmowie panel otworzy się na tym koncie.',
  },
  pending: {
    title: 'Zadzwonimy do Ciebie',
    text: 'W ciągu 1 dnia roboczego potwierdzimy przez telefon, że to Twój lokal. Zaraz po rozmowie panel otworzy się na tym koncie.',
  },
  rejected: {
    title: 'Zgłoszenie odrzucone',
    text: 'Twoje zgłoszenie nie zostało zatwierdzone. Możesz wysłać nowe poniżej albo napisać do nas.',
  },
};

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const base = panelBase();
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`${base}/login`);
  }

  const found = await getOwnerVenue(supabase, user.id, cookies().get(VENUE_COOKIE)?.value);

  if (!found) {
    const { data: claim } = await supabase
      .from('ownership_requests')
      .select('status, admin_note, phone, call_time')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    const gate = GATE[claim?.status ?? 'none'] ?? GATE.none;

    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="flex w-full max-w-lg flex-col gap-4 rounded-3xl bg-spoot-card p-6 sm:p-8">
          <Wordmark size={28} />
          <h1 className="font-display text-[26px] font-bold leading-[34px]">{gate.title}</h1>
          <p className="text-spoot-ink2">{gate.text}</p>
          {claim?.status === 'rejected' && claim.admin_note && (
            <p className="rounded-xl bg-spoot-input p-3 text-spoot-ink2">
              <strong className="font-display text-spoot-ink">Powód: </strong>{claim.admin_note}
            </p>
          )}
          {claim?.status === 'pending' && claim.phone && (
            <p className="rounded-xl bg-spoot-input p-3 text-spoot-ink2">
              <strong className="font-display text-spoot-ink">Dzwonimy na: </strong>{claim.phone}
              {claim.call_time && CALL_TIMES[claim.call_time] ? `, ${CALL_TIMES[claim.call_time]}` : ''}. Z numeru {OWNER_CONTACT_PHONE}.
            </p>
          )}
          {claim?.status !== 'pending' && (
            <ClaimVenue
              userId={user.id}
              defaultPhone={typeof user.user_metadata?.phone === 'string' ? user.user_metadata.phone : ''}
            />
          )}
          <OwnerContact lead={claim?.status === 'pending' ? 'Wolisz odezwać się pierwszy?' : 'Masz pytanie?'} withPhone={!!claim} />
          <p className="flex flex-wrap items-center gap-x-2 border-t border-spoot-line pt-4 text-xs text-spoot-ink2">
            Zalogowano jako {user.email}
            <LogoutButton base={base} className="py-2 font-display font-bold text-spoot-ink underline underline-offset-4" />
          </p>
        </div>
      </div>
    );
  }

  return (
    <OwnerShell
      venue={found.venue}
      venues={found.venues}
      canAdd={process.env.ADD_VENUE_LIVE === '1'}
      userEmail={user.email ?? ''}
      base={base}
    >
      {children}
    </OwnerShell>
  );
}
