'use client';

import { createBrowserClient } from '@supabase/ssr';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { LoyaltyCardDesign, LoyaltyTier } from '@/lib/owner-loyalty';

export type OwnerVenueRow = {
  id: string;
  place_id: string;
  loyalty_enabled: boolean | null;
  loyalty_tiers: LoyaltyTier[] | null;
  loyalty_card_design: LoyaltyCardDesign | null;
};

export type OwnerPlace = { name: string; category: string | null; district: string | null; image_url: string | null };

export function useSupabase() {
  return useMemo(
    () => createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    ),
    []
  );
}

/** Lokal zalogowanego właściciela po stronie przeglądarki (dostęp sprawdził już layout). */
export function useOwnerVenue() {
  const supabase = useSupabase();
  const [userId, setUserId] = useState<string | null>(null);
  const [venue, setVenue] = useState<OwnerVenueRow | null>(null);
  const [place, setPlace] = useState<OwnerPlace | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const { data: vd } = await supabase
        .from('venue_details')
        .select('id, place_id, loyalty_enabled, loyalty_tiers, loyalty_card_design')
        .eq('owner_id', user.id)
        .maybeSingle();
      if (!vd) return;
      setVenue(vd as OwnerVenueRow);
      const { data: p } = await supabase.from('places').select('name, category, district, image_url').eq('id', vd.place_id).maybeSingle();
      setPlace(p as OwnerPlace | null);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => { reload(); }, [reload]);

  return { supabase, userId, venue, place, loading, reload };
}
