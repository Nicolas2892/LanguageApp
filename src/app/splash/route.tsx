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
          gap: '40px',
        }}
      >
        {/* Speech bubble mark */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <div
            style={{
              width: '160px',
              height: '114px',
              borderRadius: '26px',
              background: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 40px rgba(0,0,0,0.28)',
            }}
          >
            <span
              style={{
                fontSize: '80px',
                fontWeight: 900,
                color: '#c2410c',
                fontFamily: 'sans-serif',
                lineHeight: 1,
              }}
            >
              Ñ
            </span>
          </div>
          {/* Tail: CSS border triangle pointing down-left */}
          <div
            style={{
              width: 0,
              height: 0,
              borderTopWidth: '26px',
              borderTopStyle: 'solid',
              borderTopColor: 'white',
              borderRightWidth: '26px',
              borderRightStyle: 'solid',
              borderRightColor: 'transparent',
              marginLeft: '28px',
            }}
          />
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
