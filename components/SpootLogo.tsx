import type { CSSProperties } from 'react';

const GREEN = '#164938';
const ORANGE = '#ff751f';

// Geometria jak w components/Logo.tsx w apce: koło D, środki 0.53 D od siebie,
// pierścień 0.06 D (0.12 D przy literach poniżej 24 px), środek pierścienia przezroczysty.
export function Sygnet({ d, ring = GREEN, animated = false }: { d: number; ring?: string; animated?: boolean }) {
  const offset = 0.53 * d;
  const stroke = Math.max(1, d * (d < 0.654 * 24 ? 0.12 : 0.06));
  const circle: CSSProperties = { position: 'absolute', top: 0, width: d, height: d, borderRadius: '50%', boxSizing: 'border-box' };
  return (
    <span aria-hidden="true" style={{ position: 'relative', display: 'inline-block', width: d + offset, height: d, flexShrink: 0 }}>
      <span className={animated ? 'spoot-dot-l' : undefined} style={{ ...circle, left: 0, background: ORANGE }} />
      <span className={animated ? 'spoot-dot-r' : undefined} style={{ ...circle, left: offset, border: `${stroke}px solid ${ring}` }} />
    </span>
  );
}

export function Wordmark({ size, color = GREEN }: { size: number; color?: string }) {
  return (
    <span
      role="img"
      aria-label="Spoot"
      style={{ display: 'inline-flex', alignItems: 'baseline', fontFamily: 'var(--font-manrope), sans-serif', fontWeight: 700, fontSize: size, lineHeight: 1, letterSpacing: '-0.02em', color }}
    >
      <span aria-hidden="true">sp</span>
      <span style={{ margin: '0 1px' }}><Sygnet d={0.654 * size} ring={color} /></span>
      <span aria-hidden="true">t</span>
    </span>
  );
}
