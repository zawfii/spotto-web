'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const markerIcon = L.divIcon({
  className: '',
  html: `<div style="
    width: 30px; height: 30px; border-radius: 50% 50% 50% 0;
    background: #ff751f; transform: rotate(-45deg);
    box-shadow: 0 2px 6px rgba(3,39,26,0.4); border: 2px solid #fff;
  "></div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -32],
});

interface MapPlace {
  id: string;
  name: string;
  lat: number | null;
  lng: number | null;
}

export default function ListMap({ places }: { places: MapPlace[] }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || leafletMapRef.current) return;

    const points = places.filter(
      (p): p is MapPlace & { lat: number; lng: number } => p.lat != null && p.lng != null
    );
    if (points.length === 0) return;

    const map = L.map(mapRef.current, { zoomControl: false, attributionControl: false });
    leafletMapRef.current = map;

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 20,
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);
    L.control.attribution({ position: 'bottomleft', prefix: false }).addAttribution('© OpenStreetMap, © CARTO').addTo(map);

    const markers = points.map((p) =>
      L.marker([p.lat, p.lng], { icon: markerIcon }).bindPopup(
        `<strong style="font-family: inherit;">${p.name}</strong>`
      )
    );
    const group = L.featureGroup(markers).addTo(map);

    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], 15);
    } else {
      map.fitBounds(group.getBounds(), { padding: [32, 32] });
    }

    return () => {
      map.remove();
      leafletMapRef.current = null;
    };
  }, [places]);

  const hasPoints = places.some((p) => p.lat != null && p.lng != null);
  if (!hasPoints) return null;

  return <div ref={mapRef} style={{ width: '100%', height: '260px', backgroundColor: '#D0CCC6' }} />;
}
