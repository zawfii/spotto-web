// app/owner/login/page.tsx
'use client';

import { createBrowserClient } from '@supabase/ssr';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function OwnerLoginPage() {
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
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setLoading(false);
    if (error) {
      setError('Nie udało się wysłać linku. Sprawdź adres email.');
    } else {
      setSent(true);
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f7f5] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center mb-8">
          <div className="w-10 h-10 bg-[#D4892A] rounded-xl flex items-center justify-center text-white font-bold text-lg">
            S
          </div>
          <span className="ml-3 text-xl font-bold text-[#1a1a1a]">Spoot</span>
        </div>

        {linkExpired && (
          <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-4 text-sm text-red-600">
            Link logowania wygasł lub jest nieprawidłowy. Wyślij nowy link poniżej.
          </div>
        )}

        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          <h1 className="text-xl font-bold text-[#1a1a1a] mb-1">Panel właściciela</h1>
          <p className="text-sm text-gray-500 mb-6">
            Wpisz adres email — wyślemy Ci link do logowania.
          </p>

          {sent ? (
            <div className="text-center py-4">
              <div className="text-3xl mb-3">📬</div>
              <p className="font-semibold text-[#1a1a1a]">Sprawdź skrzynkę</p>
              <p className="text-sm text-gray-500 mt-1">
                Link do logowania wysłany na <strong>{email}</strong>
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="jan@restauracja.pl"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4892A] focus:border-transparent"
                />
              </div>
              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}
              <button
                type="submit"
                disabled={loading || !email}
                className="w-full py-3 bg-[#1a1a1a] text-white rounded-xl font-semibold text-sm disabled:opacity-50 hover:bg-[#333] transition-colors"
              >
                {loading ? 'Wysyłanie...' : 'Wyślij link logowania'}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Dostęp tylko dla zweryfikowanych właścicieli lokali
        </p>
      </div>
    </div>
  );
}
