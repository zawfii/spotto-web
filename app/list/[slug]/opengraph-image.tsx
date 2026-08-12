import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { supabase } from '@/lib/supabase';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'Spoot — lista miejsc';

async function getListData(slug: string) {
  try {
    const { data, error } = await supabase.rpc('get_public_list_by_slug', { p_slug: slug });
    if (error || !data || data.length === 0) return null;
    return data[0];
  } catch {
    return null;
  }
}

export default async function Image({ params }: { params: { slug: string } }) {
  const [list, logoBuffer, iconBuffer] = await Promise.all([
    getListData(params.slug),
    readFile(join(process.cwd(), 'public/logo_spoot_bialy.png')),
    readFile(join(process.cwd(), 'public/spoot-icon.png')),
  ]);
  const logoSrc = `data:image/png;base64,${logoBuffer.toString('base64')}`;
  const iconSrc = `data:image/png;base64,${iconBuffer.toString('base64')}`;

  const places = list ? (list.places || []).filter((p: any) => p.id) : [];
  const name = list?.name || 'Lista Spoot';
  const username = list?.username || 'Użytkownik Spoot';
  const placeCount = places.length;
  const placeLabel = placeCount === 1 ? 'miejsce' : placeCount < 5 ? 'miejsca' : 'miejsc';
  const previewImages = places.filter((p: any) => p.image).slice(0, 4);
  const photoSize = previewImages.length <= 1 ? 220 : previewImages.length === 2 ? 200 : 180;

  return new ImageResponse(
    (
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          display: 'flex',
          backgroundColor: '#03271a',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Watermark */}
        <img
          src={iconSrc}
          width={620}
          height={620}
          style={{ position: 'absolute', right: -160, bottom: -160, opacity: 0.07, display: 'flex' }}
        />

        {/* Content */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '64px 72px',
          }}
        >
          {/* Logo */}
          <img src={logoSrc} width={150} height={84} style={{ objectFit: 'contain' }} />

          {/* Middle: name + meta */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                fontSize: 64,
                fontWeight: 800,
                color: '#fbfaeb',
                lineHeight: 1.1,
                maxWidth: 980,
                display: 'flex',
              }}
            >
              {name}
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginTop: 24,
                fontSize: 30,
                color: '#ff751f',
                fontWeight: 600,
              }}
            >
              <span style={{ display: 'flex' }}>📍 {placeCount} {placeLabel}</span>
              <span style={{ display: 'flex', color: 'rgba(251,250,235,0.5)' }}>·</span>
              <span style={{ display: 'flex', color: 'rgba(251,250,235,0.7)' }}>{username}</span>
            </div>
          </div>

          {/* Bottom: place photo strip */}
          <div style={{ display: 'flex', gap: 16 }}>
            {previewImages.length > 0 ? (
              previewImages.map((p: any, i: number) => (
                <img
                  key={i}
                  src={p.image}
                  width={photoSize}
                  height={photoSize}
                  style={{ borderRadius: 20, objectFit: 'cover' }}
                />
              ))
            ) : (
              <div style={{ display: 'flex', fontSize: 28, color: 'rgba(251,250,235,0.5)' }}>
                spootme.pl
              </div>
            )}
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
