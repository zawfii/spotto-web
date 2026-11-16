// app/owner/register/page.tsx
'use client';

import { useState } from 'react';
import { useSupabase } from '@/lib/owner-client';
import { Wordmark } from '@/components/SpootLogo';
import { Btn, inputCls, labelCls } from '@/components/owner/ui';

// Nick jak w profilach Spoot (handle_new_user zostawia tylko a-z, 0-9 i _, do 20 znaków).
const NICK_RE = /^[a-z0-9_]{3,20}$/;

const PERKS = [
  ['Menu i profil lokalu', 'Dania, ceny, alergeny, zdjęcia i godziny.'],
  ['Oferty i pieczątki', 'Oferty dnia i karta lojalnościowa dla stałych gości.'],
  ['Strona dla lokalu', 'Opcja w panelu: gotowa strona pod adresem spootme.pl/twoj-lokal.'],
];

export default function OwnerRegisterPage() {
  const supabase = useSupabase();
  const [nick, setNick] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const phoneDigits = phone.replace(/\D/g, '');
  const nickOk = NICK_RE.test(nick);
  const phoneOk = phoneDigits.length >= 9 && phoneDigits.length <= 15;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nickOk) { setError('Nick: 3–20 znaków, tylko małe litery, cyfry i podkreślnik.'); return; }
    if (!phoneOk) { setError('Podaj numer telefonu (9–15 cyfr).'); return; }
    setLoading(true);
    setError('');
    // Bez hasła: link na e-mail zakłada konto. Nick i telefon trafiają do metadanych konta
    // (nick → profiles.username przez handle_new_user; telefon zostaje prywatny).
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        shouldCreateUser: true,
        data: { username: nick, display_name: nick, phone: phone.trim() },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setLoading(false);
    if (error) {
      setError(error.status === 429
        ? 'Za dużo prób. Spróbuj ponownie za kilka minut.'
        : 'Nie udało się wysłać linku. Sprawdź adres e-mail.');
      return;
    }
    setSent(true);
  }

  return (
    <div className="flex min-h-screen flex-wrap bg-spoot-surface">
      <aside className="flex min-w-0 flex-[1_1_420px] flex-col gap-10 bg-spoot-ink px-6 py-10 text-white sm:px-14">
        <div className="flex flex-col gap-1.5">
          <Wordmark size={26} color="#ffffff" />
          <span className="font-display text-[10px] font-bold tracking-[1.5px] text-white/80">DLA RESTAURACJI</span>
        </div>
        <div className="my-auto flex max-w-[440px] flex-col gap-6">
          <h1 className="font-display text-[32px] font-bold leading-10 sm:text-[40px] sm:leading-[48px]">Twój lokal w Spoot, pod Twoją kontrolą</h1>
          <ul className="flex flex-col">
            {PERKS.map(([title, text]) => (
              <li key={title} className="flex flex-col gap-0.5 border-t border-white/50 py-3.5">
                <span className="font-display font-bold">{title}</span>
                <span className="text-white/80">{text}</span>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <main className="flex min-w-0 flex-[999_1_480px] items-center justify-center px-4 py-10 sm:px-14">
        <div className="flex w-full max-w-[420px] flex-col gap-4">
          {sent ? (
            <>
              <span className="font-display text-[11px] font-bold tracking-[0.5px]">PRAWIE GOTOWE</span>
              <h2 className="font-display text-[32px] font-bold leading-10">Sprawdź skrzynkę</h2>
              <p className="text-spoot-ink2">
                Link wysłaliśmy na <strong className="text-spoot-ink">{email}</strong>. Otwórz go na tym urządzeniu — konto założy się samo i wejdziesz do panelu.
              </p>
              <p className="text-spoot-ink2">
                W panelu wskażesz swój lokal. Po naszej akceptacji masz pełny dostęp — tutaj i w aplikacji Spoot, na tym samym e-mailu.
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
                <span className="font-display text-[11px] font-bold tracking-[0.5px]">REJESTRACJA</span>
                <h2 className="font-display text-[32px] font-bold leading-10">Załóż konto właściciela</h2>
                <p className="text-spoot-ink2">Trzy pola i gotowe. Bez hasła — logujesz się linkiem z e-maila. Potem wskażesz swój lokal, a my go zweryfikujemy.</p>
              </div>
              <form onSubmit={handleSubmit} className="flex flex-col gap-3" noValidate>
                <label className={labelCls}>
                  Nick
                  <input
                    value={nick}
                    onChange={e => setNick(e.target.value.toLowerCase().replace(/\s/g, '_'))}
                    required minLength={3} maxLength={20} autoComplete="username" placeholder="np. bistro_marta"
                    aria-invalid={nick !== '' && !nickOk}
                    className={inputCls}
                  />
                </label>
                <label className={labelCls}>
                  E-mail
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required maxLength={200} autoComplete="email" placeholder="ty@twojlokal.pl" className={inputCls} />
                </label>
                <label className={labelCls}>
                  Telefon
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} required maxLength={30} autoComplete="tel" placeholder="+48 600 000 000" className={inputCls} />
                </label>
                {error && <p role="alert" className="text-spoot-danger">{error}</p>}
                <Btn type="submit" disabled={loading || !nick || !email || !phone}>
                  {loading ? 'Wysyłam…' : 'Załóż konto'}
                </Btn>
              </form>
              <p className="text-xs text-spoot-ink2">
                Zakładając konto, akceptujesz <a href="https://spootme.pl/regulamin" className="underline underline-offset-2">regulamin</a> i <a href="https://spootme.pl/polityka-prywatnosci" className="underline underline-offset-2">politykę prywatności</a>.
              </p>
              <p className="border-t border-spoot-line pt-4 text-spoot-ink2">
                Masz już konto? <a href="login" className="font-semibold text-spoot-ink underline underline-offset-2">Zaloguj się</a>
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
