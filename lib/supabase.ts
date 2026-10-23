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
