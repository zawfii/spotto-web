// app/owner/login/page.tsx
'use client';

import { createBrowserClient } from '@supabase/ssr';
import { Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Wordmark } from '@/components/SpootLogo';
import { Btn, inputCls, labelCls } from '@/components/owner/ui';

export default function OwnerLoginPage() {
  return (
    <Suspense fallback={null}>
      <OwnerLoginForm />
    </Suspense>
  );
}

function OwnerLoginForm() {
  const searchParams = useSearchParams();
  const linkExpired = searchParams.get('error') === '1';

  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const supabase = useMemo(
    () => createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    ),
    []
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setLoading(false);
    if (error) {
      setError('Nie udało się wysłać linku. Sprawdź adres e-mail.');
    } else {
      setSent(true);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="flex w-full max-w-md flex-col gap-5 rounded-3xl bg-spoot-card p-8 sm:p-10">
        <div className="flex flex-col gap-1.5">
          <Wordmark size={32} />
          <span className="font-display text-[10px] font-bold tracking-[1.5px]">DLA RESTAURACJI</span>
        </div>

        {sent ? (
          <>
            <h1 className="font-display text-[26px] font-bold leading-[34px]">Sprawdź skrzynkę</h1>
            <p className="text-spoot-ink2">
              Link do logowania wysłaliśmy na <strong className="text-spoot-ink">{email}</strong>. Otwórz go na tym urządzeniu.
            </p>
            <button
              type="button"
              onClick={() => { setSent(false); setEmail(''); }}
              className="self-start py-2 font-display text-[13px] font-bold underline underline-offset-4"
            >
              Wyślij na inny adres
            </button>
          </>
        ) : (
          <>
            <div className="flex flex-col gap-1">
              <h1 className="font-display text-[26px] font-bold leading-[34px]">Panel właściciela</h1>
              <p className="text-spoot-ink2">Wpisz adres e-mail — wyślemy link do logowania. Bez hasła.</p>
            </div>

            {linkExpired && (
              <p role="alert" className="rounded-xl bg-spoot-tint p-3">
                Link logowania wygasł albo jest nieprawidłowy. Wyślij nowy poniżej.
              </p>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <label className={labelCls}>
                Adres e-mail
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" placeholder="np. kontakt@twojlokal.pl" className={inputCls} />
              </label>
              {error && <p role="alert" className="text-spoot-danger">{error}</p>}
              <Btn type="submit" disabled={loading || !email}>{loading ? 'Wysyłam…' : 'Wyślij link logowania'}</Btn>
            </form>
          </>
        )}

        <p className="border-t border-spoot-line pt-4 text-xs text-spoot-ink2">
          Dostęp mają zweryfikowani właściciele lokali. Pierwsze zgłoszenie składasz w aplikacji Spoot.
        </p>
      </div>
    </div>
  );
}
