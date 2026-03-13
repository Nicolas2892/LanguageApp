// Calligraphic winding-path divider — used between dashboard sections.
// Colour adapts via the --d5-separator CSS custom property (warm in light, muted in dark).
// Opacity adapts via --d5-separator-opacity / --d5-separator-echo-opacity tokens.
export function WindingPathSeparator() {
  return (
    <div className="-mx-5 my-2 lg:-mx-8" aria-hidden="true">
      <svg
        viewBox="0 0 354 30"
        width="100%"
        height={30}
        style={{ display: 'block', overflow: 'visible' }}
      >
        {/* Primary stroke — thin, moderate opacity */}
        <path
          d="M -10 22 C 50 6, 115 26, 177 16 C 235 7, 300 22, 364 10"
          stroke="var(--d5-separator)"
          strokeWidth={1.2}
          strokeLinecap="round"
          fill="none"
          style={{ opacity: 'var(--d5-separator-opacity)' as unknown as number }}
        />
        {/* Echo stroke — thick, low opacity, adds depth */}
        <path
          d="M -10 22 C 50 6, 115 26, 177 16 C 235 7, 300 22, 364 10"
          stroke="var(--d5-separator)"
          strokeWidth={3}
          strokeLinecap="round"
          fill="none"
          style={{ opacity: 'var(--d5-separator-echo-opacity)' as unknown as number }}
        />
      </svg>
    </div>
  )
}
