'use client';

import { useEffect, useState } from 'react';
import { useSupabase } from '@/lib/owner-client';
import { OWNER_CONTACT_EMAIL, OWNER_CONTACT_PHONE } from '@/lib/contact';
import { inputCls, labelCls } from '@/components/owner/ui';

const CLOSED_KEY = 'spoot-pytanie-zamkniete';
const TEL = `tel:${OWNER_CONTACT_PHONE.replace(/\s/g, '')}`;
const BTN = 'inline-flex min-h-[44px] items-center justify-center rounded-full px-5 font-display text-sm font-bold transition-opacity hover:opacity-90 disabled:opacity-50';
const LINK = 'font-display font-bold underline underline-offset-4';

const COPY = {
  pl: {
    aside: 'Masz pytanie? Kontakt ze Spoot', close: 'Zamknij',
    thanks: 'Dziękujemy!', callBack: 'Oddzwonimy w ciągu 1 dnia roboczego. Pilne? Zadzwoń:',
    title: 'Masz pytanie?', lead: 'Zostaw numer — oddzwonimy w ciągu 1 dnia roboczego. Możesz też zadzwonić od razu.',
    leaveNumber: 'Zostaw numer', showNumber: 'Pokaż numer',
    name: 'Imię', phone: 'Telefon', phoneTitle: 'Numer telefonu, np. 600 100 200', phonePlaceholder: 'np. 600 100 200',
    question: 'Pytanie (możesz pominąć)', questionPlaceholder: 'np. Ile kosztują pieczątki po pierwszym roku?',
    failed: 'Nie udało się wysłać. Spróbuj ponownie albo napisz:', sending: 'Wysyłam…', send: 'Wyślij pytanie', ratherCall: 'Wolę zadzwonić',
    onlyAbout: 'Zadzwonimy tylko w sprawie Twojego pytania.', privacy: 'Polityka prywatności',
  },
  en: {
    aside: 'Got a question? Contact Spoot', close: 'Close',
    thanks: 'Thank you!', callBack: "We'll call you back within 1 business day. Urgent? Call:",
    title: 'Got a question?', lead: "Leave your number and we'll call you back within 1 business day. Or give us a call right away.",
    leaveNumber: 'Leave your number', showNumber: 'Show number',
    name: 'First name', phone: 'Phone', phoneTitle: 'Phone number, e.g. +48 600 100 200', phonePlaceholder: 'e.g. +48 600 100 200',
    question: 'Question (optional)', questionPlaceholder: 'e.g. How much are loyalty stamps after the first year?',
    failed: "Couldn't send it. Try again or email us:", sending: 'Sending…', send: 'Send question', ratherCall: "I'd rather call",
    onlyAbout: "We'll only call you about your question.", privacy: 'Privacy policy (in Polish)',
  },
};

/**
 * Karta „Masz pytanie?” na stronie dla restauracji: wysuwa się w rogu po chwili albo po przewinięciu.
 * Pytanie zapisuje funkcja ask_owner_question (bez konta) — admin dostaje push i widzi je w spoot-admin.
 * Numer telefonu pokazujemy dopiero po kliknięciu albo po wysłaniu pytania, nie w treści strony.
 */
export default function OwnerQuestionPopup({ lang = 'pl' }: { lang?: keyof typeof COPY }) {
  const t = COPY[lang];
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
      aria-label={t.aside}
      className={`fixed inset-x-3 bottom-3 z-50 flex max-h-[calc(100dvh-24px)] flex-col gap-3 overflow-y-auto rounded-3xl bg-spoot-green p-5 text-white shadow-[0_16px_48px_rgba(3,39,26,0.35)] ring-1 ring-white/20 motion-safe:transition-[transform,opacity,visibility] motion-safe:duration-300 sm:inset-x-auto sm:bottom-4 sm:right-4 sm:w-[360px] ${shown ? 'visible translate-y-0 opacity-100' : 'invisible translate-y-6 opacity-0'}`}
    >
      <button
        type="button"
        aria-label={t.close}
        onClick={() => { remember(); setClosed(true); }}
        className="absolute right-1.5 top-1.5 flex h-11 w-11 items-center justify-center rounded-full hover:bg-white/15"
      >
        <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
      </button>

      {step === 'sent' ? (
        <div role="status" className="flex flex-col gap-1 pr-9">
          <h2 className="font-display text-xl font-bold">{t.thanks}</h2>
          <p className="text-white/85">{t.callBack} {phone}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-1 pr-9">
          <h2 className="font-display text-xl font-bold">{t.title}</h2>
          <p className="text-white/85">{t.lead}</p>
        </div>
      )}

      {step === 'start' && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <button type="button" onClick={() => setStep('form')} className={`${BTN} bg-spoot-orange text-spoot-ink`}>{t.leaveNumber}</button>
          {phoneVisible
            ? phone
            : <button type="button" onClick={() => setPhoneVisible(true)} className={`${BTN} shadow-[inset_0_0_0_1.5px_#fff]`}>{t.showNumber}</button>}
        </div>
      )}

      {(step === 'form' || step === 'sending') && (
        <form onSubmit={submit} className="flex flex-col gap-3">
          <label className={labelCls}>
            {t.name}
            <input name="name" required maxLength={80} autoComplete="given-name" className={`${inputCls} border-0`} />
          </label>
          <label className={labelCls}>
            {t.phone}
            <input name="phone" type="tel" required minLength={6} maxLength={30} pattern="[0-9+ \(\)\-]{6,30}" title={t.phoneTitle} autoComplete="tel" placeholder={t.phonePlaceholder} className={`${inputCls} border-0`} />
          </label>
          <label className={labelCls}>
            {t.question}
            <textarea name="message" maxLength={1000} rows={3} placeholder={t.questionPlaceholder} className={`${inputCls} !h-24 resize-none border-0 py-2.5`} />
          </label>
          <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 opacity-0" />
          {failed && (
            <p role="alert" className="rounded-xl bg-white/15 px-3 py-2 text-sm">
              {t.failed} <a href={`mailto:${OWNER_CONTACT_EMAIL}`} className={LINK}>{OWNER_CONTACT_EMAIL}</a>
            </p>
          )}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <button type="submit" disabled={step === 'sending'} className={`${BTN} bg-spoot-orange text-spoot-ink`}>
              {step === 'sending' ? t.sending : t.send}
            </button>
            {phoneVisible
              ? phone
              : <button type="button" onClick={() => setPhoneVisible(true)} className="min-h-[44px] font-display text-sm font-bold underline underline-offset-4">{t.ratherCall}</button>}
          </div>
          <p className="text-xs text-white/80">
            {t.onlyAbout} <a href="/polityka-prywatnosci" target="_blank" rel="noopener" className="underline">{t.privacy}</a>
          </p>
        </form>
      )}
    </aside>
  );
}
