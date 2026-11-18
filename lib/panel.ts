// Panel właściciela żyje pod /owner, a na panel.spootme.pl middleware podaje go od korzenia.
export const PANEL_HOST = 'panel.spootme.pl';

/** Prefiks linków panelu dla danego hosta: '' na subdomenie, '/owner' wszędzie indziej. */
export const baseFor = (host: string | null) => (host === PANEL_HOST ? '' : '/owner');

// Ciasteczko z place_id lokalu wybranego w panelu (konto może mieć kilka lokali).
export const VENUE_COOKIE = 'spoot_venue';

/** Wybrany lokal, jeśli należy do konta; inaczej pierwszy; null gdy konto nie ma lokalu. */
export const pickVenueId = (ids: string[], wanted: string | undefined): string | null =>
  wanted && ids.includes(wanted) ? wanted : ids[0] ?? null;
