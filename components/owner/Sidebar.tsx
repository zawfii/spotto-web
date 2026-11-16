'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Wordmark } from '@/components/SpootLogo';
import LogoutButton from './LogoutButton';
import { NavIcon, NAV_ICONS } from './ui';

const NAV = [
  { path: '', label: 'Pulpit', icon: NAV_ICONS.home },
  { path: '/menu', label: 'Menu', icon: NAV_ICONS.menu },
  { path: '/deals', label: 'Oferty', icon: NAV_ICONS.tag },
  { path: '/loyalty', label: 'Pieczątki', icon: NAV_ICONS.card },
  { path: '/stats', label: 'Statystyki', icon: NAV_ICONS.stats },
  { path: '/reviews', label: 'Opinie', icon: NAV_ICONS.star },
  { path: '/settings', label: 'Profil lokalu', icon: NAV_ICONS.store },
  { path: '/promote', label: 'Wyróżnienie', icon: NAV_ICONS.rocket },
  { path: '/website', label: 'Strona dla lokalu', icon: NAV_ICONS.globe, badge: 'NOWE' },
];

type Props = { base: string; venueName: string; venueMeta: string; userEmail: string };

export default function Sidebar({ base, venueName, venueMeta, userEmail }: Props) {
  const pathname = usePathname();
  // Na subdomenie przeglądarka widzi /menu, pod spootme.pl — /owner/menu.
  const isActive = (path: string) => {
    const href = `${base}${path}` || '/';
    return path === '' ? pathname === href : pathname.startsWith(href);
  };

  return (
    <nav aria-label="Panel właściciela" className="flex flex-[1_0_240px] flex-col gap-6 bg-spoot-ink px-4 py-6 text-white">
      <div className="flex flex-col gap-1.5 px-3">
        <Wordmark size={26} color="#ffffff" />
        <span className="font-display text-[10px] font-bold tracking-[1.5px] text-white/80">DLA RESTAURACJI</span>
      </div>

      <div className="flex flex-col gap-0.5 rounded-2xl bg-white/15 p-3">
        <span className="font-display text-sm font-bold">{venueName}</span>
        {venueMeta && <span className="text-xs text-white/80">{venueMeta}</span>}
      </div>

      <div className="flex flex-col gap-1">
        {NAV.map(item => {
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              href={`${base}${item.path}` || '/'}
              aria-current={active ? 'page' : undefined}
              className={`flex min-h-11 items-center gap-3 rounded-xl px-3 font-display text-sm font-semibold transition-colors ${active ? 'bg-white/15 text-white' : 'text-white/80 hover:bg-white/10'}`}
            >
              <NavIcon>{item.icon}</NavIcon>
              <span className="grow">{item.label}</span>
              {'badge' in item && <span className="rounded-full bg-spoot-orange px-2 font-display text-[10px] font-bold leading-5 tracking-[0.5px] text-spoot-ink">{item.badge}</span>}
            </Link>
          );
        })}
      </div>

      <div className="mt-auto flex flex-col gap-1 border-t border-white/50 px-3 pt-3">
        <span className="truncate text-xs text-white/80">{userEmail}</span>
        <LogoutButton base={base} className="self-start py-2 font-display text-[13px] font-bold underline underline-offset-4 hover:text-white/80" />
      </div>
    </nav>
  );
}
