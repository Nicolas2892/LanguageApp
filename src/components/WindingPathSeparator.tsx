// Calligraphic winding-path divider — used between dashboard sections.
// Colour adapts via the --d5-separator CSS custom property (warm in light, muted in dark).
export function WindingPathSeparator() {
  return (
    <div className="px-3 my-2" aria-hidden="true">
      <svg
        viewBox="0 0 354 30"
        width="100%"
        height={30}
        style={{ display: 'block', overflow: 'visible' }}
      >
        {/* Primary stroke — thin, moderate opacity */}
        <path
          d="M 4 20 C 55 6, 115 26, 177 16 C 235 7, 295 22, 350 12"
          stroke="var(--d5-separator)"
          strokeWidth={1.2}
          strokeLinecap="round"
          fill="none"
          opacity={0.45}
        />
        {/* Echo stroke — thick, low opacity, adds depth */}
        <path
          d="M 4 20 C 55 6, 115 26, 177 16 C 235 7, 295 22, 350 12"
          stroke="var(--d5-separator)"
          strokeWidth={3}
          strokeLinecap="round"
          fill="none"
          opacity={0.08}
        />
      </svg>
    </div>
  )
}
