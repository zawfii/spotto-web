import Sidebar from './Sidebar';
import type { VenueInfo } from '@/lib/owner';

type Props = { venue: VenueInfo; userEmail: string; base: string; children: React.ReactNode };

// Boczne menu + treść. flex-wrap: na telefonie menu ląduje nad treścią.
export default function OwnerShell({ venue, userEmail, base, children }: Props) {
  return (
    <div className="flex min-h-screen flex-wrap">
      <Sidebar
        base={base}
        venueName={venue.place_name}
        venueMeta={[venue.place_district, venue.place_category].filter(Boolean).join(' · ')}
        userEmail={userEmail}
      />
      <main className="min-w-0 flex-[999_1_560px] px-5 pb-12 pt-8 sm:px-10">
        <div className="mx-auto flex max-w-[1120px] flex-col gap-6">{children}</div>
      </main>
    </div>
  );
}
