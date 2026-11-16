'use client';

import { useCallback, useEffect, useState } from 'react';
import { useOwnerVenue } from '@/lib/owner-client';
import { CARD_PALETTES, CARD_PATTERNS, UUID_RE, maxTierStamps, nextRewardLabel, resolveCardDesign } from '@/lib/owner-loyalty';
import type { AddStampResult, LoyaltyCardDesign, LoyaltyTier, PaletteKey } from '@/lib/owner-loyalty';
import { pluralPl } from '@/lib/format';
import LoyaltyCardFace from '@/components/owner/LoyaltyCardFace';
import QrScanner from '@/components/owner/QrScanner';
import { Btn, Card, CardTitle, Eyebrow, Initial, Loading, NavIcon, NAV_ICONS, PageHeader, StatCard, checkCls, inputCls } from '@/components/owner/ui';

type Cardholder = { user_id: string; display_name: string; stamp_count: number };
type Customer = { id: string; display_name: string; stamp_count: number };
type ScanStep =
  | { step: 'scanning' }
  | { step: 'loading' }
  | { step: 'confirm'; customer: Customer }
  | { step: 'result'; result: AddStampResult }
  | { step: 'error'; message: string };

export default function LoyaltyPage() {
  const { supabase, userId, venue, place, loading: venueLoading, reload } = useOwnerVenue();

  const [enabled, setEnabled] = useState(false);
  const [tiers, setTiers] = useState<{ stamps: string; reward: string }[]>([]);
  const [design, setDesign] = useState<LoyaltyCardDesign>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState<'image' | 'logo' | null>(null);

  const [cardholders, setCardholders] = useState<Cardholder[]>([]);
  const [redeemed, setRedeemed] = useState(0);
  const [scan, setScan] = useState<ScanStep | null>(null);

  useEffect(() => {
    if (!venue) return;
    setEnabled(venue.loyalty_enabled ?? false);
    setTiers((venue.loyalty_tiers ?? []).map(t => ({ stamps: String(t.stamps), reward: t.reward })));
    setDesign(venue.loyalty_card_design ?? {});
  }, [venue]);

  const loadCardholders = useCallback(async () => {
    if (!venue) return;
    const [stampsRes, redemptionsRes] = await Promise.all([
      supabase.from('loyalty_stamps').select('user_id, stamp_count').eq('place_id', venue.place_id).gt('stamp_count', 0).order('stamp_count', { ascending: false }),
      supabase.from('loyalty_redemptions').select('id', { count: 'exact', head: true }).eq('place_id', venue.place_id),
    ]);
    const rows = stampsRes.data ?? [];
    const ids = rows.map(r => r.user_id);
    const { data: profiles } = ids.length
      ? await supabase.from('profiles').select('id, display_name').in('id', ids)
      : { data: [] as { id: string; display_name: string | null }[] };
    const names = Object.fromEntries((profiles ?? []).map(p => [p.id, p.display_name]));
    setCardholders(rows.map(r => ({ user_id: r.user_id, display_name: names[r.user_id] || 'Gość', stamp_count: r.stamp_count })));
    setRedeemed(redemptionsRes.count ?? 0);
  }, [supabase, venue]);

  useEffect(() => { loadCardholders(); }, [loadCardholders]);

  const parsedTiers: LoyaltyTier[] = tiers
    .map(t => ({ stamps: parseInt(t.stamps, 10), reward: t.reward.trim() }))
    .filter(t => Number.isFinite(t.stamps) && t.stamps > 0)
    .sort((a, b) => a.stamps - b.stamps);
  const savedTiers = venue?.loyalty_tiers ?? [];
  const required = maxTierStamps(savedTiers);
  const resolved = resolveCardDesign(design, place?.image_url);
  const programLive = !!venue?.loyalty_enabled && required > 0;

  async function save() {
    if (!venue) return;
    // Próg bez opisu dawał na karcie klienta „5: · 9:” — nie zapisujemy go (jak w apce).
    if (enabled && parsedTiers.some(t => !t.reward)) {
      alert('Każdy próg potrzebuje opisu nagrody, np. „Kawa gratis”.');
      return;
    }
    if (enabled && parsedTiers.length === 0) {
      alert('Dodaj co najmniej jeden próg nagrody.');
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from('venue_details')
      .update({ loyalty_enabled: enabled, loyalty_tiers: parsedTiers, loyalty_card_design: design })
      .eq('id', venue.id);
    setSaving(false);
    if (error) { alert('Nie udało się zapisać zmian. Spróbuj ponownie.'); return; }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    reload();
  }

  async function uploadCardImage(kind: 'image' | 'logo', e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.target;
    const file = input.files?.[0];
    if (!file || !userId) return;
    setUploading(kind);
    try {
      const ext = (file.name.split('.').pop() ?? 'jpg').toLowerCase();
      const path = `${userId}/card-${kind}-${Date.now()}.${ext}`;
      // bucket akceptuje tylko "image/jpeg", nie "image/jpg"
      const { error } = await supabase.storage.from('venue-photos').upload(path, file, { contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}` });
      if (error) { alert('Nie udało się wgrać zdjęcia: ' + error.message); return; }
      const url = supabase.storage.from('venue-photos').getPublicUrl(path).data.publicUrl;
      setDesign(d => ({ ...d, [kind === 'logo' ? 'logo_url' : 'image_url']: url }));
    } finally {
      setUploading(null);
      input.value = '';
    }
  }

  // ── Skanowanie ────────────────────────────────────────────────────────────

  async function handleCode(raw: string) {
    if (!venue) return;
    setScan({ step: 'loading' });
    const id = raw.trim();
    if (!UUID_RE.test(id)) { setScan({ step: 'error', message: 'To nie jest kod lojalnościowy Spoot.' }); return; }
    const [{ data: profile }, { data: stamp }] = await Promise.all([
      supabase.from('profiles').select('id, display_name').eq('id', id).maybeSingle(),
      supabase.from('loyalty_stamps').select('stamp_count').eq('place_id', venue.place_id).eq('user_id', id).maybeSingle(),
    ]);
    if (!profile) { setScan({ step: 'error', message: 'Nie znaleziono użytkownika Spoot dla tego kodu.' }); return; }
    setScan({ step: 'confirm', customer: { id: profile.id, display_name: profile.display_name || 'Użytkownik', stamp_count: stamp?.stamp_count ?? 0 } });
  }

  async function confirmStamp(customer: Customer) {
    if (!venue) return;
    setScan({ step: 'loading' });
    const { data, error } = await supabase.rpc('add_loyalty_stamp', { p_place_id: venue.place_id, p_customer_id: customer.id });
    if (error) { setScan({ step: 'error', message: error.message }); return; }
    // Odświeża kartę w Apple Wallet klienta; błąd nie blokuje wyniku.
    supabase.functions.invoke('wallet-pass/notify', { body: { customerId: customer.id } }).catch(() => {});
    setScan({ step: 'result', result: data as AddStampResult });
    loadCardholders();
  }

  useEffect(() => {
    if (!scan) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setScan(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [scan]);

  // Pulpit → „Skanuj kartę gościa” otwiera skaner od razu (?scan=1).
  useEffect(() => {
    if (programLive && new URLSearchParams(window.location.search).has('scan')) setScan({ step: 'scanning' });
  }, [programLive]);

  if (venueLoading) return <Loading />;

  const fullCount = cardholders.filter(c => required > 0 && c.stamp_count >= required).length;

  return (
    <>
      <PageHeader eyebrow="Pieczątki" title="Karta stałego gościa" sub="Goście zbierają pieczątki w aplikacji Spoot, Ty ustalasz progi i nagrody.">
        <span role="status" className="self-center font-display text-[13px] font-bold">{saved ? 'Zapisano' : ''}</span>
        <Btn variant="outline" onClick={() => setScan({ step: 'scanning' })} disabled={!programLive} title={programLive ? undefined : 'Najpierw włącz program, dodaj próg nagrody i zapisz'}>Skanuj kartę gościa</Btn>
        <Btn onClick={save} disabled={saving}>{saving ? 'Zapisuję…' : 'Zapisz zmiany'}</Btn>
      </PageHeader>

      <div className="flex flex-wrap items-start gap-6">
        <div className="flex min-w-0 flex-[1_1_400px] flex-col gap-6">
          <Card className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="grow"><CardTitle>Ustawienia programu</CardTitle></div>
              <label className="flex min-h-11 items-center gap-2 font-display font-semibold">
                <input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} className={checkCls} />
                Włączony
              </label>
            </div>
            {enabled && (
              <>
                {tiers.map((t, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      value={t.stamps}
                      onChange={e => setTiers(prev => prev.map((x, j) => (j === i ? { ...x, stamps: e.target.value.replace(/\D/g, '') } : x)))}
                      inputMode="numeric"
                      maxLength={2}
                      placeholder="Próg"
                      aria-label={`Próg ${i + 1}: liczba pieczątek`}
                      className={`${inputCls} !w-20 font-display font-bold`}
                    />
                    <input
                      value={t.reward}
                      onChange={e => setTiers(prev => prev.map((x, j) => (j === i ? { ...x, reward: e.target.value } : x)))}
                      maxLength={60}
                      placeholder="Nagroda, np. Kawa gratis"
                      aria-label={`Próg ${i + 1}: nagroda`}
                      className={inputCls}
                    />
                    <button
                      type="button"
                      onClick={() => setTiers(prev => prev.filter((_, j) => j !== i))}
                      aria-label={`Usuń próg ${i + 1}`}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full hover:bg-spoot-chip/70"
                    >
                      <NavIcon>{NAV_ICONS.close}</NavIcon>
                    </button>
                  </div>
                ))}
                <div><Btn variant="outline" size="sm" onClick={() => setTiers(prev => [...prev, { stamps: '', reward: '' }])}>Dodaj próg nagrody</Btn></div>
              </>
            )}
            {!enabled && <p className="text-spoot-ink2">Włącz program i zapisz, żeby goście mogli zbierać pieczątki.</p>}
            {!programLive && <p className="text-xs text-spoot-ink2">Skanowanie kart odblokuje się po zapisaniu włączonego programu z co najmniej jednym progiem.</p>}
          </Card>

          {programLive && (
            <>
              <section aria-label="Liczby programu" className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-4">
                <StatCard label="Aktywni" value={cardholders.length} />
                <StatCard label="Pełne karty" value={fullCount} />
                <StatCard label="Odebrane" value={redeemed} />
              </section>

              <Card className="pb-1">
                <div className="flex items-center gap-3 pb-3">
                  <div className="grow"><CardTitle>Goście z pieczątkami</CardTitle></div>
                  <span className="text-xs text-spoot-ink2">{cardholders.length} {pluralPl(cardholders.length, 'osoba', 'osoby', 'osób')}</span>
                </div>
                {cardholders.length === 0 ? (
                  <p className="border-t border-spoot-line py-6 text-spoot-ink2">Jeszcze nikt nie ma pieczątek w tym miejscu.</p>
                ) : (
                  <ul>
                    {cardholders.map(c => (
                      <li key={c.user_id} className="flex gap-3 border-t border-spoot-line py-3.5">
                        <Initial name={c.display_name} />
                        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                          <div className="flex gap-2">
                            <span className="grow font-display font-bold">{c.display_name}</span>
                            <span className="font-display text-xs font-bold leading-5">{c.stamp_count}/{required}</span>
                          </div>
                          <div role="img" aria-label={`${c.stamp_count} z ${required} pieczątek`} className="flex flex-wrap gap-1.5">
                            {Array.from({ length: required }).map((_, d) => {
                              const filled = d < c.stamp_count;
                              const isTier = savedTiers.some(t => t.stamps === d + 1);
                              return (
                                <span
                                  key={d}
                                  className={`h-[18px] w-[18px] rounded-full ${filled ? 'bg-spoot-ink' : 'bg-spoot-chip'} ${isTier && !filled ? 'border-2 border-spoot-orange' : ''}`}
                                />
                              );
                            })}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                {cardholders.length > 0 && (
                  <p className="border-t border-spoot-line pb-4 pt-3 text-xs text-spoot-ink2">Pomarańczowa obwódka oznacza próg z nagrodą.</p>
                )}
              </Card>
            </>
          )}
        </div>

        {enabled && (
          <Card className="flex min-w-0 flex-[1_1_400px] flex-col gap-5">
            <div className="flex flex-col gap-1">
              <CardTitle>Wygląd karty</CardTitle>
              <span className="text-spoot-ink2">Tak goście zobaczą Twoją kartę w Spoot</span>
            </div>
            <LoyaltyCardFace
              name={place?.name ?? 'Twój lokal'}
              meta={[place?.category, place?.district].filter(Boolean).join(' · ')}
              progress={`1/${maxTierStamps(parsedTiers) || 10}`}
              nextLabel={nextRewardLabel(1, parsedTiers)}
              design={design}
              placeImageUrl={place?.image_url ?? null}
            />
            <fieldset>
              <legend className="pb-2"><Eyebrow>Wzór</Eyebrow></legend>
              <div className="flex flex-wrap gap-1.5">
                {CARD_PATTERNS.map(p => {
                  const on = resolved.pattern === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      aria-pressed={on}
                      onClick={() => setDesign(d => ({ ...d, pattern: p.id, palette: p.palette }))}
                      className={`min-h-10 rounded-full px-3.5 font-display text-[13px] font-bold ${on ? 'bg-spoot-ink text-white' : 'border border-spoot-line bg-spoot-input hover:bg-spoot-chip/70'}`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </fieldset>
            <fieldset>
              <legend className="pb-2"><Eyebrow>Paleta</Eyebrow></legend>
              <div className="flex flex-wrap gap-1">
                {(Object.keys(CARD_PALETTES) as PaletteKey[]).map(key => {
                  const pal = CARD_PALETTES[key];
                  const on = resolved.paletteKey === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      aria-label={pal.name}
                      aria-pressed={on}
                      onClick={() => setDesign(d => ({ ...d, palette: key }))}
                      className={`flex h-11 w-11 overflow-hidden rounded-full border-[3px] ${on ? 'border-spoot-orange' : 'border-transparent'}`}
                    >
                      <span className="h-full w-1/2" style={{ background: pal.bg }} />
                      <span className="h-full w-1/2" style={{ background: pal.accent }} />
                    </button>
                  );
                })}
              </div>
            </fieldset>
            <div className="flex flex-col">
              {([
                ['image', 'Zdjęcie karty', design.image_url ? 'Do wzorów „Zdjęcie” i „Pół na pół”' : 'Teraz: zdjęcie lokalu'],
                ['logo', 'Logo', 'Kwadratowe. Bez logo pokażemy inicjały.'],
              ] as const).map(([kind, title, sub]) => (
                <div key={kind} className="flex items-center gap-3 border-t border-spoot-line py-3">
                  <span className="flex grow flex-col">
                    <span className="font-display font-bold">{title}</span>
                    <span className="text-xs text-spoot-ink2">{sub}</span>
                  </span>
                  <label className="inline-flex h-9 cursor-pointer items-center rounded-xl border border-spoot-ink px-3 font-display text-[13px] font-bold hover:bg-spoot-chip/50">
                    {uploading === kind ? 'Wgrywam…' : kind === 'logo' && !design.logo_url ? 'Wgraj' : 'Zmień'}
                    <input type="file" accept="image/*" className="sr-only" onChange={e => uploadCardImage(kind, e)} disabled={!!uploading} />
                  </label>
                </div>
              ))}
            </div>
            <p className="text-xs text-spoot-ink2">Zmiany wyglądu zobaczą goście po kliknięciu „Zapisz zmiany”.</p>
          </Card>
        )}
      </div>

      {scan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setScan(null)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Skanuj kartę gościa"
            onClick={e => e.stopPropagation()}
            className="flex w-full max-w-md flex-col gap-4 rounded-3xl bg-spoot-surface p-6"
          >
            <div className="flex items-center gap-3">
              <h2 className="grow font-display text-lg font-bold">Skanuj kartę gościa</h2>
              <button type="button" onClick={() => setScan(null)} aria-label="Zamknij" className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-spoot-chip/70">
                <NavIcon>{NAV_ICONS.close}</NavIcon>
              </button>
            </div>

            {scan.step === 'scanning' && (
              <>
                <QrScanner onCode={handleCode} />
                <p className="text-spoot-ink2">Poproś gościa o kod z aplikacji Spoot (Profil → Mój kod QR) i pokaż go kamerze komputera.</p>
              </>
            )}
            {scan.step === 'loading' && <Loading />}
            {scan.step === 'confirm' && (
              <div className="flex flex-col items-center gap-3 text-center">
                <Initial name={scan.customer.display_name} />
                <span className="font-display text-lg font-bold">{scan.customer.display_name}</span>
                <span className="text-spoot-ink2">
                  {scan.customer.stamp_count >= required ? 'Karta pełna' : `${scan.customer.stamp_count}/${required} pieczątek`}
                </span>
                <Btn onClick={() => confirmStamp(scan.customer)}>
                  {scan.customer.stamp_count >= required ? 'Odbierz nagrodę' : 'Dodaj pieczątkę'}
                </Btn>
                <Btn variant="ghost" onClick={() => setScan({ step: 'scanning' })}>Anuluj</Btn>
              </div>
            )}
            {scan.step === 'result' && (
              <div className="flex flex-col items-center gap-3 text-center">
                <span className="font-display text-[22px] font-bold">
                  {scan.result.is_final ? 'Nagroda odebrana!' : scan.result.redeemed ? 'Próg osiągnięty!' : 'Pieczątka dodana'}
                </span>
                <span className="text-spoot-ink2">
                  {scan.result.redeemed ? scan.result.reward_description || 'Gość może odebrać nagrodę.' : `${scan.result.stamp_count}/${scan.result.max_stamps} pieczątek`}
                </span>
                <Btn onClick={() => setScan({ step: 'scanning' })}>Skanuj następnego</Btn>
              </div>
            )}
            {scan.step === 'error' && (
              <div className="flex flex-col items-center gap-3 text-center">
                <p role="alert" className="text-spoot-danger">{scan.message}</p>
                <Btn onClick={() => setScan({ step: 'scanning' })}>Spróbuj ponownie</Btn>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
