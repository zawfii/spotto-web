'use client';

import { useCallback, useEffect, useState } from 'react';
import type { useSupabase } from '@/lib/owner-client';
import { DAYS, formatDealTime } from '@/lib/owner-deals';
import type { DayKey } from '@/lib/owner-deals';
import { Btn, Card, CardTitle, Eyebrow, inputCls, labelCls } from '@/components/owner/ui';

// Oferty „Tylko w Spoot” (tabela exclusive_offers, migracja w repo Spoot 20261216000000).
// Gość odblokowuje w apce kod ważny 15 minut i pokazuje go przy kasie; lokal niczego nie skanuje.

type Offer = {
  id: string; title: string; terms: string | null; days_of_week: DayKey[];
  start_time: string | null; end_time: string | null; valid_until: string | null;
  repeat_days: number; status: 'approved' | 'paused';
};
type Code = { offer_id: string; code: string; created_at: string };
type Form = {
  editId: string | null; title: string; terms: string; days: DayKey[];
  startTime: string; endTime: string; validUntil: string; repeatDays: string;
};

const EMPTY: Form = { editId: null, title: '', terms: '', days: [], startTime: '', endTime: '', validUntil: '', repeatDays: '7' };
const toDbTime = (t: string) => (t ? `${t}:00` : null);
const dayShorts = (days: DayKey[]) => days.length === 7 ? 'codziennie' : DAYS.filter(d => days.includes(d.key)).map(d => d.short).join(', ');
const WEEK_MS = 7 * 86_400_000;

