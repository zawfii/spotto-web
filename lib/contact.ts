// Kontakt dla właścicieli lokali. Telefon pokazujemy dopiero po wysłaniu zgłoszenia, nie publicznie.
export const OWNER_CONTACT_EMAIL = 'info@spootme.pl';
export const OWNER_CONTACT_PHONE = '+48 573 912 116';

// Pora, o której zgłaszający woli odebrać nasz telefon (ownership_requests.call_time).
export const CALL_TIMES: Record<string, string> = {
  rano: 'rano (9–12)',
  po_poludniu: 'po południu (12–16)',
  wieczorem: 'wieczorem (16–19)',
};
