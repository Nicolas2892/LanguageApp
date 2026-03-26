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
        {/* Terracotta S monogram — calligraphic fill */}
        <svg viewBox="0 0 24 24" width="96" height="96" fill="none">
          <path
            d="M 5.2 21 C 1 19.5, -0.8 14.5, 2.5 11 C 5.8 7.5, 14.2 9.8, 17.2 7 C 20.2 4.2, 20.8 0.5, 17.8 0.8 C 16.5 0.2, 15.8 2.2, 17 3.2 C 21 1.5, 21.5 5.8, 18.8 8.8 C 16 12, 7.5 9.5, 5 12.5 C 2.5 15.5, 4 19, 7.2 20 C 8.5 21, 7 21.5, 5.2 21 Z"
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
