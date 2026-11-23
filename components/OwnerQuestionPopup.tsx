'use client';

import { useEffect, useState } from 'react';
import { useSupabase } from '@/lib/owner-client';
import { OWNER_CONTACT_EMAIL, OWNER_CONTACT_PHONE } from '@/lib/contact';
import { inputCls, labelCls } from '@/components/owner/ui';

const CLOSED_KEY = 'spoot-pytanie-zamkniete';
const TEL = `tel:${OWNER_CONTACT_PHONE.replace(/\s/g, '')}`;
const BTN = 'inline-flex min-h-[44px] items-center justify-center rounded-full px-5 font-display text-sm font-bold transition-opacity hover:opacity-90 disabled:opacity-50';
const LINK = 'font-display font-bold underline underline-offset-4';

/**
 * Karta „Masz pytanie?” na stronie dla restauracji: wysuwa się w rogu po chwili albo po przewinięciu.
 * Pytanie zapisuje funkcja ask_owner_question (bez konta) — admin dostaje push i widzi je w spoot-admin.
 * Numer telefonu pokazujemy dopiero po kliknięciu albo po wysłaniu pytania, nie w treści strony.
 */
export default function OwnerQuestionPopup() {
  const supabase = useSupabase();
  const [shown, setShown] = useState(false);
  const [closed, setClosed] = useState(false);
  const [step, setStep] = useState<'start' | 'form' | 'sending' | 'sent'>('start');
  const [phoneVisible, setPhoneVisible] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(CLOSED_KEY)) { setClosed(true); return; }
    } catch { /* tryb prywatny: karta po prostu pokaże się znowu */ }
    const timer = setTimeout(() => setShown(true), 8000);
    const onScroll = () => { if (window.scrollY > 600) setShown(true); };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { clearTimeout(timer); window.removeEventListener('scroll', onScroll); };
  }, []);

  // Po zamknięciu i po wysłaniu pytania karta nie wraca w tej wizycie.
  function remember() {
    try { sessionStorage.setItem(CLOSED_KEY, '1'); } catch { /* jak wyżej */ }
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setFailed(false);
    // Pole-pułapka: człowiek go nie widzi, bot wypełnia. Udajemy sukces, nic nie wysyłamy.
    if (!f.get('website')) {
      setStep('sending');
      const { error } = await supabase.rpc('ask_owner_question', {
        p_name: f.get('name'),
        p_phone: f.get('phone'),
        p_message: f.get('message'),
      });
      if (error) { setStep('form'); setFailed(true); return; }
    }
    remember();
    setStep('sent');
  }

  if (closed) return null;
  const phone = <a href={TEL} className={`${LINK} whitespace-nowrap`}>{OWNER_CONTACT_PHONE}</a>;

  return (
    <aside
      aria-label="Masz pytanie? Kontakt ze Spoot"
      className={`fixed inset-x-3 bottom-3 z-50 flex max-h-[calc(100dvh-24px)] flex-col gap-3 overflow-y-auto rounded-3xl bg-spoot-green p-5 text-white shadow-[0_16px_48px_rgba(3,39,26,0.35)] ring-1 ring-white/20 motion-safe:transition-[transform,opacity,visibility] motion-safe:duration-300 sm:inset-x-auto sm:bottom-4 sm:right-4 sm:w-[360px] ${shown ? 'visible translate-y-0 opacity-100' : 'invisible translate-y-6 opacity-0'}`}
    >
      <button
        type="button"
        aria-label="Zamknij"
        onClick={() => { remember(); setClosed(true); }}
        className="absolute right-1.5 top-1.5 flex h-11 w-11 items-center justify-center rounded-full hover:bg-white/15"
      >
        <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
      </button>

      {step === 'sent' ? (
        <div role="status" className="flex flex-col gap-1 pr-9">
          <h2 className="font-display text-xl font-bold">Dziękujemy!</h2>
          <p className="text-white/85">Oddzwonimy w ciągu 1 dnia roboczego. Pilne? Zadzwoń: {phone}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-1 pr-9">
          <h2 className="font-display text-xl font-bold">Masz pytanie?</h2>
          <p className="text-white/85">Zostaw numer — oddzwonimy w ciągu 1 dnia roboczego. Możesz też zadzwonić od razu.</p>
        </div>
      )}

      {step === 'start' && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <button type="button" onClick={() => setStep('form')} className={`${BTN} bg-spoot-orange text-spoot-ink`}>Zostaw numer</button>
          {phoneVisible
            ? phone
            : <button type="button" onClick={() => setPhoneVisible(true)} className={`${BTN} border-[1.5px] border-white`}>Pokaż numer</button>}
        </div>
      )}

      {(step === 'form' || step === 'sending') && (
        <form onSubmit={submit} className="flex flex-col gap-3">
          <label className={labelCls}>
            Imię
            <input name="name" required maxLength={80} autoComplete="given-name" className={`${inputCls} border-0`} />
          </label>
          <label className={labelCls}>
            Telefon
            <input name="phone" type="tel" required minLength={6} maxLength={30} pattern="[0-9+ \(\)\-]{6,30}" title="Numer telefonu, np. 600 100 200" autoComplete="tel" placeholder="np. 600 100 200" className={`${inputCls} border-0`} />
          </label>
          <label className={labelCls}>
            Pytanie (możesz pominąć)
            <textarea name="message" maxLength={1000} rows={3} placeholder="np. Ile kosztują pieczątki po pierwszym roku?" className={`${inputCls} !h-24 resize-none border-0 py-2.5`} />
          </label>
          <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 opacity-0" />
          {failed && (
            <p role="alert" className="rounded-xl bg-white/15 px-3 py-2 text-sm">
              Nie udało się wysłać. Spróbuj ponownie albo napisz: <a href={`mailto:${OWNER_CONTACT_EMAIL}`} className={LINK}>{OWNER_CONTACT_EMAIL}</a>
            </p>
          )}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <button type="submit" disabled={step === 'sending'} className={`${BTN} bg-spoot-orange text-spoot-ink`}>
              {step === 'sending' ? 'Wysyłam…' : 'Wyślij pytanie'}
            </button>
            {phoneVisible
              ? phone
              : <button type="button" onClick={() => setPhoneVisible(true)} className="min-h-[44px] font-display text-sm font-bold underline underline-offset-4">Wolę zadzwonić</button>}
          </div>
          <p className="text-xs text-white/80">
            Zadzwonimy tylko w sprawie Twojego pytania. <a href="/polityka-prywatnosci" target="_blank" rel="noopener" className="underline">Polityka prywatności</a>
          </p>
        </form>
      )}
    </aside>
  );
}
