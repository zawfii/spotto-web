'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from '@/lib/owner-client';
import { Btn, inputCls, labelCls } from './ui';

type PlaceResult = { id: string; name: string; category: string | null; city: string | null; district: string | null };

// Najczęstsze kategorie w places; admin może je potem doprecyzować.
const CATEGORIES = ['Restauracja', 'Kawiarnia', 'Bar', 'Pub', 'Piekarnia', 'Cukiernia', 'Pizza', 'Burgery', 'Kebab', 'Sushi', 'Lody', 'Polska Kuchnia', 'Inne'];

/** Zgłoszenie lokalu — jak app/claim-venue.tsx w aplikacji (tabela ownership_requests, akceptuje admin).
 *  Gdy lokalu nie ma w bazie, właściciel dodaje go (places, status pending) i od razu go zgłasza. */
export default function ClaimVenue({ userId, defaultPhone }: { userId: string; defaultPhone: string }) {
  const supabase = useSupabase();
  const router = useRouter();
  const [mode, setMode] = useState<'search' | 'new'>('search');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<PlaceResult | null>(null);
  const [newName, setNewName] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newCategory, setNewCategory] = useState('Restauracja');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState(defaultPhone);
  const [nip, setNip] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const latest = useRef('');

  useEffect(() => {
    const text = query.trim();
    latest.current = text;
    if (mode !== 'search' || selected || text.length < 2) { setResults([]); setSearching(false); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      const pattern = `%${text.replace(/[%_\\]/g, m => `\\${m}`)}%`;
      const { data } = await supabase
        .from('places')
        .select('id, name, category, city, district')
        .ilike('name', pattern)
        .limit(10);
      if (latest.current !== text) return;
      setResults((data as PlaceResult[]) ?? []);
      setSearching(false);
    }, 250);
    return () => clearTimeout(t);
  }, [query, selected, mode, supabase]);

  function startNew() {
    setMode('new');
    setNewName(query.trim());
    setSelected(null);
    setError('');
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const cleanPhone = phone.replace(/\s/g, '');
    const cleanNip = nip.replace(/\D/g, '');
    if (mode === 'new' && (!newName.trim() || !newAddress.trim() || !newCity.trim())) { setError('Podaj nazwę, adres i miasto lokalu.'); return; }
    if (!fullName.trim()) { setError('Wpisz imię i nazwisko.'); return; }
    if (cleanPhone.replace(/\D/g, '').length < 9) { setError('Wpisz poprawny numer telefonu.'); return; }
    if (cleanNip.length !== 10) { setError('NIP musi mieć 10 cyfr.'); return; }
    setSubmitting(true);
    setError('');

    let placeId = selected?.id;
    if (mode === 'new') {
      // Nowy lokal czeka na zatwierdzenie (polityka „places: authenticated insert pending”).
      const { data, error } = await supabase
        .from('places')
        .insert({
          name: newName.trim(),
          address: newAddress.trim(),
          city: newCity.trim(),
          category: newCategory,
          status: 'pending',
        })
        .select('id')
        .single();
      if (error || !data) { setSubmitting(false); setError('Nie udało się dodać lokalu. Spróbuj ponownie.'); return; }
      placeId = data.id;
    }
    if (!placeId) { setSubmitting(false); return; }

    const { error } = await supabase.from('ownership_requests').insert({
      user_id: userId,
      place_id: placeId,
      full_name: fullName.trim(),
      phone: cleanPhone,
      nip: cleanNip,
      message: message.trim() || null,
    });
    setSubmitting(false);
    if (error) {
      setError(error.code === '23505' ? 'Prośba dla tego lokalu już została wysłana.' : 'Nie udało się wysłać zgłoszenia. Spróbuj ponownie.');
      return;
    }
    router.refresh();
  }

  const meta = (p: PlaceResult) => [p.category, p.district, p.city].filter(Boolean).join(' · ');
  const ready = mode === 'new' || selected;
  const linkCls = 'self-start py-2 font-display text-[13px] font-bold underline underline-offset-4';

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      {mode === 'search' ? (
        <div className="flex flex-col gap-1.5">
          <label className={labelCls}>
            Twój lokal
            <input
              value={query}
              onChange={e => { setQuery(e.target.value); setSelected(null); }}
              placeholder="Wpisz nazwę lokalu…"
              autoComplete="off"
              role="combobox"
              aria-expanded={results.length > 0}
              aria-controls="claim-results"
              className={inputCls}
            />
          </label>
          {selected && <span className="text-xs text-spoot-ink2">{meta(selected)}</span>}
          {searching && !selected && <span role="status" className="text-xs text-spoot-ink2">Szukam…</span>}
          {!searching && !selected && query.trim().length >= 2 && results.length === 0 && (
            <span className="text-xs text-spoot-ink2">Nic nie znaleziono.</span>
          )}
          {results.length > 0 && (
            <ul id="claim-results" role="listbox" className="flex max-h-72 flex-col overflow-y-auto rounded-xl border border-spoot-line bg-spoot-input">
              {results.map(p => (
                <li key={p.id} role="option" aria-selected={false}>
                  <button
                    type="button"
                    onClick={() => { setSelected(p); setQuery(p.name); setResults([]); }}
                    className="flex w-full flex-col items-start gap-0.5 border-b border-spoot-line px-3.5 py-2.5 text-left last:border-0 hover:bg-spoot-card"
                  >
                    <span className="font-display font-bold">{p.name}</span>
                    {meta(p) && <span className="text-xs text-spoot-ink2">{meta(p)}</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {!selected && (
            <button type="button" onClick={startNew} className={linkCls}>Nie ma mojego lokalu — dodaj go</button>
          )}
        </div>
      ) : (
        <fieldset className="flex flex-col gap-3">
          <legend className="pb-1 font-display text-base font-bold">Nowy lokal</legend>
          <p className="text-[13px] text-spoot-ink2">Dodamy go do Spoot po weryfikacji — razem z Twoim zgłoszeniem.</p>
          <label className={labelCls}>
            Nazwa lokalu
            <input value={newName} onChange={e => setNewName(e.target.value)} required maxLength={120} className={inputCls} />
          </label>
          <label className={labelCls}>
            Adres
            <input value={newAddress} onChange={e => setNewAddress(e.target.value)} required maxLength={200} autoComplete="street-address" placeholder="np. ul. Puławska 12" className={inputCls} />
          </label>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3">
            <label className={labelCls}>
              Miasto
              <input value={newCity} onChange={e => setNewCity(e.target.value)} required maxLength={80} autoComplete="address-level2" placeholder="np. Warszawa" className={inputCls} />
            </label>
            <label className={labelCls}>
              Rodzaj lokalu
              <select value={newCategory} onChange={e => setNewCategory(e.target.value)} className={inputCls}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </label>
          </div>
          <button type="button" onClick={() => { setMode('search'); setError(''); }} className={linkCls}>Wróć do wyszukiwania</button>
        </fieldset>
      )}

      {ready && (
        <>
          <label className={labelCls}>
            Imię i nazwisko
            <input value={fullName} onChange={e => setFullName(e.target.value)} required maxLength={100} autoComplete="name" className={inputCls} />
          </label>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3">
            <label className={labelCls}>
              Telefon
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} required maxLength={30} autoComplete="tel" className={inputCls} />
            </label>
            <label className={labelCls}>
              NIP
              <input value={nip} onChange={e => setNip(e.target.value)} required inputMode="numeric" maxLength={13} placeholder="10 cyfr" className={inputCls} />
            </label>
          </div>
          <label className={labelCls}>
            Wiadomość (opcjonalnie)
            <textarea value={message} onChange={e => setMessage(e.target.value)} maxLength={500} rows={3} className={`${inputCls} h-auto py-2.5`} />
          </label>
          {error && <p role="alert" className="text-spoot-danger">{error}</p>}
          <Btn type="submit" disabled={submitting}>{submitting ? 'Wysyłam…' : mode === 'new' ? 'Dodaj lokal i wyślij zgłoszenie' : 'Wyślij zgłoszenie'}</Btn>
          <p className="text-xs text-spoot-ink2">Zgłoszenie sprawdzamy ręcznie — po akceptacji panel otworzy się na tym koncie.</p>
        </>
      )}
    </form>
  );
}
