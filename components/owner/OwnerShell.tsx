import Sidebar from './Sidebar';
import { VenueProvider } from './VenueContext';
import type { OwnerVenueRef, VenueInfo } from '@/lib/owner';

type Props = { venue: VenueInfo; venues: OwnerVenueRef[]; userEmail: string; base: string; children: React.ReactNode };

// Boczne menu + treść. flex-wrap: na telefonie menu ląduje nad treścią.
export default function OwnerShell({ venue, venues, userEmail, base, children }: Props) {
  return (
    <div className="flex min-h-screen flex-wrap">
      <Sidebar
        base={base}
        venueName={venue.place_name}
        venueMeta={[venue.place_district, venue.place_category].filter(Boolean).join(' · ')}
        userEmail={userEmail}
      />
      <main className="min-w-0 flex-[999_1_560px] px-5 pb-12 pt-8 sm:px-10">
        <div className="mx-auto flex max-w-[1120px] flex-col gap-6">
          {/* key: zmiana lokalu przemontowuje stronę — stan i spóźnione odpowiedzi starego lokalu znikają */}
          <VenueProvider key={venue.place_id} placeId={venue.place_id} venues={venues}>{children}</VenueProvider>
        </div>
      </main>
    </div>
  );
}
