import { ImageResponse } from 'next/og'

/**
 * Shared PWA icon renderer — terracotta S-path on paper background.
 * Uses pure SVG (not data URI) since Satori doesn't support <img> with data URIs.
 *
 * @param rounded - set false for apple-icon (iOS applies its own mask)
 */
export function renderIcon(
  width: number,
  height: number,
  { rounded = true }: { rounded?: boolean } = {},
): ImageResponse {
  const strokeWidth = width >= 512 ? 8 : width >= 180 ? 6 : 5

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
        <svg
          viewBox="0 0 24 22"
          width={Math.round(width * 0.52)}
          height={Math.round(width * 0.52 * 0.92)}
          fill="none"
        >
          <path
            d="M 7 20 C 3 19, 1 15, 4 12 C 7 9, 15 11, 18 8 C 21 5, 21 1, 17 2"
            stroke="#C4522E"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    ),
    { width, height }
  )
}
