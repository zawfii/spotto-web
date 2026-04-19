'use client';

type Props = {
  venueName: string;
  venueCategory: string;
  venueDistrict: string | null;
  isPremium: boolean;
};

export default function TopBar({ venueName, venueCategory, venueDistrict, isPremium }: Props) {
  const meta = [venueCategory, venueDistrict].filter(Boolean).join(' · ');

  return (
    <header className="bg-white border-b border-gray-100 px-5 py-3 flex items-center justify-between flex-shrink-0">
      <div>
        <h2 className="text-base font-bold text-[#1a1a1a] leading-tight">{venueName}</h2>
        {meta && <p className="text-xs text-gray-400 mt-0.5">{meta}</p>}
      </div>
      <div className="flex items-center gap-2">
        {isPremium && (
          <span className="text-xs font-semibold bg-[#D4892A]/10 text-[#D4892A] px-2 py-1 rounded-full">
            ✦ PREMIUM
          </span>
        )}
        <span className="text-xs font-semibold bg-green-50 text-green-700 px-2 py-1 rounded-full">
          ✓ Zweryfikowany
        </span>
      </div>
    </header>
  );
}
