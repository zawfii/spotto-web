'use client';

import { useEffect, useState } from 'react';
import type { useOwnerVenue } from '@/lib/owner-client';
import { Btn, Card, CardTitle } from './ui';

type Props = {
  supabase: ReturnType<typeof useOwnerVenue>['supabase'];
  userId: string | null;
  venueId: string;
  placeId: string;
  googleUrl: string | null;
};

/** Zdjęcie w tle na stronie lokalu (spootme.pl/place/[id], też po zeskanowaniu kodu QR). Bez niego — zdjęcie z Google. */
export default function CoverPhoto({ supabase, userId, venueId, placeId, googleUrl }: Props) {
  const [cover, setCover] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.from('venue_details').select('cover_url').eq('id', venueId).maybeSingle()
      .then(({ data }) => setCover((data?.cover_url as string | null) ?? null));
  }, [supabase, venueId]);

  // ponytail: stare zdjęcie zostaje w storage (jak przy zdjęciach dań); sprzątanie, gdy zacznie zajmować miejsce.
  async function save(url: string | null) {
    const { error } = await supabase.from('venue_details').update({ cover_url: url }).eq('id', venueId);
    if (error) alert('Nie udało się zapisać zdjęcia: ' + error.message);
    else setCover(url);
  }

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.target;
    const file = input.files?.[0];
    if (!file || !userId) return;
    setBusy(true);
    try {
      const ext = (file.name.split('.').pop() ?? 'jpg').toLowerCase();
      const path = `${userId}/cover-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('venue-photos').upload(path, file, { contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}` });
      if (error) { alert('Nie udało się wgrać zdjęcia: ' + error.message); return; }
      await save(supabase.storage.from('venue-photos').getPublicUrl(path).data.publicUrl);
    } finally {
      setBusy(false);
      input.value = '';
    }
  }

  const shown = cover ?? googleUrl;
  return (
    <Card className="flex flex-wrap items-center gap-5">
      {shown
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={shown} alt="Zdjęcie w tle" className="h-[120px] w-[200px] shrink-0 rounded-2xl object-cover" />
        : <span aria-hidden="true" className="h-[120px] w-[200px] shrink-0 rounded-2xl bg-spoot-chip" />}
      <div className="flex min-w-0 flex-[1_1_260px] flex-col gap-3">
        <div className="flex flex-col gap-1">
          <CardTitle>Zdjęcie w tle</CardTitle>
          <p className="text-spoot-ink2">
            Duże zdjęcie nad kartą dań na stronie lokalu — goście widzą je też po zeskanowaniu kodu QR.
            {!cover && (googleUrl ? ' Teraz wyświetla się zdjęcie z Google.' : ' Teraz strona nie ma zdjęcia.')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="inline-flex h-9 cursor-pointer items-center rounded-xl border border-spoot-ink px-3 font-display text-[13px] font-bold hover:bg-spoot-chip/50">
            {busy ? 'Wgrywam…' : cover ? 'Zmień zdjęcie' : 'Wgraj zdjęcie'}
            <input type="file" accept="image/*" className="sr-only" onChange={upload} disabled={busy} />
          </label>
          {cover && <Btn variant="danger" size="sm" onClick={() => save(null)}>Usuń</Btn>}
          <a href={`https://spootme.pl/place/${placeId}`} target="_blank" rel="noopener noreferrer" className="px-2 py-2 font-display text-[13px] font-bold text-spoot-green underline underline-offset-4">
            Zobacz stronę lokalu
          </a>
        </div>
      </div>
    </Card>
  );
}
