// Kontakt dla właścicieli lokali (zgłoszenie lokalu, strona dla restauracji). Pusty telefon = ukryty.
export const OWNER_CONTACT_EMAIL = 'info@spootme.pl';
export const OWNER_CONTACT_PHONE: string = '';

// Pora, o której zgłaszający woli odebrać nasz telefon (ownership_requests.call_time).
export const CALL_TIMES: Record<string, string> = {
  rano: 'rano (9–12)',
  po_poludniu: 'po południu (12–16)',
  wieczorem: 'wieczorem (16–19)',
};
