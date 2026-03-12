/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from 'next/og';
import { readFileSync } from 'fs';
import { join } from 'path';

export const alt = 'SignupSmartly — Organize volunteers simply';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  const iconPath = join(process.cwd(), 'public', 'smartly-icon.png');
  const iconBuffer = readFileSync(iconPath);
  const iconDataUri = `data:image/png;base64,${iconBuffer.toString('base64')}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#FAF9F6',
          gap: 24,
        }}
      >
        <img
          src={iconDataUri}
          alt=""
          width={160}
          height={160}
          style={{ borderRadius: 24 }}
        />
        <div
          style={{
            fontSize: 64,
            fontWeight: 700,
            color: '#27272A',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          SignupSmartly
        </div>
        <div
          style={{
            fontSize: 28,
            color: '#71717A',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          Organize volunteers simply
        </div>
      </div>
    ),
    { ...size }
  );
}
