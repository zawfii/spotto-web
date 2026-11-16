// app/owner/(protected)/layout.tsx
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { getOwnerVenue } from '@/lib/owner';
import { panelBase } from '@/lib/owner-server';
import OwnerShell from '@/components/owner/OwnerShell';
import LogoutButton from '@/components/owner/LogoutButton';
import { Wordmark } from '@/components/SpootLogo';

// Stany sprzed wejścia do panelu — te same co w apce (app/owner-panel.tsx).
const GATE: Record<string, { title: string; text: string }> = {
  none: {
    title: 'Zgłoś swój lokal',
    text: 'Żeby wejść do panelu, zgłoś lokal w aplikacji Spoot. Po weryfikacji zalogujesz się tutaj tym samym adresem e-mail.',
  },
  pending: {
    title: 'Czekamy na weryfikację',
    text: 'Twoje zgłoszenie jest rozpatrywane. Wróć tu, gdy otrzymasz potwierdzenie.',
  },
  rejected: {
    title: 'Zgłoszenie odrzucone',
    text: 'Twoje zgłoszenie nie zostało zatwierdzone. Nowe złożysz w aplikacji Spoot.',
  },
};

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const base = panelBase();
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`${base}/login`);
  }

  const venue = await getOwnerVenue(supabase, user.id);

  if (!venue) {
    const { data: claim } = await supabase
      .from('ownership_requests')
      .select('status, admin_note')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    const gate = GATE[claim?.status ?? 'none'] ?? GATE.none;

    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="flex w-full max-w-md flex-col gap-4 rounded-3xl bg-spoot-card p-8">
          <Wordmark size={28} />
          <h1 className="font-display text-[26px] font-bold leading-[34px]">{gate.title}</h1>
          <p className="text-spoot-ink2">{gate.text}</p>
          {claim?.status === 'rejected' && claim.admin_note && (
            <p className="rounded-xl bg-spoot-input p-3 text-spoot-ink2">
              <strong className="font-display text-spoot-ink">Powód: </strong>{claim.admin_note}
            </p>
          )}
          <p className="flex flex-wrap items-center gap-x-2 border-t border-spoot-line pt-4 text-xs text-spoot-ink2">
            Zalogowano jako {user.email}
            <LogoutButton base={base} className="py-2 font-display font-bold text-spoot-ink underline underline-offset-4" />
          </p>
        </div>
      </div>
    );
  }

  return (
    <OwnerShell venue={venue} userEmail={user.email ?? ''} base={base}>
      {children}
    </OwnerShell>
  );
}
