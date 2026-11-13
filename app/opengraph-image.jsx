import { ImageResponse } from 'next/og';

export const alt = 'THE LAST SAVE — The Haunted Archive';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OGImage() {
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
          backgroundColor: '#140e1a',
          backgroundImage:
            'radial-gradient(circle at 50% 45%, #341a45 0%, #150f1e 55%, #0d0812 100%)',
          position: 'relative',
          padding: '40px',
        }}
      >
        {/* Subtle decorative grid dots */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.15,
            backgroundImage:
              'radial-gradient(#c69bd5 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />

        {/* Ambient glow behind the crossover favicon logo */}
        <div
          style={{
            position: 'absolute',
            width: '420px',
            height: '420px',
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(255, 129, 44, 0.22) 0%, rgba(168, 85, 247, 0.18) 45%, transparent 70%)',
            top: '55px',
          }}
        />

        {/* THE CROSSOVER FAVICON (Floppy Disk + Kiro Ghost + 4-Tile Brand Mark) */}
        <svg
          width="320"
          height="320"
          viewBox="0 0 64 64"
          fill="none"
          style={{
            marginBottom: '28px',
            filter: 'drop-shadow(0 15px 35px rgba(0, 0, 0, 0.75))',
          }}
        >
          <defs>
            <linearGradient id="og-disk" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#251730" />
              <stop offset="100%" stopColor="#120a17" />
            </linearGradient>
            <linearGradient id="og-shutter" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3d2c47" />
              <stop offset="50%" stopColor="#5d456d" />
              <stop offset="100%" stopColor="#35263d" />
            </linearGradient>
            <linearGradient id="og-ghost" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="85%" stopColor="#fff6ec" />
              <stop offset="100%" stopColor="#ecdcf8" />
            </linearGradient>
          </defs>

          {/* Floppy disk chassis with beveled top-right corner */}
          <path
            d="M 8,6 L 48,6 L 58,16 L 58,56 A 4,4 0 0 1 54,60 L 10,60 A 4,4 0 0 1 6,56 L 6,8 A 2,2 0 0 1 8,6 Z"
            fill="url(#og-disk)"
            stroke="#835298"
            strokeWidth="1.5"
          />

          {/* Grip rib lines */}
          <line x1="8" y1="10" x2="15" y2="10" stroke="#483353" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="8" y1="13" x2="15" y2="13" stroke="#483353" strokeWidth="1.2" strokeLinecap="round" />

          {/* Write protect notch */}
          <rect x="52" y="52" width="4" height="5" rx="1" fill="#09050d" stroke="#432851" strokeWidth="0.8" />

          {/* Metal shutter plate */}
          <rect x="18" y="6" width="28" height="15" rx="1" fill="url(#og-shutter)" stroke="#745686" strokeWidth="1" />
          <rect x="23" y="8" width="6" height="10" rx="1" fill="#120a17" />

          {/* 4-Tile Brand Mark of The Last Save (tilted -7deg) */}
          <g transform="translate(37, 8.5) rotate(-7)">
            <rect x="0" y="0" width="3.2" height="3.2" rx="0.5" fill="#ff812c" />
            <path d="M 4.2,0 h 1.7 a 1.5,1.5 0 0 1 1.5,1.5 v 1.7 h -3.2 z" fill="#ff812c" />
            <path d="M 0,4.2 h 3.2 v 3.2 h -1.7 a 1.5,1.5 0 0 1 -1.5,-1.5 z" fill="#ff812c" />
            <rect x="4.2" y="4.2" width="3.2" height="3.2" rx="0.5" fill="#ffa24d" />
          </g>

          {/* Disk label area */}
          <rect x="10" y="22" width="44" height="34" rx="2" fill="#150d1e" stroke="#4c305a" strokeWidth="0.8" />

          {/* Kiro ghost silhouette hovering on the disk with dark cutouts for eyes */}
          <g transform="translate(15.5, 16) scale(0.44)">
            <g transform="matrix(3.800695,0,0,4.166604,-7.598366,0.001061)">
              <path
                d="M4.594,6.677C6.67,-2.226 18.746,-2.211 21.16,6.632C21.513,7.929 22.885,14.214 19.487,20.379C17.942,23.176 13.646,25.869 12.497,22.262C8.6,25.477 3.315,24.1 5.789,18.609L5.471,18.752C1.901,20.057 1.608,17.544 2.298,16.239C2.748,15.399 3.025,14.904 3.235,14.342C3.588,13.367 3.693,12.774 3.828,11.844C4.098,10.007 4.105,8.237 4.593,6.677L4.594,6.677ZM12.964,6.687C12.638,6.676 12.329,6.839 12.154,7.115C11.937,7.438 11.824,7.94 11.824,8.577C11.824,9.282 11.974,10.467 12.964,10.467L12.972,10.467C13.729,10.467 14.186,9.762 14.186,8.577C14.186,7.955 14.059,7.452 13.819,7.122C13.625,6.843 13.304,6.68 12.964,6.687ZM17.044,6.687C16.718,6.676 16.409,6.839 16.234,7.115C16.017,7.438 15.904,7.94 15.904,8.577C15.904,9.282 16.054,10.467 17.044,10.467L17.052,10.467C17.809,10.467 18.267,9.762 18.267,8.577C18.267,7.955 18.139,7.452 17.899,7.122C17.705,6.843 17.384,6.68 17.044,6.687Z"
                fill="url(#og-ghost)"
                fillRule="evenodd"
              />
            </g>
          </g>
        </svg>

        {/* App Title & Taglines */}
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: '12px',
          }}
        >
          <span
            style={{
              fontSize: '44px',
              fontFamily: 'serif',
              fontWeight: 700,
              color: '#fff0dc',
              letterSpacing: '2px',
              textShadow: '0 4px 20px rgba(0, 0, 0, 0.6)',
            }}
          >
            THE LAST SAVE
          </span>
          <span
            style={{
              fontSize: '22px',
              fontFamily: 'monospace',
              color: '#ff812c',
              letterSpacing: '3px',
              fontWeight: 600,
            }}
          >
            ✦ KIRO EDITION
          </span>
        </div>

        <div
          style={{
            fontSize: '18px',
            fontFamily: 'monospace',
            color: '#bfaec7',
            letterSpacing: '3px',
            marginTop: '10px',
            textTransform: 'uppercase',
          }}
        >
          A Second Life for Dead Formats · The Haunted Archive
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
