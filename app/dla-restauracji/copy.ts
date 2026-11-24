// Teksty strony dla restauracji: po polsku (/dla-restauracji) i po angielsku (/dla-restauracji/en).
// Układ jest jeden (RestaurantsPage.tsx), więc nowy tekst dopisujesz w obu językach — TypeScript pilnuje, żeby żadnego nie brakowało.
import { FREE_FEATURES, LOYALTY, LOYALTY_NOTE, WEBSITE_PACKAGES, zl, type WebsitePackage, type WebsiteBilling } from '@/lib/website-packages';

export type Lang = 'pl' | 'en';

export const MAIL = 'info@spootme.pl';

type Benefit = {
  eyebrow: string; title: string; text: string; bullets: string[];
  note?: string; linkLabel?: string; file: string; shot: string; wide?: boolean;
};
type PackageText = { label: string; tagline: string; includes?: string; features: string[] };
type Row = [name: string, hint: string, price: string];
type Pricing = { title: string; head: [string, string, string]; panel: Row; loyalty: Row; build: [name: string, hint: string]; promo: Row; note: string };

/** „PLN 1,188” — kwoty w wersji angielskiej. */
const pln = (n: number) => `PLN ${n.toLocaleString('en-US')}`;
const LOYALTY_NOTE_EN = `Loyalty stamps are free for the first year. After that it's ${pln(LOYALTY.monthly)} net per month — or included in Website Plus.`;

