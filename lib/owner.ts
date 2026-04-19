// lib/owner.ts
import { SupabaseClient } from '@supabase/supabase-js';

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

export type VenueStats = {
  savedCount: number;
  avgRating: number;
  reviewCount: number;
};

export type VenueAnalytics = {
  views_30d: number;
  menu_clicks_30d: number;
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
};

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

/** Pobiera venue_details + dane places dla zalogowanego właściciela.
 *  Zwraca null jeśli właściciel nie ma zatwierdzonego lokalu. */
export async function getOwnerVenue(
  supabase: SupabaseClient,
  userId: string
): Promise<VenueInfo | null> {
  const { data: vd } = await supabase
    .from('venue_details')
    .select('*')
    .eq('owner_id', userId)
    .maybeSingle();

  if (!vd) return null;

  const { data: place } = await supabase
    .from('places')
    .select('name, category, district, image_url')
    .eq('id', vd.place_id)
    .maybeSingle();

  return {
    place_id: vd.place_id as string,
    place_name: place?.name ?? 'Twój lokal',
    place_category: place?.category ?? '',
    place_district: place?.district ?? null,
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

/** Pobiera analitykę: wyświetlenia, kliknięcia menu, zapisy, źródła social. */
export async function fetchAnalytics(
  supabase: SupabaseClient,
  placeId: string
): Promise<VenueAnalytics> {
  const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const DAY_NAMES = ['Nd', 'Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob'];

  const [viewsRes, menuRes, savesRes, socialRes, bestDaysRes] = await Promise.all([
    supabase
      .from('place_events')
      .select('id', { count: 'exact', head: true })
      .eq('place_id', placeId)
      .eq('event_type', 'view')
      .gte('created_at', since30d),
    supabase
      .from('place_events')
      .select('id', { count: 'exact', head: true })
      .eq('place_id', placeId)
      .eq('event_type', 'menu_click')
      .gte('created_at', since30d),
    supabase
      .from('spoot_list_places')
      .select('id', { count: 'exact', head: true })
      .eq('place_id', placeId),
    supabase
      .from('social_posts')
      .select('source')
      .eq('place_id', placeId)
      .in('source', ['tiktok', 'instagram']),
    supabase
      .from('place_events')
      .select('created_at')
      .eq('place_id', placeId)
      .eq('event_type', 'view')
      .gte('created_at', since30d),
  ]);

  const socialRows = socialRes.data ?? [];
  const saves_tiktok = socialRows.filter(r => r.source === 'tiktok').length;
  const saves_instagram = socialRows.filter(r => r.source === 'instagram').length;

  const dayCounts: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  (bestDaysRes.data ?? []).forEach(r => {
    const dow = new Date(r.created_at).getDay();
    dayCounts[dow] = (dayCounts[dow] ?? 0) + 1;
  });
  const best_days = DAY_NAMES.map((day, i) => ({ day, count: dayCounts[i] ?? 0 }));

  return {
    views_30d: viewsRes.count ?? 0,
    menu_clicks_30d: menuRes.count ?? 0,
    saves_total: savesRes.count ?? 0,
    saves_tiktok,
    saves_instagram,
    best_days,
  };
}

/** Pobiera 20 ostatnich opinii z display_name z profiles. */
export async function fetchReviews(
  supabase: SupabaseClient,
  placeId: string
): Promise<Review[]> {
  const { data: ratingRows } = await supabase
    .from('ratings')
    .select('id, user_id, rating, opinion, tags, created_at')
    .eq('place_id', placeId)
    .order('created_at', { ascending: false })
    .limit(20);

  if (!ratingRows || ratingRows.length === 0) return [];

  const userIds = [...new Set(ratingRows.map(r => r.user_id))];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name')
    .in('id', userIds);

  const nameMap = Object.fromEntries(
    (profiles ?? []).map(p => [p.id, p.display_name])
  );

  return ratingRows.map(r => ({
    id: r.id,
    user_id: r.user_id,
    display_name: nameMap[r.user_id] ?? 'Użytkownik',
    rating: Number(r.rating),
    opinion: r.opinion ?? null,
    tags: r.tags ?? [],
    created_at: r.created_at,
  }));
}

/** Pobiera sekcje menu z pozycjami dla danego lokalu. */
export async function fetchMenu(
  supabase: SupabaseClient,
  placeId: string
): Promise<MenuSection[]> {
  const { data: sections } = await supabase
    .from('menu_sections')
    .select('id, name, position, menu_items(id, section_id, name, price, description, is_vege, spice_level, is_available, position)')
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
