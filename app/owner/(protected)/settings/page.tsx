'use client';

import { createBrowserClient } from '@supabase/ssr';
import { useEffect, useState, useCallback, useMemo } from 'react';
import type { VenueInfo, VenuePhoto, Hours, DayKey } from '@/lib/owner';
import { DEFAULT_HOURS } from '@/lib/owner';

const DAY_LABELS: { key: DayKey; label: string }[] = [
  { key: 'mon', label: 'Poniedziałek' },
  { key: 'tue', label: 'Wtorek' },
  { key: 'wed', label: 'Środa' },
  { key: 'thu', label: 'Czwartek' },
  { key: 'fri', label: 'Piątek' },
  { key: 'sat', label: 'Sobota' },
  { key: 'sun', label: 'Niedziela' },
];

export default function SettingsPage() {
  const supabase = useMemo(
    () => createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    ),
    []
  );

  const [venue, setVenue] = useState<VenueInfo | null>(null);
  const [photos, setPhotos] = useState<VenuePhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [saved, setSaved] = useState(false);

  // Form state
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [instagram, setInstagram] = useState('');
  const [menuUrl, setMenuUrl] = useState('');
  const [hours, setHours] = useState<Hours>(DEFAULT_HOURS);

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: vd } = await supabase
      .from('venue_details')
      .select('*')
      .eq('owner_id', user.id)
      .maybeSingle();
    if (!vd) return;

    const { data: place } = await supabase
      .from('places')
      .select('name, category, district, image_url')
      .eq('id', vd.place_id)
      .maybeSingle();

    const v: VenueInfo = {
      place_id: vd.place_id,
      place_name: place?.name ?? '',
      place_category: place?.category ?? '',
      place_district: place?.district ?? null,
      place_image_url: place?.image_url ?? null,
      description: vd.description ?? '',
      phone: vd.phone ?? '',
      address: vd.address ?? '',
      instagram: vd.instagram ?? '',
      menu_url: vd.menu_url ?? '',
      hours: (vd.hours as Hours) ?? DEFAULT_HOURS,
      is_premium: vd.is_premium ?? false,
      reservation_notifications: vd.reservation_notifications ?? true,
    };

    setVenue(v);
    setDescription(v.description);
    setPhone(v.phone);
    setAddress(v.address);
    setInstagram(v.instagram);
    setMenuUrl(v.menu_url);
    setHours(v.hours);

    const { data: photoRows } = await supabase
      .from('venue_photos')
      .select('*')
      .eq('owner_id', user.id)
      .order('position', { ascending: true });
    setPhotos((photoRows ?? []) as VenuePhoto[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  async function handleSave() {
    if (!venue) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    await supabase.from('venue_details').upsert(
      { owner_id: user.id, place_id: venue.place_id, description, phone, address, instagram, menu_url: menuUrl, hours },
      { onConflict: 'place_id' }
    );
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !venue || photos.length >= 10) return;
    setUploadingPhoto(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setUploadingPhoto(false); return; }

    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
    const storagePath = `${user.id}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('venue-photos')
      .upload(storagePath, file, { contentType: file.type, upsert: false });

    if (uploadError) {
      setUploadingPhoto(false);
      alert('Błąd uploadu: ' + uploadError.message);
      return;
    }

    const { data: urlData } = supabase.storage.from('venue-photos').getPublicUrl(storagePath);

    const { data: photoRow } = await supabase
      .from('venue_photos')
      .insert({ place_id: venue.place_id, owner_id: user.id, url: urlData.publicUrl, storage_path: storagePath, position: photos.length })
      .select()
      .single();

    if (photoRow) setPhotos(prev => [...prev, photoRow as VenuePhoto]);
    setUploadingPhoto(false);
    e.target.value = '';
  }

  async function handleDeletePhoto(photo: VenuePhoto) {
    if (!confirm('Usunąć to zdjęcie?')) return;
    await supabase.storage.from('venue-photos').remove([photo.storage_path]);
    await supabase.from('venue_photos').delete().eq('id', photo.id);
    setPhotos(prev => prev.filter(p => p.id !== photo.id));
  }

  function updateHour(day: DayKey, field: 'open' | 'close' | 'closed', value: string | boolean) {
    setHours(prev => ({ ...prev, [day]: { ...prev[day], [field]: value } }));
  }

  if (loading) {
    return <div className="flex items-center justify-center h-40"><div className="text-2xl animate-spin">⏳</div></div>;
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-lg font-bold text-[#1a1a1a]">Ustawienia lokalu</h1>

      {/* Zdjęcia */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-[#1a1a1a]">Zdjęcia</h2>
          <span className="text-xs text-gray-400">{photos.length}/10</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {photos.map(photo => (
            <div key={photo.id} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.url} alt="" className="w-20 h-20 rounded-xl object-cover" />
              <button
                onClick={() => handleDeletePhoto(photo)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center hover:bg-red-600"
              >
                ×
              </button>
            </div>
          ))}
          {photos.length < 10 && (
            <label className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-[#D4892A] transition-colors">
              {uploadingPhoto ? (
                <span className="text-xs text-gray-400">...</span>
              ) : (
                <>
                  <span className="text-xl text-gray-400">+</span>
                  <span className="text-[9px] text-gray-400 font-semibold">DODAJ</span>
                </>
              )}
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploadingPhoto} />
            </label>
          )}
        </div>
      </section>

      {/* Opis */}
      <section className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <h2 className="text-sm font-bold text-[#1a1a1a]">Opis restauracji</h2>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={4}
          placeholder="Opisz swój lokal..."
          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#D4892A]"
        />
      </section>

      {/* Dane kontaktowe */}
      <section className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50 overflow-hidden">
        <div className="px-5 py-3">
          <h2 className="text-sm font-bold text-[#1a1a1a]">Dane kontaktowe</h2>
        </div>
        {[
          { icon: '📞', label: 'Telefon', value: phone, setter: setPhone, type: 'tel', placeholder: '+48 600 000 000' },
          { icon: '📍', label: 'Adres', value: address, setter: setAddress, type: 'text', placeholder: 'ul. Przykładowa 1, Warszawa' },
          { icon: '🔗', label: 'Link do menu', value: menuUrl, setter: setMenuUrl, type: 'url', placeholder: 'https://...' },
          { icon: '📸', label: 'Instagram', value: instagram, setter: setInstagram, type: 'text', placeholder: '@twojlokal' },
        ].map(field => (
          <div key={field.label} className="flex items-center gap-3 px-5 py-3">
            <span className="text-base w-6 flex-shrink-0">{field.icon}</span>
            <input
              type={field.type}
              value={field.value}
              onChange={e => field.setter(e.target.value)}
              placeholder={field.placeholder}
              className="flex-1 text-sm text-[#1a1a1a] focus:outline-none placeholder:text-gray-300"
            />
          </div>
        ))}
      </section>

      {/* Godziny otwarcia */}
      <section className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-50">
          <h2 className="text-sm font-bold text-[#1a1a1a]">Godziny otwarcia</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {DAY_LABELS.map(({ key, label }) => {
            const schedule = hours[key];
            return (
              <div key={key} className="flex items-center gap-3 px-5 py-3">
                <span className="text-sm text-[#1a1a1a] flex-1">{label}</span>
                <button
                  onClick={() => updateHour(key, 'closed', !schedule.closed)}
                  className={`w-10 h-5 rounded-full transition-colors relative flex-shrink-0 ${schedule.closed ? 'bg-gray-200' : 'bg-[#D4892A]'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${schedule.closed ? 'left-0.5' : 'left-5'}`} />
                </button>
                {schedule.closed ? (
                  <span className="text-xs text-gray-400 w-28 text-center">Zamknięte</span>
                ) : (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <input
                      type="text"
                      value={schedule.open}
                      onChange={e => updateHour(key, 'open', e.target.value)}
                      maxLength={5}
                      placeholder="00:00"
                      className="w-12 h-7 rounded-lg border border-gray-200 text-center text-xs focus:outline-none focus:ring-1 focus:ring-[#D4892A]"
                    />
                    <span className="text-gray-400 text-xs">–</span>
                    <input
                      type="text"
                      value={schedule.close}
                      onChange={e => updateHour(key, 'close', e.target.value)}
                      maxLength={5}
                      placeholder="00:00"
                      className="w-12 h-7 rounded-lg border border-gray-200 text-center text-xs focus:outline-none focus:ring-1 focus:ring-[#D4892A]"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Przycisk zapisz */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-3.5 bg-[#1a1a1a] text-white rounded-full font-semibold text-sm disabled:opacity-50 hover:bg-[#333] transition-colors"
      >
        {saving ? 'Zapisywanie...' : saved ? '✓ Zapisano!' : 'Zapisz zmiany'}
      </button>
    </div>
  );
}
