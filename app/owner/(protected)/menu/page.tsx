'use client';

import { useEffect, useState, useCallback } from 'react';
import type { AllergenKey, MenuSection, MenuItem, OwnerVenueRef } from '@/lib/owner';
import { ALLERGENS, allergenLabels } from '@/lib/owner';
import { formatPrice, pluralPl } from '@/lib/format';
import { useOwnerVenue } from '@/lib/owner-client';
import { useOwnerVenueList } from '@/components/owner/VenueContext';
import { Btn, Card, CardTitle, Eyebrow, Loading, PageHeader, checkCls, inputCls, labelCls } from '@/components/owner/ui';
import MenuQr from '@/components/owner/MenuQr';
import CoverPhoto from '@/components/owner/CoverPhoto';
import MenuEntryRequest from '@/components/owner/MenuEntryRequest';

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

const ITEM_COLUMNS = 'id, section_id, name, price, description, is_vege, spice_level, is_available, position, image_url, allergens, name_en, description_en';
const SPICE_LABELS = ['Brak', 'Łagodne', 'Ostre', 'Bardzo ostre'];

type ItemForm = {
  editId: string | null; sectionId: string;
  name: string; price: string; description: string; name_en: string; description_en: string;
  is_vege: boolean; spice_level: 0 | 1 | 2 | 3; is_available: boolean;
  image_url: string | null; allergens: AllergenKey[] | null; // null = nieuzupełnione, [] = brak alergenów
};

const parsePrice = (s: string) => parseFloat(s.replace(',', '.'));

