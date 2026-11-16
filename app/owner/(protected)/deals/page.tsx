'use client';

import { useCallback, useEffect, useState } from 'react';
import { useOwnerVenue } from '@/lib/owner-client';
import { DAYS, DISH_TYPE_LABELS, discountPercent, dishToTemplateKey, formatDealTime } from '@/lib/owner-deals';
import type { Deal, DayKey, DishTypeKey } from '@/lib/owner-deals';
import { formatPrice } from '@/lib/format';
import { Btn, Card, CardTitle, Eyebrow, Loading, PageHeader, inputCls, labelCls } from '@/components/owner/ui';

type Form = {
  editId: string | null;
  dishName: string;
  price: string;
  originalPrice: string;
  days: DayKey[];
  validUntil: string; // RRRR-MM-DD z <input type="date">
  startTime: string;
  endTime: string;
  dishType: DishTypeKey;
  dishTypeTouched: boolean; // dopóki właściciel nie wybierze, zgadujemy z nazwy dania
};

const EMPTY: Form = {
  editId: null, dishName: '', price: '', originalPrice: '', days: [], validUntil: '',
  startTime: '', endTime: '', dishType: 'inne', dishTypeTouched: false,
};

// Płatna promocja oferty jeszcze nie ruszyła: nowych próśb nie przyjmujemy,
// pokazujemy tylko status tych, które już są w bazie.
type DealPromotion = { id: string; deal_id: string; status: string; active_until: string | null };

const parsePrice = (s: string) => parseFloat(s.replace(',', '.'));
const toDbTime = (t: string) => (t ? `${t}:00` : null);
const dayShorts = (days: DayKey[]) => DAYS.filter(d => days.includes(d.key)).map(d => d.short).join(', ');

function StatusPill({ deal }: { deal: Deal }) {
  const expired = deal.valid_until && deal.valid_until < new Date().toISOString().slice(0, 10);
  const [text, cls] =
    deal.status === 'rejected' ? ['Odrzucona', 'bg-spoot-danger/10 text-spoot-danger']
      : deal.status === 'pending' ? ['Oczekuje', 'bg-spoot-tint']
        : expired ? ['Wygasła', 'bg-spoot-chip']
          : ['Aktywna', 'bg-[#2e7d32] text-white'];
  return <span className={`whitespace-nowrap rounded-full px-2.5 py-0.5 font-display text-[11px] font-bold ${cls}`}>{text}</span>;
}

