import type { Metadata } from 'next';
import { Manrope, Plus_Jakarta_Sans } from 'next/font/google';

const manrope = Manrope({ subsets: ['latin', 'latin-ext'], weight: ['500', '600', '700'], variable: '--font-manrope' });
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin', 'latin-ext'], weight: ['400', '500', '600'], variable: '--font-jakarta' });

export const metadata: Metadata = {
  title: 'Spoot dla restauracji',
  description: 'Panel właściciela lokalu w Spoot: menu, zdjęcia, opinie i statystyki.',
  robots: { index: false },
};

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${manrope.variable} ${jakarta.variable} min-h-screen bg-spoot-surface font-body text-sm text-spoot-ink`}>
      {children}
    </div>
  );
}