export default function MenuPage() {
  const { supabase, userId, venue, place, loading: venueLoading } = useOwnerVenue();
  const placeId = venue?.place_id ?? null;
  const category = place?.category ?? '';
  const [uploading, setUploading] = useState(false);
  const [sections, setSections] = useState<MenuSection[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [newSection, setNewSection] = useState('');
  const [quick, setQuick] = useState({ name: '', price: '' });
  const [form, setForm] = useState<ItemForm | null>(null);
  // Karta z importu (strona lokalu / zdjęcie) — goście ją widzą, dopóki właściciel nie doda własnej sekcji.
  const [imported, setImported] = useState<{ source: string; items: number } | null>(null);
  // Kopiowanie menu z innego lokalu konta — tylko gdy tu nie ma jeszcze menu właściciela.
  const venues = useOwnerVenueList();
  const [copySources, setCopySources] = useState<OwnerVenueRef[]>([]);
  const [copying, setCopying] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);
  const [copied, setCopied] = useState<number | null>(null);
  // Lokal wskazany do karty po angielsku (menu_en_places) — tylko wtedy pola po angielsku.
  const [en, setEn] = useState(false);

  const load = useCallback(async () => {
    if (!venue) return;
    try {
      const [{ data: sectionRows }, { data: importedRows }, { data: enRow }] = await Promise.all([
        supabase
          .from('menu_sections')
          .select(`id, name, name_en, position, menu_items(${ITEM_COLUMNS})`)
          .eq('place_id', venue.place_id)
          .eq('source', 'owner') // import ze strony/zdjęcia nie jest edytowalny przez właściciela (RLS)
          .order('position', { ascending: true }),
        supabase.from('menu_sections').select('source, menu_items(id)').eq('place_id', venue.place_id).neq('source', 'owner'),
        supabase.from('menu_en_places').select('place_id').eq('place_id', venue.place_id).maybeSingle(),
      ]);
      setEn(!!enRow);
      setImported(importedRows?.length
        ? { source: importedRows[0].source, items: importedRows.reduce((n, s) => n + (s.menu_items?.length ?? 0), 0) }
        : null);
      setSections(
        (sectionRows ?? []).map(s => ({
          ...s,
          menu_items: ((s.menu_items as MenuItem[]) ?? []).sort((a, b) => a.position - b.position),
        }))
      );
    } finally {
      setLoading(false);
    }
  }, [supabase, venue]);

  useEffect(() => { load(); }, [load]);

  const menuEmpty = !loading && sections.length === 0;
  useEffect(() => {
    const others = venues.filter(v => v.place_id !== placeId).map(v => v.place_id);
    if (!menuEmpty || others.length === 0) return;
    supabase.from('menu_sections').select('place_id').eq('source', 'owner').in('place_id', others)
      .then(({ data }) => {
        const withMenu = new Set((data ?? []).map(r => r.place_id as string));
        setCopySources(venues.filter(v => withMenu.has(v.place_id)));
      });
  }, [supabase, venues, placeId, menuEmpty]);

  async function copyMenu(fromId: string) {
    if (!placeId) return;
    setCopying(true);
    setCopyError(null);
    try {
      const { data, error } = await supabase.rpc('copy_owner_menu', { p_from: fromId, p_to: placeId });
      // np. „Ten lokal ma już menu” z innej karty — przeładowanie pokaże to menu zamiast pustego
      if (error) { setCopyError(error.message); await load(); return; }
      setCopied(Number(data));
      await load();
    } finally {
      setCopying(false);
    }
  }

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
    if (!name) return;
    const patch: { name: string; name_en?: string | null } = { name };
    // Anulowanie drugiego pytania zostawia angielską nazwę bez zmian (baza skasuje ją, jeśli zmieniła się polska).
    const enInput = en ? prompt('Nazwa sekcji po angielsku (dla gości z zagranicy)', section.name_en ?? '') : null;
    if (enInput != null) patch.name_en = enInput.trim().slice(0, 50) || null;
    if (name === section.name && (patch.name_en === undefined || patch.name_en === (section.name_en ?? null))) return;
    let { data, error } = await supabase.from('menu_sections').update(patch).eq('id', section.id).select('name, name_en').single();
    // Zatwierdzona bez zmian angielska nazwa przy nowej polskiej: baza ją skasowała, zapisujemy ponownie.
    if (!error && patch.name_en && !data?.name_en) {
      ({ data, error } = await supabase.from('menu_sections').update({ name_en: patch.name_en }).eq('id', section.id).select('name, name_en').single());
    }
    if (error) { alert('Nie udało się zapisać: ' + error.message); return; }
    setSections(prev => prev.map(s => (s.id === section.id ? { ...s, ...data } : s)));
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
      image_url: null, allergens: null,
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
      image_url: form.image_url, allergens: form.allergens,
      ...(en ? { name_en: form.name_en.trim() || null, description_en: form.description_en.trim() || null } : null),
    };

    if (!form.editId) {
      if (await insertItem(form.sectionId, payload)) setForm(null);
      return;
    }

    const current = sections.flatMap(s => s.menu_items).find(i => i.id === form.editId);
    const moved = current && current.section_id !== form.sectionId;
    const position = moved ? sections.find(s => s.id === form.sectionId)?.menu_items.length ?? 0 : current?.position ?? 0;
    // Wiersz z bazy, nie payload: baza kasuje nieaktualne tłumaczenie przy zmianie polskiej nazwy/opisu.
    let { data, error } = await supabase.from('menu_items')
      .update({ ...payload, section_id: form.sectionId, position })
      .eq('id', form.editId)
      .select(ITEM_COLUMNS)
      .single();
    // Właściciel widział angielski w formularzu, więc zostaje to, co zatwierdził (kasowanie jest dla
    // zmian bez pól po angielsku, np. z panelu w apce). Drugi zapis: angielski z null na wartość.
    if (!error && en && ((!data?.name_en && payload.name_en) || (!data?.description_en && payload.description_en))) {
      ({ data, error } = await supabase.from('menu_items')
        .update({ name_en: payload.name_en, description_en: payload.description_en })
        .eq('id', form.editId)
        .select(ITEM_COLUMNS)
        .single());
    }
    if (error) { alert('Nie udało się zapisać: ' + error.message); return; }
    if (moved) {
      await load();
    } else {
      setSections(prev => prev.map(s => ({
        ...s,
        menu_items: s.menu_items.map(i => (i.id === form.editId ? (data as MenuItem) : i)),
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
    editId: null, sectionId: selected.id, name: '', price: '', description: '', name_en: '', description_en: '',
    is_vege: false, spice_level: 0, is_available: true, image_url: null, allergens: null,
  });
  const openEdit = (item: MenuItem) => setForm({
    editId: item.id, sectionId: item.section_id, name: item.name, price: String(item.price),
    description: item.description ?? '', name_en: item.name_en ?? '', description_en: item.description_en ?? '',
    is_vege: item.is_vege, spice_level: item.spice_level, is_available: item.is_available,
    image_url: item.image_url, allergens: item.allergens,
  });

  // Zdjęcie trafia do storage od razu; do dania zapisuje się razem z formularzem.
  async function uploadDishPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.target;
    const file = input.files?.[0];
    if (!file || !userId || !form) return;
    setUploading(true);
    try {
      const ext = (file.name.split('.').pop() ?? 'jpg').toLowerCase();
      const path = `${userId}/dish-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('venue-photos').upload(path, file, { contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}` });
      if (error) { alert('Nie udało się wgrać zdjęcia: ' + error.message); return; }
      const url = supabase.storage.from('venue-photos').getPublicUrl(path).data.publicUrl;
      setForm(f => (f ? { ...f, image_url: url } : f));
    } finally {
      setUploading(false);
      input.value = '';
    }
  }

  // Odznaczenie ostatniego alergenu wraca do „nieuzupełnione” — „brak alergenów” trzeba wybrać świadomie.
  const toggleAllergen = (key: AllergenKey) => setForm(f => {
    if (!f) return f;
    const cur = f.allergens ?? [];
    const next = cur.includes(key) ? cur.filter(a => a !== key) : [...cur, key];
    return { ...f, allergens: next.length ? next : null };
  });

  if (venueLoading || (venue && loading)) return <Loading />;

  return (
    <>
      <PageHeader
        eyebrow="Menu"
        title="Karta dań"
        sub={`${sections.length} ${pluralPl(sections.length, 'sekcja', 'sekcje', 'sekcji')} · ${itemCount} ${pluralPl(itemCount, 'danie', 'dania', 'dań')}${unavailable > 0 ? ` · ${unavailable} niedostępne` : ''}. Zmiany widać w aplikacji od razu po zapisaniu.`}
      >
        <Btn onClick={openNew} disabled={!selected}>Dodaj danie</Btn>
      </PageHeader>

      {copied !== null && (
        <p role="status" className="rounded-2xl bg-spoot-tint p-4 font-display font-bold">
          Skopiowano {copied} {pluralPl(copied, 'danie', 'dania', 'dań')}
        </p>
      )}

      {venue && <CoverPhoto supabase={supabase} userId={userId} venueId={venue.id} placeId={venue.place_id} googleUrl={place?.image_url ?? null} />}

      {/* poza pustym stanem: błąd zostaje widoczny także, gdy przeładowanie pokaże menu */}
      {copyError && <p role="alert" className="text-spoot-danger">{copyError}</p>}

      {imported && sections.length === 0 && (
        <p role="status" className="rounded-2xl bg-spoot-tint p-4">
          <strong className="font-display">Goście widzą teraz kartę {imported.source === 'website' ? 'pobraną z Twojej strony' : 'przepisaną ze zdjęcia'} ({imported.items} {pluralPl(imported.items, 'danie', 'dania', 'dań')}).</strong>{' '}
          Tej karty nie da się tu edytować. Gdy dodasz pierwszą własną sekcję, goście zobaczą już tylko Twoją kartę — wpisz więc od razu całe menu albo poproś nas o to na dole strony.
        </p>
      )}

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
            <>
              <p className="text-spoot-ink2">Brak sekcji. Dodaj pierwszą po lewej, a potem wpisz dania.</p>
              {copySources.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {copySources.map(v => (
                    <Btn key={v.place_id} variant="outline" size="sm" disabled={copying} onClick={() => copyMenu(v.place_id)}>
                      Skopiuj menu z: {v.place_name}{v.place_district ? ` (${v.place_district})` : ''}
                    </Btn>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <div className="grow">
                  <CardTitle>{selected.name}</CardTitle>
                  {en && <div className="text-xs text-spoot-ink2">{selected.name_en ? `Po angielsku: ${selected.name_en}` : 'Bez nazwy po angielsku — dodasz ją w „Zmień nazwę”'}</div>}
                </div>
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
                            <div className="flex gap-3">
                            {item.image_url
                              // eslint-disable-next-line @next/next/no-img-element
                              ? <img src={item.image_url} alt="" className="h-12 w-12 shrink-0 rounded-xl object-cover" />
                              : <span aria-hidden="true" className="h-12 w-12 shrink-0 rounded-xl bg-spoot-chip" />}
                            <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-display font-bold">{item.name}</span>
                              {item.is_vege && <span className="rounded-full bg-spoot-chip px-2 py-px font-display text-[10px] font-bold tracking-[0.5px]">WEGE</span>}
                              {item.spice_level > 0 && <span className="rounded-full bg-spoot-tint px-2 py-px font-display text-[10px] font-bold tracking-[0.5px]">{SPICE_LABELS[item.spice_level].toUpperCase()}</span>}
                              {en && !item.name_en && <span className="rounded-full border border-spoot-line px-2 py-px font-display text-[10px] font-bold tracking-[0.5px] text-spoot-ink2">BEZ EN</span>}
                              {!item.is_available && <span className="text-xs text-spoot-ink2">· niedostępne</span>}
                            </div>
                            {item.description && <div className="text-xs text-spoot-ink2">{item.description}</div>}
                            {item.allergens == null
                              ? <div className="text-xs font-bold text-spoot-danger">Alergeny nieuzupełnione</div>
                              : <div className="text-xs text-spoot-ink2">{item.allergens.length ? <><strong>Alergeny:</strong> {allergenLabels(item.allergens)}</> : 'Bez alergenów'}</div>}
                            </div>
                            </div>
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
              {en && (
                <div className="flex flex-col gap-4 border-t border-spoot-line pt-4">
                  <label className={labelCls}>
                    Nazwa po angielsku
                    <input lang="en" value={form.name_en} onChange={e => setForm({ ...form, name_en: e.target.value })} placeholder="np. Beef noodles" maxLength={80} className={inputCls} />
                  </label>
                  <label className={labelCls}>
                    Opis po angielsku
                    <textarea lang="en" value={form.description_en} onChange={e => setForm({ ...form, description_en: e.target.value })} maxLength={240} rows={3} className={`${inputCls} h-auto resize-y py-3`} />
                  </label>
                  <span className="text-xs text-spoot-ink2">
                    Goście z zagranicy zobaczą to w karcie po angielsku. Zmieniasz polską nazwę lub opis? Sprawdź, czy angielski nadal pasuje. Puste pole = goście zobaczą polski.
                  </span>
                </div>
              )}
              <div className="flex flex-col gap-1.5">
                <Eyebrow>Zdjęcie dania</Eyebrow>
                <div className="flex items-center gap-3">
                  {form.image_url
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={form.image_url} alt="Zdjęcie dania" className="h-[88px] w-[88px] shrink-0 rounded-xl object-cover" />
                    : <span aria-hidden="true" className="h-[88px] w-[88px] shrink-0 rounded-xl bg-spoot-chip" />}
                  <div className="flex flex-col items-start gap-1">
                    <label className="inline-flex h-9 cursor-pointer items-center rounded-xl border border-spoot-ink px-3 font-display text-[13px] font-bold hover:bg-spoot-chip/50">
                      {uploading ? 'Wgrywam…' : form.image_url ? 'Zmień zdjęcie' : 'Dodaj zdjęcie'}
                      <input type="file" accept="image/*" className="sr-only" onChange={uploadDishPhoto} disabled={uploading} />
                    </label>
                    {form.image_url && <Btn variant="danger" size="sm" onClick={() => setForm({ ...form, image_url: null })}>Usuń</Btn>}
                  </div>
                </div>
                <span className="text-xs text-spoot-ink2">Goście zobaczą je przy daniu w karcie.</span>
              </div>
              <fieldset>
                <legend className="pb-2"><Eyebrow>Alergeny</Eyebrow></legend>
                <div className="flex flex-wrap gap-1.5">
                  {ALLERGENS.map(a => {
                    const on = !!form.allergens?.includes(a.key);
                    return (
                      <button
                        key={a.key}
                        type="button"
                        aria-pressed={on}
                        onClick={() => toggleAllergen(a.key)}
                        className={`min-h-9 rounded-full px-3 font-display text-xs font-bold ${on ? 'bg-spoot-ink text-white' : 'border border-spoot-line bg-spoot-input hover:bg-spoot-chip/70'}`}
                      >
                        {a.label}
                      </button>
                    );
                  })}
                </div>
                <label className="mt-2 flex min-h-11 items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={form.allergens?.length === 0}
                    onChange={e => setForm({ ...form, allergens: e.target.checked ? [] : null })}
                    className={checkCls}
                  />
                  To danie nie zawiera żadnego z tych alergenów
                </label>
                <span className="block text-xs text-spoot-ink2">Zaznacz wszystko, co jest w daniu, albo potwierdź, że nie ma w nim alergenów. Goście zobaczą to przy pozycji w karcie.</span>
              </fieldset>
              <div className="flex flex-col gap-2.5 rounded-xl bg-spoot-input p-3.5">
                <div className="flex items-center gap-2">
                  <span className="grow font-display font-bold">Kalorie liczone przez Spoot</span>
                  <span className="rounded-full bg-spoot-orange px-2 py-0.5 font-display text-[10px] font-bold tracking-[0.5px]">WKRÓTCE</span>
                </div>
                <span className="text-xs text-spoot-ink2">Podasz gramatury składników, a my policzymy kalorie i pokażemy je gościom przy daniu.</span>
                <label className={labelCls}>
                  Gramatura porcji (g)
                  <input disabled placeholder="Dostępne wkrótce" className={inputCls} />
                </label>
              </div>
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

      {placeId && (
        <div className="flex flex-wrap items-stretch gap-6">
          <MenuQr placeId={placeId} />
          <MenuEntryRequest placeId={placeId} />
        </div>
      )}
    </>
  );
}
