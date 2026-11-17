import type { MetadataRoute } from 'next';

// panel.spootme.pl tu nie trafia (middleware przepisuje na /owner/… → 404); panel chroni noindex w app/owner/layout.tsx.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: 'https://spootme.pl/sitemap.xml',
  };
}
