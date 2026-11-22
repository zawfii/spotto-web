// app/dla-restauracji/page.tsx — strona sprzedażowa dla właścicieli lokali.
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Manrope, Plus_Jakarta_Sans } from 'next/font/google';
import { Wordmark } from '@/components/SpootLogo';
import { SETUP_FEE, WEBSITE_PACKAGES, zl } from '@/lib/website-packages';

// Te same ustawienia co w app/owner/layout.tsx — next/font 14.2 bywa kapryśny przy nowych zestawach wag.
const manrope = Manrope({ subsets: ['latin', 'latin-ext'], weight: ['500', '600', '700'], variable: '--font-manrope' });
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin', 'latin-ext'], weight: ['400', '500', '600'], variable: '--font-jakarta' });

export const metadata: Metadata = {
  title: 'Spoot dla restauracji — menu, oferty i stali goście w jednym panelu',
  description:
    'Przejmij profil swojego lokalu w Spoot. Menu, oferty dnia, karta stałego gościa i statystyki w jednym panelu. Zaczynasz za darmo.',
  openGraph: {
    title: 'Spoot dla restauracji',
    description: 'Goście wybierają w Spoot, gdzie dziś zjedzą. Bądź na ich liście — zaczynasz za darmo.',
    url: 'https://spootme.pl/dla-restauracji',
    locale: 'pl_PL',
    type: 'website',
  },
};

const REGISTER = '/owner/register';
const LOGIN = '/owner/login';
const MAIL = 'info@spootme.pl';
// Strona aplikacji dla gości — żeby właściciel mógł zobaczyć, czym jest Spoot od drugiej strony.
const APP_SITE = 'https://www.spootme.pl/';
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

