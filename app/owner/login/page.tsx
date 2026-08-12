// app/owner/login/page.tsx
'use client';

import Image from 'next/image';
import { createBrowserClient } from '@supabase/ssr';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

const GREEN = '#1A3C34';
const ORANGE = '#F5621C';
const BG = '#F5F2E8';

export default function OwnerLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [focusedEmail, setFocusedEmail] = useState(false);
  const [focusedPassword, setFocusedPassword] = useState(false);

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
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError('Nieprawidłowy email lub hasło.');
      } else {
        router.push('/owner');
      }
    } finally {
      setLoading(false);
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
            src="/logo_kolo_bialy-kopia.png"
            alt="Spoot"
            width={56}
            height={56}
            style={{ objectFit: 'contain' }}
          />
        </div>

        {/* Heading */}
        <h1 style={{ fontSize: 26, fontWeight: 800, color: GREEN, marginBottom: 6, lineHeight: 1.2 }}>
          Panel właściciela
        </h1>
        <p style={{ fontSize: 14, color: '#6B7C79', marginBottom: 32, lineHeight: 1.5 }}>
          Zaloguj się do panelu właściciela lokalu.
        </p>

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
            onFocus={() => setFocusedEmail(true)}
            onBlur={() => setFocusedEmail(false)}
            style={{
              width: '100%',
              padding: '14px 16px',
              borderRadius: 14,
              border: `2px solid ${focusedEmail ? ORANGE : '#E8E5DC'}`,
              backgroundColor: focusedEmail ? '#FFFAF7' : '#FAFAF8',
              fontSize: 15,
              color: GREEN,
              outline: 'none',
              transition: 'border-color 0.15s, background 0.15s',
              boxSizing: 'border-box',
            }}
          />

          <label style={{
            display: 'block',
            fontSize: 12,
            fontWeight: 700,
            color: '#6B7C79',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: 8,
            marginTop: 16,
          }}>
            Hasło
          </label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            placeholder="••••••••"
            onFocus={() => setFocusedPassword(true)}
            onBlur={() => setFocusedPassword(false)}
            style={{
              width: '100%',
              padding: '14px 16px',
              borderRadius: 14,
              border: `2px solid ${focusedPassword ? ORANGE : '#E8E5DC'}`,
              backgroundColor: focusedPassword ? '#FFFAF7' : '#FAFAF8',
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
            disabled={loading || !email || !password}
            style={{
              width: '100%',
              padding: '15px',
              borderRadius: 14,
              backgroundColor: loading || !email || !password ? '#C5C0B8' : GREEN,
              color: 'white',
              fontWeight: 700,
              fontSize: 15,
              cursor: loading || !email || !password ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s',
              marginTop: 20,
              border: 'none',
              letterSpacing: '0.01em',
            }}
          >
            {loading ? 'Logowanie...' : 'Zaloguj się →'}
          </button>
        </form>

        <p style={{
          textAlign: 'center',
          fontSize: 12,
          color: '#9CA8A5',
          marginTop: 36,
          lineHeight: 1.6,
        }}>
          Dostęp tylko dla zweryfikowanych właścicieli lokali.
        </p>
      </div>
    </div>
  );
}
