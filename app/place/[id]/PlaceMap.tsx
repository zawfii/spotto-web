'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Nieruchoma mapka jak w apce (place-detail: scrollEnabled/zoomEnabled false) — dotknięcie łapie link wokół niej.
// ponytail: publiczne kafelki OSM mają limity użycia; przy dużym ruchu przejść na MapTiler/Stadia albo Google Embed.
export default function PlaceMap({ lat, lng }: { lat: number; lng: number }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const map = L.map(ref.current, {
      center: [lat, lng],
      zoom: 16,
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      touchZoom: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
    });
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
    L.control.attribution({ position: 'bottomright', prefix: false }).addAttribution('© OpenStreetMap').addTo(map);
    L.marker([lat, lng], {
      interactive: false,
      icon: L.divIcon({
        className: '',
        html: '<div style="width:30px;height:30px;border-radius:50% 50% 50% 0;background:#ff751f;transform:rotate(-45deg);box-shadow:0 2px 6px rgba(3,39,26,0.4);border:2px solid #fff;box-sizing:border-box"></div>',
        iconSize: [30, 30],
        iconAnchor: [15, 30],
      }),
    }).addTo(map);
    return () => { map.remove(); };
  }, [lat, lng]);

  return <div ref={ref} aria-hidden="true" style={{ height: 160, background: '#d9d4cc', pointerEvents: 'none', isolation: 'isolate' }} />;
}
