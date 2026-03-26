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
          {/* Calligraphic filled S — matches SvgSendaPath */}
          <path
            d="M 5.2 21 C 1 19.5, -0.8 14.5, 2.5 11 C 5.8 7.5, 14.2 9.8, 17.2 7 C 20.2 4.2, 20.8 0.5, 17.8 0.8 C 16.5 0.2, 15.8 2.2, 17 3.2 C 21 1.5, 21.5 5.8, 18.8 8.8 C 16 12, 7.5 9.5, 5 12.5 C 2.5 15.5, 4 19, 7.2 20 C 8.5 21, 7 21.5, 5.2 21 Z"
            fill="#FDFCF9"
          />
        </svg>
      </div>
    ),
    { width, height }
  )
}
