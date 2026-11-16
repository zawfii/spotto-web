// Oferty dnia — jak types/deals.ts i utils/dishTypes.ts w apce (te same tabele i klucze).

export type DealStatus = 'pending' | 'approved' | 'rejected';
export type DealSource = 'owner' | 'admin' | 'user' | 'scraper';
export type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export type Deal = {
  id: string;
  dish_name: string;
  price: number;
  original_price: number | null;
  days_of_week: DayKey[];
  valid_until: string | null;
  start_time: string | null;
  end_time: string | null;
  dish_category: DishTypeKey;
  status: DealStatus;
  source: DealSource;
  admin_note: string | null;
  created_at: string;
};

export const DAYS: { key: DayKey; short: string }[] = [
  { key: 'mon', short: 'Pon' },
  { key: 'tue', short: 'Wt' },
  { key: 'wed', short: 'Śr' },
  { key: 'thu', short: 'Czw' },
  { key: 'fri', short: 'Pt' },
  { key: 'sat', short: 'Sob' },
  { key: 'sun', short: 'Nd' },
];

export function discountPercent(price: number, originalPrice: number | null): number | null {
  if (!originalPrice || originalPrice <= price) return null;
  return Math.round((1 - price / originalPrice) * 100);
}

export function formatDealTime(deal: Pick<Deal, 'start_time' | 'end_time'>): string | null {
  if (deal.start_time && deal.end_time) return `${deal.start_time.slice(0, 5)}-${deal.end_time.slice(0, 5)}`;
  if (deal.end_time) return `do ${deal.end_time.slice(0, 5)}`;
  return null;
}

export const DISH_TYPE_LABELS = {
  kebab: 'Kebab',
  burger: 'Burgery',
  sushi: 'Sushi',
  pizza: 'Pizza',
  coffee: 'Kawa',
  napoje: 'Napoje',
  ramen: 'Ramen',
  pierogi: 'Pierogi',
  kotlet: 'Kotlety',
  zupa: 'Zupy',
  nalesniki: 'Naleśniki',
  pasta: 'Pasta',
  stek: 'Steki',
  tacos: 'Meksykańskie',
  curry: 'Curry',
  asian: 'Dania azjatyckie',
  desery: 'Desery',
  zapiekanki: 'Zapiekanki',
  hotdog: 'Hot dogi',
  kurczak: 'Kurczak',
  gruzinskie: 'Gruzińskie',
  bliskowschodnie: 'Bliskowschodnie',
  bowl: 'Bowle i sałatki',
  ryby: 'Ryby i owoce morza',
  wypieki: 'Wypieki',
  dodatki: 'Dodatki',
  inne: 'Inne',
} as const;

export type DishTypeKey = keyof typeof DISH_TYPE_LABELS;