export default function DealsPage() {
  const { supabase, userId, venue, loading: venueLoading } = useOwnerVenue();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Form>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [promos, setPromos] = useState<DealPromotion[]>([]);

  const load = useCallback(async () => {
    if (!venue) return;
    const [{ data }, { data: promoRows }] = await Promise.all([
      supabase
        .from('deals')
        .select('id, dish_name, price, original_price, days_of_week, valid_until, start_time, end_time, dish_category, status, source, admin_note, created_at')
        .eq('place_id', venue.place_id)
        .order('created_at', { ascending: false }),
      supabase
        .from('deal_promotions')
        .select('id, deal_id, status, active_until')
        .eq('place_id', venue.place_id)
        .order('created_at', { ascending: false }),
    ]);
    setDeals((data as Deal[]) ?? []);
    setPromos((promoRows as DealPromotion[]) ?? []);
    setLoading(false);
  }, [supabase, venue]);

  const promoFor = (dealId: string) => {
    const rows = promos.filter(p => p.deal_id === dealId);
    return rows.find(p => p.status === 'approved' && p.active_until && new Date(p.active_until) > new Date())
      ?? rows.find(p => p.status === 'pending');
  };

  useEffect(() => { load(); }, [load]);

  const submissions = deals.filter(d => d.status === 'pending' && d.source === 'user');
  const own = deals.filter(d => d.source !== 'user' || d.status === 'approved');

  function setName(dishName: string) {
    setForm(f => ({
      ...f,
      dishName,
      dishType: f.dishTypeTouched ? f.dishType : dishToTemplateKey(dishName) ?? 'inne',
    }));
  }

  function toggleDay(day: DayKey) {
    setForm(f => ({ ...f, days: f.days.includes(day) ? f.days.filter(d => d !== day) : [...f.days, day] }));
  }

  function edit(deal: Deal) {
    setForm({
      editId: deal.id,
      dishName: deal.dish_name,
      price: String(deal.price),
      originalPrice: deal.original_price != null ? String(deal.original_price) : '',
      days: deal.days_of_week,
      validUntil: deal.valid_until ?? '',
      startTime: deal.start_time?.slice(0, 5) ?? '',
      endTime: deal.end_time?.slice(0, 5) ?? '',
      dishType: deal.dish_category ?? 'inne',
      dishTypeTouched: true,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const price = parsePrice(form.price);
    const original = form.originalPrice.trim() ? parsePrice(form.originalPrice) : null;
    if (!venue || !userId || !form.dishName.trim() || isNaN(price) || form.days.length === 0) return;
    if (original !== null && isNaN(original)) return;

    const data = {
      dish_name: form.dishName.trim(),
      description: null,
      price,
      original_price: original,
      days_of_week: DAYS.map(d => d.key).filter(k => form.days.includes(k)),
      valid_until: form.validUntil || null,
      start_time: toDbTime(form.startTime),
      end_time: toDbTime(form.endTime),
      dish_category: form.dishType,
    };
    setSaving(true);
    const { error } = form.editId
      ? await supabase.from('deals').update(data).eq('id', form.editId)
      : await supabase.from('deals').insert({ ...data, place_id: venue.place_id, owner_id: userId, status: 'approved', source: 'owner' });
    setSaving(false);
    if (error) { alert('Nie udało się zapisać oferty. Spróbuj ponownie.'); return; }
    setForm(EMPTY);
    load();
  }

  async function remove(deal: Deal) {
    if (!confirm(`Usunąć ofertę „${deal.dish_name}”?`)) return;
    await supabase.from('deals').delete().eq('id', deal.id);
    if (form.editId === deal.id) setForm(EMPTY);
    load();
  }

  async function review(deal: Deal, status: 'approved' | 'rejected') {
    if (status === 'rejected' && !confirm('Na pewno odrzucić tę propozycję okazji?')) return;
    await supabase.from('deals').update({ status }).eq('id', deal.id).eq('status', 'pending');
    load();
  }

  if (venueLoading || (venue && loading)) return <Loading />;

  const canSave = form.dishName.trim() && form.price.trim() && form.days.length > 0 && !saving;

  return (
    <>
      <PageHeader
        eyebrow="Oferty"
        title="Oferty dnia"
        sub="Dania w niższej cenie w wybrane dni i godziny. Goście widzą je w Ofertach dnia i na profilu lokalu."
      />

      <div className="flex flex-wrap items-start gap-6">
        <div className="flex min-w-0 flex-[2_1_480px] flex-col gap-6">
          {submissions.map(deal => (
            <section key={deal.id} className="flex flex-wrap items-center gap-4 rounded-2xl bg-spoot-tint p-5">
              <div className="flex min-w-0 flex-[1_1_260px] flex-col gap-1">
                <Eyebrow>Zgłoszone przez gościa · oczekuje</Eyebrow>
                <span className="font-display text-lg font-bold">{deal.dish_name} — {formatPrice(deal.price)}</span>
                <span className="text-spoot-ink2">
                  {dayShorts(deal.days_of_week)}{formatDealTime(deal) ? ` · ${formatDealTime(deal)}` : ''}. Sprawdź, czy to się zgadza, zanim pokażemy ofertę gościom.
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Btn onClick={() => review(deal, 'approved')}>Zatwierdź</Btn>
                <Btn variant="outline" onClick={() => review(deal, 'rejected')}>Odrzuć</Btn>
              </div>
            </section>
          ))}

          <Card className="flex flex-col gap-3">
            <CardTitle>Twoje oferty</CardTitle>
            {own.length === 0 ? (
              <p className="text-spoot-ink2">Brak ofert. Dodaj pierwszą w formularzu obok.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[620px] border-collapse text-left">
                  <thead>
                    <tr className="font-display text-[11px] font-bold tracking-[0.5px]">
                      <th scope="col" className="py-2 pr-3">DANIE</th>
                      <th scope="col" className="px-3 py-2">KIEDY</th>
                      <th scope="col" className="px-3 py-2 text-right">CENA</th>
                      <th scope="col" className="px-3 py-2">STATUS</th>
                      <th scope="col" className="py-2 text-right">AKCJE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {own.map(deal => {
                      const pct = discountPercent(deal.price, deal.original_price);
                      return (
                        <tr key={deal.id} className={`border-t border-spoot-line ${form.editId === deal.id ? 'bg-spoot-input' : ''}`}>
                          <td className="py-3.5 pl-2 pr-3">
                            <div className="font-display font-bold">{deal.dish_name}</div>
                            <div className="text-xs text-spoot-ink2">
                              {DISH_TYPE_LABELS[deal.dish_category] ?? 'Inne'}
                              {deal.valid_until ? ` · do ${deal.valid_until.split('-').reverse().join('.')}` : ''}
                            </div>
                            {deal.status === 'rejected' && deal.admin_note && <div className="text-xs text-spoot-danger">{deal.admin_note}</div>}
                          </td>
                          <td className="px-3 py-3.5 text-spoot-ink2">
                            {dayShorts(deal.days_of_week)}
                            <br />
                            {formatDealTime(deal) ?? 'cały dzień'}
                          </td>
                          <td className="whitespace-nowrap px-3 py-3.5 text-right">
                            <div className="font-display font-bold">{formatPrice(deal.price)}</div>
                            {deal.original_price != null && (
                              <div className="text-xs text-spoot-ink2">
                                <s>{formatPrice(deal.original_price)}</s>{pct != null && <strong> · -{pct}%</strong>}
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-3.5">
                            {(() => {
                              const p = promoFor(deal.id);
                              if (!p) return <StatusPill deal={deal} />;
                              return (
                                <div className="flex flex-col items-start gap-1">
                                  <span className="whitespace-nowrap rounded-full bg-spoot-orange px-2.5 py-0.5 font-display text-[11px] font-bold">
                                    {p.status === 'pending' ? 'Promocja czeka' : 'Promowana'}
                                  </span>
                                  {p.active_until && p.status === 'approved' && (
                                    <span className="text-xs text-spoot-ink2">do {new Date(p.active_until).toLocaleDateString('pl-PL', { day: 'numeric', month: 'numeric' })}</span>
                                  )}
                                </div>
                              );
                            })()}
                          </td>
                          <td className="whitespace-nowrap py-3.5 text-right">
                            <Btn variant="ghost" size="sm" onClick={() => edit(deal)}>Edytuj</Btn>
                            <Btn variant="danger" size="sm" onClick={() => remove(deal)}>Usuń</Btn>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <section className="flex flex-col items-start gap-2 rounded-3xl bg-spoot-green p-6 text-white">
            <span className="rounded-full bg-spoot-orange px-2.5 py-0.5 font-display text-[11px] font-bold tracking-[0.5px] text-spoot-ink">WKRÓTCE</span>
            <h2 className="font-display text-[22px] font-bold leading-7">Promuj ofertę dnia</h2>
            <p className="text-white/80">Promowana oferta wyświetli się na samej górze Ofert dnia u gości w Twojej okolicy. Zawsze z etykietą „Sponsorowane”. Damy znać, gdy ruszy.</p>
          </section>
        </div>

        <Card className="min-w-0 flex-[1_1_320px]">
          <form onSubmit={save} className="flex flex-col gap-4">
            <CardTitle>{form.editId ? 'Edytuj ofertę' : 'Nowa oferta'}</CardTitle>
            <label className={labelCls}>
              Danie *
              <input required value={form.dishName} onChange={e => setName(e.target.value)} placeholder="np. Pizza Margherita" maxLength={80} className={inputCls} />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className={labelCls}>
                Cena w ofercie *
                <input required value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} inputMode="decimal" placeholder="np. 15" className={inputCls} />
              </label>
              <label className={labelCls}>
                Cena przed obniżką
                <input value={form.originalPrice} onChange={e => setForm({ ...form, originalPrice: e.target.value })} inputMode="decimal" placeholder="np. 22" className={inputCls} />
              </label>
            </div>
            <label className={labelCls}>
              Rodzaj dania
              <select
                value={form.dishType}
                onChange={e => setForm({ ...form, dishType: e.target.value as DishTypeKey, dishTypeTouched: true })}
                className={inputCls}
              >
                {(Object.keys(DISH_TYPE_LABELS) as DishTypeKey[]).map(k => <option key={k} value={k}>{DISH_TYPE_LABELS[k]}</option>)}
              </select>
            </label>
            <fieldset className="flex flex-col gap-2">
              <legend className="pb-2 font-display text-[11px] font-bold uppercase tracking-[0.5px]">Dni tygodnia *</legend>
              <div className="flex flex-wrap gap-1.5">
                {DAYS.map(d => {
                  const on = form.days.includes(d.key);
                  return (
                    <button
                      key={d.key}
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggleDay(d.key)}
                      className={`min-h-10 min-w-12 rounded-full px-3 font-display text-[13px] font-bold ${on ? 'bg-spoot-ink text-white' : 'border border-spoot-line bg-spoot-input hover:bg-spoot-chip/70'}`}
                    >
                      {d.short}
                    </button>
                  );
                })}
              </div>
            </fieldset>
            <div className="grid grid-cols-2 gap-3">
              <label className={labelCls}>
                Od
                <input type="time" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} className={inputCls} />
              </label>
              <label className={labelCls}>
                Do
                <input type="time" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} className={inputCls} />
              </label>
            </div>
            <label className={labelCls}>
              Aktywne do (opcjonalnie)
              <input type="date" value={form.validUntil} onChange={e => setForm({ ...form, validUntil: e.target.value })} className={inputCls} />
            </label>
            <div className="flex flex-wrap gap-2">
              <Btn type="submit" disabled={!canSave}>{saving ? 'Zapisuję…' : form.editId ? 'Zapisz' : 'Dodaj ofertę'}</Btn>
              {(form.editId || form.dishName) && <Btn variant="outline" onClick={() => setForm(EMPTY)}>Anuluj</Btn>}
            </div>
          </form>
        </Card>
      </div>
    </>
  );
}
