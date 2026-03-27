import { ImageResponse } from 'next/og'

/**
 * Shared PWA icon renderer — white calligraphic S on terracotta.
 * Strong bleed: the S extends beyond the icon boundary and is clipped
 * by the rounded square, as if the brush stroke passes through the frame.
 *
 * @param rounded - set false for apple-icon (iOS applies its own mask)
 */
export function renderIcon(
  width: number,
  height: number,
  { rounded = true }: { rounded?: boolean } = {},
): ImageResponse {
  // S fills ~96% of the icon — bleeds past edges for cropped calligraphic effect
  const svgSize = Math.round(width * 0.96)
  // Center the S path within the icon
  const offset = Math.round((width - svgSize) / 2)

  return new ImageResponse(
    (
      <div
        style={{
          background: '#C4522E',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          position: 'relative',
          ...(rounded
            ? { borderRadius: width >= 512 ? 80 : 32 }
            : {}),
        }}
      >
        <svg
          viewBox="0 0 24 24"
          width={svgSize}
          height={svgSize}
          fill="none"
          style={{
            position: 'absolute',
            left: offset,
            top: offset,
          }}
        >
          {/* Calligraphic filled S — V2 broad-nib path */}
          <path
            d="M 6 21 C 2.5 20, 0.5 17, 1.5 14 C 2.5 11, 5.5 10, 9 9 C 12.5 8, 16 7, 18 5 C 19.5 3.5, 19 1.5, 17 1.5 C 16.5 1.5, 16.8 2.5, 17.5 3 C 19 2, 21 3, 20.5 5.5 C 20 8, 17 9.5, 13.5 10.5 C 10 11.5, 6.5 12, 4.5 14 C 2.5 16, 3 19, 5.5 20 C 7 20.8, 7.5 20, 6 21 Z"
            fill="#FDFCF9"
          />
        </svg>
      </div>
    ),
    { width, height }
  )
}
