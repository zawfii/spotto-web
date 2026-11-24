import type { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase';

const BASE = 'https://spootme.pl';

// Strona główna to landing na www (repo spoot-landing, własna mapa). Lokale /place/… celowo pominięte:
// to głównie dane z Google — dopisać, gdy będą miały własne oceny w Spoot.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Włączona strona lokalu wpisuje swój adres do places.website_uri (trigger place_site_link).
  const { data } = await supabase.from('places').select('website_uri').like('website_uri', `${BASE}/%`);
  const sites = (data ?? [])
    .map((p) => p.website_uri as string)
    .filter((url) => url !== `${BASE}/bistropokazowe`); // demo z /dla-restauracji

  return ['/dla-restauracji', '/dla-restauracji/en', '/regulamin', '/polityka-prywatnosci']
    .map((path) => BASE + path)
    .concat(sites)
    .map((url) => ({ url }));
}
