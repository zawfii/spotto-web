// Strona sprzedażowa dla właścicieli lokali — jeden układ dla /dla-restauracji i /dla-restauracji/en, teksty w copy.ts.
import type { ReactNode } from 'react';
import { Manrope, Plus_Jakarta_Sans } from 'next/font/google';
import { Wordmark } from '@/components/SpootLogo';
import OwnerQuestionPopup from '@/components/OwnerQuestionPopup';
import PackageCards, { Bullets } from './PackageCards';
import { COPY, MAIL, type Lang } from './copy';
import { WEBSITE_PACKAGES } from '@/lib/website-packages';

// Te same ustawienia co w app/owner/layout.tsx — next/font 14.2 bywa kapryśny przy nowych zestawach wag.
const manrope = Manrope({ subsets: ['latin', 'latin-ext'], weight: ['500', '600', '700'], variable: '--font-manrope' });
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin', 'latin-ext'], weight: ['400', '500', '600'], variable: '--font-jakarta' });

const REGISTER = '/owner/register';
const LOGIN = '/owner/login';
// Lokal pokazowy: jego strona (pakiet Strona Plus) służy za przykład, a ekrany panelu noszą jego dane.
const DEMO_SITE = 'bistropokazowe';
// Karta lokalu pokazowego — ta sama strona, którą otwiera link z aplikacji i kod QR ze stolika.
const DEMO_MENU = '/place/4b8c7b23-b94b-4387-bfd9-e4294dffa851/menu';

// Zrzuty to statyczne kopie ekranów panelu z danymi przykładowymi (public/demo-panel/*.html),
// pokazane w pomniejszonej ramce. --w: szerokość widoku, --iw: szerokość ekranu w ramce,
// --off: ucięty pasek boczny, --r: proporcja kadru.
const SHOT_CSS = `
.rs-shot{--w:1100;--iw:1440;--off:0;--r:.6;--s:calc(var(--w)/(var(--iw) - var(--off)))}
.rs-view{width:calc(var(--w)*1px);height:calc(var(--w)*var(--r)*1px);overflow:hidden;border-radius:10px;background:#fdf5ec}
.rs-frame{display:block;border:0;width:calc(var(--iw)*1px);height:calc(var(--w)*var(--r)*1px/var(--s));transform-origin:0 0;transform:scale(var(--s)) translateX(calc(var(--off)*-1px));pointer-events:none}
@media(max-width:1240px){.rs-shot{--w:900}}
@media(max-width:1000px){.rs-shot{--w:660}}
.rs-f{--w:640;--iw:1100;--off:240;--r:.74}
.rs-wide{--iw:1340}
.rs-tall{--r:.95}
@media(max-width:740px){.rs-shot,.rs-f{--w:420}}
@media(max-width:480px){.rs-shot,.rs-f{--w:300}}
html{scroll-behavior:smooth}
@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}}
`;

function Shot({ file, src, address = 'panel.spootme.pl', title, className = '', chrome = false, eager = false }: {
  file?: string; src?: string; address?: string; title: string; className?: string; chrome?: boolean; eager?: boolean;
}) {
  return (
    <div className={`rs-shot ${className} shrink-0 rounded-[18px] bg-spoot-card p-2 ${chrome ? 'pt-0' : ''}`}>
      {chrome && (
        <div aria-hidden="true" className="flex items-center gap-1.5 px-1.5 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-spoot-chip" />
          <span className="h-2.5 w-2.5 rounded-full bg-spoot-chip" />
          <span className="h-2.5 w-2.5 rounded-full bg-spoot-chip" />
          <span className="ml-2.5 rounded-full bg-spoot-surface px-3.5 py-0.5 font-display text-xs font-semibold">{address}</span>
        </div>
      )}
      <div className="rs-view">
        <iframe className="rs-frame" src={src ?? `/demo-panel/${file}.html`} title={title} tabIndex={-1} scrolling="no" loading={eager ? 'eager' : 'lazy'} />
      </div>
    </div>
  );
}

const Eyebrow = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <div className={`font-display text-xs font-bold uppercase tracking-[0.14em] ${className}`}>{children}</div>
);

const H2 = 'font-display font-bold leading-[1.1] tracking-[-0.015em] text-[clamp(28px,3.4vw,44px)]';
const BTN = 'inline-flex min-h-[50px] items-center justify-center rounded-full px-6 font-display text-base font-bold transition-opacity hover:opacity-90';
const GUTTER = 'px-[clamp(16px,5vw,80px)]';
const WRAP = 'mx-auto max-w-[1160px]';

