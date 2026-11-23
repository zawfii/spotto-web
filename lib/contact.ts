// Kontakt dla właścicieli lokali. Telefonu nie ma w treści stron: pokazujemy go po wysłaniu zgłoszenia
// albo po kliknięciu „Pokaż numer” w karcie „Masz pytanie?” na /dla-restauracji (OwnerQuestionPopup).
export const OWNER_CONTACT_EMAIL = 'info@spootme.pl';
export const OWNER_CONTACT_PHONE = '+48 573 912 116';

// Pora, o której zgłaszający woli odebrać nasz telefon (ownership_requests.call_time).
export const CALL_TIMES: Record<string, string> = {
  rano: 'rano (9–12)',
  po_poludniu: 'po południu (12–16)',
  wieczorem: 'wieczorem (16–19)',
};
