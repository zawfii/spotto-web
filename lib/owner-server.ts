import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { getOwnerVenue } from '@/lib/owner';
import { baseFor } from '@/lib/panel';

/** Prefiks linków panelu dla bieżącego żądania. */
export const panelBase = () => baseFor(headers().get('host'));

/** Zalogowany właściciel z zatwierdzonym lokalem. Bez sesji przekierowuje na logowanie;
 *  bez lokalu zwraca null — stan zgłoszenia pokazuje layout, strona ma wtedy nic nie rysować. */
export async function requireVenue() {
  const base = panelBase();
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`${base}/login`);
  const venue = await getOwnerVenue(supabase, user.id);
  return venue ? { supabase, user, venue, base } : null;
}
