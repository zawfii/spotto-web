import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { ratingLabel } from '@/lib/format';

// Wspólne klocki panelu właściciela — wygląd z systemu Spoot (kremowe tło, zielony tusz, płaskie karty).

export const inputCls =
  'w-full h-11 px-3.5 rounded-xl border border-spoot-line bg-spoot-input font-body text-sm font-normal normal-case tracking-normal text-spoot-ink placeholder:text-spoot-ink2/70 focus:outline-none focus:border-spoot-ink disabled:bg-[#e8d5c4] disabled:text-spoot-ink2';
export const labelCls = 'flex flex-col gap-1.5 font-display text-[11px] font-bold uppercase tracking-[0.5px]';
export const checkCls = 'h-5 w-5 shrink-0 accent-spoot-ink';

export function Eyebrow({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <span className={`font-display text-[11px] font-bold uppercase tracking-[0.5px] ${className}`}>{children}</span>;
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-2xl bg-spoot-card p-5 ${className}`}>{children}</section>;
}

export function CardTitle({ children }: { children: ReactNode }) {
  return <h2 className="font-display text-lg font-bold leading-6">{children}</h2>;
}

export function PageHeader({ eyebrow, title, sub, children }: { eyebrow: string; title: string; sub?: ReactNode; children?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-end gap-4">
      <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-1">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1 className="font-display text-[32px] font-bold leading-10">{title}</h1>
        {sub && <p className="text-spoot-ink2">{sub}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </header>
  );
}

export function StatCard({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl bg-spoot-card p-5">
      <Eyebrow>{label}</Eyebrow>
      <span className="font-display text-[32px] font-bold leading-10">{value}</span>
      {hint && <span className="text-xs text-spoot-ink2">{hint}</span>}
    </div>
  );
}

const BTN_VARIANT = {
  primary: 'bg-spoot-ink text-white hover:bg-spoot-green',
  outline: 'border border-spoot-ink text-spoot-ink hover:bg-spoot-chip/50',
  ghost: 'text-spoot-ink hover:bg-spoot-chip/70',
  danger: 'text-spoot-danger hover:bg-spoot-danger/10',
};
const BTN_SIZE = { md: 'h-11 rounded-2xl px-5 text-sm', sm: 'h-9 rounded-xl px-3 text-[13px]' };

export const btnCls = (variant: keyof typeof BTN_VARIANT = 'primary', size: keyof typeof BTN_SIZE = 'md') =>
  `inline-flex items-center justify-center gap-2 whitespace-nowrap font-display font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${BTN_VARIANT[variant]} ${BTN_SIZE[size]}`;

export function Btn({ variant, size, className = '', type = 'button', ...props }:
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof BTN_VARIANT; size?: keyof typeof BTN_SIZE }) {
  return <button type={type} className={`${btnCls(variant, size)} ${className}`} {...props} />;
}

// Ocena Spoot 1–10 ze słowem. Kolory tła dobrane tak, żeby tekst miał kontrast.
export function RatingBadge({ rating }: { rating: number }) {
  const tone = rating >= 8 ? 'bg-[#2e7d32] text-white' : rating >= 5 ? 'bg-[#d4892a] text-spoot-ink' : 'bg-spoot-orange text-spoot-ink';
  return (
    <span className={`rounded-full px-2.5 py-0.5 font-display text-[11px] font-bold leading-4 ${tone}`}>
      {rating} · {ratingLabel(rating)}
    </span>
  );
}

export function Initial({ name }: { name: string }) {
  return (
    <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-spoot-green font-display text-base font-bold text-white">
      {(name?.[0] ?? '?').toUpperCase()}
    </span>
  );
}

export function Loading() {
  return <p role="status" className="py-16 text-center text-spoot-ink2">Wczytuję…</p>;
}

// Wyświetlenia według dnia tygodnia; najlepszy dzień na pomarańczowo.
export function WeekdayBars({ days, height }: { days: { day: string; count: number }[]; height: number }) {
  const max = Math.max(...days.map(d => d.count), 1);
  const best = days.reduce((b, d) => (d.count > b.count ? d : b), days[0]);
  return (
    <div
      role="img"
      aria-label={`Wyświetlenia według dnia tygodnia: ${days.map(d => `${d.day} ${d.count}`).join(', ')}`}
      className="grid grid-cols-7 items-end gap-3"
      style={{ height: height + 48 }}
    >
      {days.map(d => (
        <div key={d.day} className="flex flex-col items-center gap-1.5">
          <span className="font-display text-[11px] font-bold">{d.count}</span>
          <div
            className={`w-full rounded-lg ${d === best && d.count > 0 ? 'bg-spoot-orange' : 'bg-spoot-ink'}`}
            style={{ height: Math.max((d.count / max) * height, d.count > 0 ? 4 : 1) }}
          />
          <span className="text-xs">{d.day}</span>
        </div>
      ))}
    </div>
  );
}

export function NavIcon({ children }: { children: ReactNode }) {
  return (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      {children}
    </svg>
  );
}

export const NAV_ICONS = {
  home: <><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></>,
  menu: <path d="M7 3v18M4 3v5a3 3 0 0 0 6 0V3M17 21V3c-2 2-3 4.5-3 8h3" />,
  stats: <path d="M5 20V10M11 20V4M17 20v-7M2 20h20" />,
  star: <path d="M12 3l2.7 5.6 6.1.8-4.5 4.3 1.1 6.1-5.4-2.9-5.4 2.9 1.1-6.1L3.2 9.4l6.1-.8z" />,
  store: <path d="M4 10v10h16V10M3 10l2-6h14l2 6M10 20v-5h4v5" />,
  chevron: <path d="M9 5l7 7-7 7" />,
  plus: <path d="M12 5v14M5 12h14" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
};
