// Panel właściciela żyje pod /owner, a na panel.spootme.pl middleware podaje go od korzenia.
export const PANEL_HOST = 'panel.spootme.pl';

/** Prefiks linków panelu dla danego hosta: '' na subdomenie, '/owner' wszędzie indziej. */
export const baseFor = (host: string | null) => (host === PANEL_HOST ? '' : '/owner');
