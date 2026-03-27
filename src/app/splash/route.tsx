import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const width = parseInt(searchParams.get('w') ?? '1170', 10)
  const height = parseInt(searchParams.get('h') ?? '2532', 10)

  return new ImageResponse(
    (
      <div
        style={{
          background: '#FDFCF9',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '24px',
        }}
      >
        {/* Terracotta S monogram — calligraphic filled */}
        <svg viewBox="0 0 24 24" width="96" height="96" fill="none">
          <path
            d="M 6 21 C 2.5 20, 0.5 17, 1.5 14 C 2.5 11, 5.5 10, 9 9 C 12.5 8, 16 7, 18 5 C 19.5 3.5, 19 1.5, 17 1.5 C 16.5 1.5, 16.8 2.5, 17.5 3 C 19 2, 21 3, 20.5 5.5 C 20 8, 17 9.5, 13.5 10.5 C 10 11.5, 6.5 12, 4.5 14 C 2.5 16, 3 19, 5.5 20 C 7 20.8, 7.5 20, 6 21 Z"
            fill="#C4522E"
          />
        </svg>

        {/* App name */}
        <span
          style={{
            color: '#1A1108',
            fontSize: 48,
            fontWeight: 600,
            fontFamily: 'serif',
            fontStyle: 'italic',
            letterSpacing: '0.02em',
          }}
        >
          Senda
        </span>
      </div>
    ),
    { width, height }
  )
}
