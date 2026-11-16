import type { CSSProperties } from 'react';
import { DARK_INK, resolveCardDesign } from '@/lib/owner-loyalty';
import type { LoyaltyCardDesign } from '@/lib/owner-loyalty';

// Podgląd karty stałego gościa — te same wzory co components/loyalty/LoyaltyCardFace.tsx w apce.
const W = 358;
const H = 226;
const SCRIM = 'rgba(3,39,26,0.62)';

const inkAlpha = (ink: string, a: number) => (ink === DARK_INK ? `rgba(3,39,26,${a})` : `rgba(255,255,255,${a})`);
const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();

type Props = {
  name: string;
  meta: string;
  progress: string;
  nextLabel: string;
  design: LoyaltyCardDesign | null;
  placeImageUrl: string | null;
};

export default function LoyaltyCardFace({ name, meta, progress, nextLabel, design, placeImageUrl }: Props) {
  const { pattern, palette: pal, image, logo } = resolveCardDesign(design, placeImageUrl);
  const ink = pal.ink;
  const pillBg = pattern === 'photo' ? SCRIM : pattern === 'logo' ? inkAlpha(ink, ink === DARK_INK ? 0.1 : 0.18) : pal.bg;
  const circle = (left: number, top: number, size: number, extra: CSSProperties): CSSProperties => ({
    position: 'absolute', left, top, width: size, height: size, borderRadius: 999, boxSizing: 'border-box', ...extra,
  });
  const logoCircle = (size: number, fontSize: number) => (
    <span
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-full border-[1.5px] border-white/50 bg-spoot-surface font-display font-bold text-spoot-ink"
      style={{ width: size, height: size, fontSize }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {logo ? <img src={logo} alt="" className="h-full w-full object-cover" /> : initials(name)}
    </span>
  );

  return (
    <div
      role="img"
      aria-label={`Podgląd karty stałego gościa: ${name}`}
      className="relative mx-auto max-w-full overflow-hidden rounded-2xl border border-spoot-ink/10"
      style={{ width: W, height: H, background: pal.bg }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {pattern === 'photo' && image && <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover" />}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {pattern === 'split' && image && <img src={image} alt="" className="absolute right-0 top-0 h-full w-[44%] object-cover" />}
      {pattern === 'dots' && (
        <>
          <span style={circle(186, 60, 150, { background: pal.accent })} />
          <span style={circle(262, 60, 150, { border: `18px solid ${ink}` })} />
        </>
      )}
      {pattern === 'type' && (
        <span
          className="absolute left-3 whitespace-nowrap font-display font-bold"
          style={{ top: 60, fontSize: 104, lineHeight: '96px', letterSpacing: -4, color: pal.accent }}
        >
          {name}
        </span>
      )}
      {pattern === 'rings' && (
        <>
          <span style={circle(180, 50, 220, { border: `2px solid ${pal.accent}` })} />
          <span style={circle(210, 80, 160, { border: `2px dashed ${pal.accent}` })} />
          <span style={circle(240, 110, 100, { background: pal.accent })} />
        </>
      )}
      {pattern === 'stripes' && (
        <span className="absolute inset-0" style={{ background: `repeating-linear-gradient(90deg, ${pal.accent} 0 26px, transparent 26px 52px)` }} />
      )}
      {pattern === 'check' && (
        <span
          className="absolute inset-0 opacity-30"
          style={{ background: `repeating-linear-gradient(0deg, ${pal.accent} 0 18px, transparent 18px 36px), repeating-linear-gradient(90deg, ${pal.accent}99 0 18px, transparent 18px 36px)` }}
        />
      )}
      {pattern === 'arch' && <span style={circle((W - 300) / 2, 100, 300, { background: pal.accent })} />}
      {pattern === 'logo' && <span className="absolute inset-x-0 flex items-center justify-center" style={{ top: 58, bottom: 48 }}>{logoCircle(92, 30)}</span>}

      <div className="absolute inset-x-0 top-0 flex h-[58px] items-center gap-3 px-4" style={pattern === 'photo' ? { background: SCRIM } : undefined}>
        {pattern !== 'logo' && logoCircle(36, 12)}
        <div className="min-w-0 flex-1" style={{ color: ink }}>
          <div className="truncate font-display text-base font-bold leading-5">{name}</div>
          {meta && <div className="truncate text-xs opacity-80">{meta}</div>}
        </div>
        <div className="text-right" style={{ color: ink }}>
          <div className="font-display text-[10px] font-bold tracking-[1px] opacity-80">PIECZĄTKI</div>
          <div className="font-display text-lg font-bold leading-[22px]">{progress}</div>
        </div>
      </div>

      <div className="absolute inset-x-4 bottom-3.5 flex items-center justify-between" style={{ color: ink }}>
        {nextLabel ? <span className="rounded-full px-2.5 py-1 font-display text-xs font-bold" style={{ background: pillBg }}>{nextLabel}</span> : <span />}
        <span className="rounded-full px-2.5 py-1 font-display text-[11px] font-bold tracking-[1.5px]" style={{ background: pillBg }}>SPOOT</span>
      </div>
    </div>
  );
}
