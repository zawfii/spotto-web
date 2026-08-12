// app/owner/login/page.tsx
'use client';

import Image from 'next/image';
import { createBrowserClient } from '@supabase/ssr';
import { Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';

const GREEN = '#1A3C34';
const ORANGE = '#F5621C';
const BG = '#F5F2E8';

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
  const [focused, setFocused] = useState(false);

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
      setError('Nie udało się wysłać linku. Sprawdź adres email.');
    } else {
      setSent(true);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: BG,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      color: GREEN,
    }}>
      <div style={{
        width: 480,
        backgroundColor: 'white',
        borderRadius: 24,
        padding: '52px 48px',
        boxShadow: '0 4px 40px rgba(26,60,52,0.10)',
      }}>

        {/* Logo */}
        <div style={{ marginBottom: 40 }}>
          <Image
            src="/logo_spoot_zielony.png"
            alt="Spoot"
            width={120}
            height={40}
            style={{ objectFit: 'contain', objectPosition: 'left' }}
          />
        </div>

        {/* Heading */}
        <h1 style={{ fontSize: 26, fontWeight: 800, color: GREEN, marginBottom: 6, lineHeight: 1.2 }}>
          Panel właściciela
        </h1>
        <p style={{ fontSize: 14, color: '#6B7C79', marginBottom: 32, lineHeight: 1.5 }}>
          Wpisz adres email — wyślemy link do logowania.<br />Bez hasła, jednym kliknięciem.
        </p>

        {/* Error banner */}
        {linkExpired && (
          <div style={{
            backgroundColor: '#FEF2F2',
            border: '1px solid #FECACA',
            borderRadius: 12,
            padding: '12px 16px',
            marginBottom: 20,
            fontSize: 13,
            color: '#DC2626',
          }}>
            Link logowania wygasł lub jest nieprawidłowy. Wyślij nowy poniżej.
          </div>
        )}

        {sent ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{
              width: 64,
              height: 64,
              borderRadius: 20,
              backgroundColor: '#FFF4EE',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              fontSize: 28,
            }}>
              📬
            </div>
            <p style={{ fontWeight: 700, fontSize: 18, color: GREEN, marginBottom: 8 }}>
              Sprawdź skrzynkę
            </p>
            <p style={{ fontSize: 14, color: '#6B7C79', lineHeight: 1.5 }}>
              Link logowania wysłany na<br />
              <strong style={{ color: GREEN }}>{email}</strong>
            </p>
            <button
              onClick={() => { setSent(false); setEmail(''); }}
              style={{
                marginTop: 24,
                fontSize: 13,
                color: '#6B7C79',
                textDecoration: 'underline',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Wyślij na inny adres
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label style={{
              display: 'block',
              fontSize: 12,
              fontWeight: 700,
              color: '#6B7C79',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 8,
            }}>
              Adres email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="jan@restauracja.pl"
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: 14,
                border: `2px solid ${focused ? ORANGE : '#E8E5DC'}`,
                backgroundColor: focused ? '#FFFAF7' : '#FAFAF8',
                fontSize: 15,
                color: GREEN,
                outline: 'none',
                transition: 'border-color 0.15s, background 0.15s',
                boxSizing: 'border-box',
              }}
            />

            {error && (
              <p style={{ fontSize: 13, color: '#DC2626', marginTop: 8 }}>{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !email}
              style={{
                width: '100%',
                padding: '15px',
                borderRadius: 14,
                backgroundColor: loading || !email ? '#C5C0B8' : GREEN,
                color: 'white',
                fontWeight: 700,
                fontSize: 15,
                cursor: loading || !email ? 'not-allowed' : 'pointer',
                transition: 'background 0.15s',
                marginTop: 12,
                border: 'none',
                letterSpacing: '0.01em',
              }}
            >
              {loading ? 'Wysyłanie...' : 'Wyślij link logowania →'}
            </button>
          </form>
        )}

        <p style={{
          textAlign: 'center',
          fontSize: 12,
          color: '#9CA8A5',
          marginTop: 36,
          lineHeight: 1.6,
        }}>
          Dostęp tylko dla zweryfikowanych właścicieli lokali.<br />
          Pierwsze zgłoszenie przez aplikację mobilną Spoot.
        </p>
      </div>
    </div>
  );
}
