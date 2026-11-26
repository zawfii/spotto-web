'use client';

import { useEffect } from 'react';
import { track } from '@/lib/page-stats';

/** Wejście na stronę + kliknięcia w linki (np. „Zgłoś swój lokal”, „Zaloguj się”) → PostHog, opis w lib/page-stats.ts. */
export default function PageStats() {
  useEffect(() => {
    track('$pageview');
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element).closest?.('a[href]');
      if (a) track('dla_restauracji_click', { href: a.getAttribute('href'), text: a.textContent?.trim().slice(0, 80) });
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);
  return null;
}
