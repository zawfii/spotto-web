'use client';

import { createBrowserClient } from '@supabase/ssr';
import { useEffect, useState, useCallback, useMemo } from 'react';
import type { MenuSection, MenuItem } from '@/lib/owner';
import { formatPrice, pluralPl } from '@/lib/format';
import { Btn, Card, CardTitle, Eyebrow, Loading, PageHeader, checkCls, inputCls, labelCls } from '@/components/owner/ui';

// Jak getPresetSections w apce (app/owner-panel.tsx).
const DEFAULT_PRESETS = ['Przystawki', 'Zupy', 'Dania główne', 'Desery', 'Napoje', 'Inne'];
const ASIAN_PRESETS = ['Przystawki', 'Zupy', 'Dania główne', 'Makarony & ryż', 'Desery', 'Napoje'];
const PRESETS: Record<string, string[]> = {
  'Kawiarnie': ['Kawy', 'Herbaty', 'Ciasta & desery', 'Śniadania', 'Napoje zimne', 'Lunch'],
  'Bary': ['Piwa', 'Drinki & koktajle', 'Wódki', 'Wina', 'Whisky', 'Przekąski'],
  'Desery & Lody': ['Lody & sorbety', 'Ciasta', 'Desery', 'Napoje', 'Inne', 'Sezonowe'],
  'Japońska': ['Sushi & Maki', 'Sashimi', 'Ramen & Zupy', 'Przystawki', 'Napoje', 'Desery'],
  'Włoska': ['Pizza', 'Makarony', 'Przystawki', 'Sałatki', 'Desery', 'Napoje'],
  'Amerykańska': ['Burgery', 'Frytki & dodatki', 'Sałatki', 'Desery', 'Napoje', 'Inne'],
  'Polska': ['Przystawki', 'Zupy', 'Dania główne', 'Pierogi', 'Desery', 'Napoje'],
  'Ukraińska': ['Przystawki', 'Zupy', 'Dania główne', 'Pierogi', 'Desery', 'Napoje'],
  'Indyjska': ['Przystawki', 'Curry', 'Biryani', 'Chleby & ryż', 'Desery', 'Napoje'],
  'Meksykańska': ['Tacos & quesadillas', 'Nachos & przystawki', 'Dania główne', 'Desery', 'Piwa & drinki', 'Napoje'],
  'Chińska': ['Przystawki', 'Dim Sum', 'Zupy', 'Dania główne', 'Makarony & ryż', 'Napoje'],
  'Koreańska': ['BBQ', 'Przystawki', 'Zupy & stew', 'Makarony & ryż', 'Desery', 'Napoje'],
  'Tajska': ASIAN_PRESETS,
  'Wietnamska': ASIAN_PRESETS,
  'Azjatyckie': ASIAN_PRESETS,
  'Seafood': ['Ryby', 'Owoce morza', 'Zupy', 'Sałatki', 'Desery', 'Napoje'],
  'Hiszpańska': ['Tapas', 'Paella', 'Sałatki', 'Desery', 'Wina & drinki', 'Napoje'],
  'Grecka': ['Mezes', 'Sałatki', 'Dania główne', 'Grillowane', 'Desery', 'Napoje'],
  'Bałkańska': ['Przystawki', 'Zupy', 'Grillowane', 'Dania główne', 'Desery', 'Napoje'],
  'Bliski Wschód': ['Meze', 'Kebaby', 'Dania główne', 'Sałatki', 'Desery', 'Napoje'],
};

const ITEM_COLUMNS = 'id, section_id, name, price, description, is_vege, spice_level, is_available, position';
const SPICE_LABELS = ['Brak', 'Łagodne', 'Ostre', 'Bardzo ostre'];

type ItemForm = {
  editId: string | null; sectionId: string;
  name: string; price: string; description: string;
  is_vege: boolean; spice_level: 0 | 1 | 2 | 3; is_available: boolean;
};

const parsePrice = (s: string) => parseFloat(s.replace(',', '.'));

