'use client';

import { useEffect, useState } from 'react';
import { useSupabase } from '@/lib/owner-client';
import { inputCls, labelCls } from './ui';

/** „Wprowadzimy menu za Ciebie” — prośba trafia do admina (tabela menu_entry_requests). */
export default function MenuEntryRequest({ placeId }: { placeId: string }) {
  const supabase = useSupabase();
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'pending'>('idle');

  useEffect(() => {
    supabase.from('menu_entry_requests').select('id').eq('place_id', placeId).eq('status', 'pending').limit(1)
      .then(({ data }) => { if (data?.length) setState('pending'); });
  }, [supabase, placeId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!phone.trim() && !email.trim()) return;
    setState('sending');
    const { error } = await supabase.from('menu_entry_requests').insert({
      place_id: placeId,
      phone: phone.trim() || null,
      email: email.trim() || null,
    });
    if (error) { setState('idle'); alert('Nie udało się wysłać prośby. Spróbuj ponownie.'); return; }
    setState('sent');
  }

  const done = state === 'sent' || state === 'pending';

  return (
    <form onSubmit={submit} className="flex min-w-0 flex-[1_1_400px] flex-col gap-3 rounded-2xl bg-spoot-green p-5 text-white">
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-lg font-bold">Wprowadzimy menu za Ciebie</h2>
        <p className="text-white/80">
          {done
            ? 'Mamy Twoją prośbę. Odezwiemy się, poprosimy o zdjęcie albo PDF karty i dodamy dania sami.'
            : 'Nie masz czasu przepisywać karty? Zostaw telefon albo e-mail. Odezwiemy się, poprosimy o zdjęcie lub PDF karty i dodamy dania sami.'}
        </p>
      </div>
      {!done && (
        <>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3">
            <label className={labelCls}>
              Telefon
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} maxLength={30} placeholder="np. 600 100 200" className={`${inputCls} border-0`} />
            </label>
            <label className={labelCls}>
              Albo e-mail
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} maxLength={200} placeholder="np. kontakt@twojlokal.pl" className={`${inputCls} border-0`} />
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={state === 'sending' || (!phone.trim() && !email.trim())}
              className="h-11 rounded-2xl bg-spoot-orange px-5 font-display font-bold text-spoot-ink hover:opacity-90 disabled:opacity-50"
            >
              {state === 'sending' ? 'Wysyłam…' : 'Poproś o dodanie menu'}
            </button>
            <span className="flex-[1_1_200px] text-xs text-white/80">Wystarczy jedno z dwóch. Prośba trafia prosto do zespołu Spoot.</span>
          </div>
        </>
      )}
    </form>
  );
}
