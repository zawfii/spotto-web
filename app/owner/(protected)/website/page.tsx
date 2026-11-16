'use client';

import { useCallback, useEffect, useState } from 'react';
import { useOwnerVenue } from '@/lib/owner-client';
import { Card, CardTitle, Eyebrow, Loading, PageHeader, inputCls, labelCls } from '@/components/owner/ui';
import {
  SETUP_FEE, WEBSITE_PACKAGES, isValidSlug, quote, slugify, zl,
  type WebsiteBilling, type WebsitePackage,
} from '@/lib/website-packages';

type WebsiteRequest = {
  id: string;
  package: WebsitePackage;
  billing: WebsiteBilling;
  slug: string;
  status: 'pending' | 'approved' | 'rejected' | 'done';
  admin_note: string | null;
  created_at: string;
};

const SOON = [
  ['System rezerwacji', 'Goście zarezerwują stolik prosto ze strony.'],
  ['Zamówienia online', 'Zamawianie z Twojego menu bez wychodzenia ze strony.'],
];

const optionCls = (on: boolean) =>
  `flex cursor-pointer gap-3 rounded-2xl border-2 bg-spoot-input p-4 ${on ? 'border-spoot-ink' : 'border-transparent hover:border-spoot-line'}`;

const pkgLabel = (id: WebsitePackage) => WEBSITE_PACKAGES.find(p => p.id === id)?.label ?? id;