export default function ExclusiveOffers({ supabase, placeId, userId }:
  { supabase: ReturnType<typeof useSupabase>; placeId: string; userId: string | null }) {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [codes, setCodes] = useState<Code[]>([]);
  const [total, setTotal] = useState(0);
  const [form, setForm] = useState<Form>(EMPTY);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const { data: o } = await supabase.from('exclusive_offers')
      .select('id, title, terms, days_of_week, start_time, end_time, valid_until, repeat_days, status')
      .eq('place_id', placeId).order('created_at', { ascending: false });
    const ids = ((o as Offer[]) ?? []).map(x => x.id);
    setOffers((o as Offer[]) ?? []);
    if (ids.length === 0) { setCodes([]); setTotal(0); return; }
    const [{ data: c }, { count }] = await Promise.all([
      supabase.from('offer_codes').select('offer_id, code, created_at').in('offer_id', ids)
        .order('created_at', { ascending: false }).limit(50),
      supabase.from('offer_codes').select('id', { count: 'exact', head: true }).in('offer_id', ids),
    ]);
    setCodes((c as Code[]) ?? []);
    setTotal(count ?? 0);
  }, [supabase, placeId]);

  useEffect(() => { load(); }, [load]);

  const repeat = parseInt(form.repeatDays, 10);
  const timesOk = !form.startTime || (form.endTime && form.endTime > form.startTime);
  const canSave = form.title.trim() && form.days.length > 0 && repeat >= 1 && repeat <= 365 && timesOk && !saving;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!canSave || !userId) return;
    const data = {
      title: form.title.trim(),
      terms: form.terms.trim() || null,
      days_of_week: DAYS.map(d => d.key).filter(k => form.days.includes(k)),
      start_time: toDbTime(form.startTime),
      end_time: toDbTime(form.endTime),
      valid_until: form.validUntil || null,
      repeat_days: repeat,
    };
    setSaving(true);
    const { error } = form.editId
      ? await supabase.from('exclusive_offers').update(data).eq('id', form.editId)
      : await supabase.from('exclusive_offers').insert({ ...data, place_id: placeId, owner_id: userId });
    setSaving(false);
    if (error) { alert('Nie udało się zapisać oferty. Spróbuj ponownie.'); return; }
    setForm(EMPTY); setOpen(false); load();
  }

  async function setStatus(o: Offer, status: Offer['status']) {
    await supabase.from('exclusive_offers').update({ status }).eq('id', o.id);
    load();
  }

  async function remove(o: Offer) {
    if (!confirm(`Usunąć ofertę „${o.title}”? Zniknie też historia jej kodów. Żeby tylko ją ukryć, użyj „Wstrzymaj”.`)) return;
    await supabase.from('exclusive_offers').delete().eq('id', o.id);
    if (form.editId === o.id) { setForm(EMPTY); setOpen(false); }
    load();
  }

  function edit(o: Offer) {
    setForm({
      editId: o.id, title: o.title, terms: o.terms ?? '', days: o.days_of_week,
      startTime: o.start_time?.slice(0, 5) ?? '', endTime: o.end_time?.slice(0, 5) ?? '',
      validUntil: o.valid_until ?? '', repeatDays: String(o.repeat_days),
    });
    setOpen(true);
  }

  const today = new Date().toISOString().slice(0, 10);
  const lastWeek = codes.filter(c => Date.now() - new Date(c.created_at).getTime() < WEEK_MS).length;
  const titleOf = (id: string) => offers.find(o => o.id === id)?.title ?? '';

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-[1_1_260px] flex-col gap-1">
          <span className="self-start rounded-full bg-spoot-orange px-2.5 py-0.5 font-display text-[11px] font-bold tracking-[0.5px]">TYLKO W SPOOT</span>
          <CardTitle>Oferta z kodem</CardTitle>
          <p className="text-sm text-spoot-ink2">
            Gość odblokowuje w aplikacji kod ważny 15 minut i pokazuje go przy kasie. Obsługa tylko patrzy na ekran: kod, odliczanie i ruchome tło (zrzut ekranu od razu widać).
          </p>
        </div>
        {!open && <Btn onClick={() => { setForm(EMPTY); setOpen(true); }}>Dodaj ofertę</Btn>}
      </div>

      {offers.length > 0 && (
        <div className="flex flex-wrap gap-6">
          <div><Eyebrow>Odblokowane · 7 dni</Eyebrow><div className="font-display text-[28px] font-bold leading-9">{lastWeek}</div></div>
          <div><Eyebrow>Razem</Eyebrow><div className="font-display text-[28px] font-bold leading-9">{total}</div></div>
        </div>
      )}

      {offers.map(o => {
        const expired = o.valid_until && o.valid_until < today;
        const [pill, cls] = o.status === 'paused' ? ['Wstrzymana', 'bg-spoot-chip'] : expired ? ['Wygasła', 'bg-spoot-chip'] : ['Aktywna', 'bg-[#2e7d32] text-white'];
        return (
          <div key={o.id} className={`flex flex-wrap items-center gap-3 border-t border-spoot-line pt-3 ${form.editId === o.id ? 'bg-spoot-input' : ''}`}>
            <div className="flex min-w-0 flex-[1_1_240px] flex-col">
              <span className="font-display font-bold">{o.title}</span>
              <span className="text-xs text-spoot-ink2">
                {dayShorts(o.days_of_week)} · {formatDealTime(o) ?? 'cały dzień'} · jedna osoba co {o.repeat_days} {o.repeat_days === 1 ? 'dzień' : 'dni'}
                {o.valid_until ? ` · do ${o.valid_until.split('-').reverse().join('.')}` : ''}
              </span>
              {o.terms && <span className="text-xs text-spoot-ink2">{o.terms}</span>}
            </div>
            <span className={`whitespace-nowrap rounded-full px-2.5 py-0.5 font-display text-[11px] font-bold ${cls}`}>{pill}</span>
            <div className="flex flex-wrap">
              <Btn variant="ghost" size="sm" onClick={() => edit(o)}>Edytuj</Btn>
              <Btn variant="ghost" size="sm" onClick={() => setStatus(o, o.status === 'paused' ? 'approved' : 'paused')}>
                {o.status === 'paused' ? 'Wznów' : 'Wstrzymaj'}
              </Btn>
              <Btn variant="danger" size="sm" onClick={() => remove(o)}>Usuń</Btn>
            </div>
          </div>
        );
      })}

      {open && (
        <form onSubmit={save} className="flex flex-col gap-4 border-t border-spoot-line pt-4">
          <label className={labelCls}>
            Co gość dostaje *
            <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="np. 1+1 na kawę" maxLength={80} className={inputCls} />
          </label>
          <label className={labelCls}>
            Warunki (opcjonalnie)
            <input value={form.terms} onChange={e => setForm({ ...form, terms: e.target.value })} placeholder="np. tańsza kawa gratis, nie łączy się z innymi rabatami" maxLength={240} className={inputCls} />
          </label>
          <fieldset className="flex flex-col gap-2">
            <legend className="pb-2 font-display text-[11px] font-bold uppercase tracking-[0.5px]">Dni tygodnia *</legend>
            <div className="flex flex-wrap gap-1.5">
              {DAYS.map(d => {
                const on = form.days.includes(d.key);
                return (
                  <button key={d.key} type="button" aria-pressed={on}
                    onClick={() => setForm(f => ({ ...f, days: on ? f.days.filter(x => x !== d.key) : [...f.days, d.key] }))}
                    className={`min-h-10 min-w-12 rounded-full px-3 font-display text-[13px] font-bold ${on ? 'bg-spoot-ink text-white' : 'border border-spoot-line bg-spoot-input hover:bg-spoot-chip/70'}`}>
                    {d.short}
                  </button>
                );
              })}
            </div>
          </fieldset>
          <div className="grid grid-cols-2 gap-3">
            <label className={labelCls}>Od<input type="time" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} className={inputCls} /></label>
            <label className={labelCls}>Do<input type="time" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} className={inputCls} /></label>
          </div>
          {!timesOk && <p className="text-xs text-spoot-danger">Podaj godzinę końca późniejszą niż początek.</p>}
          <div className="grid grid-cols-2 gap-3">
            <label className={labelCls}>
              Ta sama osoba co ile dni *
              <input type="number" min={1} max={365} value={form.repeatDays} onChange={e => setForm({ ...form, repeatDays: e.target.value })} className={inputCls} />
            </label>
            <label className={labelCls}>
              Aktywna do (opcjonalnie)
              <input type="date" value={form.validUntil} onChange={e => setForm({ ...form, validUntil: e.target.value })} className={inputCls} />
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            <Btn type="submit" disabled={!canSave}>{saving ? 'Zapisuję…' : form.editId ? 'Zapisz' : 'Dodaj ofertę'}</Btn>
            <Btn variant="outline" onClick={() => { setForm(EMPTY); setOpen(false); }}>Anuluj</Btn>
          </div>
        </form>
      )}

      {codes.length > 0 && (
        <details className="border-t border-spoot-line pt-3">
          <summary className="cursor-pointer font-display text-sm font-bold">Ostatnie kody ({codes.length})</summary>
          <p className="mt-1 text-xs text-spoot-ink2">Jeśli obsługa zapisuje kod na paragonie, tu sprawdzisz, czy był prawdziwy.</p>
          <ul className="mt-2 flex flex-col gap-1 text-sm">
            {codes.map(c => (
              <li key={c.offer_id + c.created_at} className="flex flex-wrap gap-x-3">
                <span className="font-mono font-bold tracking-widest">{c.code}</span>
                <span className="text-spoot-ink2">{new Date(c.created_at).toLocaleString('pl-PL', { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                <span className="text-spoot-ink2">{titleOf(c.offer_id)}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </Card>
  );
}
