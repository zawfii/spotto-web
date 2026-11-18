// lib/owner.ts
import { SupabaseClient } from '@supabase/supabase-js';
import { pickVenueId } from '@/lib/panel';

// ─── Typy ────────────────────────────────────────────────────────────────────

export type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export type DaySchedule = {
  open: string;
  close: string;
  closed: boolean;
};

export type Hours = Record<DayKey, DaySchedule>;

export const DEFAULT_HOURS: Hours = {
  mon: { open: '12:00', close: '22:00', closed: false },
  tue: { open: '12:00', close: '22:00', closed: false },
  wed: { open: '12:00', close: '22:00', closed: false },
  thu: { open: '12:00', close: '22:00', closed: false },
  fri: { open: '12:00', close: '23:00', closed: false },
  sat: { open: '13:00', close: '23:00', closed: false },
  sun: { open: '13:00', close: '21:00', closed: false },
};

export type VenueInfo = {
  place_id: string;
  place_name: string;
  place_category: string;
  place_district: string | null;
  place_image_url: string | null;
  description: string;
  phone: string;
  address: string;
  instagram: string;
  menu_url: string;
  hours: Hours;
  is_premium: boolean;
  reservation_notifications: boolean;
};

/** Lokal z listy lokali konta (przełącznik w panelu). */
export type OwnerVenueRef = {
  place_id: string;
  place_name: string;
  place_district: string | null;
  place_category: string;
};

export type VenueStats = {
  savedCount: number;
  avgRating: number;
  reviewCount: number;
};

export type VenueAnalytics = {
  views: number;
  menu_clicks: number;
  saves_total: number;
  saves_tiktok: number;
  saves_instagram: number;
  best_days: { day: string; count: number }[];
};

export type Review = {
  id: string;
  user_id: string;
  display_name: string;
  rating: number;
  opinion: string | null;
  tags: string[];
  created_at: string;
  /** Odpowiedź właściciela (rating_replies). */
  reply: string | null;
};

export type MenuSection = {
  id: string;
  name: string;
  position: number;
  menu_items: MenuItem[];
};

export type MenuItem = {
  id: string;
  section_id: string;
  name: string;
  price: number;
  description: string | null;
  is_vege: boolean;
  spice_level: 0 | 1 | 2 | 3;
  is_available: boolean;
  position: number;
  image_url: string | null;
  allergens: AllergenKey[] | null; // null = nieuzupełnione, [] = brak alergenów
};

// 14 alergenów, które restauracje w UE muszą podawać — klucze jak w menu_items.allergens.
export const ALLERGENS = [
  { key: 'gluten', label: 'Gluten' },
  { key: 'jaja', label: 'Jaja' },
  { key: 'mleko', label: 'Mleko' },
  { key: 'orzechy', label: 'Orzechy' },
  { key: 'orzeszki_ziemne', label: 'Orzeszki ziemne' },
  { key: 'soja', label: 'Soja' },
  { key: 'ryby', label: 'Ryby' },
  { key: 'skorupiaki', label: 'Skorupiaki' },
  { key: 'mieczaki', label: 'Mięczaki' },
  { key: 'seler', label: 'Seler' },
  { key: 'gorczyca', label: 'Gorczyca' },
  { key: 'sezam', label: 'Sezam' },
  { key: 'lubin', label: 'Łubin' },
  { key: 'siarczyny', label: 'Siarczyny' },
] as const;

export type AllergenKey = (typeof ALLERGENS)[number]['key'];

export const allergenLabels = (keys: readonly string[]) =>
  ALLERGENS.filter(a => keys.includes(a.key)).map(a => a.label.toLowerCase()).join(', ');

export type MenuItemInput = Omit<MenuItem, 'id' | 'section_id' | 'position'>;

export type VenuePhoto = {
  id: string;
  place_id: string;
  owner_id: string;
  url: string;
  storage_path: string;
  position: number;
};

// ─── Funkcje ─────────────────────────────────────────────────────────────────

