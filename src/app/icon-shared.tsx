import { ImageResponse } from 'next/og'

/**
 * Shared PWA icon renderer — white S-path on terracotta background.
 * Bold, full-bleed design that looks sharp at home screen size.
 *
 * @param rounded - set false for apple-icon (iOS applies its own mask)
 */
export function renderIcon(
  width: number,
  height: number,
  { rounded = true }: { rounded?: boolean } = {},
): ImageResponse {
  // S-path fills ~70% of the icon for maximum visual impact
  const svgSize = Math.round(width * 0.70)
  const strokeWidth = width >= 512 ? 5 : width >= 180 ? 4 : 3.5

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
        >
          <path
            d="M 7 20 C 4 18, 1 15, 4 12 C 7 9, 14 9.5, 18 8 C 20.5 5.5, 20 1.5, 16.5 2.5"
            stroke="#FDFCF9"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        </svg>
      </div>
    ),
    { width, height }
  )
}
