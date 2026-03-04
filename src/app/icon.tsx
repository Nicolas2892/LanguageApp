import { ImageResponse } from 'next/og'

export const size = { width: 192, height: 192 }
export const contentType = 'image/png'

export default function Icon() {
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
              width: '144px',
              height: '100px',
              borderRadius: '22px',
              background: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 6px 28px rgba(0,0,0,0.22)',
            }}
          >
            <span
              style={{
                fontSize: '70px',
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
              borderTopWidth: '22px',
              borderTopStyle: 'solid',
              borderTopColor: 'white',
              borderRightWidth: '22px',
              borderRightStyle: 'solid',
              borderRightColor: 'transparent',
              marginLeft: '24px',
            }}
          />
        </div>
      </div>
    ),
    { ...size }
  )
}