/** Zatwierdzone lokale właściciela, alfabetycznie po nazwie (remis → po place_id). */
export async function getOwnerVenues(
  supabase: SupabaseClient,
  userId: string
): Promise<OwnerVenueRef[]> {
  const { data: rows } = await supabase.from('venue_details').select('place_id').eq('owner_id', userId);
  const ids = (rows ?? []).map(r => r.place_id as string);
  if (ids.length === 0) return [];

  const { data: places } = await supabase.from('places').select('id, name, category, district').in('id', ids);
  const byId = new Map((places ?? []).map(p => [p.id as string, p]));

  return ids
    .map(id => {
      const p = byId.get(id);
      return {
        place_id: id,
        place_name: p?.name ?? 'Twój lokal',
        place_district: p?.district ?? null,
        place_category: p?.category ?? '',
      };
    })
    // remis nazw (sieć) po id: venue_details bez ORDER BY, a „pierwszy” lokal nie może skakać
    .sort((a, b) => a.place_name.localeCompare(b.place_name, 'pl') || a.place_id.localeCompare(b.place_id));
}

/** Pobiera venue_details + dane places wybranego lokalu (`wanted` z ciasteczka, jeśli należy
 *  do konta; inaczej pierwszy) i listę lokali konta. Null, gdy konto nie ma zatwierdzonego lokalu. */
export async function getOwnerVenue(
  supabase: SupabaseClient,
  userId: string,
  wanted?: string
): Promise<{ venue: VenueInfo; venues: OwnerVenueRef[] } | null> {
  const venues = await getOwnerVenues(supabase, userId);
  const placeId = pickVenueId(venues.map(v => v.place_id), wanted);
  if (!placeId) return null;

  const [{ data: vd }, { data: place }] = await Promise.all([
    supabase.from('venue_details').select('*').eq('place_id', placeId).eq('owner_id', userId).maybeSingle(),
    supabase.from('places').select('image_url').eq('id', placeId).maybeSingle(),
  ]);
  if (!vd) return null;

  const ref = venues.find(v => v.place_id === placeId)!;
  const venue: VenueInfo = {
    place_id: placeId,
    place_name: ref.place_name,
    place_category: ref.place_category,
    place_district: ref.place_district,
    place_image_url: place?.image_url ?? null,
    description: vd.description ?? '',
    phone: vd.phone ?? '',
    address: vd.address ?? '',
    instagram: vd.instagram ?? '',
    menu_url: vd.menu_url ?? '',
    hours: (vd.hours as Hours) ?? DEFAULT_HOURS,
    is_premium: vd.is_premium ?? false,
    reservation_notifications: vd.reservation_notifications ?? true,
  };
  return { venue, venues };
}

/** Pobiera podstawowe statystyki lokalu: zapisania, ocena, liczba opinii. */
export async function fetchStats(
  supabase: SupabaseClient,
  placeId: string
): Promise<VenueStats> {
  const [savedRes, ratingsRes] = await Promise.all([
    supabase
      .from('spoot_list_places')
      .select('id', { count: 'exact', head: true })
      .eq('place_id', placeId),
    supabase
      .from('ratings')
      .select('id, rating')
      .eq('place_id', placeId),
  ]);

  const savedCount = savedRes.count ?? 0;
  const ratingRows = ratingsRes.data ?? [];
  const reviewCount = ratingRows.length;
  const avgRating =
    reviewCount > 0
      ? Math.round(
          (ratingRows.reduce((s, r) => s + Number(r.rating), 0) / reviewCount) * 10
        ) / 10
      : 0;

  return { savedCount, avgRating, reviewCount };
}

export type StatsRange = { from: Date; to: Date };

/** Ostatnie `days` dni, do teraz. */
export const lastDays = (days: number): StatsRange => ({ from: new Date(Date.now() - days * 86400000), to: new Date() });

