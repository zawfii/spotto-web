// /dla-restauracji — strona sprzedażowa dla właścicieli lokali (układ w RestaurantsPage.tsx, teksty w copy.ts).
import type { Metadata } from 'next';
import RestaurantsPage from './RestaurantsPage';

const PL = 'https://spootme.pl/dla-restauracji';
const EN = 'https://spootme.pl/dla-restauracji/en';

export const metadata: Metadata = {
  title: 'Spoot dla restauracji — menu, oferty i stali goście w jednym panelu',
  description:
    'Przejmij profil swojego lokalu w Spoot. Menu, oferty dnia, karta stałego gościa i statystyki w jednym panelu. Zaczynasz za darmo.',
  alternates: { canonical: PL, languages: { pl: PL, en: EN, 'x-default': PL } },
  openGraph: {
    title: 'Spoot dla restauracji',
    description: 'Goście wybierają w Spoot, gdzie dziś zjedzą. Bądź na ich liście — zaczynasz za darmo.',
    url: PL,
    locale: 'pl_PL',
    type: 'website',
  },
};

export default function DlaRestauracjiPage() {
  return <RestaurantsPage lang="pl" />;
}
