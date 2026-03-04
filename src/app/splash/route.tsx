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
          background: '#ea580c',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '32px',
        }}
      >
        {/* EA monogram pill */}
        <div
          style={{
            background: 'rgba(255,255,255,0.15)',
            borderRadius: '48px',
            width: '200px',
            height: '200px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span
            style={{
              color: 'white',
              fontSize: 96,
              fontWeight: 700,
              fontFamily: 'sans-serif',
              letterSpacing: '-3px',
            }}
          >
            EA
          </span>
        </div>

        {/* App name */}
        <span
          style={{
            color: 'rgba(255,255,255,0.90)',
            fontSize: 36,
            fontWeight: 600,
            fontFamily: 'sans-serif',
            letterSpacing: '0.5px',
          }}
        >
          Español Avanzado
        </span>
      </div>
    ),
    { width, height }
  )
}
