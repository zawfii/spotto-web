import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function getProfileByUsername(username: string) {
  try {
    const { data, error } = await supabase.rpc('get_public_profile_by_username', { p_username: username });
    if (error || !data) return null;
    return data as {
      username: string;
      display_name: string;
      avatar_url: string | null;
      bio: string | null;
      lists: Array<{ id: string; name: string; slug: string; icon: string; place_count: number }>;
      topki: Array<{ id: string; title: string; total_count: number; places: Array<{ rank: number; name: string; image: string }> }>;
    };
  } catch {
    return null;
  }
}

export async function getRatingGroupPreview(groupId: string) {
  try {
    const { data, error } = await supabase.rpc('get_rating_group_preview', { p_group_id: groupId });
    if (error || !data || data.length === 0) return null;
    return data[0] as { id: string; name: string; member_count: number };
  } catch {
    return null;
  }
}

export type Rating = {
  id: string;
  place_id: string;
  place_name: string;
  place_image: string | null;
  place_category: string | null;
  rating: number;
  opinion: string | null;
  dishes: string[] | null;
  dish_entries: { name: string; score?: number }[] | null;
  created_at: string;
};

// To samo co ekran profilu znajomego w apce (app/user-profile.tsx) — profiles, ratings i follows są czytelne dla anon.
export async function getProfileExtras(username: string) {
  const { data: p } = await supabase.from('profiles').select('id, city').eq('username', username.toLowerCase()).maybeSingle();
  if (!p) return null;
  const [ratings, followers, following] = await Promise.all([
    supabase
      .from('ratings')
      .select('id, place_id, place_name, place_image, place_category, rating, opinion, dishes, dish_entries, created_at', { count: 'exact' })
      .eq('user_id', p.id)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', p.id),
    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', p.id),
  ]);
  const rows = (ratings.data ?? []) as Rating[];
  // Ocena trzyma zdjęcie z chwili oceniania (bywa zastępcze), lokal ma aktualne z Google.
  const { data: places } = rows.length
    ? await supabase.from('places').select('id, image_url').in('id', Array.from(new Set(rows.map((r) => r.place_id))))
    : { data: [] };
  const placeImage = new Map((places ?? []).map((pl) => [pl.id as string, pl.image_url as string | null]));
  return {
    city: (p.city as string | null) ?? null,
    ratings: rows.map((r) => ({ ...r, place_image: [placeImage.get(r.place_id), r.place_image].find(isRealPhoto) ?? null })),
    ratingsCount: ratings.count ?? ratings.data?.length ?? 0,
    followers: followers.count ?? 0,
    following: following.count ?? 0,
  };
}

// Zastępcze zdjęcia z mocków apki to stock z Unsplash — wtedy lepiej ikona niż cudze wnętrze.
// ponytail: rozpoznaje tylko host Unsplash; gdyby doszły inne zastępcze źródła, dopisać tutaj.
export function isRealPhoto(url: string | null | undefined): url is string {
  return !!url && !url.includes('images.unsplash.com');
}

// URL-e z bazy pochodzą ze scrapingu stron i od użytkowników — do linków i <img> tylko http(s).
function safeUrl(url: string | null | undefined) {
  return url && /^https?:\/\//i.test(url) ? url : null;
}

export type PlaceReview = {
  id: string;
  rating: number;
  opinion: string | null;
  dishes: string[] | null;
  dish_entries: { name: string; score?: number }[] | null;
  created_at: string;
  photos: string[];
  author: { name: string; username: string | null; avatar_url: string | null };
};

export type PlaceMenuSection = {
  id: string;
  name: string;
  items: { id: string; name: string; price: number; description: string | null; is_vege: boolean; image_url: string | null; allergens: string[] | null }[];
};

// Opinie i menu lokalu — jak app/place-ratings.tsx i hooks/useMenu.ts w apce. Oceny grupowe ukrywa RLS.
export async function getPlaceExtras(placeId: string) {
  const [ratings, menu, link, venue] = await Promise.all([
    supabase
      .from('ratings')
      .select('id, user_id, rating, opinion, dishes, dish_entries, created_at, rating_photos(url)')
      .eq('place_id', placeId)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('menu_sections')
      .select('id, name, source, source_url, updated_at, menu_items(id, name, price, description, is_vege, image_url, allergens)')
      .eq('place_id', placeId)
      .order('position', { ascending: true })
      .order('position', { ascending: true, referencedTable: 'menu_items' }),
    supabase.from('place_menu_links').select('url').eq('place_id', placeId).maybeSingle(),
    supabase.from('venue_details').select('menu_url').eq('place_id', placeId).maybeSingle(),
  ]);

  const rows = ratings.data ?? [];
  const userIds = Array.from(new Set(rows.map((r) => r.user_id as string)));
  const { data: profiles } = userIds.length
    ? await supabase.from('profiles').select('id, display_name, username, avatar_url').in('id', userIds)
    : { data: [] };
  const byId = new Map((profiles ?? []).map((p) => [p.id as string, p]));

  const reviews: PlaceReview[] = rows.map((r) => {
    const p = byId.get(r.user_id as string);
    return {
      id: r.id,
      rating: r.rating,
      opinion: r.opinion,
      dishes: r.dishes,
      dish_entries: r.dish_entries,
      created_at: r.created_at,
      photos: ((r.rating_photos ?? []) as { url: string }[]).map((ph) => safeUrl(ph.url)).filter((u): u is string => !!u),
      author: {
        name: p?.display_name?.trim() || (p?.username ? `@${p.username}` : 'Użytkownik Spoot'),
        username: p?.username ?? null,
        avatar_url: safeUrl(p?.avatar_url),
      },
    };
  });

  // Menu właściciela wygrywa z importem ze strony/zdjęcia — nie mieszamy dwóch kart.
  const all = menu.data ?? [];
  const own = all.filter((sec) => sec.source === 'owner');
  const shown = own.length ? own : all;
  const sections: PlaceMenuSection[] = shown
    .map((sec) => ({
      id: sec.id,
      name: sec.name,
      items: ((sec.menu_items ?? []) as PlaceMenuSection['items']).map((it) => ({ ...it, image_url: safeUrl(it.image_url) })),
    }))
    .filter((sec) => sec.items.length > 0);

  return {
    reviews,
    menu: {
      sections,
      source: (shown[0]?.source as 'owner' | 'website' | 'photo' | undefined) ?? null,
      updatedAt: shown.reduce<string | null>((max, sec) => (!max || sec.updated_at > max ? sec.updated_at : max), null),
      url: safeUrl(venue.data?.menu_url) || safeUrl(link.data?.url) || safeUrl(shown[0]?.source_url),
    },
  };
}
