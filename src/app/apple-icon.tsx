import { ImageResponse } from 'next/og'

// Apple touch icon — no border-radius (iOS applies it automatically)
export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  // S-path SVG as data URI (next/og doesn't support inline <svg>)
  const sPath = `M 7 20 C 3 19, 1 15, 4 12 C 7 9, 15 11, 18 8 C 21 5, 21 1, 17 2`
  const svgDataUri = `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 22" width="94" height="86">` +
      `<path d="${sPath}" fill="none" stroke="%23C4522E" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>` +
      `</svg>`
  )}`

  return new ImageResponse(
    (
      <div
        style={{
          background: '#FDFCF9',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <img src={svgDataUri} width={94} height={86} alt="" />
      </div>
    ),
    { ...size }
  )
}
