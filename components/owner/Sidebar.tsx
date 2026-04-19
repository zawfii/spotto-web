'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { useMemo } from 'react';

const NAV = [
  { href: '/owner', label: 'Dashboard', icon: '⊞' },
  { href: '/owner/menu', label: 'Menu', icon: '🍽' },
  { href: '/owner/stats', label: 'Statystyki', icon: '📊' },
  { href: '/owner/reviews', label: 'Opinie', icon: '⭐' },
  { href: '/owner/settings', label: 'Ustawienia', icon: '⚙️' },
];

export default function Sidebar({ ownerInitial }: { ownerInitial: string }) {
  const pathname = usePathname();
  const router = useRouter();

  const supabase = useMemo(
    () => createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    ),
    []
  );

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/owner/login');
    router.refresh();
  }

  function isActive(href: string) {
    if (href === '/owner') return pathname === '/owner';
    return pathname.startsWith(href);
  }

  return (
    <nav className="w-[60px] bg-[#1a1a1a] flex flex-col items-center py-4 gap-1 flex-shrink-0">
      {/* Logo */}
      <div className="w-9 h-9 bg-[#D4892A] rounded-xl flex items-center justify-center text-white font-bold text-base mb-4">
        S
      </div>

      {/* Nav items */}
      {NAV.map(item => (
        <Link
          key={item.href}
          href={item.href}
          title={item.label}
          className={`
            w-11 h-11 rounded-xl flex flex-col items-center justify-center gap-0.5
            transition-colors group relative
            ${isActive(item.href)
              ? 'bg-[#D4892A]/20'
              : 'hover:bg-white/8'}
          `}
        >
          <span className="text-lg leading-none">{item.icon}</span>
          <span className={`text-[8px] font-medium leading-none ${
            isActive(item.href) ? 'text-[#D4892A]' : 'text-white/40'
          }`}>
            {item.label.toUpperCase()}
          </span>
          {/* Tooltip */}
          <span className="absolute left-14 bg-[#333] text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
            {item.label}
          </span>
        </Link>
      ))}

      {/* Spacer + avatar */}
      <div className="flex-1" />
      <button
        onClick={handleLogout}
        title="Wyloguj"
        className="w-8 h-8 rounded-full bg-[#333] flex items-center justify-center text-white/60 text-sm font-semibold hover:bg-[#444] transition-colors"
      >
        {ownerInitial}
      </button>
    </nav>
  );
}
