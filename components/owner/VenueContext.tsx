'use client';

import { createContext, useContext } from 'react';
import type { OwnerVenueRef } from '@/lib/owner';

// Wybrany lokal (z ciasteczka, sprawdzony w layoucie) i lista lokali konta dla stron klienckich.
const VenueContext = createContext<{ placeId: string; venues: OwnerVenueRef[] } | null>(null);

export function VenueProvider({ placeId, venues, children }: { placeId: string; venues: OwnerVenueRef[]; children: React.ReactNode }) {
  return <VenueContext.Provider value={{ placeId, venues }}>{children}</VenueContext.Provider>;
}

function useVenueContext() {
  const ctx = useContext(VenueContext);
  if (!ctx) throw new Error('Brak VenueProvider — hook działa tylko w panelu (OwnerShell).');
  return ctx;
}

export const useSelectedPlaceId = () => useVenueContext().placeId;
export const useOwnerVenueList = () => useVenueContext().venues;
