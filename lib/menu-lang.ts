// Karta po angielsku w lokalach z tabeli menu_en_places (spec w repo Spoot:
// docs/superpowers/specs/2026-11-24-menu-po-angielsku-design.md). Bez importów — test chodzi pod gołym node.

export type MenuLang = 'pl' | 'en';

/** Polski, gdy przeglądarka stawia go na pierwszym miejscu albo nie podaje języka (boty); inaczej angielski. */
export function pickMenuLang(acceptLanguage: string | null): MenuLang {
  const first = (acceptLanguage ?? '').split(',')[0].trim().toLowerCase();
  return !first || first === '*' || first.startsWith('pl') ? 'pl' : 'en';
}

// Te same klucze i kolejność co ALLERGENS w lib/owner.ts.
const ALLERGENS_EN: [string, string][] = [
  ['gluten', 'gluten'], ['jaja', 'eggs'], ['mleko', 'milk'], ['orzechy', 'tree nuts'], ['orzeszki_ziemne', 'peanuts'],
  ['soja', 'soy'], ['ryby', 'fish'], ['skorupiaki', 'crustaceans'], ['mieczaki', 'molluscs'], ['seler', 'celery'],
  ['gorczyca', 'mustard'], ['sezam', 'sesame'], ['lubin', 'lupin'], ['siarczyny', 'sulphites'],
];

export const allergenLabelsEn = (keys: readonly string[]) =>
  ALLERGENS_EN.filter(([key]) => keys.includes(key)).map(([, label]) => label).join(', ');

export const MENU_TEXT = {
  pl: {
    langSwitch: 'Język karty', sections: 'Sekcje menu', showPhoto: 'pokaż zdjęcie', allergens: 'Alergeny',
    showAll: 'Pokaż całe menu', fromPhoto: 'Ze zdjęcia karty od użytkownika', fromWebsite: 'Menu ze strony lokalu',
    asOf: 'stan na', fullMenu: 'Pełna karta na stronie lokalu', spice: ['', 'lekko ostre', 'ostre', 'bardzo ostre'],
    vege: 'wege', dishPhotos: 'zdjęcia dań', zoomPhoto: 'Powiększ zdjęcie', more: 'Więcej', of: 'z', close: 'Zamknij',
    zoom: 'Powiększ', closeZoom: 'Zamknij powiększenie', dateLocale: 'pl-PL', reviewsLink: 'Opinie i informacje o lokalu w Spoot',
    website: 'Strona lokalu',
  },
  en: {
    langSwitch: 'Menu language', sections: 'Menu sections', showPhoto: 'show photo', allergens: 'Allergens',
    showAll: 'Show full menu', fromPhoto: "From a guest's photo of the menu", fromWebsite: "Menu from the venue's website",
    asOf: 'as of', fullMenu: "Full menu on the venue's website", spice: ['', 'mildly spicy', 'spicy', 'very spicy'],
    vege: 'veggie', dishPhotos: 'dish photos', zoomPhoto: 'Zoom photo', more: 'More', of: 'of', close: 'Close',
    zoom: 'Zoom', closeZoom: 'Close zoom', dateLocale: 'en-GB', reviewsLink: 'Reviews and info about this place in Spoot',
    website: 'Website',
  },
} satisfies Record<MenuLang, Record<string, string | string[]>>;
