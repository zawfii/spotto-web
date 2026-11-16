'use client';

import { useState } from 'react';
import { useSupabase } from '@/lib/owner-client';
import { Btn, Eyebrow, inputCls } from './ui';

const MAX = 1000;

/** Odpowiedź właściciela na opinię (tabela rating_replies, jedna na opinię). Goście widzą ją pod opinią w aplikacji. */
export default function ReviewReply({ ratingId, placeId, initial }: { ratingId: string; placeId: string; initial: string | null }) {
  const supabase = useSupabase();
  const [saved, setSaved] = useState(initial);
  const [draft, setDraft] = useState<string | null>(null); // null = formularz zamknięty
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const body = (draft ?? '').trim();
    if (!body) return;
    setBusy(true);
    const { error } = await supabase
      .from('rating_replies')
      .upsert({ rating_id: ratingId, place_id: placeId, body, updated_at: new Date().toISOString() });
    setBusy(false);
    if (error) { alert('Nie udało się zapisać odpowiedzi. Spróbuj ponownie.'); return; }
    setSaved(body);
    setDraft(null);
  }

  async function remove() {
    if (!confirm('Usunąć odpowiedź?')) return;
    setBusy(true);
    const { error } = await supabase.from('rating_replies').delete().eq('rating_id', ratingId);
    setBusy(false);
    if (error) { alert('Nie udało się usunąć odpowiedzi. Spróbuj ponownie.'); return; }
    setSaved(null);
  }

  if (draft !== null) {
    return (
      <form onSubmit={save} className="flex flex-col gap-2">
        <textarea
          autoFocus
          value={draft}
          onChange={e => setDraft(e.target.value)}
          maxLength={MAX}
          rows={3}
          aria-label="Odpowiedź na opinię"
          placeholder="Podziękuj albo wyjaśnij — odpowiedź zobaczą wszyscy goście."
          className={`${inputCls} h-auto resize-y py-2.5`}
        />
        <div className="flex flex-wrap items-center gap-2">
          <Btn type="submit" size="sm" disabled={busy || !draft.trim()}>{busy ? 'Zapisuję…' : 'Opublikuj odpowiedź'}</Btn>
          <Btn variant="ghost" size="sm" onClick={() => setDraft(null)}>Anuluj</Btn>
          <span className="ml-auto text-xs text-spoot-ink2">{draft.length}/{MAX}</span>
        </div>
      </form>
    );
  }

  if (saved) {
    return (
      <div className="flex flex-col gap-1 rounded-xl bg-spoot-input p-3">
        <Eyebrow>Twoja odpowiedź</Eyebrow>
        <p className="whitespace-pre-line">{saved}</p>
        <div className="flex gap-1">
          <Btn variant="ghost" size="sm" onClick={() => setDraft(saved)}>Edytuj</Btn>
          <Btn variant="danger" size="sm" onClick={remove} disabled={busy}>Usuń</Btn>
        </div>
      </div>
    );
  }

  return <div><Btn variant="outline" size="sm" onClick={() => setDraft('')}>Odpowiedz</Btn></div>;
}
