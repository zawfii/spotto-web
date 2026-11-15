import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { getProfileByUsername, getProfileExtras } from '@/lib/supabase';
import { pluralPl, ratingColor } from '@/lib/format';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'Profil na Spoot';

// Kolory jak strona profilu (page.tsx).
const GREEN = '#164938';
const ORANGE = '#ff751f';
const CREAM = '#fdf5ec';
const MUTED = 'rgba(22,73,56,0.6)';

const PAD = 48;
const PANEL_W = 540; // prawa kolumna ze zdjęciami
const PANEL_H = size.height - 2 * PAD;
const GAP = 14;

const font = (file: string) => readFile(join(process.cwd(), 'assets/fonts', file));

// Rozkład zdjęć: 1 = całe pole, 2 = dwie kolumny, 3 = wysokie + dwa jedno na drugim.
function photoBoxes(n: number): { w: number; h: number }[][] {
  if (n === 1) return [[{ w: PANEL_W, h: PANEL_H }]];
  if (n === 2) {
    const w = (PANEL_W - GAP) / 2;
    return [[{ w, h: PANEL_H }], [{ w, h: PANEL_H }]];
  }
  const tall = 280;
  const w = PANEL_W - GAP - tall;
  const h = (PANEL_H - GAP) / 2;
  return [[{ w: tall, h: PANEL_H }], [{ w, h }, { w, h }]];
}

// Geometria jak components/SpootLogo.tsx: koło D = 0.654 × litera, środki 0.53 D od siebie, pierścień 0.06 D.
function Sygnet({ d }: { d: number }) {
  const circle = { position: 'absolute' as const, top: 0, width: d, height: d, borderRadius: d };
  return (
    <div style={{ position: 'relative', display: 'flex', width: d * 1.53, height: d }}>
      <div style={{ ...circle, left: 0, backgroundColor: ORANGE }} />
      <div style={{ ...circle, left: d * 0.53, border: `${d * 0.06}px solid ${GREEN}` }} />
    </div>
  );
}

function Wordmark({ size: s }: { size: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', fontSize: s, fontWeight: 700, letterSpacing: -0.02 * s, lineHeight: 1, color: GREEN }}>
      <span>sp</span>
      <div style={{ display: 'flex', margin: '0 1px' }}>
        <Sygnet d={0.654 * s} />
      </div>
      <span>t</span>
    </div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <span style={{ fontSize: 46, fontWeight: 800, lineHeight: 1.1 }}>{value}</span>
      <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: 1.5, color: MUTED }}>{label}</span>
    </div>
  );
}

function Photo({ src, name, rating, w, h }: { src: string; name: string; rating: number; w: number; h: number }) {
  return (
    <div style={{ position: 'relative', display: 'flex', width: w, height: h, borderRadius: 28, overflow: 'hidden', backgroundColor: GREEN }}>
      <img src={src} width={w} height={h} style={{ objectFit: 'cover' }} />
      <div style={{ position: 'absolute', left: 0, bottom: 0, width: w, height: h * 0.5, display: 'flex', backgroundImage: 'linear-gradient(to bottom, rgba(0,0,0,0), rgba(0,0,0,0.7))' }} />
      <div style={{ position: 'absolute', left: 18, bottom: 18, width: w - 36, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 50, height: 50, borderRadius: 25, border: `4px solid ${ratingColor(rating)}`, backgroundColor: CREAM, color: GREEN, fontSize: 20, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {String(rating)}
        </div>
        <span style={{ fontSize: 22, fontWeight: 700, color: '#fff', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {name}
        </span>
      </div>
    </div>
  );
}

export default async function Image({ params }: { params: { username: string } }) {
  const [profile, extras, medium, bold, extraBold] = await Promise.all([
    getProfileByUsername(params.username),
    getProfileExtras(params.username),
    font('Manrope_500Medium.ttf'),
    font('Manrope_700Bold.ttf'),
    font('Manrope_800ExtraBold.ttf'),
  ]);

  const displayName = profile?.display_name || 'Użytkownik Spoot';
  const username = profile?.username || params.username;
  const subtitle = [`@${username}`, extras?.city].filter(Boolean).join(' · ');
  const ratingsCount = extras?.ratingsCount ?? 0;

  // Najwyżej ocenione lokale ze zdjęciem (spośród ostatnich ocen), bez powtórek.
  const seen = new Set<string>();
  const photos = (extras?.ratings ?? [])
    .filter((r) => r.place_image && !seen.has(r.place_id) && seen.add(r.place_id))
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 3);
  const columns = photos.length ? photoBoxes(photos.length) : [];
  let next = 0;

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', backgroundColor: CREAM, color: GREEN, fontFamily: 'Manrope', padding: PAD }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '10px 40px 6px 16px' }}>
          <Wordmark size={46} />

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} width={128} height={128} style={{ borderRadius: 64, objectFit: 'cover' }} />
            ) : (
              <div style={{ width: 128, height: 128, borderRadius: 64, backgroundColor: GREEN, color: CREAM, fontSize: 60, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <span style={{ marginTop: 22, fontSize: 64, fontWeight: 800, letterSpacing: -1.5, lineHeight: 1.05, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {displayName}
            </span>
            <span style={{ marginTop: 8, fontSize: 28, fontWeight: 500, color: MUTED }}>{subtitle}</span>
          </div>

          <div style={{ display: 'flex', gap: 44 }}>
            <Stat value={ratingsCount} label={pluralPl(ratingsCount, 'OCENA', 'OCENY', 'OCEN')} />
            <Stat value={extras?.followers ?? 0} label="OBSERWUJĄCY" />
            <Stat value={extras?.following ?? 0} label="OBSERWOWANI" />
          </div>
        </div>

        {columns.length ? (
          <div style={{ display: 'flex', gap: GAP }}>
            {columns.map((col, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: GAP }}>
                {col.map((box) => {
                  const r = photos[next++];
                  return <Photo key={r.id} src={r.place_image!} name={r.place_name} rating={r.rating} w={box.w} h={box.h} />;
                })}
              </div>
            ))}
          </div>
        ) : (
          // Bez ocen ze zdjęciami — duży sygnet zamiast pustego pola.
          <div style={{ width: PANEL_W, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 28, backgroundColor: 'rgba(22,73,56,0.06)' }}>
            <Sygnet d={220} />
          </div>
        )}
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: 'Manrope', data: medium, weight: 500 },
        { name: 'Manrope', data: bold, weight: 700 },
        { name: 'Manrope', data: extraBold, weight: 800 },
      ],
    }
  );
}
