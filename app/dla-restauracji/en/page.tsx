// /dla-restauracji/en — angielska wersja strony dla restauracji (ten sam układ, teksty z copy.ts).
import type { Metadata } from 'next';
import RestaurantsPage from '../RestaurantsPage';

const PL = 'https://spootme.pl/dla-restauracji';
const EN = 'https://spootme.pl/dla-restauracji/en';

export const metadata: Metadata = {
  title: 'Spoot for restaurants — menu, daily deals and regulars in one dashboard',
  description:
    'Claim your venue’s profile on Spoot. Menu, daily deals, a loyalty card and stats in one dashboard. Free to start.',
  alternates: { canonical: EN, languages: { pl: PL, en: EN, 'x-default': PL } },
  openGraph: {
    title: 'Spoot for restaurants',
    description: 'Diners use Spoot to choose where to eat today. Get on their list — free to start.',
    url: EN,
    locale: 'en_GB',
    type: 'website',
  },
};

export default function ForRestaurantsPage() {
  return <RestaurantsPage lang="en" />;
}
