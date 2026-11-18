'use client';

import { useEffect, useState, useCallback } from 'react';
import type { VenuePhoto, Hours, DayKey } from '@/lib/owner';
import { DEFAULT_HOURS } from '@/lib/owner';
import { useOwnerVenue } from '@/lib/owner-client';
import { Btn, Card, CardTitle, Eyebrow, Loading, NavIcon, NAV_ICONS, PageHeader, checkCls, inputCls, labelCls } from '@/components/owner/ui';

const DAY_LABELS: { key: DayKey; label: string }[] = [
  { key: 'mon', label: 'Poniedziałek' },
  { key: 'tue', label: 'Wtorek' },
  { key: 'wed', label: 'Środa' },
  { key: 'thu', label: 'Czwartek' },
  { key: 'fri', label: 'Piątek' },
  { key: 'sat', label: 'Sobota' },
  { key: 'sun', label: 'Niedziela' },
];
const MAX_PHOTOS = 10;

export default function SettingsPage() {
  const { supabase, userId, venue, loading: venueLoading } = useOwnerVenue();
  const venueId = venue?.id ?? null;
  const placeId = venue?.place_id ?? null;
  const [photos, setPhotos] = useState<VenuePhoto[]>([]);
  // Zdjęcia z Google (place_photos, source='google') — import; właściciel może je usunąć.
  const [googlePhotos, setGooglePhotos] = useState<{ id: string; url: string }[]>([]);
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
  // Rezerwacji jeszcze nie ma — przełącznik zniknął z ekranu, wartość z bazy przepisujemy bez zmian.
  const [reservationNotif, setReservationNotif] = useState(true);
  // PIN żyje w venue_staff_pins (widoczny tylko dla właściciela); savedPin = stan w bazie.
  const [staffPin, setStaffPin] = useState('');
  const [savedPin, setSavedPin] = useState('');

  const load = useCallback(async () => {
    if (!venue || !userId) return;
    try {
      const { data: vd } = await supabase
        .from('venue_details')
        .select('description, phone, address, instagram, menu_url, hours, reservation_notifications')
        .eq('place_id', venue.place_id)
        .eq('owner_id', userId)
        .maybeSingle();
      if (!vd) return;

      setDescription(vd.description ?? '');
      setPhone(vd.phone ?? '');
      setAddress(vd.address ?? '');
      setInstagram(vd.instagram ?? '');
      setMenuUrl(vd.menu_url ?? '');
      setHours((vd.hours as Hours) ?? DEFAULT_HOURS);
      setReservationNotif(vd.reservation_notifications ?? true);

      const [{ data: photoRows }, { data: pinRow }, { data: googleRows }] = await Promise.all([
        supabase.from('venue_photos').select('*').eq('owner_id', userId).eq('place_id', venue.place_id).order('position', { ascending: true }),
        supabase.from('venue_staff_pins').select('pin').eq('venue_id', venue.id).maybeSingle(),
        supabase.from('place_photos').select('id, url').eq('place_id', venue.place_id).eq('source', 'google').order('position'),
      ]);
      setPhotos((photoRows ?? []) as VenuePhoto[]);
      setGooglePhotos(googleRows ?? []);
      setStaffPin(pinRow?.pin ?? '');
      setSavedPin(pinRow?.pin ?? '');
    } finally {
      setLoading(false);
    }
  }, [supabase, userId, venue]);

  useEffect(() => { load(); }, [load]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!placeId) return;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from('venue_details').upsert(
        { owner_id: user.id, place_id: placeId, description, phone, address, instagram, menu_url: menuUrl, hours, reservation_notifications: reservationNotif },
        { onConflict: 'place_id' }
      );
      if (error) throw error;

      const pin = staffPin.trim();
      if (venueId && pin !== savedPin) {
        const { error: pinError } = await supabase.from('venue_staff_pins').upsert({ venue_id: venueId, pin });
        if (pinError) throw pinError;
        setSavedPin(pin);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      alert('Nie udało się zapisać zmian. Spróbuj ponownie.');
    } finally {
      setSaving(false);
    }
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.target;
    const file = input.files?.[0];
    if (!file || !placeId || photos.length >= MAX_PHOTOS) return;
    setUploadingPhoto(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
      const storagePath = `${user.id}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('venue-photos')
        .upload(storagePath, file, { contentType: file.type, upsert: false });
      if (uploadError) { alert('Nie udało się wgrać zdjęcia: ' + uploadError.message); return; }

      const { data: urlData } = supabase.storage.from('venue-photos').getPublicUrl(storagePath);
      const { data: photoRow } = await supabase
        .from('venue_photos')
        .insert({ place_id: placeId, owner_id: user.id, url: urlData.publicUrl, storage_path: storagePath, position: photos.length })
        .select()
        .single();
      if (photoRow) setPhotos(prev => [...prev, photoRow as VenuePhoto]);
    } finally {
      setUploadingPhoto(false);
      input.value = '';
    }
  }

  async function handleDeletePhoto(photo: VenuePhoto) {
    if (!confirm('Usunąć to zdjęcie?')) return;
    await supabase.storage.from('venue-photos').remove([photo.storage_path]);
    await supabase.from('venue_photos').delete().eq('id', photo.id);
    setPhotos(prev => prev.filter(p => p.id !== photo.id));
  }

  async function deleteGooglePhoto(id: string) {
    if (!confirm('Usunąć to zdjęcie z Google? Goście przestaną je widzieć w Spoot. Tego nie da się cofnąć.')) return;
    const { error } = await supabase.rpc('delete_place_google_photo', { p_photo_id: id });
    if (error) { alert('Nie udało się usunąć zdjęcia. Spróbuj ponownie.'); return; }
    setGooglePhotos(prev => prev.filter(p => p.id !== id));
  }

  function updateHour(day: DayKey, field: 'open' | 'close' | 'closed', value: string | boolean) {
    setHours(prev => ({ ...prev, [day]: { ...prev[day], [field]: value } }));
  }

  function copyMondayToAll() {
    setHours(prev => Object.fromEntries(DAY_LABELS.map(({ key }) => [key, { ...prev.mon }])) as Hours);
  }

  if (venueLoading || (venue && loading)) return <Loading />;

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-6">
      <PageHeader eyebrow="Profil lokalu" title="To widzą goście w Spoot">
        <span role="status" className="self-center font-display text-[13px] font-bold">{saved ? 'Zapisano' : ''}</span>
        <Btn type="submit" disabled={saving}>{saving ? 'Zapisuję…' : 'Zapisz zmiany'}</Btn>
      </PageHeader>

      <Card className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="grow"><CardTitle>Zdjęcia i profil</CardTitle></div>
          <span className="text-xs text-spoot-ink2">{photos.length}/{MAX_PHOTOS} · Twoje zdjęcia goście widzą jako pierwsze</span>
        </div>
        <Eyebrow>Twoje zdjęcia</Eyebrow>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3">
          {photos.map((photo, i) => (
            <div key={photo.id} className="relative h-40 overflow-hidden rounded-2xl bg-spoot-chip">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.url} alt={`Zdjęcie lokalu ${i + 1}`} className="h-full w-full object-cover" />
              {i === 0 && <Eyebrow className="absolute left-2 top-2 rounded-full bg-black/60 px-2.5 py-0.5 !text-[10px] text-white">Okładka</Eyebrow>}
              <button
                type="button"
                onClick={() => handleDeletePhoto(photo)}
                aria-label={`Usuń zdjęcie ${i + 1}`}
                className="absolute right-1 top-1 flex h-11 w-11 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
              >
                <NavIcon>{NAV_ICONS.close}</NavIcon>
              </button>
            </div>
          ))}
          {photos.length < MAX_PHOTOS && (
            <label className="flex h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-[1.5px] border-dashed border-spoot-ink/50 font-display font-bold hover:bg-spoot-chip/50">
              <NavIcon>{NAV_ICONS.plus}</NavIcon>
              {uploadingPhoto ? 'Wgrywam…' : 'Dodaj zdjęcie'}
              <input type="file" accept="image/*" className="sr-only" onChange={handlePhotoUpload} disabled={uploadingPhoto} />
            </label>
          )}
        </div>
        {googlePhotos.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-spoot-line pt-4">
            <div className="flex flex-col gap-0.5">
              <Eyebrow>Z Google · {googlePhotos.length}</Eyebrow>
              <span className="text-xs text-spoot-ink2">
                Pobrane z wizytówki lokalu w Google. Goście widzą je w Spoot po Twoich zdjęciach i zdjęciach z ocen. Możesz usunąć te, które Ci nie pasują. Zdjęć dodanych przez gości przy ocenach nie da się usunąć.
              </span>
            </div>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3">
              {googlePhotos.map((photo, i) => (
                <div key={photo.id} className="relative h-40 overflow-hidden rounded-2xl bg-spoot-chip">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.url} alt={`Zdjęcie z Google ${i + 1}`} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => deleteGooglePhoto(photo.id)}
                    aria-label={`Usuń zdjęcie z Google ${i + 1}`}
                    className="absolute right-1 top-1 flex h-11 w-11 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                  >
                    <NavIcon>{NAV_ICONS.close}</NavIcon>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        <label className={labelCls}>
          Opis
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} placeholder="Opisz swoją restaurację..." className={`${inputCls} h-auto resize-y py-3`} />
        </label>
      </Card>

      <div className="flex flex-wrap items-start gap-6">
        <Card className="flex min-w-0 flex-[1_1_400px] flex-col">
          <div className="pb-3"><CardTitle>Godziny otwarcia</CardTitle></div>
          {DAY_LABELS.map(({ key, label }) => {
            const schedule = hours[key];
            return (
              <div key={key} className="flex flex-wrap items-center gap-2 border-t border-spoot-line py-2">
                <span className="flex-[1_1_96px] font-display font-semibold">{label}</span>
                <input type="time" value={schedule.closed ? '' : schedule.open} onChange={e => updateHour(key, 'open', e.target.value)} disabled={schedule.closed} aria-label={`${label} od`} className={`${inputCls} !w-28`} />
                <input type="time" value={schedule.closed ? '' : schedule.close} onChange={e => updateHour(key, 'close', e.target.value)} disabled={schedule.closed} aria-label={`${label} do`} className={`${inputCls} !w-28`} />
                <label className="flex min-h-11 items-center gap-2">
                  <input type="checkbox" checked={schedule.closed} onChange={e => updateHour(key, 'closed', e.target.checked)} className={checkCls} />
                  Zamknięte
                </label>
              </div>
            );
          })}
          <div className="pt-2"><Btn variant="outline" size="sm" onClick={copyMondayToAll}>Skopiuj poniedziałek na cały tydzień</Btn></div>
        </Card>

        <div className="flex min-w-0 flex-[1_1_400px] flex-col gap-6">
          <Card className="flex flex-col gap-4">
            <CardTitle>Dane biznesowe</CardTitle>
            <label className={labelCls}>
              Telefon
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+48 600 000 000" className={inputCls} />
            </label>
            <label className={labelCls}>
              Adres
              <input value={address} onChange={e => setAddress(e.target.value)} placeholder="ul. Przykładowa 1, Warszawa" className={inputCls} />
            </label>
            <label className={labelCls}>
              Menu na Twojej stronie (opcjonalnie)
              <input type="url" value={menuUrl} onChange={e => setMenuUrl(e.target.value)} placeholder="https://..." className={inputCls} />
              <span className="font-body text-xs font-normal normal-case tracking-normal text-spoot-ink2">
                Masz kartę na własnej stronie albo w PDF? Wklej adres, a goście dostaną przycisk „Zobacz menu”. Zostaw puste, jeśli uzupełniasz zakładkę Menu.
              </span>
            </label>
            <label className={labelCls}>
              Instagram
              <input value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="@twojlokal" className={inputCls} />
            </label>
          </Card>

          <Card className="flex flex-col">
            <div className="pb-3"><CardTitle>Dostęp personelu</CardTitle></div>
            <label className={`${labelCls} border-t border-spoot-line pt-3`}>
              PIN
              <input value={staffPin} onChange={e => setStaffPin(e.target.value)} inputMode="numeric" maxLength={8} placeholder="PIN np. 1234 — puste = brak blokady" className={inputCls} />
              <span className="font-body text-xs font-normal normal-case tracking-normal text-spoot-ink2">
                W aplikacji na wspólnym telefonie PIN blokuje Menu, Oferty, Statystyki i Ustawienia. Bez PIN-u personel skanuje karty i widzi pulpit.
              </span>
            </label>
          </Card>
        </div>
      </div>
    </form>
  );
}
