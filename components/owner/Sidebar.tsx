'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Wordmark } from '@/components/SpootLogo';
import { selectVenue } from '@/app/owner/actions';
import type { OwnerVenueRef } from '@/lib/owner';
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
  { path: '/promote', label: 'Wyróżnienie', icon: NAV_ICONS.rocket, badge: 'WKRÓTCE' },
  { path: '/website', label: 'Cennik i strona', icon: NAV_ICONS.globe },
];

type Props = { base: string; venues: OwnerVenueRef[]; selectedId: string; canAdd: boolean; userEmail: string };

const metaOf = (v: OwnerVenueRef) => [v.place_district, v.place_category].filter(Boolean).join(' · ');

export default function Sidebar({ base, venues, selectedId, canAdd, userEmail }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const switcher = useRef<HTMLDetailsElement>(null);
  const [switching, setSwitching] = useState(false);
  const current = venues.find(v => v.place_id === selectedId) ?? venues[0];
  const others = venues.filter(v => v !== current);

  // Nowy lokal dotarł z serwera albo przejście na inną stronę — zwiń listę i odblokuj przyciski.
  useEffect(() => {
    setSwitching(false);
    if (switcher.current) switcher.current.open = false;
  }, [selectedId, pathname]);

  async function choose(placeId: string) {
    setSwitching(true);
    try {
      await selectVenue(placeId);
      router.refresh();
    } catch {
      setSwitching(false);
    }
  }

  const card = (
    <span className="flex min-w-0 grow flex-col gap-0.5">
      <span className="font-display text-sm font-bold">{current.place_name}</span>
      {metaOf(current) && <span className="text-xs text-white/80">{metaOf(current)}</span>}
    </span>
  );

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

      {venues.length > 1 ? (
        <details ref={switcher} className="group rounded-2xl bg-white/15">
          <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-2xl p-3 hover:bg-white/10 [&::-webkit-details-marker]:hidden">
            {card}
            <span className="sr-only">Zmień lokal</span>
            <span className="transition-transform group-open:rotate-90"><NavIcon>{NAV_ICONS.chevron}</NavIcon></span>
          </summary>
          <div className="flex flex-col gap-0.5 border-t border-white/20 p-1.5" aria-busy={switching}>
            {others.map(v => (
              <button
                key={v.place_id}
                type="button"
                disabled={switching}
                onClick={() => choose(v.place_id)}
                className="flex min-h-11 w-full flex-col items-start justify-center gap-0.5 rounded-xl px-3 py-1.5 text-left hover:bg-white/10 disabled:cursor-wait disabled:opacity-60"
              >
                <span className="font-display text-sm font-semibold">{v.place_name}</span>
                {metaOf(v) && <span className="text-xs text-white/80">{metaOf(v)}</span>}
              </button>
            ))}
            {canAdd && (
              <Link href={`${base}/add`} className="flex min-h-11 items-center rounded-xl px-3 font-display text-sm font-bold hover:bg-white/10">
                + Dodaj lokal
              </Link>
            )}
          </div>
        </details>
      ) : (
        <div className="flex flex-col gap-1">
          <div className="flex rounded-2xl bg-white/15 p-3">{card}</div>
          {canAdd && (
            <Link href={`${base}/add`} className="flex min-h-11 items-center self-start px-3 font-display text-[13px] font-bold underline underline-offset-4 hover:text-white/80">
              Dodaj lokal
            </Link>
          )}
        </div>
      )}

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
