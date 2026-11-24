'use client';

// Karty pakietów strony z przełącznikiem płatności — ceny z lib/website-packages.ts, teksty z copy.ts.
import { useState } from 'react';
import { WEBSITE_PACKAGES, type WebsiteBilling } from '@/lib/website-packages';
import { COPY, type Lang } from './copy';

function Check({ onDark = false }: { onDark?: boolean }) {
  return (
    <span aria-hidden="true" className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${onDark ? 'bg-white text-spoot-green' : 'bg-spoot-green text-white'}`}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5 9-10" /></svg>
    </span>
  );
}

export function Bullets({ items, onDark = false }: { items: string[]; onDark?: boolean }) {
  return (
    <ul className="flex list-none flex-col gap-2.5">
      {items.map(item => (
        <li key={item} className="flex items-start gap-3"><Check onDark={onDark} /><span>{item}</span></li>
      ))}
    </ul>
  );
}

export default function PackageCards({ lang }: { lang: Lang }) {
  const { billing: t, packages, money } = COPY[lang];
  const [billing, setBilling] = useState<WebsiteBilling>('yearly');
  return (
    <div className="flex flex-col gap-5">
      <div role="group" aria-label={t.label} className="flex self-center rounded-full bg-spoot-card p-1">
        {t.options.map(([id, label]) => (
          <button
            key={id}
            type="button"
            aria-pressed={billing === id}
            onClick={() => setBilling(id)}
            className={`flex min-h-[44px] items-center gap-2 rounded-full px-5 font-display text-sm font-bold transition-colors ${billing === id ? 'bg-spoot-ink text-white' : 'hover:text-spoot-green'}`}
          >
            {label}
            {id === 'yearly' && <span className="rounded-full bg-spoot-orange px-2 py-0.5 text-[10px] tracking-[0.5px] text-spoot-ink">{t.cheaper}</span>}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] gap-3">
        {WEBSITE_PACKAGES.map(pkg => {
          const dark = pkg.id === 'plus';
          const text = packages[pkg.id];
          return (
            <div key={pkg.id} className={`flex flex-col gap-4 rounded-3xl p-[clamp(24px,3vw,32px)] ${dark ? 'bg-spoot-green text-white' : 'bg-spoot-card'}`}>
              <div className="flex flex-col gap-1">
                <h3 className="font-display text-[26px] font-bold leading-[1.15]">{text.label}</h3>
                <p className={dark ? 'text-white/85' : 'text-spoot-ink2'}>{text.tagline}</p>
              </div>
              <div className="flex flex-col gap-1" aria-live="polite">
                <div className="font-display text-[32px] font-bold leading-10">
                  {pkg.monthly ? <>{money(pkg.monthly[billing])} <span className="text-base font-semibold">{t.perMonth}</span></> : t.custom}
                </div>
                {pkg.monthly && (
                  <div className={`text-sm ${dark ? 'text-white/85' : 'text-spoot-ink2'}`}>
                    {billing === 'yearly' ? t.yearlyNote(money(12 * pkg.monthly.yearly)) : t.monthlyNote}
                  </div>
                )}
              </div>
              {text.includes && <p className="font-display text-sm font-bold">{text.includes}</p>}
              <Bullets items={text.features} onDark={dark} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
