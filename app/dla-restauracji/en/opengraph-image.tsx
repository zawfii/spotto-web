import { OG_SIZE, renderOg } from '../og';

export const size = OG_SIZE;
export const contentType = 'image/png';
export const alt = 'Spoot for restaurants — menu, daily deals and regulars in one dashboard';

export default function Image() {
  return renderOg({
    badge: 'FOR RESTAURANTS',
    title: 'Diners use Spoot to choose where to eat today.',
    lead: 'Menu, daily deals, loyalty stamps and stats in one dashboard.',
    url: 'spootme.pl/dla-restauracji/en',
    stat: 'PROFILE VIEWS',
    statValue: '3,480',
    statSub: 'in the last 30 days',
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  });
}
