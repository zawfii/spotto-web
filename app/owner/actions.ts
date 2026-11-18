'use server';

import { cookies } from 'next/headers';
import { VENUE_COOKIE } from '@/lib/panel';

/** Zapamiętuje lokal wybrany w panelu. Własności nie sprawdzamy: layout i tak bierze lokal
 *  z ciasteczka tylko, gdy należy do konta (pickVenueId), a inaczej pokazuje pierwszy. */
export async function selectVenue(placeId: string): Promise<void> {
  if (typeof placeId !== 'string' || !placeId || placeId.length > 64) return;
  cookies().set(VENUE_COOKIE, placeId, { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax', httpOnly: true });
}
