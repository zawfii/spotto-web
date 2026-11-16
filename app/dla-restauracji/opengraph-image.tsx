import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

// Miniatura linku spootme.pl/dla-restauracji (iMessage, Messenger, WhatsApp…).
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'Spoot dla restauracji — menu, oferty i stali goście w jednym panelu';

const GREEN = '#164938';
const INK = '#03271a';
const ORANGE = '#ff751f';
const CREAM = '#fdf5ec';
const CARD = '#eae5de';
const WHITE = '#ffffff';
const MUTED = 'rgba(255,255,255,0.8)';

const font = (file: string) => readFile(join(process.cwd(), 'assets/fonts', file));

// Geometria jak components/SpootLogo.tsx: koło D = 0.654 × litera, środki 0.53 D od siebie, pierścień 0.06 D.
function Sygnet({ d }: { d: number }) {
  const circle = { position: 'absolute' as const, top: 0, width: d, height: d, borderRadius: d };
  return (
    <div style={{ position: 'relative', display: 'flex', width: d * 1.53, height: d }}>
      <div style={{ ...circle, left: 0, backgroundColor: ORANGE }} />
      <div style={{ ...circle, left: d * 0.53, border: `${d * 0.06}px solid ${WHITE}` }} />
    </div>
  );
}

// Słupki tygodnia z ekranu statystyk: sobota najwyższa, na pomarańczowo.
const BARS = [91, 104, 99, 127, 187, 220, 101];
const DAYS = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nd'];

export default async function Image() {
  const [medium, bold, extraBold] = await Promise.all([
    font('Manrope_500Medium.ttf'),
    font('Manrope_700Bold.ttf'),
    font('Manrope_800ExtraBold.ttf'),
  ]);

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', backgroundColor: GREEN, color: WHITE, fontFamily: 'Manrope', padding: 56 }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', paddingRight: 48 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', fontSize: 52, fontWeight: 700, letterSpacing: -1, lineHeight: 1 }}>
              <span>sp</span>
              <div style={{ display: 'flex', margin: '0 1px' }}>
                <Sygnet d={34} />
              </div>
              <span>t</span>
            </div>
            <div style={{ display: 'flex', backgroundColor: ORANGE, color: INK, borderRadius: 999, padding: '8px 20px', fontSize: 20, fontWeight: 800, letterSpacing: 1.5 }}>
              DLA RESTAURACJI
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 62, fontWeight: 800, letterSpacing: -1.5, lineHeight: 1.06 }}>Goście wybierają w Spoot, gdzie dziś zjedzą.</span>
            <span style={{ marginTop: 20, fontSize: 28, fontWeight: 500, lineHeight: 1.3, color: MUTED }}>
              Menu, oferty dnia, pieczątki i statystyki w jednym panelu.
            </span>
          </div>

          <span style={{ fontSize: 24, fontWeight: 700, color: MUTED }}>spootme.pl/dla-restauracji</span>
        </div>

        <div style={{ width: 430, display: 'flex', flexDirection: 'column', backgroundColor: CREAM, color: INK, borderRadius: 32, padding: 28 }}>
          <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: 1.5 }}>WYŚWIETLENIA PROFILU</span>
          <span style={{ marginTop: 4, fontSize: 60, fontWeight: 800, lineHeight: 1.1 }}>3 480</span>
          <span style={{ fontSize: 18, fontWeight: 500 }}>w ostatnich 30 dniach</span>
          <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: 10, marginTop: 20, backgroundColor: CARD, borderRadius: 20, padding: '20px 18px 14px' }}>
            {BARS.map((h, i) => (
              <div key={DAYS[i]} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <div style={{ display: 'flex', width: '100%', height: h, borderRadius: 8, backgroundColor: i === 5 ? ORANGE : INK }} />
                <span style={{ fontSize: 15, fontWeight: 700 }}>{DAYS[i]}</span>
              </div>
            ))}
          </div>
        </div>
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
