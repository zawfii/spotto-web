'use client';

import { createBrowserClient } from '@supabase/ssr';
import { useEffect, useState, useCallback, useMemo } from 'react';
import type { MenuSection, MenuItem, MenuItemInput } from '@/lib/owner';
import { formatPrice } from '@/lib/owner';

export default function MenuPage() {
  const supabase = useMemo(
    () => createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    ),
    []
  );

  const [placeId, setPlaceId] = useState<string | null>(null);
  const [sections, setSections] = useState<MenuSection[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [sectionModal, setSectionModal] = useState<{ open: boolean; editId: string | null; name: string }>({ open: false, editId: null, name: '' });
  const [itemModal, setItemModal] = useState<{
    open: boolean; editId: string | null; sectionId: string;
    name: string; price: string; description: string;
    is_vege: boolean; spice_level: 0 | 1 | 2 | 3; is_available: boolean;
  }>({ open: false, editId: null, sectionId: '', name: '', price: '', description: '', is_vege: false, spice_level: 0, is_available: true });

  const load = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: vd } = await supabase.from('venue_details').select('place_id').eq('owner_id', user.id).maybeSingle();
      if (!vd) return;

      setPlaceId(vd.place_id);

      const { data: sectionRows } = await supabase
        .from('menu_sections')
        .select('id, name, position, menu_items(id, section_id, name, price, description, is_vege, spice_level, is_available, position)')
        .eq('place_id', vd.place_id)
        .order('position', { ascending: true });

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

  // ── Section CRUD ──────────────────────────────────────────────────────────

  async function saveSection() {
    const name = sectionModal.name.trim();
    if (!name || !placeId) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (sectionModal.editId) {
      const { error } = await supabase.from('menu_sections').update({ name }).eq('id', sectionModal.editId);
      if (error) { alert('Błąd zapisu: ' + error.message); return; }
      setSections(prev => prev.map(s => s.id === sectionModal.editId ? { ...s, name } : s));
    } else {
      const pos = sections.length;
      const { data, error } = await supabase.from('menu_sections')
        .insert({ place_id: placeId, owner_id: user.id, name, position: pos })
        .select('id, name, position')
        .single();
      if (error) { alert('Błąd zapisu: ' + error.message); return; }
      if (data) setSections(prev => [...prev, { ...data, menu_items: [] }]);
    }
    setSectionModal({ open: false, editId: null, name: '' });
  }

  async function deleteSection(sectionId: string) {
    const count = sections.find(s => s.id === sectionId)?.menu_items.length ?? 0;
    if (!confirm(`Usunąć sekcję${count > 0 ? ` i ${count} dań` : ''}?`)) return;
    await supabase.from('menu_sections').delete().eq('id', sectionId);
    setSections(prev => prev.filter(s => s.id !== sectionId));
  }

  // ── Item CRUD ─────────────────────────────────────────────────────────────

  async function saveItem() {
    const name = itemModal.name.trim();
    const price = parseFloat(itemModal.price.replace(',', '.'));
    if (!name || isNaN(price) || price <= 0) return;

    const payload: MenuItemInput = {
      name, price,
      description: itemModal.description.trim() || null,
      is_vege: itemModal.is_vege,
      spice_level: itemModal.spice_level,
      is_available: itemModal.is_available,
    };

    if (itemModal.editId) {
      const { error } = await supabase.from('menu_items').update(payload).eq('id', itemModal.editId);
      if (error) { alert('Błąd zapisu: ' + error.message); return; }
      setSections(prev => prev.map(s => ({
        ...s,
        menu_items: s.menu_items.map(item =>
          item.id === itemModal.editId ? { ...item, ...payload } : item
        ),
      })));
    } else {
      const section = sections.find(s => s.id === itemModal.sectionId);
      const pos = section?.menu_items.length ?? 0;
      const { data, error } = await supabase.from('menu_items')
        .insert({ section_id: itemModal.sectionId, ...payload, position: pos })
        .select()
        .single();
      if (error) { alert('Błąd zapisu: ' + error.message); return; }
      if (data) {
        setSections(prev => prev.map(s =>
          s.id === itemModal.sectionId
            ? { ...s, menu_items: [...s.menu_items, data as MenuItem] }
            : s
        ));
      }
    }
    setItemModal(m => ({ ...m, open: false }));
  }

  async function deleteItem(itemId: string) {
    if (!confirm('Usunąć danie?')) return;
    await supabase.from('menu_items').delete().eq('id', itemId);
    setSections(prev => prev.map(s => ({
      ...s,
      menu_items: s.menu_items.filter(item => item.id !== itemId),
    })));
  }

  if (loading) {
    return <div className="flex items-center justify-center h-40"><div className="text-2xl animate-spin">⏳</div></div>;
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-[#1a1a1a]">Menu</h1>
        <button
          onClick={() => setSectionModal({ open: true, editId: null, name: '' })}
          className="text-sm text-[#D4892A] font-semibold hover:underline"
        >
          + Dodaj sekcję
        </button>
      </div>

      {sections.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <div className="text-4xl mb-3">🍽</div>
          <p className="text-sm text-gray-500">Brak sekcji menu. Dodaj pierwszą sekcję powyżej.</p>
        </div>
      )}

      {sections.map(section => (
        <div key={section.id}>
          {/* Nagłówek sekcji */}
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-sm font-bold text-[#1a1a1a] flex-1">{section.name}</h2>
            <button
              onClick={() => setSectionModal({ open: true, editId: section.id, name: section.name })}
              className="text-xs text-gray-400 hover:text-[#D4892A]"
            >
              Edytuj
            </button>
            <button
              onClick={() => deleteSection(section.id)}
              className="text-xs text-red-400 hover:text-red-600"
            >
              Usuń
            </button>
          </div>

          {/* Dania */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {section.menu_items.map((item, idx) => (
              <div key={item.id} className={`flex items-center gap-3 px-4 py-3 ${idx > 0 ? 'border-t border-gray-50' : ''}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className={`text-sm font-medium ${!item.is_available ? 'text-gray-400' : 'text-[#1a1a1a]'}`}>
                      {item.name}
                    </span>
                    {!item.is_available && <span className="text-[10px] text-gray-400">· niedostępne</span>}
                  </div>
                  <div className="flex gap-1 mt-0.5">
                    {item.is_vege && <span className="text-xs">🌱</span>}
                    {item.spice_level > 0 && <span className="text-xs">{'🌶'.repeat(item.spice_level)}</span>}
                  </div>
                </div>
                <span className="text-sm font-semibold text-[#1a1a1a]">{formatPrice(item.price)}</span>
                <button
                  onClick={() => setItemModal({
                    open: true, editId: item.id, sectionId: item.section_id,
                    name: item.name, price: String(item.price),
                    description: item.description ?? '',
                    is_vege: item.is_vege, spice_level: item.spice_level, is_available: item.is_available,
                  })}
                  className="text-xs text-gray-400 hover:text-[#D4892A] px-1"
                >
                  ✏️
                </button>
                <button onClick={() => deleteItem(item.id)} className="text-xs text-red-400 hover:text-red-600 px-1">🗑</button>
              </div>
            ))}
            <button
              onClick={() => setItemModal({ open: true, editId: null, sectionId: section.id, name: '', price: '', description: '', is_vege: false, spice_level: 0, is_available: true })}
              className="w-full flex items-center gap-2 px-4 py-3 border-t border-gray-50 text-sm text-[#D4892A] hover:bg-gray-50 transition-colors"
            >
              <span>+</span> Dodaj danie
            </button>
          </div>
        </div>
      ))}

      {/* Modal: Sekcja */}
      {sectionModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 space-y-4">
            <h3 className="font-bold text-[#1a1a1a]">{sectionModal.editId ? 'Edytuj sekcję' : 'Nowa sekcja'}</h3>
            <input
              autoFocus
              value={sectionModal.name}
              onChange={e => setSectionModal(m => ({ ...m, name: e.target.value }))}
              placeholder="Nazwa sekcji"
              maxLength={50}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4892A]"
            />
            <div className="flex gap-2">
              <button onClick={() => setSectionModal({ open: false, editId: null, name: '' })} className="flex-1 py-3 rounded-full bg-gray-100 text-sm font-semibold text-[#1a1a1a]">Anuluj</button>
              <button onClick={saveSection} disabled={!sectionModal.name.trim()} className="flex-1 py-3 rounded-full bg-[#1a1a1a] text-white text-sm font-semibold disabled:opacity-40">Zapisz</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Danie */}
      {itemModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 space-y-3 max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-[#1a1a1a]">{itemModal.editId ? 'Edytuj danie' : 'Nowe danie'}</h3>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Nazwa *</label>
              <input autoFocus value={itemModal.name} onChange={e => setItemModal(m => ({ ...m, name: e.target.value }))} placeholder="Nazwa dania" maxLength={80} className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-[#D4892A]" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Cena (zł) *</label>
              <input value={itemModal.price} onChange={e => setItemModal(m => ({ ...m, price: e.target.value }))} placeholder="np. 38" inputMode="decimal" className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-[#D4892A]" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Opis</label>
              <textarea value={itemModal.description} onChange={e => setItemModal(m => ({ ...m, description: e.target.value }))} placeholder="Krótki opis..." maxLength={240} rows={2} className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm mt-1 resize-none focus:outline-none focus:ring-2 focus:ring-[#D4892A]" />
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-sm text-[#1a1a1a]">🌱 Wegetariańskie</span>
              <button onClick={() => setItemModal(m => ({ ...m, is_vege: !m.is_vege }))} className={`w-10 h-5 rounded-full transition-colors relative ${itemModal.is_vege ? 'bg-[#D4892A]' : 'bg-gray-200'}`}>
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${itemModal.is_vege ? 'left-5' : 'left-0.5'}`} />
              </button>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Ostrość</label>
              <div className="flex gap-2 mt-1">
                {([0, 1, 2, 3] as const).map(level => (
                  <button key={level} onClick={() => setItemModal(m => ({ ...m, spice_level: level }))} className={`flex-1 py-1.5 rounded-lg text-xs border transition-colors ${itemModal.spice_level === level ? 'border-[#D4892A] bg-orange-50' : 'border-gray-200'}`}>
                    {level === 0 ? 'Brak' : '🌶'.repeat(level)}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-sm text-[#1a1a1a]">✅ Dostępne</span>
              <button onClick={() => setItemModal(m => ({ ...m, is_available: !m.is_available }))} className={`w-10 h-5 rounded-full transition-colors relative ${itemModal.is_available ? 'bg-[#D4892A]' : 'bg-gray-200'}`}>
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${itemModal.is_available ? 'left-5' : 'left-0.5'}`} />
              </button>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setItemModal(m => ({ ...m, open: false }))} className="flex-1 py-3 rounded-full bg-gray-100 text-sm font-semibold text-[#1a1a1a]">Anuluj</button>
              <button onClick={saveItem} disabled={!itemModal.name.trim() || !itemModal.price.trim()} className="flex-1 py-3 rounded-full bg-[#1a1a1a] text-white text-sm font-semibold disabled:opacity-40">Zapisz</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
