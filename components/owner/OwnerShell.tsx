'use client';

import Sidebar from './Sidebar';
import TopBar from './TopBar';
import type { VenueInfo } from '@/lib/owner';

type Props = {
  venue: VenueInfo;
  userEmail: string;
  children: React.ReactNode;
};

export default function OwnerShell({ venue, userEmail, children }: Props) {
  const initial = userEmail?.[0]?.toUpperCase() ?? 'O';

  return (
    <div className="flex h-screen overflow-hidden bg-[#f7f7f5]" style={{ color: '#1a1a1a' }}>
      <Sidebar ownerInitial={initial} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar
          venueName={venue.place_name}
          venueCategory={venue.place_category}
          venueDistrict={venue.place_district}
          isPremium={venue.is_premium}
        />
        <main className="flex-1 overflow-y-auto p-5">
          {children}
        </main>
      </div>
    </div>
  );
}