function Check({ onDark = false }: { onDark?: boolean }) {
  return (
    <span aria-hidden="true" className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${onDark ? 'bg-white text-spoot-green' : 'bg-spoot-green text-white'}`}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5 9-10" /></svg>
    </span>
  );
}

function Bullets({ items, onDark = false }: { items: string[]; onDark?: boolean }) {
  return (
    <ul className="flex list-none flex-col gap-2.5">
      {items.map(item => (
        <li key={item} className="flex items-start gap-3"><Check onDark={onDark} /><span>{item}</span></li>
      ))}
    </ul>
  );
}

const Eyebrow = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <div className={`font-display text-xs font-bold uppercase tracking-[0.14em] ${className}`}>{children}</div>
);

const H2 = 'font-display font-bold leading-[1.1] tracking-[-0.015em] text-[clamp(28px,3.4vw,44px)]';
const BTN = 'inline-flex min-h-[50px] items-center justify-center rounded-full px-6 font-display text-base font-bold transition-opacity hover:opacity-90';
const GUTTER = 'px-[clamp(16px,5vw,80px)]';
const WRAP = 'mx-auto max-w-[1160px]';

const BENEFITS: { eyebrow: string; title: string; text: string; bullets: string[]; note?: string; link?: { href: string; label: string }; file: string; shot: string; wide?: boolean }[] = [
  {
    eyebrow: 'Oferty dnia',
    title: 'Zapełnij wtorek, nie tylko sobotę',
    text: 'Ustaw danie w niższej cenie na dni, w które sala stoi pusta. Goście z okolicy zobaczą je dokładnie wtedy, gdy szukają, gdzie zjeść.',
    bullets: [
      'Sam wybierasz dni i godziny — lunch 12–16, czwartki do 18:00',
      'Oferta sama znika po terminie — nikt nie przyjdzie po nieaktualną promocję',
      'Dodanie oferty zajmuje mniej niż napisanie jej kredą na tablicy',
    ],
    file: 'oferty',
    shot: 'Podgląd panelu: lista ofert dnia z cenami, dniami i statusem',
  },
  {
    eyebrow: 'Karta stałego gościa',
    title: 'Niech wracają po dziesiątą pieczątkę',
    text: 'Karta w telefonie gościa nie zgubi się w portfelu. Ty ustalasz progi i nagrody, a kartę ubierasz w swoje kolory i logo.',
    bullets: [
      'Skanujesz kod przy kasie — pieczątka przybita w sekundę',
      'Widzisz, kto jest o krok od nagrody',
      'Zero druku, zero kartoników, zero podrabianych stempli',
    ],
    note: 'Pierwsze lokale mają pieczątki za darmo przez rok. Potem 39 zł miesięcznie — albo w cenie jednego z pakietów strony.',
    file: 'pieczatki',
    shot: 'Podgląd panelu: ustawienia karty stałego gościa i lista gości z pieczątkami',
    wide: true,
  },
  {
    eyebrow: 'Menu',
    title: 'Zmieniasz kartę w minutę, nie u grafika',
    text: 'Gość sprawdza menu, zanim wyjdzie z domu. U Ciebie zobaczy aktualne dania i ceny — a nie zdjęcie karty sprzed dwóch lat.',
    bullets: [
      'Skończyły się policzki wołowe? Wyłączasz je jednym kliknięciem',
      'Kod QR na stoliki: jeden wydruk, zawsze aktualna karta',
      'Nie masz czasu przepisywać? Wprowadzimy menu za Ciebie',
    ],
    link: { href: DEMO_MENU, label: 'Zobacz menu tak, jak widzi je gość' },
    file: 'menu',
    shot: 'Podgląd panelu: edycja karty dań z cenami, alergenami i dostępnością',
  },
  {
    eyebrow: 'Statystyki i opinie',
    title: 'Wiesz, co działa, zanim wydasz złotówkę',
    text: 'Ile osób obejrzało profil, ile zapisało lokal, ile zajrzało do menu — i czy przyszli z TikToka, Instagrama, czy z samej aplikacji.',
    bullets: [
      'Widzisz, w który dzień zagląda najwięcej osób — i tam celujesz ofertą',
      'Oceny 1–10 za konkretne dania: wiesz, co chwalą, a co poprawić',
      'Odpowiadasz na opinie prosto z panelu',
    ],
    file: 'statystyki',
    shot: 'Podgląd panelu: statystyki wyświetleń profilu, zapisów i kliknięć menu',
  },
];

const FACTS = [
  ['16 miast', 'w których ludzie szukają jedzenia przez Spoot'],
  ['43 tys. lokali', 'już w aplikacji — Twój najpewniej też, tylko bez gospodarza'],
  ['0 zł', 'za profil, menu, oferty i statystyki. Pieczątki: pierwszy rok gratis dla pierwszych lokali'],
];

// Lokale, które są z nami. Logo w public/partnerzy/ (kwadrat, ok. 320 px).
const VENUES = [
  { name: 'Bejbi Na Rozdrożu', kind: 'Kawiarnia · Warszawa', logo: '/partnerzy/bejbi.jpg', url: 'https://www.bejbinarozdrozu.pl/', site: 'bejbinarozdrozu.pl' },
];

const STEPS = [
  ['Załóż konto', 'Nick, e-mail i telefon. Bez hasła — logujesz się linkiem z maila.'],
  ['Zgłoś, że lokal jest Twój', 'Znajdujesz go w katalogu i podajesz dane firmy. Sprawdzamy każde zgłoszenie, żeby nikt obcy nie przejął Twojego profilu.'],
  ['Zarządzaj skąd chcesz', 'Z komputera w panelu albo z telefonu w aplikacji. Zmiany widać u gości od razu.'],
];

const FAQ = [
  ['Naprawdę za darmo? Gdzie jest haczyk?', 'Nie ma. Profil, menu, oferty i statystyki są bezpłatne. Pieczątki są za darmo przez rok dla pierwszych lokali, potem 39 zł miesięcznie albo w cenie jednego z pakietów strony. Płatne są też dodatki, o które sam poprosisz: strona internetowa dla lokalu i wyróżnienie w aplikacji.'],
  ['Mojego lokalu nie ma w Spoot. Co teraz?', `Napisz na ${MAIL} — dodamy go do katalogu, a potem zgłosisz go jako swój.`],
  ['Jak wygląda weryfikacja?', 'Każde zgłoszenie sprawdza człowiek. Stan zgłoszenia widzisz po zalogowaniu, a gdy je zatwierdzimy, panel otworzy się na Twoim koncie.'],
  ['Czy mogę usunąć słabą ocenę?', 'Nie — i to działa na Twoją korzyść. Goście ufają ocenom, bo nikt ich nie czyści. Na opinię możesz odpowiedzieć, a treść łamiącą regulamin zgłosić.'],
  ['Czy muszę mieć aplikację w telefonie?', 'Nie. Cały panel działa w przeglądarce na komputerze. Aplikacja przydaje się przy kasie — do skanowania kart stałych gości.'],
];

export default function DlaRestauracjiPage() {
  return (
    <div className={`${manrope.variable} ${jakarta.variable} min-h-screen bg-spoot-surface font-body text-base leading-relaxed text-spoot-ink`}>
      <style dangerouslySetInnerHTML={{ __html: SHOT_CSS }} />

      <header className={`${GUTTER} py-4`}>
        <div className={`${WRAP} flex flex-wrap items-center justify-between gap-x-6 gap-y-3`}>
          <div className="flex items-center gap-3">
            <Wordmark size={26} />
            <span className="rounded-full bg-spoot-green px-3 py-[3px] font-display text-[11px] font-bold tracking-[0.4px] text-white">DLA RESTAURACJI</span>
          </div>
          <nav aria-label="Główna" className="flex flex-wrap items-center gap-x-6 gap-y-2 font-display text-sm font-bold">
            <a href="#korzysci" className="py-3 hover:text-spoot-green">Co zyskujesz</a>
            <a href="#strona" className="py-3 hover:text-spoot-green">Strona www</a>
            <a href="#jak" className="py-3 hover:text-spoot-green">Jak to działa</a>
            <a href="#pytania" className="py-3 hover:text-spoot-green">Pytania</a>
            <a href={LOGIN} className="py-3 hover:text-spoot-green">Zaloguj się</a>
            <a href={REGISTER} className={`${BTN} min-h-[44px] bg-spoot-ink px-5 text-sm text-white`}>Zgłoś lokal</a>
          </nav>
        </div>
      </header>

      <main>
        <section className={`${GUTTER} pb-[88px] pt-14`}>
          <div className={`${WRAP} flex flex-col items-center gap-12`}>
            <div className="flex max-w-[900px] flex-col items-center gap-6 text-center">
              <h1 className="font-display text-[clamp(36px,5.6vw,72px)] font-bold leading-[1.04] tracking-[-0.025em]">
                Goście wybierają w Spoot, gdzie dziś zjedzą. Bądź na ich liście.
              </h1>
              <p className="max-w-[640px] text-[clamp(17px,1.6vw,20px)] text-spoot-ink2">
                Przejmij profil swojego lokalu i jednym panelem ogarnij menu, oferty dnia, kartę stałego gościa i statystyki. Zaczynasz za darmo.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <a href={REGISTER} className={`${BTN} bg-spoot-ink text-white`}>Zgłoś swój lokal</a>
                <a href="#korzysci" className={`${BTN} border-[1.5px] border-spoot-ink bg-spoot-card`}>Zobacz panel</a>
              </div>
              <p className="text-sm text-spoot-ink2">Bez umowy i bez karty. Dostęp dostaje tylko zweryfikowany właściciel.</p>
            </div>
            <div className="flex max-w-full flex-col items-center gap-3 overflow-hidden">
              <Shot file="pulpit" title="Podgląd panelu: pulpit z liczbami, opiniami i szybkimi akcjami" chrome eager />
              <p className="text-xs text-spoot-ink2">Panel Bistro Pokazowego — naszego lokalu demonstracyjnego. Liczby są przykładowe.</p>
            </div>
          </div>
        </section>

        <section className={`${GUTTER} pb-[104px]`}>
          <div className={`${WRAP} grid grid-cols-[repeat(auto-fit,minmax(min(100%,240px),1fr))] gap-3`}>
            {FACTS.map(([value, label]) => (
              <div key={value} className="rounded-2xl bg-spoot-card p-6">
                <div className="font-display text-[40px] font-bold leading-[1.1]">{value}</div>
                <div className="text-spoot-ink2">{label}</div>
              </div>
            ))}
          </div>
        </section>

        <section className={`${GUTTER} pb-[104px]`}>
          <div className={`${WRAP} flex flex-wrap items-center justify-between gap-x-14 gap-y-6`}>
            <div className="flex min-w-0 flex-[1_1_340px] flex-col gap-3">
              <Eyebrow>Są z nami</Eyebrow>
              <h2 className={H2}>Te lokale już tu są</h2>
              <p className="text-lg text-spoot-ink2">Restauracje i kawiarnie, które mają w Spoot swój profil i menu.</p>
            </div>
            <ul className="flex min-w-0 flex-[1_1_340px] list-none flex-col gap-3">
              {VENUES.map(v => (
                <li key={v.url}>
                  <a href={v.url} target="_blank" rel="noopener" className="flex items-center gap-4 rounded-3xl bg-spoot-card p-4 transition-opacity hover:opacity-90">
                    <img src={v.logo} alt={`Logo: ${v.name}`} width={72} height={72} loading="lazy" className="h-[72px] w-[72px] shrink-0 rounded-2xl" />
                    <span className="flex min-w-0 flex-col">
                      <span className="font-display text-xl font-bold leading-tight">{v.name}</span>
                      <span className="text-spoot-ink2">{v.kind}</span>
                      <span className="font-display text-sm font-bold text-spoot-green underline">{v.site}</span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="korzysci" className={`${GUTTER} scroll-mt-6 pb-[104px]`}>
          <div className={`${WRAP} flex flex-col gap-24`}>
            {BENEFITS.map((b, i) => (
              <div key={b.file} className={`flex items-center justify-center gap-x-14 gap-y-10 ${i % 2 ? 'flex-wrap-reverse' : 'flex-wrap'}`}>
                <div className={`flex min-w-0 flex-[1_1_340px] flex-col gap-4 ${i % 2 ? 'order-2' : ''}`}>
                  <Eyebrow>{b.eyebrow}</Eyebrow>
                  <h2 className={H2}>{b.title}</h2>
                  <p className="text-lg text-spoot-ink2">{b.text}</p>
                  <Bullets items={b.bullets} />
                  {b.link && (
                    <a href={b.link.href} target="_blank" rel="noopener" className={`${BTN} min-h-[44px] self-start bg-spoot-orange px-5 text-sm text-spoot-ink`}>
                      {b.link.label}
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
              <Eyebrow>Strona internetowa</Eyebrow>
              <h2 className={H2}>Nie masz strony? Zrobimy ją z tego, co już jest w panelu.</h2>
              <p className="text-lg text-spoot-ink2">
                Gość, który wpisuje nazwę lokalu w Google, chce trzech rzeczy: menu, godzin i adresu. Na Twojej stronie będą zawsze aktualne, bo
                czyta je prosto ze Spoot — niczego nie wpisujesz dwa razy.
              </p>
              <p className="self-start rounded-2xl bg-spoot-orange px-5 py-4 font-display text-lg font-bold leading-snug text-spoot-ink">
                Twoje menu jest od razu na stronie. Zmieniasz danie albo cenę w panelu — zmienia się wszędzie: na stronie, w aplikacji i pod
                kodem QR na stoliku.
              </p>
            </div>
            <div className="flex max-w-full flex-col items-center gap-4 overflow-hidden">
              <Shot src={`/${DEMO_SITE}`} address={`spootme.pl/${DEMO_SITE}`} title="Podgląd strony lokalu: Bistro Pokazowe" chrome />
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-center">
                <p className="text-spoot-ink2">Tak może wyglądać Twoja strona. To działająca Strona Plus naszego lokalu pokazowego.</p>
                <a href={`/${DEMO_SITE}`} target="_blank" rel="noopener" className={`${BTN} min-h-[44px] bg-spoot-orange px-5 text-sm text-spoot-ink`}>
                  Otwórz stronę Bistro Pokazowego
                </a>
              </div>
            </div>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] gap-3">
              {WEBSITE_PACKAGES.map(pkg => {
                const dark = pkg.id === 'plus';
                return (
                  <div key={pkg.id} className={`flex flex-col gap-4 rounded-3xl p-[clamp(24px,3vw,32px)] ${dark ? 'bg-spoot-green text-white' : 'bg-spoot-card'}`}>
                    <div className="flex flex-col gap-1">
                      <h3 className="font-display text-[26px] font-bold leading-[1.15]">{pkg.label}</h3>
                      <p className={dark ? 'text-white/85' : 'text-spoot-ink2'}>{pkg.tagline}</p>
                    </div>
                    <div className="font-display text-[32px] font-bold leading-10">
                      {pkg.monthly ? <>od {zl(pkg.monthly.yearly)} <span className="text-base font-semibold">/ mies.</span></> : 'Wycena indywidualna'}
                    </div>
                    {pkg.includes && <p className="font-display text-sm font-bold">{pkg.includes}</p>}
                    <Bullets items={pkg.features} onDark={dark} />
                  </div>
                );
              })}
            </div>
            <p className="max-w-[760px] text-sm text-spoot-ink2">
              Ceny netto. „Od” oznacza płatność za 12 miesięcy z góry; przy płatności co miesiąc: Wizytówka {zl(79)}, Strona Plus {zl(129)}.
              Jednorazowa opłata za stworzenie strony: {zl(SETUP_FEE.yearly)} przy płatności rocznej, {zl(SETUP_FEE.monthly)} przy miesięcznej.
              Stronę zamawiasz w panelu, po przejęciu lokalu.
            </p>
          </div>
        </section>

        <section className={`${GUTTER} bg-spoot-green py-24 text-white`}>
          <div className={`${WRAP} flex flex-wrap items-center gap-12`}>
            <div className="flex min-w-0 flex-[1_1_520px] flex-col gap-5">
              <Eyebrow className="text-white/80">Dlaczego Spoot</Eyebrow>
              <h2 className="font-display text-[clamp(32px,4.6vw,60px)] font-bold leading-[1.05] tracking-[-0.02em]">Tu wygrywa kuchnia, nie budżet na reklamę.</h2>
              <p className="max-w-[560px] text-lg text-white/85">
                W Spoot każdy gość buduje własny ranking z tego, co sam zjadł i ocenił. Miejsca w czyimś guście nie da się kupić — da się na nie
                zapracować jedzeniem.
              </p>
              <a href={APP_SITE} target="_blank" rel="noopener" className={`${BTN} self-start bg-spoot-orange text-spoot-ink`}>
                Zobacz Spoot oczami gościa
              </a>
            </div>
            <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-3">
              <div className="rounded-2xl bg-white/15 p-5">
                <div className="font-display text-lg font-bold">Trafiasz do ludzi, którym smakuje Twoja kuchnia</div>
                <div className="text-white/85">Aplikacja poleca lokal tym, którym pasuje — nie wszystkim po równo.</div>
              </div>
              <div className="rounded-2xl bg-white/15 p-5">
                <div className="font-display text-lg font-bold">Mały lokal ma te same szanse co sieciówka</div>
                <div className="text-white/85">Liczą się oceny dań. Płatne wyróżnienie jest zawsze wyraźnie oznaczone.</div>
              </div>
            </div>
          </div>
        </section>

        <section id="jak" className={`${GUTTER} scroll-mt-6 py-24`}>
          <div className={`${WRAP} flex flex-col gap-8`}>
            <div className="flex flex-col gap-2">
              <Eyebrow>Jak to działa</Eyebrow>
              <h2 className={H2}>Trzy kroki i lokal jest Twój</h2>
            </div>
            <ol className="grid list-none grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] gap-3">
              {STEPS.map(([title, text], i) => (
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
            <h2 className={H2}>Pytania, które słyszymy najczęściej</h2>
            <div className="border-b border-spoot-line">
              {FAQ.map(([q, a], i) => (
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
            <h2 className="max-w-[820px] font-display text-[clamp(32px,4.6vw,60px)] font-bold leading-[1.05] tracking-[-0.02em]">Twój lokal już tu jest. Brakuje tylko Ciebie.</h2>
            <p className="text-lg text-white/85">Zgłoszenie zajmuje kilka minut. Zaczynasz za darmo.</p>
            <a href={REGISTER} className={`${BTN} bg-white text-spoot-ink`}>Zgłoś swój lokal</a>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4 border-t border-white/50 pt-6">
            <Wordmark size={26} color="#ffffff" />
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <a href={APP_SITE} className="py-3 underline">Aplikacja Spoot</a>
              <a href={LOGIN} className="py-3 underline">Panel właściciela</a>
              <a href={`mailto:${MAIL}`} className="py-3 underline">{MAIL}</a>
              <a href="/regulamin" className="py-3 underline">Regulamin</a>
              <a href="/polityka-prywatnosci" className="py-3 underline">Polityka prywatności</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
