// app/owner/(protected)/layout.tsx
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { getOwnerVenue } from '@/lib/owner';
import OwnerShell from '@/components/owner/OwnerShell';

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/owner/login');
  }

  const venue = await getOwnerVenue(supabase, user.id);

  if (!venue) {
    return (
      <div className="min-h-screen bg-[#f7f7f5] flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">🏪</div>
          <h1 className="text-xl font-bold text-[#1a1a1a] mb-2">Brak dostępu</h1>
          <p className="text-sm text-gray-500">
            Nie masz jeszcze zatwierdzonego lokalu. Zgłoś lokal przez aplikację Spoot, a po weryfikacji otrzymasz dostęp do panelu.
          </p>
        </div>
      </div>
    );
  }

  return (
    <OwnerShell venue={venue} userEmail={user.email ?? ''}>
      {children}
    </OwnerShell>
  );
}
