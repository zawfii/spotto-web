'use client';

import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';

export default function LogoutButton({ base, className }: { base: string; className?: string }) {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    await supabase.auth.signOut();
    router.push(`${base}/login`);
    router.refresh();
  }

  return <button type="button" onClick={handleLogout} className={className}>Wyloguj</button>;
}
