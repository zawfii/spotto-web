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
    <div
      className="min-h-screen flex"
      style={{ color: '#1a1a1a' }}
    >
      {/* Lewa strona — brand panel */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12"
        style={{ backgroundColor: '#1a1a1a' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg"
            style={{ backgroundColor: '#D4892A' }}
          >
            S
          </div>
          <span className="text-white font-bold text-xl tracking-tight">Spoot</span>
        </div>

        {/* Środkowy content */}
        <div>
          <h2 className="text-white text-4xl font-bold leading-tight mb-4">
            Zarządzaj swoim<br />lokalem z dowolnego<br />miejsca.
          </h2>
          <p className="text-white/50 text-sm leading-relaxed">
            Panel właściciela Spoot — menu, godziny, zdjęcia,<br />statystyki i opinie w jednym miejscu.
          </p>
        </div>

        {/* Stats row */}
        <div className="flex gap-6">
          {[
            { value: '2 400+', label: 'lokali w Spoot' },
            { value: '18 tys.', label: 'aktywnych użytkowników' },
            { value: '4.8★', label: 'średnia ocena aplikacji' },
          ].map(s => (
            <div key={s.label}>
              <div className="text-white font-bold text-lg">{s.value}</div>
              <div className="text-white/40 text-xs mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Prawa strona — formularz */}
      <div
        className="flex-1 flex flex-col items-center justify-center p-6 lg:p-16"
        style={{ backgroundColor: '#f7f7f5' }}
      >
        {/* Mobile logo */}
        <div className="flex items-center gap-2 mb-10 lg:hidden">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold"
            style={{ backgroundColor: '#D4892A' }}
          >
            S
          </div>
          <span className="font-bold text-lg" style={{ color: '#1a1a1a' }}>Spoot</span>
        </div>

        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold mb-1" style={{ color: '#1a1a1a' }}>
            Zaloguj się
          </h1>
          <p className="text-sm mb-8" style={{ color: '#888' }}>
            Wyślemy Ci link logowania na email — bez hasła.
          </p>

          {linkExpired && (
            <div
              className="rounded-xl px-4 py-3 mb-5 text-sm"
              style={{ backgroundColor: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}
            >
              Link logowania wygasł lub jest nieprawidłowy. Wyślij nowy link poniżej.
            </div>
          )}

          {sent ? (
            <div className="text-center py-8">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-5"
                style={{ backgroundColor: '#D4892A1A' }}
              >
                📬
              </div>
              <h3 className="font-bold text-lg mb-2" style={{ color: '#1a1a1a' }}>Sprawdź skrzynkę</h3>
              <p className="text-sm" style={{ color: '#888' }}>
                Link logowania wysłany na
              </p>
              <p className="text-sm font-semibold mt-1" style={{ color: '#1a1a1a' }}>{email}</p>
              <button
                onClick={() => { setSent(false); setEmail(''); }}
                className="mt-6 text-xs underline"
                style={{ color: '#888' }}
              >
                Wyślij na inny adres
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label
                  className="block text-xs font-semibold uppercase tracking-wider mb-2"
                  style={{ color: '#888' }}
                >
                  Adres email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="jan@restauracja.pl"
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    borderRadius: '14px',
                    border: '1.5px solid #E5E5E5',
                    background: '#fff',
                    fontSize: '14px',
                    color: '#1a1a1a',
                    outline: 'none',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={e => (e.target.style.borderColor = '#D4892A')}
                  onBlur={e => (e.target.style.borderColor = '#E5E5E5')}
                />
              </div>

              {error && (
                <p className="text-xs" style={{ color: '#DC2626' }}>{error}</p>
              )}

              <button
                type="submit"
                disabled={loading || !email}
                style={{
                  width: '100%',
                  padding: '15px',
                  borderRadius: '14px',
                  background: loading || !email ? '#ccc' : '#1a1a1a',
                  color: '#fff',
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: loading || !email ? 'not-allowed' : 'pointer',
                  transition: 'background 0.15s',
                  marginTop: '8px',
                }}
              >
                {loading ? 'Wysyłanie...' : 'Wyślij link logowania →'}
              </button>
            </form>
          )}

          <p className="text-center text-xs mt-8" style={{ color: '#bbb' }}>
            Dostęp tylko dla zweryfikowanych właścicieli lokali.<br />
            Pierwsze zgłoszenie przez aplikację mobilną Spoot.
          </p>
        </div>
      </div>
    </div>
  );
}
