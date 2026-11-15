import type { CSSProperties, ReactNode } from 'react';

// Wspólne kawałki stron profilu i listy.
const GREEN = '#164938';
const MANROPE = 'var(--font-manrope), sans-serif';

export function Avatar({ url, name, size, onDark = false }: { url: string | null; name: string; size: number; onDark?: boolean }) {
  const box: CSSProperties = { width: size, height: size, borderRadius: '50%', flexShrink: 0 };
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt="" style={{ ...box, objectFit: 'cover', boxShadow: onDark ? '0 0 0 2px rgba(255,255,255,0.25)' : undefined }} />;
  }
  const initial = name.replace(/^@/, '').charAt(0).toUpperCase();
  return (
    <span aria-hidden="true" style={{ ...box, background: onDark ? 'rgba(255,255,255,0.15)' : GREEN, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: MANROPE, fontWeight: 700, fontSize: size * 0.4 }}>
      {initial}
    </span>
  );
}

export function Icon({ children, color = GREEN, size = 20 }: { children: ReactNode; color?: string; size?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      {children}
    </svg>
  );
}

export const ICONS = {
  bookmark: <path d="M6 4h12v17l-6-4-6 4z" />,
  fork: <><path d="M7 3v8a2 2 0 0 0 2 2v8" /><path d="M11 3v8a2 2 0 0 1-2 2" /><path d="M17 21V3c-2 1.5-3 4-3 7v4h3" /></>,
  chevron: <path d="M9 6l6 6-6 6" />,
  people: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8" /><path d="M18 14a6.5 6.5 0 0 1 3.5 6" /></>,
  star: <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" />,
  sparkle: <><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" /><path d="M19 15l.8 2.2 2.2.8-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z" /></>,
  share: <><path d="M12 3v12" /><path d="M7 8l5-5 5 5" /><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" /></>,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
};