/** Pobiera analitykę z wybranego okresu: wyświetlenia, kliknięcia menu; zapisy i źródła są łączne. */
export async function fetchAnalytics(
  supabase: SupabaseClient,
  placeId: string,
  range: StatsRange = lastDays(30)
): Promise<VenueAnalytics> {
  const from = range.from.toISOString();
  const to = range.to.toISOString();
  const DAY_NAMES = ['Nd', 'Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob'];
  const events = (type: string) =>
    supabase.from('place_events').select('id', { count: 'exact', head: true })
      .eq('place_id', placeId).eq('event_type', type).gte('created_at', from).lte('created_at', to);

  // Daty wyświetleń stronami po 1000 (limit API) — przy roku jedna strona nie wystarcza.
  // ponytail: sufit 20 000 wyświetleń na wykres dni tygodnia; powyżej przenieść liczenie do funkcji w bazie.
  async function viewDates() {
    const out: string[] = [];
    for (let page = 0; page < 20; page++) {
      const { data } = await supabase.from('place_events').select('created_at')
        .eq('place_id', placeId).eq('event_type', 'view').gte('created_at', from).lte('created_at', to)
        .order('created_at').range(page * 1000, page * 1000 + 999);
      out.push(...(data ?? []).map(r => r.created_at as string));
      if (!data || data.length < 1000) break;
    }
    return out;
  }

  const [viewsRes, menuRes, savesRes, socialRes, dates] = await Promise.all([
    events('view'),
    events('menu_click'),
    supabase.from('spoot_list_places').select('id', { count: 'exact', head: true }).eq('place_id', placeId),
    supabase.from('social_posts').select('source').eq('place_id', placeId).in('source', ['tiktok', 'instagram']),
    viewDates(),
  ]);

  const socialRows = socialRes.data ?? [];
  const dayCounts = [0, 0, 0, 0, 0, 0, 0];
  dates.forEach(d => { dayCounts[new Date(d).getDay()]++; });

  return {
    views: viewsRes.count ?? 0,
    menu_clicks: menuRes.count ?? 0,
    saves_total: savesRes.count ?? 0,
    saves_tiktok: socialRows.filter(r => r.source === 'tiktok').length,
    saves_instagram: socialRows.filter(r => r.source === 'instagram').length,
    best_days: DAY_NAMES.map((day, i) => ({ day, count: dayCounts[i] })),
  };
}

/** Pobiera opinie lokalu (najnowsze pierwsze) z nazwą autora i odpowiedzią właściciela. */
export async function fetchReviews(
  supabase: SupabaseClient,
  placeId: string
): Promise<Review[]> {
  const [{ data: ratingRows }, { data: replyRows }] = await Promise.all([
    supabase
      .from('ratings')
      .select('id, user_id, rating, opinion, tags, created_at')
      .eq('place_id', placeId)
      .order('created_at', { ascending: false })
      .limit(500),
    supabase.from('rating_replies').select('rating_id, body').eq('place_id', placeId),
  ]);

  if (!ratingRows || ratingRows.length === 0) return [];

  const userIds = [...new Set(ratingRows.map(r => r.user_id))];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name')
    .in('id', userIds);

  const nameMap = Object.fromEntries(
    (profiles ?? []).map(p => [p.id, p.display_name])
  );
  const replyMap = Object.fromEntries((replyRows ?? []).map(r => [r.rating_id, r.body as string]));

  return ratingRows.map(r => ({
    id: r.id,
    user_id: r.user_id,
    display_name: nameMap[r.user_id] ?? 'Użytkownik',
    rating: Number(r.rating),
    opinion: r.opinion ?? null,
    tags: r.tags ?? [],
    created_at: r.created_at,
    reply: replyMap[r.id] ?? null,
  }));
}

/** Pobiera sekcje menu z pozycjami dla danego lokalu. */
export async function fetchMenu(
  supabase: SupabaseClient,
  placeId: string
): Promise<MenuSection[]> {
  const { data: sections } = await supabase
    .from('menu_sections')
    .select('id, name, position, menu_items(id, section_id, name, price, description, is_vege, spice_level, is_available, position, image_url, allergens)')
    .eq('place_id', placeId)
    .order('position', { ascending: true });

  if (!sections) return [];

  return sections.map(s => ({
    ...s,
    menu_items: ((s.menu_items as MenuItem[]) ?? []).sort(
      (a, b) => a.position - b.position
    ),
  }));
}

/** Formatuje cenę do wyświetlenia, np. 38 → "38,00 zł" */
export function formatPrice(price: number): string {
  return price.toFixed(2).replace('.', ',') + ' zł';
}