export default function MenuPage() {
  const supabase = useMemo(
    () => createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    ),
    []
  );

  const [placeId, setPlaceId] = useState<string | null>(null);
  const [category, setCategory] = useState('');
  const [sections, setSections] = useState<MenuSection[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [newSection, setNewSection] = useState('');
  const [quick, setQuick] = useState({ name: '', price: '' });
  const [form, setForm] = useState<ItemForm | null>(null);

  const load = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: vd } = await supabase.from('venue_details').select('place_id').eq('owner_id', user.id).maybeSingle();
      if (!vd) return;
      setPlaceId(vd.place_id);

      const [{ data: place }, { data: sectionRows }] = await Promise.all([
        supabase.from('places').select('category').eq('id', vd.place_id).maybeSingle(),
        supabase
          .from('menu_sections')
          .select(`id, name, position, menu_items(${ITEM_COLUMNS})`)
          .eq('place_id', vd.place_id)
          .eq('source', 'owner') // import ze strony/zdjęcia nie jest edytowalny przez właściciela (RLS)
          .order('position', { ascending: true }),
      ]);
      setCategory(place?.category ?? '');
      setSections(
        (sectionRows ?? []).map(s => ({
          ...s,
          menu_items: ((s.menu_items as MenuItem[]) ?? []).sort((a, b) => a.position - b.position),
        }))
      );
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  const selected = sections.find(s => s.id === selectedId) ?? sections[0] ?? null;
  const itemCount = sections.reduce((n, s) => n + s.menu_items.length, 0);
  const unavailable = sections.reduce((n, s) => n + s.menu_items.filter(i => !i.is_available).length, 0);
  const presets = (PRESETS[category] ?? DEFAULT_PRESETS).filter(p => !sections.some(s => s.name === p));

  // ── Sekcje ────────────────────────────────────────────────────────────────

  async function addSection(rawName: string) {
    const name = rawName.trim();
    if (!name || !placeId) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase.from('menu_sections')
      .insert({ place_id: placeId, owner_id: user.id, name, position: sections.length })
      .select('id, name, position')
      .single();
    if (error) { alert('Nie udało się dodać sekcji: ' + error.message); return; }
    setSections(prev => [...prev, { ...data, menu_items: [] }]);
    setSelectedId(data.id);
    setNewSection('');
  }

  async function renameSection(section: MenuSection) {
    const name = prompt('Nazwa sekcji', section.name)?.trim();
    if (!name || name === section.name) return;
    const { error } = await supabase.from('menu_sections').update({ name }).eq('id', section.id);
    if (error) { alert('Nie udało się zapisać: ' + error.message); return; }
    setSections(prev => prev.map(s => (s.id === section.id ? { ...s, name } : s)));
  }

  async function deleteSection(section: MenuSection) {
    const count = section.menu_items.length;
    const extra = count > 0 ? ` i ${count} ${pluralPl(count, 'danie', 'dania', 'dań')}` : '';
    if (!confirm(`Usunąć sekcję „${section.name}”${extra}?`)) return;
    const { error } = await supabase.from('menu_sections').delete().eq('id', section.id);
    if (error) { alert('Nie udało się usunąć: ' + error.message); return; }
    setSections(prev => prev.filter(s => s.id !== section.id));
    setSelectedId(null);
    setForm(null);
  }

  // ── Dania ─────────────────────────────────────────────────────────────────

  async function insertItem(sectionId: string, payload: Omit<MenuItem, 'id' | 'section_id' | 'position'>) {
    const position = sections.find(s => s.id === sectionId)?.menu_items.length ?? 0;
    const { data, error } = await supabase.from('menu_items')
      .insert({ section_id: sectionId, ...payload, position })
      .select(ITEM_COLUMNS)
      .single();
    if (error) { alert('Nie udało się dodać dania: ' + error.message); return false; }
    setSections(prev => prev.map(s => (s.id === sectionId ? { ...s, menu_items: [...s.menu_items, data as MenuItem] } : s)));
    return true;
  }

  async function quickAdd(e: React.FormEvent) {
    e.preventDefault();
    const price = parsePrice(quick.price);
    if (!selected || !quick.name.trim() || isNaN(price) || price <= 0) return;
    const ok = await insertItem(selected.id, {
      name: quick.name.trim(), price, description: null, is_vege: false, spice_level: 0, is_available: true,
    });
    if (ok) setQuick({ name: '', price: '' });
  }

  async function saveForm(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    const price = parsePrice(form.price);
    if (!form.name.trim() || isNaN(price) || price <= 0) return;
    const payload = {
      name: form.name.trim(), price,
      description: form.description.trim() || null,
      is_vege: form.is_vege, spice_level: form.spice_level, is_available: form.is_available,
    };

    if (!form.editId) {
      if (await insertItem(form.sectionId, payload)) setForm(null);
      return;
    }

    const current = sections.flatMap(s => s.menu_items).find(i => i.id === form.editId);
    const moved = current && current.section_id !== form.sectionId;
    const position = moved ? sections.find(s => s.id === form.sectionId)?.menu_items.length ?? 0 : current?.position ?? 0;
    const { error } = await supabase.from('menu_items')
      .update({ ...payload, section_id: form.sectionId, position })
      .eq('id', form.editId);
    if (error) { alert('Nie udało się zapisać: ' + error.message); return; }
    if (moved) {
      await load();
    } else {
      setSections(prev => prev.map(s => ({
        ...s,
        menu_items: s.menu_items.map(i => (i.id === form.editId ? { ...i, ...payload } : i)),
      })));
    }
    setForm(null);
  }

  async function toggleAvailable(item: MenuItem) {
    const is_available = !item.is_available;
    const { error } = await supabase.from('menu_items').update({ is_available }).eq('id', item.id);
    if (error) { alert('Nie udało się zapisać: ' + error.message); return; }
    setSections(prev => prev.map(s => ({
      ...s,
      menu_items: s.menu_items.map(i => (i.id === item.id ? { ...i, is_available } : i)),
    })));
  }

  async function deleteItem(item: MenuItem) {
    if (!confirm(`Usunąć „${item.name}”?`)) return;
    const { error } = await supabase.from('menu_items').delete().eq('id', item.id);
    if (error) { alert('Nie udało się usunąć: ' + error.message); return; }
    setSections(prev => prev.map(s => ({ ...s, menu_items: s.menu_items.filter(i => i.id !== item.id) })));
    if (form?.editId === item.id) setForm(null);
  }

  const openNew = () => selected && setForm({
    editId: null, sectionId: selected.id, name: '', price: '', description: '', is_vege: false, spice_level: 0, is_available: true,
  });
  const openEdit = (item: MenuItem) => setForm({
    editId: item.id, sectionId: item.section_id, name: item.name, price: String(item.price),
    description: item.description ?? '', is_vege: item.is_vege, spice_level: item.spice_level, is_available: item.is_available,
  });

  if (loading) return <Loading />;

  return (
    <>
      <PageHeader
        eyebrow="Menu"
        title="Karta dań"
        sub={`${sections.length} ${pluralPl(sections.length, 'sekcja', 'sekcje', 'sekcji')} · ${itemCount} ${pluralPl(itemCount, 'danie', 'dania', 'dań')}${unavailable > 0 ? ` · ${unavailable} niedostępne` : ''}. Zmiany widać w aplikacji od razu po zapisaniu.`}
      >
        <Btn onClick={openNew} disabled={!selected}>Dodaj danie</Btn>
      </PageHeader>

      <div className="flex flex-wrap items-start gap-6">
        {/* Sekcje */}
        <Card className="flex min-w-0 flex-[1_1_200px] flex-col gap-1 !p-3">
          <Eyebrow className="px-3 py-2">Sekcje</Eyebrow>
          {sections.map(s => {
            const active = s.id === selected?.id;
            return (
              <button
                key={s.id}
                type="button"
                aria-pressed={active}
                onClick={() => { setSelectedId(s.id); setForm(null); }}
                className={`flex min-h-11 items-center gap-2 rounded-xl px-3 text-left font-display ${active ? 'bg-spoot-ink font-bold text-white' : 'font-semibold hover:bg-spoot-chip/70'}`}
              >
                <span className="grow">{s.name}</span>
                <span className="text-xs">{s.menu_items.length}</span>
              </button>
            );
          })}
          <form onSubmit={e => { e.preventDefault(); addSection(newSection); }} className="mt-2 flex flex-col gap-2 border-t border-spoot-line p-3">
            <label className={labelCls}>
              Nowa sekcja
              <input value={newSection} onChange={e => setNewSection(e.target.value)} placeholder="np. Przystawki" maxLength={50} className={inputCls} />
            </label>
            <Btn type="submit" variant="outline" size="sm" disabled={!newSection.trim()}>Dodaj sekcję</Btn>
            {presets.length > 0 && (
              <>
                <span className="pt-1 text-xs text-spoot-ink2">{sections.length === 0 ? 'Zacznij od gotowych sekcji' : 'Albo dodaj gotową'}</span>
                <div className="flex flex-wrap gap-1.5">
                  {presets.map(p => (
                    <button key={p} type="button" onClick={() => addSection(p)} className="min-h-9 rounded-full border border-spoot-line px-3 font-display text-xs font-semibold hover:bg-spoot-chip/70">
                      + {p}
                    </button>
                  ))}
                </div>
              </>
            )}
          </form>
        </Card>

        {/* Dania w wybranej sekcji */}
        <Card className="flex min-w-0 flex-[3_1_440px] flex-col gap-4">
          {!selected ? (
            <p className="text-spoot-ink2">Brak sekcji. Dodaj pierwszą po lewej, a potem wpisz dania.</p>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <div className="grow"><CardTitle>{selected.name}</CardTitle></div>
                <Btn variant="ghost" size="sm" onClick={() => renameSection(selected)}>Zmień nazwę</Btn>
                <Btn variant="danger" size="sm" onClick={() => deleteSection(selected)}>Usuń sekcję</Btn>
              </div>

              {selected.menu_items.length === 0 ? (
                <p className="text-spoot-ink2">Ta sekcja jest pusta. Dodaj pierwsze danie poniżej.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[520px] border-collapse text-left">
                    <thead>
                      <tr className="font-display text-[11px] font-bold tracking-[0.5px]">
                        <th scope="col" className="py-2 pr-3">DANIE</th>
                        <th scope="col" className="px-3 py-2 text-right">CENA</th>
                        <th scope="col" className="px-3 py-2">DOSTĘPNE</th>
                        <th scope="col" className="py-2 text-right">AKCJE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selected.menu_items.map(item => (
                        <tr key={item.id} className={`border-t border-spoot-line ${form?.editId === item.id ? 'bg-spoot-input' : ''}`}>
                          <td className="py-3.5 pl-2 pr-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-display font-bold">{item.name}</span>
                              {item.is_vege && <span className="rounded-full bg-spoot-chip px-2 py-px font-display text-[10px] font-bold tracking-[0.5px]">WEGE</span>}
                              {item.spice_level > 0 && <span className="rounded-full bg-spoot-tint px-2 py-px font-display text-[10px] font-bold tracking-[0.5px]">{SPICE_LABELS[item.spice_level].toUpperCase()}</span>}
                              {!item.is_available && <span className="text-xs text-spoot-ink2">· niedostępne</span>}
                            </div>
                            {item.description && <div className="text-xs text-spoot-ink2">{item.description}</div>}
                          </td>
                          <td className="whitespace-nowrap px-3 py-3.5 text-right font-display font-bold">{formatPrice(item.price)}</td>
                          <td className="px-3 py-3.5">
                            <input type="checkbox" checked={item.is_available} onChange={() => toggleAvailable(item)} aria-label={`${item.name} — dostępne`} className={checkCls} />
                          </td>
                          <td className="whitespace-nowrap py-3.5 text-right">
                            <Btn variant="ghost" size="sm" onClick={() => openEdit(item)}>Edytuj</Btn>
                            <Btn variant="danger" size="sm" onClick={() => deleteItem(item)}>Usuń</Btn>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <form onSubmit={quickAdd} className="flex flex-wrap items-end gap-2 border-t border-spoot-line pt-4">
                <label className={`${labelCls} flex-[3_1_200px]`}>
                  Szybkie dodawanie
                  <input value={quick.name} onChange={e => setQuick(q => ({ ...q, name: e.target.value }))} placeholder="Nazwa dania" maxLength={80} className={inputCls} />
                </label>
                <label className={`${labelCls} flex-[1_1_100px]`}>
                  Cena
                  <input value={quick.price} onChange={e => setQuick(q => ({ ...q, price: e.target.value }))} placeholder="np. 38" inputMode="decimal" className={inputCls} />
                </label>
                <Btn type="submit" disabled={!quick.name.trim() || !quick.price.trim()}>Dodaj danie</Btn>
              </form>
            </>
          )}
        </Card>

        {/* Edycja dania */}
        {form && (
          <Card className="min-w-0 flex-[1_1_280px]">
            <form onSubmit={saveForm} className="flex flex-col gap-4">
              <CardTitle>{form.editId ? 'Edytuj danie' : 'Nowe danie'}</CardTitle>
              <label className={labelCls}>
                Nazwa dania *
                <input autoFocus required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Nazwa dania" maxLength={80} className={inputCls} />
              </label>
              <label className={labelCls}>
                Cena (zł) *
                <input required value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="np. 38" inputMode="decimal" className={inputCls} />
              </label>
              <label className={labelCls}>
                Opis
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Krótki opis zwiększa apetyt" maxLength={240} rows={3} className={`${inputCls} h-auto resize-y py-3`} />
              </label>
              <label className={labelCls}>
                Sekcja
                <select value={form.sectionId} onChange={e => setForm({ ...form, sectionId: e.target.value })} className={inputCls}>
                  {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </label>
              <label className={labelCls}>
                Ostrość
                <select value={form.spice_level} onChange={e => setForm({ ...form, spice_level: Number(e.target.value) as 0 | 1 | 2 | 3 })} className={inputCls}>
                  {SPICE_LABELS.map((l, i) => <option key={l} value={i}>{l}</option>)}
                </select>
              </label>
              <div className="flex flex-col">
                <label className="flex min-h-11 items-center gap-2.5">
                  <input type="checkbox" checked={form.is_vege} onChange={e => setForm({ ...form, is_vege: e.target.checked })} className={checkCls} />
                  Wegetariańskie
                </label>
                <label className="flex min-h-11 items-center gap-2.5">
                  <input type="checkbox" checked={form.is_available} onChange={e => setForm({ ...form, is_available: e.target.checked })} className={checkCls} />
                  Dostępne
                </label>
              </div>
              <div className="flex flex-wrap gap-2">
                <Btn type="submit" disabled={!form.name.trim() || !form.price.trim()}>Zapisz</Btn>
                <Btn variant="outline" onClick={() => setForm(null)}>Anuluj</Btn>
              </div>
            </form>
          </Card>
        )}
      </div>
    </>
  );
}
