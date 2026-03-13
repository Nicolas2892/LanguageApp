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
        {/* Terracotta S monogram */}
        <svg viewBox="0 0 24 24" width="96" height="96" fill="none">
          <path
            d="M 7 20 C 3 19, 1 15, 4 12 C 7 9, 15 11, 18 8 C 21 5, 21 1, 17 2"
            stroke="#C4522E"
            strokeWidth={3}
            strokeLinecap="round"
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
