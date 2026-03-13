import { SvgSendaPath } from '@/components/SvgSendaPath'
import { BackgroundMagicS } from '@/components/BackgroundMagicS'

export function AuthHeroPanel() {
  return (
    <div className="hidden lg:flex lg:w-1/2 bg-[var(--d5-ink)] text-[var(--d5-paper)] flex-col items-center justify-center p-12 relative overflow-hidden">
      {/* Warm radial gradient for depth */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 50% 50%, rgba(140,106,63,0.12) 0%, transparent 70%)',
        }}
      />

      {/* Vellum noise texture */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.4 }}>
        <filter id="auth-noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#auth-noise)" />
      </svg>

      {/* Watermark S — larger, more offset, subtler */}
      <BackgroundMagicS
        opacity={0.06}
        style={{ right: -100, top: -80, width: 480, height: 624 }}
      />

      {/* Logo group */}
      <div className="relative z-10 flex flex-col items-center gap-4 text-center">
        <SvgSendaPath size={96} strokeWidth={4} />

        {/* Terracotta accent line */}
        <div
          className="bg-[var(--d5-terracotta)]"
          style={{ width: 48, height: 2, borderRadius: 1 }}
        />

        <h1
          className="senda-heading text-4xl"
          style={{ letterSpacing: '0.02em', color: 'var(--d5-paper)' }}
        >
          Senda
        </h1>

        <p className="text-sm mt-1" style={{ color: 'var(--d5-paper)', opacity: 0.55 }}>
          Tu camino al español avanzado
        </p>
      </div>
    </div>
  )
}
