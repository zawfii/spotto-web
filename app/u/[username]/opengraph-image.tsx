import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { getProfileByUsername } from '@/lib/supabase';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'Spoot — profil użytkownika';

export default async function Image({ params }: { params: { username: string } }) {
  const [profile, logoBuffer, iconBuffer] = await Promise.all([
    getProfileByUsername(params.username),
    readFile(join(process.cwd(), 'public/logo_spoot_bialy.png')),
    readFile(join(process.cwd(), 'public/spoot-icon.png')),
  ]);
  const logoSrc = `data:image/png;base64,${logoBuffer.toString('base64')}`;
  const iconSrc = `data:image/png;base64,${iconBuffer.toString('base64')}`;

  const displayName = profile?.display_name || 'Użytkownik Spoot';
  const username = profile?.username || params.username;
  const listCount = profile?.lists.length || 0;
  const topkiCount = profile?.topki.length || 0;

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

          {/* Middle: avatar + name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                width={160}
                height={160}
                style={{ borderRadius: '50%', objectFit: 'cover' }}
              />
            ) : (
              <div
                style={{
                  width: 160,
                  height: 160,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(251,250,235,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 72,
                }}
              >
                👤
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 60, fontWeight: 800, color: '#fbfaeb', display: 'flex' }}>
                {displayName}
              </div>
              <div style={{ fontSize: 30, color: 'rgba(251,250,235,0.6)', marginTop: 8, display: 'flex' }}>
                @{username}
              </div>
            </div>
          </div>

          {/* Bottom: stats */}
          <div style={{ display: 'flex', gap: 20, fontSize: 30, fontWeight: 600, color: '#ff751f' }}>
            <span style={{ display: 'flex' }}>📍 {listCount} {listCount === 1 ? 'lista' : listCount < 5 ? 'listy' : 'list'}</span>
            <span style={{ display: 'flex', color: 'rgba(251,250,235,0.4)' }}>·</span>
            <span style={{ display: 'flex' }}>🥇 {topkiCount} {topkiCount === 1 ? 'topka' : topkiCount < 5 ? 'topki' : 'topek'}</span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
