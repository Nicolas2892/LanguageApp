import { ImageResponse } from 'next/og'

/**
 * Shared PWA icon renderer — terracotta S-path on paper background.
 * Used by icon.tsx, apple-icon.tsx, and pwa-icon route.
 *
 * @param rounded - set false for apple-icon (iOS applies its own mask)
 */
export function renderIcon(
  width: number,
  height: number,
  { rounded = true }: { rounded?: boolean } = {},
): ImageResponse {
  // Scale the S-path SVG proportionally to the icon size
  const svgWidth = Math.round(width * 0.52)
  const svgHeight = Math.round(svgWidth * 0.92)
  const strokeWidth = width >= 512 ? 2.5 : 3

  const sPath = `M 7 20 C 3 19, 1 15, 4 12 C 7 9, 15 11, 18 8 C 21 5, 21 1, 17 2`
  const svgDataUri = `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 22" width="${svgWidth}" height="${svgHeight}">` +
      `<path d="${sPath}" fill="none" stroke="%23C4522E" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>` +
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
          ...(rounded
            ? { borderRadius: width >= 512 ? 80 : 32 }
            : {}),
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={svgDataUri} width={svgWidth} height={svgHeight} alt="" />
      </div>
    ),
    { width, height }
  )
}
