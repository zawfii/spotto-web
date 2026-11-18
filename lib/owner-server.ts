import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { getOwnerVenue } from '@/lib/owner';
import { baseFor, VENUE_COOKIE } from '@/lib/panel';

/** Prefiks linków panelu dla bieżącego żądania. */
export const panelBase = () => baseFor(headers().get('host'));

/** Zalogowany właściciel z wybranym (ciasteczko) zatwierdzonym lokalem. Bez sesji przekierowuje na logowanie;
 *  bez lokalu zwraca null — stan zgłoszenia pokazuje layout, strona ma wtedy nic nie rysować. */
export async function requireVenue() {
  const base = panelBase();
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`${base}/login`);
  const found = await getOwnerVenue(supabase, user.id, cookies().get(VENUE_COOKIE)?.value);
  return found ? { supabase, user, venue: found.venue, venues: found.venues, base } : null;
}
