import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Spoot',
  description: 'Knajpy z rolek na Instagramie i TikToku w jednym miejscu.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pl">
      <body>{children}</body>
    </html>
  );
}
