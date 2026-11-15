'use client';

import { useState, type CSSProperties, type ReactNode } from 'react';

// Przycisk znika i na jego miejscu pojawia się reszta (wyrenderowana na serwerze).
export function ShowMore({ label, style, children }: { label: string; style?: CSSProperties; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  if (open) return <>{children}</>;
  return <button type="button" onClick={() => setOpen(true)} style={style}>{label}</button>;
}
