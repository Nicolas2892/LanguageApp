import { SvgSendaPath } from '@/components/SvgSendaPath'
import { BackgroundMagicS } from '@/components/BackgroundMagicS'

export function AuthHeroPanel() {
  return (
    <div className="hidden lg:flex lg:w-1/2 bg-[var(--d5-ink)] text-[var(--d5-paper)] flex-col items-center pt-[35vh] p-12 relative overflow-hidden">
      <BackgroundMagicS opacity={0.12} style={{ right: -60, top: -40, width: 360, height: 468 }} />
      <div className="relative z-10 flex flex-col items-center gap-3 text-center">
        <SvgSendaPath size={80} strokeWidth={4} />
        <h1 className="senda-heading text-4xl text-[var(--d5-paper)]" style={{ letterSpacing: '0.02em' }}>
          Senda
        </h1>
        <p className="text-sm text-[var(--d5-muted)]">
          Tu camino al español avanzado
        </p>
      </div>
    </div>
  )
}