// Kolejność ma znaczenie — pierwsze trafienie wygrywa. Kopia DISH_KEYWORDS z apki.
const DISH_KEYWORDS: [DishTypeKey, string[]][] = [
  ['kebab', ['kebab']],
  ['burger', ['burger', 'hambur']],
  ['hotdog', ['hot dog', 'hotdog', 'hot-dog']],
  ['sushi', ['sushi', 'nigiri', 'maki', 'sashimi', 'california']],
  ['pizza', ['pizza']],
  ['zapiekanki', ['zapiekank']],
  ['gruzinskie', ['chaczapur', 'khachapur', 'chinkal', 'khinkal', 'pchali', 'pkhali', 'mcwadi', 'mtsvadi', 'lobio', 'satsivi']],
  ['napoje', ['matcha', 'chai', 'bubble tea', 'boba']],
  ['coffee', ['kawa', 'coffee', 'espresso', 'latte', 'cappuc', 'flat white', 'americano', 'cortado', 'macchiato', 'przelew', 'v60', 'chemex', 'aeropress']],
  ['ramen', ['ramen', 'tsukemen', 'tantanmen']],
  ['pierogi', ['pierog']],
  ['kotlet', ['schabow', 'kotlet', 'sznycel', 'mielon', 'volaille', 'devolaj', 'pożarsk']],
  ['zupa', ['zupa', 'żurek', 'zurek', 'rosół', 'rosol', 'pomidorowa', 'barszcz', 'flaki', 'pho', 'tom yum', 'krem z']],
  ['nalesniki', ['naleśn', 'nalesn', 'pancake', 'crepe']],
  ['pasta', ['pasta', 'makaron', 'spaghetti', 'penne', 'tagliatelle', 'rigatoni', 'linguine', 'carbonara', 'bolognese', 'aglio', 'lasagn', 'pomodoro']],
  ['tacos', ['taco', 'burrito', 'quesadilla', 'fajit', 'nacho', 'tortill', 'enchilad']],
  ['curry', ['curry', 'masala', 'tikka', 'korma', 'vindaloo', 'butter chicken', 'rogan', 'massaman', 'panang']],
  ['asian', ['pad thai', 'pad-thai', 'bao', 'bun cha', 'gyoza', 'dim sum', 'dumpling', 'poke', 'poké', 'bibimbap', 'wok', 'chow mein', 'lo mein', 'fried rice', 'smażony ryż', 'yakisoba', 'udon']],
  ['bliskowschodnie', ['falafel', 'hummus', 'humus', 'szakszuk', 'shakshuk', 'shakshouk', 'baba gan', 'baba ghan', 'tabbouleh', 'tabule', 'labneh', 'mezze']],
  ['wypieki', ['croissant', 'rogal', 'drożdżów', 'drozdzow', 'cynamonk', 'cinnamon roll', 'cinnamon bun', 'jagodzian', 'chleb', 'bagiet', 'focacc', 'precel', 'pretzel', 'pain au', 'chałk']],
  ['bowl', ['bowl', 'sałatk', 'salatk', 'salad', 'cezar', 'caesar']],
  ['ryby', ['ryb', 'łoso', 'losos', 'dorsz', 'pstrąg', 'pstrag', 'tuńczyk', 'tunczyk', 'halibut', 'sandacz', 'śled', 'makrel', 'fish', 'krewet', 'shrimp', 'prawn', 'małż', 'malz', 'ostryg', 'oyster', 'kalmar', 'ośmiornic', 'osmiornic', 'owoce morza', 'frutti di mare', 'seafood', 'homar', 'krab']],
  ['kurczak', ['kurcz', 'skrzyde', 'wings', 'strips', 'nugget', 'chicken', 'udko', 'drumstick']],
  ['stek', ['stek', 'steak', 'tatar', 'antrykot', 'polędwic', 'poledwic', 'rib eye', 'ribeye', 't-bone', 'tomahawk', 'entrecote']],
  ['desery', ['lody', 'gelato', 'sorbet', 'sernik', 'cheesecake', 'tort', 'ciast', 'deser', 'tiramisu', 'panna cotta', 'brownie', 'szarlot', 'gofr', 'waffle', 'pącz', 'donut']],
  ['dodatki', ['frytk', 'fries', 'bataty', 'krążki cebul', 'onion rings']],
  ['napoje', ['herbat', 'lemoniad', 'lemonade', 'smoothie', 'kakao', 'gorąca czekolada', 'czekolada na gorąco', 'hot chocolate', 'koktajl', 'cocktail', 'spritz', 'mojito', 'negroni', 'aperol', 'margarita', 'piwo', 'beer', 'lager', 'prosecco', 'shake']],
];
const DRINK_WORDS = /(^|[^a-ząćęłńóśźż])(tea|wino|wine|gin|ipa|drink|stout|pils)($|[^a-ząćęłńóśźż])/;

export function dishToTemplateKey(dishName: string): DishTypeKey | null {
  const d = dishName.toLowerCase();
  for (const [key, words] of DISH_KEYWORDS) {
    if (words.some(w => d.includes(w))) return key;
  }
  return DRINK_WORDS.test(d) ? 'napoje' : null;
}
