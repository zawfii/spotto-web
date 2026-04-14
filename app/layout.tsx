import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Spotto - Shared Lists',
  description: 'View shared Spotto food lists',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
