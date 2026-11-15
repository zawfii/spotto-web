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
