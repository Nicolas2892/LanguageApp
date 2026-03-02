import { ImageResponse } from 'next/og'

export const size = { width: 192, height: 192 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#18181b',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '24px',
        }}
      >
        <span
          style={{
            color: 'white',
            fontSize: 80,
            fontWeight: 700,
            fontFamily: 'sans-serif',
            letterSpacing: '-2px',
          }}
        >
          ES
        </span>
      </div>
    ),
    { ...size }
  )
}