const plBenefits: Benefit[] = [
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
    note: LOYALTY_NOTE,
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
    linkLabel: 'Zobacz menu tak, jak widzi je gość',
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

const enBenefits: Benefit[] = [
  {
    eyebrow: 'Daily deals',
    title: 'Fill up Tuesday, not just Saturday',
    text: 'Put a dish on at a lower price on the days your dining room sits empty. People nearby will see it exactly when they are looking for somewhere to eat.',
    bullets: [
      'You choose the days and hours — lunch 12–4 pm, Thursdays until 6 pm',
      'The deal disappears by itself when it ends — nobody turns up for an expired offer',
      'Adding a deal takes less time than chalking it on a board',
    ],
    file: 'oferty',
    shot: 'Dashboard preview: a list of daily deals with prices, days and status',
  },
  {
    eyebrow: 'Loyalty card',
    title: 'Bring them back for the tenth stamp',
    text: "A card on your guest's phone won't get lost in a wallet. You set the thresholds and rewards, and dress the card in your own colours and logo.",
    bullets: [
      'Scan a code at the till — stamp added in a second',
      "See who's one visit away from a reward",
      'No printing, no paper cards, no forged stamps',
    ],
    note: LOYALTY_NOTE_EN,
    file: 'pieczatki',
    shot: 'Dashboard preview: loyalty card settings and a list of guests with stamps',
    wide: true,
  },
  {
    eyebrow: 'Menu',
    title: 'Update your menu in a minute, no designer needed',
    text: "Guests check the menu before they leave home. With you they'll see today's dishes and prices — not a photo of a menu from two years ago.",
    bullets: [
      'Out of beef cheeks? Switch them off with one click',
      'A QR code for your tables: print it once, the menu is always up to date',
      "No time to type it all in? We'll enter your menu for you",
    ],
    linkLabel: 'See the menu the way guests see it',
    file: 'menu',
    shot: 'Dashboard preview: editing the menu with prices, allergens and availability',
  },
  {
    eyebrow: 'Stats and reviews',
    title: 'Know what works before you spend a single złoty',
    text: 'How many people viewed your profile, saved your venue or opened your menu — and whether they came from TikTok, Instagram or the app itself.',
    bullets: [
      'See which day gets the most visits — and aim your deals there',
      '1–10 ratings for specific dishes: you know what people praise and what to improve',
      'Reply to reviews straight from the dashboard',
    ],
    file: 'statystyki',
    shot: 'Dashboard preview: stats for profile views, saves and menu clicks',
  },
];

// Po polsku pakiety mają teksty prosto z cennika (te same, które widzi panel).
const plPackages = {} as Record<WebsitePackage, PackageText>;
for (const p of WEBSITE_PACKAGES) plPackages[p.id] = p;

const enPackages: Record<WebsitePackage, PackageText> = {
  wizytowka: {
    label: 'Business Card',
    tagline: 'One page with what guests look for most.',
    features: ['An address like spootme.pl/your-venue', 'Menu, opening hours and photos straight from Spoot', 'Map, phone number and directions'],
  },
  plus: {
    label: 'Website Plus',
    tagline: 'A full website for your venue — on your own domain, too.',
    includes: 'Everything in Business Card, plus:',
    features: [
      'Your own domain, e.g. yourvenue.pl',
      'Up to 5 subpages, e.g. about us, gallery, catering',
      'Guest ratings and current deals from Spoot',
      'Loyalty card (stamps) included',
      'English version',
      'One content update a month',
    ],
  },
  custom: {
    label: 'Custom Website',
    tagline: 'We design a website from scratch, made just for your venue.',
    features: ['Bespoke design', 'As many subpages as you need', 'Blog and news', 'Your own domain'],
  },
};

const pl = {
  money: zl,
  switchTo: { href: '/dla-restauracji/en', lang: 'en', short: 'EN', name: 'English' },
  appSite: 'https://www.spootme.pl/',
  badge: 'DLA RESTAURACJI',
  navLabel: 'Główna',
  nav: { benefits: 'Co zyskujesz', site: 'Strona www', pricing: 'Cennik', how: 'Jak to działa', faq: 'Pytania', login: 'Zaloguj się', register: 'Zgłoś lokal' },
  hero: {
    title: 'Goście wybierają w Spoot, gdzie dziś zjedzą. Bądź na ich liście.',
    lead: 'Przejmij profil swojego lokalu i jednym panelem ogarnij menu, oferty dnia, kartę stałego gościa i statystyki. Zaczynasz za darmo.',
    register: 'Zgłoś swój lokal',
    seePanel: 'Zobacz panel',
    note: 'Bez umowy i bez karty. Dostęp dostaje tylko zweryfikowany właściciel.',
    withUs: 'Są z nami',
    shot: 'Podgląd panelu: pulpit z liczbami, opiniami i szybkimi akcjami',
    caption: 'Panel Bistro Pokazowego — naszego lokalu demonstracyjnego. Liczby są przykładowe.',
  },
  facts: [
    ['16 miast', 'w których ludzie szukają jedzenia przez Spoot'],
    ['43 tys. lokali', 'już w aplikacji — Twój najpewniej też, tylko bez gospodarza'],
    ['0 zł', 'za profil, menu, oferty i statystyki. Pieczątki: pierwszy rok gratis'],
  ],
  benefits: plBenefits,
  site: {
    eyebrow: 'Strona internetowa',
    title: 'Nie masz strony? Zrobimy ją z tego, co już jest w panelu.',
    text: 'Gość, który wpisuje nazwę lokalu w Google, chce trzech rzeczy: menu, godzin i adresu. Na Twojej stronie będą zawsze aktualne, bo czyta je prosto ze Spoot — niczego nie wpisujesz dwa razy.',
    highlight: 'Twoje menu jest od razu na stronie. Zmieniasz danie albo cenę w panelu — zmienia się wszędzie: na stronie, w aplikacji i pod kodem QR na stoliku.',
    shot: 'Podgląd strony lokalu: Bistro Pokazowe',
    caption: 'Tak może wyglądać Twoja strona. To działająca Strona Plus naszego lokalu pokazowego.',
    open: 'Otwórz stronę Bistro Pokazowego',
    terms: 'Stworzenie strony nic nie kosztuje. Strona działa, dopóki opłacasz abonament — profil w Spoot zostaje zawsze. Stronę zamawiasz w panelu, po przejęciu lokalu.',
  },
  packages: plPackages,
  billing: {
    label: 'Jak chcesz płacić',
    options: [['yearly', 'Za rok z góry'], ['monthly', 'Co miesiąc']] as [WebsiteBilling, string][],
    cheaper: 'TANIEJ',
    perMonth: '/ mies.',
    custom: 'Wycena indywidualna',
    yearlyNote: (total: string) => `netto · razem ${total} za rok z góry`,
    monthlyNote: 'netto · płacisz co miesiąc, bez zobowiązania',
  },
  pricing: <Pricing>{
    title: 'Cały cennik',
    head: ['Co dostajesz', 'Za rok z góry', 'Co miesiąc'],
    panel: ['Panel lokalu', FREE_FEATURES.join(' · '), `${zl(0)}, na zawsze`],
    loyalty: ['Pieczątki', 'Karta stałego gościa. W cenie Strony Plus', `pierwszy rok ${zl(0)}, potem ${zl(LOYALTY.monthly)}`],
    build: ['Stworzenie strony', 'Robimy ją za Ciebie z tego, co jest w panelu'],
    promo: ['Wyróżnienie lokalu i promocja oferty', 'Zawsze wyraźnie oznaczone', 'Wkrótce'],
    note: 'Ceny netto za miesiąc, doliczamy 23% VAT. Bez umowy na czas określony. W panelu zaznaczasz, czego chcesz, i od razu widzisz sumę.',
  },
  why: {
    eyebrow: 'Dlaczego Spoot',
    title: 'Tu wygrywa kuchnia, nie budżet na reklamę.',
    text: 'W Spoot każdy gość buduje własny ranking z tego, co sam zjadł i ocenił. Miejsca w czyimś guście nie da się kupić — da się na nie zapracować jedzeniem.',
    cta: 'Zobacz Spoot oczami gościa',
    cards: [
      ['Trafiasz do ludzi, którym smakuje Twoja kuchnia', 'Aplikacja poleca lokal tym, którym pasuje — nie wszystkim po równo.'],
      ['Mały lokal ma te same szanse co sieciówka', 'Liczą się oceny dań. Płatne wyróżnienie jest zawsze wyraźnie oznaczone.'],
    ],
  },
  how: {
    eyebrow: 'Jak to działa',
    title: 'Trzy kroki i lokal jest Twój',
    steps: [
      ['Załóż konto', 'Nick, e-mail i telefon. Bez hasła — logujesz się linkiem z maila.'],
      ['Zgłoś, że lokal jest Twój', 'Znajdujesz go w katalogu i zostawiasz numer telefonu. Dzwonimy w ciągu 1 dnia roboczego, żeby nikt obcy nie przejął Twojego profilu.'],
      ['Zarządzaj skąd chcesz', 'Z komputera w panelu albo z telefonu w aplikacji. Zmiany widać u gości od razu.'],
    ],
  },
  faqTitle: 'Pytania, które słyszymy najczęściej',
  faq: [
    ['Naprawdę za darmo? Gdzie jest haczyk?', `Nie ma. Profil, menu, oferty i statystyki są bezpłatne na zawsze. ${LOYALTY_NOTE} Płatna jest też strona internetowa dla lokalu — tylko jeśli sam o nią poprosisz, bez opłaty za jej stworzenie. Płatne wyróżnienie w aplikacji dopiero szykujemy.`],
    ['Mojego lokalu nie ma w Spoot. Co teraz?', 'Dodasz go sam przy zgłoszeniu: nazwa, adres i rodzaj lokalu. Sprawdzimy dane i dopiszemy go do katalogu razem z Twoim zgłoszeniem.'],
    ['Jak wygląda weryfikacja?', `Dzwonimy do każdego zgłaszającego, zwykle w ciągu 1 dnia roboczego i o porze, którą wskażesz. W tej samej rozmowie pokażemy Ci panel. Wolisz napisać? ${MAIL}.`],
    ['Czy mogę usunąć słabą ocenę?', 'Nie — i to działa na Twoją korzyść. Goście ufają ocenom, bo nikt ich nie czyści. Na opinię możesz odpowiedzieć, a treść łamiącą regulamin zgłosić.'],
    ['Czy muszę mieć aplikację w telefonie?', 'Nie. Cały panel działa w przeglądarce na komputerze. Aplikacja przydaje się przy kasie — do skanowania kart stałych gości.'],
  ],
  footer: {
    title: 'Twój lokal już tu jest. Brakuje tylko Ciebie.',
    text: 'Zgłoszenie zajmuje kilka minut. Zaczynasz za darmo.',
    app: 'Aplikacja Spoot',
    panel: 'Panel właściciela',
    terms: 'Regulamin',
    privacy: 'Polityka prywatności',
  },
};

export type Copy = typeof pl;

const en: Copy = {
  money: pln,
  switchTo: { href: '/dla-restauracji', lang: 'pl', short: 'PL', name: 'Polski' },
  appSite: 'https://www.spootme.pl/en/',
  badge: 'FOR RESTAURANTS',
  navLabel: 'Main',
  nav: { benefits: 'What you get', site: 'Website', pricing: 'Pricing', how: 'How it works', faq: 'FAQ', login: 'Log in', register: 'Claim your venue' },
  hero: {
    title: 'Diners use Spoot to choose where to eat today. Get on their list.',
    lead: 'Claim your venue’s profile and run your menu, daily deals, loyalty card and stats from one dashboard. Free to start.',
    register: 'Claim your venue',
    seePanel: 'See the dashboard',
    note: 'No contract, no card. Only verified owners get access.',
    withUs: 'Already with us',
    shot: 'Dashboard preview: overview with numbers, reviews and quick actions',
    caption: 'The dashboard of Bistro Pokazowe, our demo venue. The numbers are examples. The dashboard is in Polish.',
  },
  facts: [
    ['16 cities', 'where people look for food with Spoot'],
    ['43k venues', 'already in the app — yours is most likely there too, just unclaimed'],
    [pln(0), 'for your profile, menu, deals and stats. Loyalty stamps: first year free'],
  ],
  benefits: enBenefits,
  site: {
    eyebrow: 'Website',
    title: "No website? We'll build one from what's already in your dashboard.",
    text: "Someone who googles your venue wants three things: the menu, opening hours and the address. On your website they're always up to date, because it reads them straight from Spoot — you never type anything in twice.",
    highlight: 'Your menu is on the website from day one. Change a dish or a price in the dashboard and it changes everywhere: on your website, in the app and behind the QR code on the table.',
    shot: 'Venue website preview: Bistro Pokazowe',
    caption: "This is what your website could look like. It's the live Website Plus of our demo venue.",
    open: 'Open the Bistro Pokazowe website',
    terms: 'Building the website costs nothing. It stays online as long as you pay the subscription — your Spoot profile stays for good. You order a website in the dashboard once you have claimed your venue.',
  },
  packages: enPackages,
  billing: {
    label: 'How do you want to pay',
    options: [['yearly', 'Yearly upfront'], ['monthly', 'Monthly']],
    cheaper: 'SAVE',
    perMonth: '/ mo',
    custom: 'Custom quote',
    yearlyNote: (total: string) => `net · ${total} in total, paid yearly upfront`,
    monthlyNote: 'net · paid monthly, no commitment',
  },
  pricing: {
    title: 'Full pricing',
    head: ['What you get', 'Yearly upfront', 'Monthly'],
    panel: ['Venue dashboard', ['Venue profile', 'Menu and table QR code', 'Daily deals and lunch', 'Stats', 'Replies to reviews'].join(' · '), `${pln(0)}, forever`],
    loyalty: ['Loyalty stamps', 'Loyalty card. Included in Website Plus', `first year ${pln(0)}, then ${pln(LOYALTY.monthly)}`],
    build: ['Building the website', "We build it for you from what's in your dashboard"],
    promo: ['Featured venue and promoted deals', 'Always clearly labelled', 'Coming soon'],
    note: 'Net prices per month, plus 23% VAT. No fixed-term contract. Tick what you want in the dashboard and see the total straight away.',
  },
  why: {
    eyebrow: 'Why Spoot',
    title: 'Here the kitchen wins, not the ad budget.',
    text: "On Spoot every guest builds their own ranking from what they've eaten and rated. You can't buy a place in someone's taste — you earn it with your food.",
    cta: 'See Spoot through a guest’s eyes',
    cards: [
      ['You reach people who like your kind of food', 'The app recommends your venue to the people it suits — not to everyone equally.'],
      ['A small place gets the same chance as a chain', 'Dish ratings are what count. Paid promotion is always clearly labelled.'],
    ],
  },
  how: {
    eyebrow: 'How it works',
    title: 'Three steps and the venue is yours',
    steps: [
      ['Create an account', 'Nickname, email and phone number. No password — you log in with a link sent to your email.'],
      ['Claim your venue', "Find it in our directory and leave your phone number. We'll call you within 1 business day, so no stranger can take over your profile."],
      ['Manage it from anywhere', 'On your computer in the dashboard or on your phone in the app. Guests see your changes straight away.'],
    ],
  },
  faqTitle: 'Questions we hear most often',
  faq: [
    ["Really free? What's the catch?", `There isn't one. Your profile, menu, deals and stats are free forever. ${LOYALTY_NOTE_EN} A website for your venue is also paid — only if you ask for one, with no setup fee. Paid promotion in the app is still in the works.`],
    ["My venue isn't on Spoot. What now?", "You add it yourself when you claim it: name, address and type of venue. We'll check the details and add it to the directory along with your claim."],
    ['How does verification work?', `We call everyone who submits a claim, usually within 1 business day and at a time that suits you. On the same call we'll show you around the dashboard. Prefer to write? ${MAIL}.`],
    ['Is the dashboard in English?', `Not at the moment — the dashboard and the Spoot app are in Polish. If anything is unclear, write to us in English at ${MAIL}.`],
    ['Can I remove a bad rating?', 'No — and that works in your favour. Guests trust the ratings because nobody cleans them up. You can reply to a review and report content that breaks the rules.'],
    ['Do I need the app on my phone?', "No. The whole dashboard works in a browser on your computer. The app comes in handy at the till — for scanning your regulars' loyalty cards."],
  ],
  footer: {
    title: "Your venue is already here. All that's missing is you.",
    text: 'Claiming it takes a few minutes. Free to start.',
    app: 'The Spoot app',
    panel: 'Owner dashboard',
    terms: 'Terms of service (in Polish)',
    privacy: 'Privacy policy (in Polish)',
  },
};

export const COPY: Record<Lang, Copy> = { pl, en };