export default function WebsitePage() {
  const { supabase, userId, venue, place, loading: venueLoading } = useOwnerVenue();
  const [requests, setRequests] = useState<WebsiteRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [billing, setBilling] = useState<WebsiteBilling>('yearly');
  const [pkg, setPkg] = useState<WebsitePackage>('plus');
  const [slug, setSlug] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase
      .from('website_requests')
      .select('id, package, billing, slug, status, admin_note, created_at')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);
    setRequests((data as WebsiteRequest[]) ?? []);
    setLoading(false);
  }, [supabase, userId]);

  useEffect(() => { load(); }, [load]);

  // Podpowiedzi: adres z nazwy lokalu, telefon podany przy rejestracji.
  useEffect(() => { if (place?.name) setSlug(s => s || slugify(place.name)); }, [place?.name]);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const p = data.user?.user_metadata?.phone;
      if (typeof p === 'string') setPhone(v => v || p);
    });
  }, [supabase]);

  const q = quote(pkg, billing);
  const custom = q === null;
  const slugOk = isValidSlug(slug);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!venue || !userId) return;
    if (!slugOk) { setError('Adres: 3–40 znaków, małe litery, cyfry i myślniki między słowami.'); return; }
    setSubmitting(true);
    setError('');
    const { error } = await supabase.from('website_requests').insert({
      owner_id: userId,
      place_id: venue.place_id,
      package: pkg,
      billing,
      slug,
      phone: phone.trim() || null,
    });
    setSubmitting(false);
    if (error) { setError('Nie udało się wysłać prośby. Spróbuj ponownie.'); return; }
    load();
  }

  if (venueLoading || loading) return <Loading />;

  const header = (
    <PageHeader
      eyebrow="Strona dla lokalu"
      title="Zamów stronę swojego lokalu"
      sub={<>Robimy ją za Ciebie i uruchamiamy pod adresem <strong className="text-spoot-ink">spootme.pl/{slug || 'twoj-lokal'}</strong>. Menu, godziny i zdjęcia bierzemy z profilu w Spoot — zmieniasz raz, aktualne jest wszędzie.</>}
    />
  );

  const live = requests.find(r => r.status !== 'rejected');
  const lastRejected = requests[0]?.status === 'rejected' ? requests[0] : null;

  if (live) {
    const title = { pending: 'Oczekuje na potwierdzenie', approved: 'Strona w przygotowaniu', done: 'Strona działa', rejected: '' }[live.status];
    return (
      <>
        {header}
        <section className="flex max-w-2xl flex-col gap-3 rounded-3xl bg-spoot-green p-6 text-white">
          <Eyebrow className="text-white/80">{live.status === 'pending' ? 'Prośba w toku' : 'Twoja strona'}</Eyebrow>
          <h2 className="font-display text-[22px] font-bold leading-7">{title}</h2>
          <p className="text-white/80">
            {pkgLabel(live.package)} · {live.billing === 'yearly' ? '12 miesięcy z góry' : 'co miesiąc'} · spootme.pl/{live.slug}.
            {live.status === 'pending' && ' Odezwiemy się na Twój e-mail lub telefon, żeby ustalić szczegóły i płatność.'}
          </p>
          {live.status === 'done' && (
            <a href={`https://spootme.pl/${live.slug}`} target="_blank" rel="noreferrer" className="self-start rounded-2xl bg-spoot-orange px-5 py-3 font-display font-bold text-spoot-ink hover:opacity-90">
              Otwórz stronę
            </a>
          )}
        </section>
      </>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-6">
      {header}
      {lastRejected && (
        <p role="status" className="rounded-2xl bg-spoot-tint p-4">
          Poprzednia prośba nie została zatwierdzona{lastRejected.admin_note ? `: ${lastRejected.admin_note}` : '.'} Możesz wysłać nową.
        </p>
      )}

      <div className="flex flex-wrap items-start gap-6">
        <div className="flex min-w-0 flex-[2_1_480px] flex-col gap-6">
          <Card>
            <fieldset className="flex flex-col gap-3">
              <legend className="pb-3"><CardTitle>Jak chcesz płacić</CardTitle></legend>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-3">
                {([
                  ['yearly', '12 miesięcy, z góry', `Stworzenie strony ${zl(SETUP_FEE.yearly)}. Płacisz raz za cały rok.`],
                  ['monthly', 'Co miesiąc', `Stworzenie strony ${zl(SETUP_FEE.monthly)}. Odnawia się co miesiąc, bez zobowiązania.`],
                ] as const).map(([id, label, desc]) => (
                  <label key={id} className={optionCls(billing === id)}>
                    <input type="radio" name="billing" checked={billing === id} onChange={() => setBilling(id)} className="mt-0.5 h-5 w-5 shrink-0 accent-spoot-ink" />
                    <span className="flex flex-col gap-0.5">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="font-display font-bold">{label}</span>
                        {id === 'yearly' && <span className="rounded-full bg-spoot-orange px-2 py-0.5 font-display text-[10px] font-bold tracking-[0.5px]">TANIEJ</span>}
                      </span>
                      <span className="text-[13px] text-spoot-ink2">{desc}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          </Card>

          <Card>
            <fieldset className="flex flex-col gap-3">
              <legend className="pb-3"><CardTitle>Wybierz pakiet</CardTitle></legend>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
                {WEBSITE_PACKAGES.map(p => (
                  <label key={p.id} className={`${optionCls(pkg === p.id)} flex-col`}>
                    <span className="flex items-center gap-2">
                      <input type="radio" name="package" checked={pkg === p.id} onChange={() => setPkg(p.id)} className="h-5 w-5 accent-spoot-ink" />
                      <span className="grow font-display text-base font-bold">{p.label}</span>
                      {p.id === 'plus' && <span className="rounded-full bg-spoot-orange px-2 py-0.5 font-display text-[10px] font-bold tracking-[0.5px]">POLECANY</span>}
                    </span>
                    <span className="flex flex-col">
                      <span className="font-display text-[26px] font-bold leading-[34px]">{p.monthly ? zl(p.monthly[billing]) : 'Wycena'}</span>
                      <span className="text-xs text-spoot-ink2">
                        {!p.monthly ? 'indywidualna, po rozmowie' : billing === 'yearly' ? 'netto / mies., płatne z góry za 12 miesięcy' : 'netto / miesiąc'}
                      </span>
                    </span>
                    <ul className="flex flex-col gap-1.5 text-[13px] text-spoot-ink2">
                      {p.features.map(f => <li key={f}>{f}</li>)}
                    </ul>
                  </label>
                ))}
              </div>
              <span className="text-xs text-spoot-ink2">Ceny netto, doliczamy 23% VAT.</span>
            </fieldset>
          </Card>

          <Card className="flex flex-col gap-3">
            <CardTitle>Adres i kontakt</CardTitle>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
              <label className={labelCls}>
                Adres strony
                <span className="flex items-center gap-1.5">
                  <span className="font-body text-sm font-normal normal-case tracking-normal text-spoot-ink2">spootme.pl/</span>
                  <input
                    value={slug}
                    onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                    required maxLength={40} aria-invalid={slug !== '' && !slugOk}
                    className={inputCls}
                  />
                </span>
              </label>
              <label className={labelCls}>
                Telefon do kontaktu
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} maxLength={30} placeholder="np. 600 100 200" className={inputCls} />
              </label>
            </div>
            <span className="text-xs text-spoot-ink2">Adres potwierdzimy przed uruchomieniem strony — jeśli będzie zajęty, zaproponujemy inny.</span>
          </Card>

          <Card className="flex flex-col gap-3">
            <div className="flex flex-col gap-0.5">
              <CardTitle>Wkrótce</CardTitle>
              <span className="text-[13px] text-spoot-ink2">Dołożymy to do Twojej strony, gdy będzie gotowe.</span>
            </div>
            <ul className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-3">
              {SOON.map(([title, text]) => (
                <li key={title} className="flex flex-col gap-1.5 rounded-2xl bg-spoot-input p-4">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="grow font-display font-bold">{title}</span>
                    <span className="rounded-full bg-spoot-chip px-2 py-0.5 font-display text-[10px] font-bold tracking-[0.5px]">WKRÓTCE</span>
                  </span>
                  <span className="text-[13px] text-spoot-ink2">{text}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <section className="flex min-w-0 flex-[1_1_320px] flex-col gap-4 rounded-3xl bg-spoot-green p-6 text-white">
          <h2 className="font-display text-lg font-bold">Twoja prośba</h2>
          <dl className="flex flex-col">
            {([
              ['Lokal', place?.name ?? '—'],
              ['Pakiet', pkgLabel(pkg)],
              ...(q ? [
                ['Adres', `spootme.pl/${slug || '…'}`],
                ['Stworzenie strony', zl(q.setup)],
                ['Abonament', billing === 'yearly' ? `${zl(12 * q.monthly)} (12 × ${zl(q.monthly)})` : `${zl(q.monthly)} / mies.`],
              ] : [['Cena', 'Wycena indywidualna']]),
            ] as [string, string][]).map(([k, v]) => (
              <div key={k} className="flex gap-3 border-t border-white/50 py-3">
                <dt className="grow text-white/80">{k}</dt>
                <dd className="break-all text-right font-display font-bold">{v}</dd>
              </div>
            ))}
            {q && (
              <div className="flex items-baseline gap-3 border-t border-white/50 py-3">
                <dt className="grow text-white/80">Koszt na start, netto</dt>
                <dd className="font-display text-[32px] font-bold leading-10">{zl(q.dueNow)}</dd>
              </div>
            )}
          </dl>
          {q && billing === 'yearly' && (
            <p className="rounded-xl bg-white/15 px-3 py-2.5 text-[13px]">Oszczędzasz {zl(q.yearlySaving)} w pierwszym roku względem płatności co miesiąc.</p>
          )}
          {error && <p role="alert" className="rounded-xl bg-spoot-tint px-3 py-2.5 text-spoot-ink">{error}</p>}
          <button
            type="submit"
            disabled={submitting || !slug}
            className="h-12 rounded-2xl bg-spoot-orange font-display font-bold text-spoot-ink transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? 'Wysyłam…' : custom ? 'Poproś o wycenę' : 'Wyślij prośbę'}
          </button>
          <p className="text-xs text-white/80">Po wysłaniu prośba czeka na potwierdzenie. Odezwiemy się w sprawie szczegółów i płatności — online nic teraz nie płacisz.</p>
        </section>
      </div>
    </form>
  );
}