// Lokale, które są z nami. Logo w public/partnerzy/ (kwadrat, ok. 320 px).
const VENUES = [
  { name: 'Bejbi Na Rozdrożu', kind: { pl: 'Kawiarnia · Warszawa', en: 'Café · Warsaw' }, logo: '/partnerzy/bejbi.jpg', url: 'https://www.bejbinarozdrozu.pl/', site: 'bejbinarozdrozu.pl' },
];

export default function RestaurantsPage({ lang }: { lang: Lang }) {
  const c = COPY[lang];
  // Cennik w jednej tabeli — te same stałe, z których liczy panel. [nazwa, opis, rocznie | cała szerokość, miesięcznie?]
  const priceRows: [string, string, string, string?][] = [
    c.pricing.panel,
    c.pricing.loyalty,
    ...WEBSITE_PACKAGES.map((p): [string, string, string, string?] => {
      const t = c.packages[p.id];
      return p.monthly ? [t.label, t.tagline, c.money(p.monthly.yearly), c.money(p.monthly.monthly)] : [t.label, t.tagline, c.billing.custom];
    }),
    [...c.pricing.build, c.money(0)],
    c.pricing.promo,
  ];
  const switchLink = { href: c.switchTo.href, hrefLang: c.switchTo.lang, lang: c.switchTo.lang };

  return (
    <div lang={lang} className={`${manrope.variable} ${jakarta.variable} min-h-screen bg-spoot-surface font-body text-base leading-relaxed text-spoot-ink`}>
      <style dangerouslySetInnerHTML={{ __html: SHOT_CSS }} />

      <header className={`${GUTTER} py-4`}>
        <div className={`${WRAP} flex flex-wrap items-center justify-between gap-x-2 gap-y-3 sm:gap-x-3`}>
          <div className="flex items-center gap-2 sm:gap-3">
            <Wordmark size={26} />
            <span className="rounded-full bg-spoot-green px-2.5 py-[3px] sm:px-3 font-display text-[11px] font-bold tracking-[0.4px] text-white">{c.badge}</span>
          </div>
          <nav aria-label={c.navLabel} className="ml-auto flex flex-wrap items-center gap-x-3 gap-y-2 font-display text-sm font-bold sm:gap-x-6">
            <a href="#korzysci" className="py-3 hover:text-spoot-green max-md:hidden">{c.nav.benefits}</a>
            <a href="#strona" className="py-3 hover:text-spoot-green max-md:hidden">{c.nav.site}</a>
            <a href="#cennik" className="py-3 hover:text-spoot-green max-md:hidden">{c.nav.pricing}</a>
            <a href="#jak" className="py-3 hover:text-spoot-green max-md:hidden">{c.nav.how}</a>
            <a href="#pytania" className="py-3 hover:text-spoot-green max-md:hidden">{c.nav.faq}</a>
            <a href={LOGIN} className="whitespace-nowrap py-3 hover:text-spoot-green">{c.nav.login}</a>
            <a href={REGISTER} className={`${BTN} min-h-[44px] bg-spoot-ink px-5 text-sm text-white max-md:hidden`}>{c.nav.register}</a>
            {/* Przełącznik języka jako osobna pigułka z globusem — jako zwykły link ginął wśród pozycji menu.
                Na telefonie bez globusa i z mniejszymi odstępami, żeby nagłówek mieścił się w jednej linii od 375 px. */}
            <a {...switchLink} aria-label={c.switchTo.name} className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full bg-spoot-card px-3 transition-colors hover:bg-spoot-chip sm:px-3.5">
              <svg aria-hidden="true" className="max-sm:hidden" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></svg>
              {c.switchTo.short}
            </a>
          </nav>
        </div>
      </header>

      <main>
        <section className={`${GUTTER} pb-[88px] pt-14`}>
          <div className={`${WRAP} flex flex-col items-center gap-12`}>
            <div className="flex max-w-[900px] flex-col items-center gap-6 text-center">
              <h1 className="font-display text-[clamp(36px,5.6vw,72px)] font-bold leading-[1.04] tracking-[-0.025em]">
                {c.hero.title}
              </h1>
              <p className="max-w-[640px] text-[clamp(17px,1.6vw,20px)] text-spoot-ink2">
                {c.hero.lead}
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <a href={REGISTER} className={`${BTN} bg-spoot-ink text-white`}>{c.hero.register}</a>
                <a href="#korzysci" className={`${BTN} border-[1.5px] border-spoot-ink bg-spoot-card`}>{c.hero.seePanel}</a>
              </div>
              <p className="text-sm text-spoot-ink2">{c.hero.note}</p>
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
                <Eyebrow>{c.hero.withUs}</Eyebrow>
                <ul className="flex list-none flex-wrap justify-center gap-2">
                  {VENUES.map(v => (
                    <li key={v.url}>
                      <a href={v.url} target="_blank" rel="noopener" className="flex items-center gap-3 rounded-[28px] bg-spoot-card py-1.5 pl-1.5 pr-5 text-left transition-opacity hover:opacity-90">
                        <img src={v.logo} alt={`Logo: ${v.name}`} width={44} height={44} className="h-11 w-11 shrink-0 rounded-full" />
                        <span className="flex flex-col leading-tight">
                          <span className="font-display font-bold">{v.name}</span>
                          <span className="text-sm text-spoot-ink2">{v.kind[lang]}<span className="max-sm:hidden"> · </span><span className="font-semibold text-spoot-green underline max-sm:block">{v.site}</span></span>
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="flex max-w-full flex-col items-center gap-3 overflow-hidden">
              <Shot file="pulpit" title={c.hero.shot} chrome eager />
              <p className="text-xs text-spoot-ink2">{c.hero.caption}</p>
            </div>
          </div>
        </section>

        <section className={`${GUTTER} pb-[104px]`}>
          <div className={`${WRAP} grid grid-cols-[repeat(auto-fit,minmax(min(100%,240px),1fr))] gap-3`}>
            {c.facts.map(([value, label]) => (
              <div key={value} className="rounded-2xl bg-spoot-card p-6">
                <div className="font-display text-[40px] font-bold leading-[1.1]">{value}</div>
                <div className="text-spoot-ink2">{label}</div>
              </div>
            ))}
          </div>
        </section>

        <section id="korzysci" className={`${GUTTER} scroll-mt-6 pb-[104px]`}>
          <div className={`${WRAP} flex flex-col gap-24`}>
            {c.benefits.map((b, i) => (
              <div key={b.file} className={`flex items-center justify-center gap-x-14 gap-y-10 ${i % 2 ? 'flex-wrap-reverse' : 'flex-wrap'}`}>
                <div className={`flex min-w-0 flex-[1_1_340px] flex-col gap-4 ${i % 2 ? 'order-2' : ''}`}>
                  <Eyebrow>{b.eyebrow}</Eyebrow>
                  <h2 className={H2}>{b.title}</h2>
                  <p className="text-lg text-spoot-ink2">{b.text}</p>
                  <Bullets items={b.bullets} />
                  {b.linkLabel && (
                    <a href={DEMO_MENU} target="_blank" rel="noopener" className={`${BTN} min-h-[44px] self-start bg-spoot-orange px-5 text-sm text-spoot-ink`}>
                      {b.linkLabel}
                    </a>
                  )}
                  {b.note && <p className="rounded-2xl bg-spoot-tint px-4 py-3 font-display text-sm font-bold">{b.note}</p>}
                </div>
                <div className="max-w-full overflow-hidden">
                  <Shot file={b.file} title={b.shot} className={`rs-f ${b.wide ? 'rs-wide' : ''} ${b.file === 'statystyki' ? 'rs-tall' : ''}`} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="strona" className={`${GUTTER} scroll-mt-6 pb-[104px]`}>
          <div className={`${WRAP} flex flex-col gap-8`}>
            <div className="flex max-w-[760px] flex-col gap-3">
              <Eyebrow>{c.site.eyebrow}</Eyebrow>
              <h2 className={H2}>{c.site.title}</h2>
              <p className="text-lg text-spoot-ink2">{c.site.text}</p>
              <p className="self-start rounded-2xl bg-spoot-orange px-5 py-4 font-display text-lg font-bold leading-snug text-spoot-ink">
                {c.site.highlight}
              </p>
            </div>
            <div className="flex max-w-full flex-col items-center gap-4 overflow-hidden">
              <Shot src={`/${DEMO_SITE}`} address={`spootme.pl/${DEMO_SITE}`} title={c.site.shot} chrome />
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-center">
                <p className="text-spoot-ink2">{c.site.caption}</p>
                <a href={`/${DEMO_SITE}`} target="_blank" rel="noopener" className={`${BTN} min-h-[44px] bg-spoot-orange px-5 text-sm text-spoot-ink`}>
                  {c.site.open}
                </a>
              </div>
            </div>
            <PackageCards lang={lang} />
            <p className="max-w-[760px] text-sm text-spoot-ink2">{c.site.terms}</p>
            <div id="cennik" className="flex scroll-mt-6 flex-col gap-4 rounded-3xl bg-spoot-card p-[clamp(24px,3vw,32px)]">
              <h3 className="font-display text-[26px] font-bold leading-[1.15]">{c.pricing.title}</h3>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] border-collapse text-left">
                  <thead>
                    <tr className="font-display text-xs font-bold uppercase tracking-[0.08em] text-spoot-ink2">
                      <th scope="col" className="py-2 pr-4 font-bold">{c.pricing.head[0]}</th>
                      <th scope="col" className="whitespace-nowrap py-2 pr-4 text-right font-bold">{c.pricing.head[1]}</th>
                      <th scope="col" className="whitespace-nowrap py-2 text-right font-bold">{c.pricing.head[2]}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {priceRows.map(([name, hint, yearly, monthly]) => (
                      <tr key={name} className="border-t border-spoot-line align-top">
                        <th scope="row" className="py-3 pr-4 font-normal">
                          <div className="font-display font-bold">{name}</div>
                          <div className="text-sm text-spoot-ink2">{hint}</div>
                        </th>
                        {monthly === undefined
                          ? <td colSpan={2} className="whitespace-nowrap py-3 text-right font-display font-bold">{yearly}</td>
                          : <>
                              <td className="whitespace-nowrap py-3 pr-4 text-right font-display font-bold">{yearly}</td>
                              <td className="whitespace-nowrap py-3 text-right font-display font-bold">{monthly}</td>
                            </>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-sm text-spoot-ink2">{c.pricing.note}</p>
            </div>
          </div>
        </section>

        <section className={`${GUTTER} bg-spoot-green py-24 text-white`}>
          <div className={`${WRAP} flex flex-wrap items-center gap-12`}>
            <div className="flex min-w-0 flex-[1_1_520px] flex-col gap-5">
              <Eyebrow className="text-white/80">{c.why.eyebrow}</Eyebrow>
              <h2 className="font-display text-[clamp(32px,4.6vw,60px)] font-bold leading-[1.05] tracking-[-0.02em]">{c.why.title}</h2>
              <p className="max-w-[560px] text-lg text-white/85">{c.why.text}</p>
              <a href={c.appSite} target="_blank" rel="noopener" className={`${BTN} self-start bg-spoot-orange text-spoot-ink`}>
                {c.why.cta}
              </a>
            </div>
            <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-3">
              {c.why.cards.map(([title, text]) => (
                <div key={title} className="rounded-2xl bg-white/15 p-5">
                  <div className="font-display text-lg font-bold">{title}</div>
                  <div className="text-white/85">{text}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="jak" className={`${GUTTER} scroll-mt-6 py-24`}>
          <div className={`${WRAP} flex flex-col gap-8`}>
            <div className="flex flex-col gap-2">
              <Eyebrow>{c.how.eyebrow}</Eyebrow>
              <h2 className={H2}>{c.how.title}</h2>
            </div>
            <ol className="grid list-none grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] gap-3">
              {c.how.steps.map(([title, text], i) => (
                <li key={title} className="flex flex-col gap-2 rounded-3xl bg-spoot-card p-6">
                  <div aria-hidden="true" className="font-display text-[56px] font-bold leading-none text-spoot-green">{i + 1}</div>
                  <h3 className="font-display text-xl font-bold">{title}</h3>
                  <p className="text-spoot-ink2">{text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="pytania" className={`${GUTTER} scroll-mt-6 pb-24`}>
          <div className="mx-auto flex max-w-[800px] flex-col gap-6">
            <h2 className={H2}>{c.faqTitle}</h2>
            <div className="border-b border-spoot-line">
              {c.faq.map(([q, a], i) => (
                <details key={q} open={i === 0} className="border-t border-spoot-line py-4">
                  <summary className="flex min-h-[44px] cursor-pointer list-none items-center font-display text-lg font-bold">{q}</summary>
                  <p className="mt-2 text-spoot-ink2">{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className={`${GUTTER} bg-spoot-green pb-8 pt-24 text-white`}>
        <div className={`${WRAP} flex flex-col gap-16`}>
          <div className="flex flex-col items-center gap-6 text-center">
            <h2 className="max-w-[820px] font-display text-[clamp(32px,4.6vw,60px)] font-bold leading-[1.05] tracking-[-0.02em]">{c.footer.title}</h2>
            <p className="text-lg text-white/85">{c.footer.text}</p>
            <a href={REGISTER} className={`${BTN} bg-white text-spoot-ink`}>{c.hero.register}</a>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4 border-t border-white/50 pt-6">
            <Wordmark size={26} color="#ffffff" />
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <a href={c.appSite} className="py-3 underline">{c.footer.app}</a>
              <a href={LOGIN} className="py-3 underline">{c.footer.panel}</a>
              <a href={`mailto:${MAIL}`} className="py-3 underline">{MAIL}</a>
              <a href="/regulamin" className="py-3 underline">{c.footer.terms}</a>
              <a href="/polityka-prywatnosci" className="py-3 underline">{c.footer.privacy}</a>
              <a {...switchLink} className="py-3 underline">{c.switchTo.name}</a>
            </div>
          </div>
        </div>
      </footer>

      <OwnerQuestionPopup lang={lang} />
    </div>
  );
}
