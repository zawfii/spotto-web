// Karta stałego gościa — jak types/loyalty.ts i components/loyalty/LoyaltyCardFace.tsx w apce.

export type LoyaltyTier = { stamps: number; reward: string };

export type LoyaltyCardPattern = 'photo' | 'logo' | 'dots' | 'type' | 'rings' | 'stripes' | 'check' | 'split' | 'arch';

export type LoyaltyCardDesign = {
  pattern?: LoyaltyCardPattern;
  palette?: string;
  image_url?: string | null;
  logo_url?: string | null;
};

export type AddStampResult = {
  stamp_count: number;
  max_stamps: number;
  redeemed: boolean;
  is_final: boolean;
  reward_description: string;
};

export const DARK_INK = '#03271a';

export const CARD_PALETTES = {
  orange: { name: 'Pomarańcz', bg: '#ff751f', accent: '#164938', ink: DARK_INK },
  peach: { name: 'Brzoskwinia', bg: '#f0e0ca', accent: '#ff751f', ink: DARK_INK },
  navy: { name: 'Granat', bg: '#2b3a67', accent: '#f2c94c', ink: '#ffffff' },
  brick: { name: 'Cegła', bg: '#a8401f', accent: '#f2c94c', ink: '#ffffff' },
  pink: { name: 'Róż', bg: '#fbd3c7', accent: '#f4a896', ink: DARK_INK },
  green: { name: 'Zieleń', bg: '#164938', accent: '#ff751f', ink: '#ffffff' },
  butter: { name: 'Masło', bg: '#f2c94c', accent: DARK_INK, ink: DARK_INK },
  cream: { name: 'Krem', bg: '#fdf5ec', accent: '#c82d2d', ink: DARK_INK },
} as const;

export type PaletteKey = keyof typeof CARD_PALETTES;

export const CARD_PATTERNS: { id: LoyaltyCardPattern; label: string; palette: PaletteKey }[] = [
  { id: 'photo', label: 'Zdjęcie', palette: 'green' },
  { id: 'logo', label: 'Logo', palette: 'navy' },
  { id: 'dots', label: 'Kropki', palette: 'peach' },
  { id: 'type', label: 'Napis', palette: 'orange' },
  { id: 'rings', label: 'Pieczątka', palette: 'navy' },
  { id: 'stripes', label: 'Pasy', palette: 'pink' },
  { id: 'check', label: 'Kratka', palette: 'cream' },
  { id: 'split', label: 'Pół na pół', palette: 'butter' },
  { id: 'arch', label: 'Słońce', palette: 'brick' },
];

const NEEDS_IMAGE: LoyaltyCardPattern[] = ['photo', 'split'];

/** Uzupełnia zapis właściciela domyślnymi: brak wzoru → zdjęcie lokalu, brak zdjęcia → „Napis”. */
export function resolveCardDesign(design: LoyaltyCardDesign | null | undefined, placeImageUrl?: string | null) {
  const image = design?.image_url || placeImageUrl || null;
  let pattern: LoyaltyCardPattern = design?.pattern ?? (image ? 'photo' : 'type');
  if (NEEDS_IMAGE.includes(pattern) && !image) pattern = 'type';
  const fallback = CARD_PATTERNS.find(p => p.id === pattern)!.palette;
  const key = (design?.palette && design.palette in CARD_PALETTES ? design.palette : fallback) as PaletteKey;
  return { pattern, paletteKey: key, palette: CARD_PALETTES[key], image, logo: design?.logo_url || null };
}

export function maxTierStamps(tiers: LoyaltyTier[]): number {
  return tiers.reduce((max, t) => Math.max(max, t.stamps), 0);
}

export function nextRewardLabel(stampCount: number, tiers: LoyaltyTier[]): string {
  const next = [...tiers].sort((a, b) => a.stamps - b.stamps).find(t => t.stamps > stampCount);
  if (!next) return tiers.length ? 'Nagroda do odbioru' : '';
  return `Jeszcze ${next.stamps - stampCount} do nagrody`;
}

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
