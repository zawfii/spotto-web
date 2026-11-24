import { OG_SIZE, renderOg } from './og';

export const size = OG_SIZE;
export const contentType = 'image/png';
export const alt = 'Spoot dla restauracji — menu, oferty i stali goście w jednym panelu';

export default function Image() {
  return renderOg({
    badge: 'DLA RESTAURACJI',
    title: 'Goście wybierają w Spoot, gdzie dziś zjedzą.',
    lead: 'Menu, oferty dnia, pieczątki i statystyki w jednym panelu.',
    url: 'spootme.pl/dla-restauracji',
    stat: 'WYŚWIETLENIA PROFILU',
    statValue: '3 480',
    statSub: 'w ostatnich 30 dniach',
    days: ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nd'],
  });
}
