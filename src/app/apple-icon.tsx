import { ImageResponse } from 'next/og'

// Apple touch icon — no border-radius (iOS applies it automatically)
export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(145deg, #f97316, #c2410c)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          {/* Bubble body */}
          <div
            style={{
              width: '136px',
              height: '94px',
              borderRadius: '20px',
              background: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 6px 26px rgba(0,0,0,0.22)',
            }}
          >
            <span
              style={{
                fontSize: '66px',
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
              borderTopWidth: '20px',
              borderTopStyle: 'solid',
              borderTopColor: 'white',
              borderRightWidth: '20px',
              borderRightStyle: 'solid',
              borderRightColor: 'transparent',
              marginLeft: '22px',
            }}
          />
        </div>
      </div>
    ),
    { ...size }
  )
}
