'use client'

import { useState } from 'react'

// ─── Shared frame + utilities ─────────────────────────────────────────────────

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 36 }}>
      <div style={{
        fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
        color: '#9ca3af', marginBottom: 14, paddingBottom: 6, borderBottom: '1px solid #f3f4f6',
      }}>
        {label}
      </div>
      {children}
    </div>
  )
}

function PaletteRow({ palette }: { palette: { hex: string; token: string }[] }) {
  const lightHexes = ['#FFF8EE', '#F2E8D0', '#FEFBF4', '#F5EDD8', '#F2E8D0']
  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      {palette.map((c) => (
        <div key={c.hex} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 12, background: c.hex,
            border: lightHexes.includes(c.hex) ? '1px solid #e5e7eb' : 'none',
          }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: '#1f2937', textAlign: 'center' }}>{c.hex}</span>
          <span style={{ fontSize: 10, color: '#6b7280', textAlign: 'center', maxWidth: 72 }}>{c.token}</span>
        </div>
      ))}
    </div>
  )
}

// Phone-frame wrapper — simulates a mobile screen (390px × 720px, scrollable body)
function PhoneFrame({ bg, bottomNav, children }: {
  bg: string
  bottomNav: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div style={{
      width: 390, height: 720,
      border: '1.5px solid #d1d5db', borderRadius: 28,
      overflow: 'hidden', boxShadow: '0 12px 48px rgba(0,0,0,0.12)',
      background: bg, display: 'flex', flexDirection: 'column',
      fontFamily: 'system-ui, sans-serif',
    }}>
      {/* Fake status bar */}
      <div style={{ height: 20, flexShrink: 0 }} />
      {/* Scrollable page body */}
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
        {children}
      </div>
      {/* Bottom nav */}
      {bottomNav}
    </div>
  )
}

// ─── Simple SVG nav icons (Lucide-style paths) ────────────────────────────────

const ICON_PATHS = {
  home:       'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z',
  book:       'M4 19.5A2.5 2.5 0 016.5 17H20V2H6.5A2.5 2.5 0 004 4.5v15z',
  list:       'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
  bar:        'M18 20V10M12 20V4M6 20v-6',
  bot:        'M12 8V4H8M3 12v6a2 2 0 002 2h14a2 2 0 002-2v-6M3 12h18',
}

function SvgIcon({ d, size = 20, color }: { d: string; size?: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  )
}

// ─── Direction colour tokens ───────────────────────────────────────────────────

const D1 = { primary: '#9B3422', warm: '#C4522E', surface: '#FFF8EE', accent: '#F5EDD8', muted: '#6B3020' }
const D2 = { primary: '#1B3A6B', gold: '#D4A84B', cream: '#F2E8D0', blue: '#2E5BA8', muted: '#8BA3C7' }
const D3 = { ink: '#1A1108', paper: '#FEFBF4', mid: '#8C6A3F', accent: '#C4522E', muted: '#B8AA99' }

// ─── Shared concept rows for curriculum mockup ────────────────────────────────

const CURRICULUM_CONCEPTS = [
  { title: 'aunque + subjunctive vs indicative', level: 'B1', state: 'Learning', sc: '#3b82f6', sb: '#eff6ff' },
  { title: 'sin embargo vs. no obstante',        level: 'B1', state: 'New',      sc: '#9ca3af', sb: 'transparent' },
  { title: 'a pesar de (que)',                   level: 'B2', state: 'Mastered', sc: '#16a34a', sb: '#dcfce7' },
]

// ─── Direction 1 components ───────────────────────────────────────────────────

function D1Icon() {
  return (
    <svg viewBox="0 0 100 100" width={128} height={128} style={{ display: 'block', borderRadius: 22 }}>
      <rect width="100" height="100" fill={D1.primary} />
      <path
        d="M 52 76 C 48 66, 44 54, 42 42 C 40 32, 46 22, 50 18
           C 54 16, 59 20, 60 26 C 62 36, 62 50, 60 62 C 58 70, 56 76, 52 76 Z"
        fill={D1.accent}
      />
    </svg>
  )
}

function D1BottomNav({ active }: { active: 'home' | 'book' | 'list' | 'bar' | 'bot' }) {
  const items = [
    { id: 'home' as const, label: 'Home' },
    { id: 'book' as const, label: 'Study' },
    { id: 'list' as const, label: 'Curriculum' },
    { id: 'bar'  as const, label: 'Progress' },
    { id: 'bot'  as const, label: 'Tutor' },
  ]
  return (
    <div style={{ height: 54, borderTop: `1px solid #e5d5c5`, display: 'flex', background: '#fff', flexShrink: 0 }}>
      {items.map((item) => {
        const on = item.id === active
        return (
          <div key={item.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
            <div style={{ padding: '2px 10px', borderRadius: 99, background: on ? D1.surface : 'transparent' }}>
              <SvgIcon d={ICON_PATHS[item.id]} size={20} color={on ? D1.primary : '#9ca3af'} />
            </div>
            <span style={{ fontSize: 9, fontWeight: on ? 700 : 500, color: on ? D1.primary : '#9ca3af' }}>{item.label}</span>
          </div>
        )
      })}
    </div>
  )
}

function D1DashboardContent() {
  return (
    <div style={{ padding: '20px 18px' }}>
      {/* Greeting */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: '#111', letterSpacing: '-0.02em' }}>Hola, Nicolas</h1>
          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: '#fef9c3', color: '#854d0e', border: '1px solid #fde68a' }}>B2</span>
        </div>
        <div style={{ height: 2, width: 36, background: `linear-gradient(to right, ${D1.primary}, transparent)`, marginBottom: 5, borderRadius: 1 }} />
        <p style={{ fontSize: 12, color: D1.muted, margin: 0 }}>7 days strong — you&apos;re building a real habit.</p>
      </div>

      {/* Stats card */}
      <div style={{ background: '#fff', border: '1px solid #e5d5c5', borderRadius: 14, padding: '12px 14px', marginBottom: 10 }}>
        <div style={{ display: 'flex', gap: 24, marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 26, fontWeight: 900, color: D1.primary, lineHeight: 1 }}>7</div>
            <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>day streak</div>
          </div>
          <div>
            <div style={{ fontSize: 26, fontWeight: 900, color: '#111', lineHeight: 1 }}>12</div>
            <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>of 85 mastered</div>
          </div>
        </div>
        <div style={{ height: 7, borderRadius: 99, background: '#f3f4f6', overflow: 'hidden', display: 'flex', gap: 2 }}>
          <div style={{ width: '14%', background: D1.primary, borderRadius: '99px 0 0 99px' }} />
          <div style={{ width: '21%', background: D1.warm }} />
        </div>
        <div style={{ fontSize: 10, color: '#9ca3af', textAlign: 'right', marginTop: 4 }}>12 mastered · 18 in progress · 55 to start</div>
      </div>

      {/* Review CTA */}
      <div style={{ background: D1.primary, borderRadius: 14, padding: '14px 16px', marginBottom: 8 }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: D1.accent, opacity: 0.8, marginBottom: 6 }}>Review</div>
        <div style={{ fontSize: 17, fontWeight: 700, color: D1.accent, marginBottom: 12 }}>5 concepts due today</div>
        <button style={{ background: D1.accent, color: D1.primary, border: 'none', borderRadius: 99, padding: '9px 0', width: '100%', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Start review →</button>
      </div>

      {/* Learn new */}
      <div style={{ background: '#fff', border: `1px solid #e5d5c5`, borderLeft: `4px solid ${D1.primary}`, borderRadius: 14, padding: '14px 16px', marginBottom: 8 }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: D1.muted, marginBottom: 6 }}>Learn new</div>
        <div style={{ fontSize: 17, fontWeight: 700, color: '#111', marginBottom: 12 }}>55 concepts waiting</div>
        <button style={{ background: D1.primary, color: D1.accent, border: 'none', borderRadius: 99, padding: '9px 0', width: '100%', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Start learning →</button>
      </div>

      {/* Free write */}
      <div style={{ background: '#fff', border: `1px solid #e5d5c5`, borderLeft: `4px solid ${D1.warm}`, borderRadius: 14, padding: '14px 16px' }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: D1.muted, marginBottom: 6 }}>Free write</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#111', marginBottom: 3 }}>aunque + subjunctive</div>
        <div style={{ fontSize: 11, color: D1.muted, marginBottom: 12 }}>Worth some extra time today</div>
        <button style={{ background: 'transparent', color: D1.primary, border: `1.5px solid ${D1.primary}`, borderRadius: 99, padding: '8px 0', width: '100%', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Write about this →</button>
      </div>
    </div>
  )
}

function D1CurriculumContent() {
  return (
    <div style={{ padding: '20px 18px' }}>
      <div style={{ marginBottom: 14 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: '#111' }}>Curriculum</h1>
        <p style={{ fontSize: 12, color: D1.muted, margin: '2px 0 0' }}>B1 → B2 Spanish</p>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', borderBottom: `1px solid #e5d5c5`, marginBottom: 10 }}>
        {['All', 'New', 'Learning', 'Mastered'].map((tab, i) => (
          <div key={tab} style={{
            padding: '7px 10px', fontSize: 12, fontWeight: i === 0 ? 600 : 400,
            color: i === 0 ? '#111' : '#9ca3af',
            borderBottom: i === 0 ? `2px solid ${D1.primary}` : '2px solid transparent',
            marginBottom: -1,
          }}>{tab}</div>
        ))}
      </div>

      {/* Level chips */}
      <div style={{ display: 'flex', gap: 5, marginBottom: 14 }}>
        {['All levels', 'B1', 'B2', 'C1'].map((lvl, i) => (
          <span key={lvl} style={{
            padding: '3px 9px', borderRadius: 99, fontSize: 10, fontWeight: 600, border: '1px solid',
            background: i === 0 ? '#111' : 'transparent', color: i === 0 ? '#fff' : '#9ca3af',
            borderColor: i === 0 ? '#111' : '#d1d5db',
          }}>{lvl}</span>
        ))}
      </div>

      {/* Module 1 — open */}
      <div style={{ border: `1px solid #e5d5c5`, borderRadius: 14, overflow: 'hidden', marginBottom: 8, background: '#fff' }}>
        <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#111', marginBottom: 2 }}>Connectors & Discourse Markers</div>
            <div style={{ fontSize: 10, color: '#f59e0b', marginBottom: 5 }}>🏆 3 / 23 mastered</div>
            <div style={{ height: 4, width: 150, background: '#f3f4f6', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ width: '13%', height: '100%', background: D1.primary, borderRadius: 99 }} />
            </div>
          </div>
          <span style={{ fontSize: 10, color: D1.primary, fontWeight: 600, border: `1px solid ${D1.primary}`, borderRadius: 6, padding: '2px 7px', whiteSpace: 'nowrap', marginTop: 2 }}>Practice →</span>
        </div>
        <div style={{ borderTop: '1px solid #f3f4f6', padding: '8px 14px 12px' }}>
          <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9ca3af', marginBottom: 7 }}>
            Additive &amp; Contrastive · 1 / 6
          </div>
          {CURRICULUM_CONCEPTS.map((c, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: i < 2 ? '1px solid #f9fafb' : 'none' }}>
              <span style={{ fontSize: 12, color: '#111', flex: 1, marginRight: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 4, background: '#dcfce7', color: '#15803d' }}>{c.level}</span>
                <span style={{ fontSize: 9, fontWeight: 600, padding: '1px 5px', borderRadius: 4, border: '1px solid', background: c.sb, color: c.sc, borderColor: c.sc + '40' }}>{c.state}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Module 2 — closed */}
      <div style={{ border: `1px solid #e5d5c5`, borderRadius: 14, marginBottom: 8, background: '#fff' }}>
        <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#111', marginBottom: 2 }}>The Subjunctive: Core</div>
            <div style={{ fontSize: 10, color: '#f59e0b' }}>🏆 5 / 5 mastered</div>
          </div>
          <span style={{ color: '#9ca3af', fontSize: 14 }}>›</span>
        </div>
      </div>

      {/* Module 3 — closed */}
      <div style={{ border: `1px solid #e5d5c5`, borderRadius: 14, background: '#fff' }}>
        <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#111', marginBottom: 2 }}>Past Tenses</div>
            <div style={{ fontSize: 10, color: '#f59e0b' }}>🏆 0 / 11 mastered</div>
          </div>
          <span style={{ color: '#9ca3af', fontSize: 14 }}>›</span>
        </div>
      </div>
    </div>
  )
}

function D1ExerciseContext() {
  return (
    <div style={{ background: D1.surface, padding: '22px 18px', borderRadius: 14, border: `1px solid #e5d5c5` }}>
      {/* Session header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div style={{ fontSize: 12, color: D1.muted, fontWeight: 600 }}>aunque + subjunctive</div>
        <div style={{ display: 'flex', gap: 3 }}>
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} style={{ width: 18, height: 4, borderRadius: 2, background: i < 3 ? D1.primary : '#ddd5c8' }} />
          ))}
        </div>
      </div>
      {/* Exercise card */}
      <div style={{ background: '#fff', borderRadius: 14, padding: 18, border: `1px solid #e5d5c5`, boxShadow: `0 2px 16px rgba(155,52,34,0.07)` }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: D1.warm, marginBottom: 8 }}>Gap Fill</div>
        <div style={{ fontSize: 14, color: '#111', lineHeight: 1.75, marginBottom: 14 }}>
          Aunque el examen _____ difícil, todos lo aprobaron con nota alta.
        </div>
        <label style={{ fontSize: 11, fontWeight: 600, color: D1.muted, display: 'block', marginBottom: 5 }}>Your answer</label>
        <input readOnly type="text" style={{ width: '100%', border: `1.5px solid ${D1.warm}`, borderRadius: 8, padding: '9px 11px', fontSize: 14, color: '#111', background: D1.surface, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' } as React.CSSProperties} />
        <button style={{ marginTop: 12, width: '100%', background: D1.primary, color: D1.accent, border: 'none', borderRadius: 99, padding: '11px 0', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Submit</button>
      </div>
      {/* Score feedback — shown after submit */}
      <div style={{ marginTop: 12, padding: '12px 14px', background: '#fff', borderRadius: 12, border: `1.5px solid ${D1.primary}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
          <span style={{ background: D1.primary, color: D1.accent, fontSize: 11, fontWeight: 700, padding: '3px 12px', borderRadius: 99 }}>3 / 3 · Correct</span>
        </div>
        <p style={{ fontSize: 12, color: '#374151', margin: 0, lineHeight: 1.55 }}>
          &ldquo;fuera&rdquo; is the imperfect subjunctive — correct here because the <em>aunque</em> clause concedes a real past fact.
        </p>
      </div>
    </div>
  )
}

// ─── Direction 2 components ───────────────────────────────────────────────────

function D2Icon() {
  return (
    <svg viewBox="0 0 100 100" width={128} height={128} style={{ display: 'block', borderRadius: 22 }}>
      <rect width="100" height="100" fill={D2.primary} />
      <text x="50" y="72" textAnchor="middle" fill={D2.cream} fontSize={72}
        fontFamily="var(--font-cormorant), serif" fontWeight={600}>N</text>
      <path d="M 35 31  C 40 24, 46 24, 50 29  C 54 34, 60 34, 65 27"
        stroke={D2.gold} strokeWidth={3.5} fill="none" strokeLinecap="round" />
    </svg>
  )
}

function D2BottomNav({ active }: { active: 'home' | 'book' | 'list' | 'bar' | 'bot' }) {
  const items = [
    { id: 'home' as const, label: 'Home' },
    { id: 'book' as const, label: 'Study' },
    { id: 'list' as const, label: 'Curriculum' },
    { id: 'bar'  as const, label: 'Progress' },
    { id: 'bot'  as const, label: 'Tutor' },
  ]
  return (
    <div style={{ height: 54, borderTop: '1px solid #dde4f0', display: 'flex', background: '#fff', flexShrink: 0 }}>
      {items.map((item) => {
        const on = item.id === active
        return (
          <div key={item.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
            <div style={{ padding: '2px 10px', borderRadius: 99, background: on ? '#EEF2FB' : 'transparent' }}>
              <SvgIcon d={ICON_PATHS[item.id]} size={20} color={on ? D2.primary : '#9ca3af'} />
            </div>
            <span style={{ fontSize: 9, fontWeight: on ? 700 : 500, color: on ? D2.primary : '#9ca3af' }}>{item.label}</span>
          </div>
        )
      })}
    </div>
  )
}

function D2DashboardContent() {
  return (
    <div style={{ padding: '20px 18px' }}>
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: D2.primary, letterSpacing: '-0.02em', fontFamily: 'var(--font-cormorant), serif' }}>
            Hola, Nicolas
          </h1>
          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: '#fef9c3', color: '#854d0e', border: '1px solid #fde68a' }}>B2</span>
        </div>
        <div style={{ height: 2, width: 36, background: `linear-gradient(to right, ${D2.gold}, transparent)`, marginBottom: 5, borderRadius: 1 }} />
        <p style={{ fontSize: 12, color: '#4b5563', margin: 0 }}>7 days strong — you&apos;re building a real habit.</p>
      </div>

      <div style={{ background: D2.cream, border: '1px solid #d1c8b0', borderRadius: 14, padding: '12px 14px', marginBottom: 10 }}>
        <div style={{ display: 'flex', gap: 24, marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 26, fontWeight: 900, color: D2.gold, lineHeight: 1 }}>7</div>
            <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>day streak</div>
          </div>
          <div>
            <div style={{ fontSize: 26, fontWeight: 900, color: D2.primary, lineHeight: 1 }}>12</div>
            <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>of 85 mastered</div>
          </div>
        </div>
        <div style={{ height: 7, borderRadius: 99, background: '#e8ddc8', overflow: 'hidden', display: 'flex', gap: 2 }}>
          <div style={{ width: '14%', background: D2.primary, borderRadius: '99px 0 0 99px' }} />
          <div style={{ width: '21%', background: D2.blue }} />
        </div>
        <div style={{ fontSize: 10, color: '#9ca3af', textAlign: 'right', marginTop: 4 }}>12 mastered · 18 in progress · 55 to start</div>
      </div>

      <div style={{ background: D2.primary, borderRadius: 14, padding: '14px 16px', marginBottom: 8 }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: D2.muted, marginBottom: 6 }}>Review</div>
        <div style={{ fontSize: 17, fontWeight: 700, color: D2.cream, marginBottom: 12 }}>5 concepts due today</div>
        <button style={{ background: D2.gold, color: D2.primary, border: 'none', borderRadius: 99, padding: '9px 0', width: '100%', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Start review →</button>
      </div>

      <div style={{ background: '#fff', border: '1px solid #dde4f0', borderLeft: `4px solid ${D2.primary}`, borderRadius: 14, padding: '14px 16px', marginBottom: 8 }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: D2.primary, marginBottom: 6 }}>Learn new</div>
        <div style={{ fontSize: 17, fontWeight: 700, color: '#111', marginBottom: 12 }}>55 concepts waiting</div>
        <button style={{ background: D2.primary, color: D2.cream, border: 'none', borderRadius: 99, padding: '9px 0', width: '100%', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Start learning →</button>
      </div>

      <div style={{ background: '#fff', border: '1px solid #dde4f0', borderLeft: `4px solid ${D2.gold}`, borderRadius: 14, padding: '14px 16px' }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: D2.primary, marginBottom: 6 }}>Free write</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#111', marginBottom: 3 }}>aunque + subjunctive</div>
        <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 12 }}>Worth some extra time today</div>
        <button style={{ background: 'transparent', color: D2.primary, border: `1.5px solid ${D2.primary}`, borderRadius: 99, padding: '8px 0', width: '100%', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Write about this →</button>
      </div>
    </div>
  )
}

function D2CurriculumContent() {
  return (
    <div style={{ padding: '20px 18px' }}>
      <div style={{ marginBottom: 14 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: D2.primary, fontFamily: 'var(--font-cormorant), serif' }}>Curriculum</h1>
        <p style={{ fontSize: 12, color: '#6b7280', margin: '2px 0 0' }}>B1 → B2 Spanish</p>
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid #dde4f0', marginBottom: 10 }}>
        {['All', 'New', 'Learning', 'Mastered'].map((tab, i) => (
          <div key={tab} style={{ padding: '7px 10px', fontSize: 12, fontWeight: i === 0 ? 600 : 400, color: i === 0 ? D2.primary : '#9ca3af', borderBottom: i === 0 ? `2px solid ${D2.primary}` : '2px solid transparent', marginBottom: -1 }}>{tab}</div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 5, marginBottom: 14 }}>
        {['All levels', 'B1', 'B2', 'C1'].map((lvl, i) => (
          <span key={lvl} style={{ padding: '3px 9px', borderRadius: 99, fontSize: 10, fontWeight: 600, border: '1px solid', background: i === 0 ? D2.primary : 'transparent', color: i === 0 ? '#fff' : '#9ca3af', borderColor: i === 0 ? D2.primary : '#d1d5db' }}>{lvl}</span>
        ))}
      </div>

      <div style={{ border: '1px solid #dde4f0', borderRadius: 14, overflow: 'hidden', marginBottom: 8, background: '#fff' }}>
        <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: D2.primary, marginBottom: 2 }}>Connectors &amp; Discourse Markers</div>
            <div style={{ fontSize: 10, color: D2.gold, marginBottom: 5 }}>🏆 3 / 23 mastered</div>
            <div style={{ height: 4, width: 150, background: '#f3f4f6', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ width: '13%', height: '100%', background: D2.gold, borderRadius: 99 }} />
            </div>
          </div>
          <span style={{ fontSize: 10, color: D2.primary, fontWeight: 600, border: `1px solid ${D2.primary}`, borderRadius: 6, padding: '2px 7px', whiteSpace: 'nowrap', marginTop: 2 }}>Practice →</span>
        </div>
        <div style={{ borderTop: '1px solid #f3f4f6', padding: '8px 14px 12px' }}>
          <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9ca3af', marginBottom: 7 }}>Additive &amp; Contrastive · 1 / 6</div>
          {CURRICULUM_CONCEPTS.map((c, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: i < 2 ? '1px solid #f9fafb' : 'none' }}>
              <span style={{ fontSize: 12, color: '#111', flex: 1, marginRight: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 4, background: '#dcfce7', color: '#15803d' }}>{c.level}</span>
                <span style={{ fontSize: 9, fontWeight: 600, padding: '1px 5px', borderRadius: 4, border: '1px solid', background: c.sb, color: c.sc, borderColor: c.sc + '40' }}>{c.state}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ border: '1px solid #dde4f0', borderRadius: 14, marginBottom: 8, background: '#fff' }}>
        <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: D2.primary, marginBottom: 2 }}>The Subjunctive: Core</div>
            <div style={{ fontSize: 10, color: D2.gold }}>🏆 5 / 5 mastered</div>
          </div>
          <span style={{ color: '#9ca3af', fontSize: 14 }}>›</span>
        </div>
      </div>

      <div style={{ border: '1px solid #dde4f0', borderRadius: 14, background: '#fff' }}>
        <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: D2.primary, marginBottom: 2 }}>Past Tenses</div>
            <div style={{ fontSize: 10, color: D2.gold }}>🏆 0 / 11 mastered</div>
          </div>
          <span style={{ color: '#9ca3af', fontSize: 14 }}>›</span>
        </div>
      </div>
    </div>
  )
}

function D2ExerciseContext() {
  return (
    <div style={{ background: D2.cream, padding: '22px 18px', borderRadius: 14, border: '1px solid #d1c8b0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div style={{ fontSize: 14, color: D2.primary, fontWeight: 600, fontFamily: 'var(--font-cormorant), serif' } as React.CSSProperties}>aunque + subjunctive</div>
        <div style={{ display: 'flex', gap: 3 }}>
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} style={{ width: 18, height: 4, borderRadius: 2, background: i < 3 ? D2.primary : '#d1c8b0' }} />
          ))}
        </div>
      </div>
      <div style={{ background: '#fff', borderRadius: 14, padding: 18, border: '1px solid #d1c8b0', boxShadow: '0 2px 16px rgba(27,58,107,0.07)' }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: D2.blue, marginBottom: 8 }}>Gap Fill</div>
        <div style={{ fontSize: 14, color: '#111', lineHeight: 1.75, marginBottom: 14 }}>
          Aunque el examen _____ difícil, todos lo aprobaron con nota alta.
        </div>
        <label style={{ fontSize: 11, fontWeight: 600, color: D2.primary, display: 'block', marginBottom: 5 }}>Your answer</label>
        <input readOnly type="text" style={{ width: '100%', border: `1.5px solid ${D2.primary}`, borderRadius: 8, padding: '9px 11px', fontSize: 14, color: '#111', background: D2.cream, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' } as React.CSSProperties} />
        <button style={{ marginTop: 12, width: '100%', background: D2.primary, color: D2.cream, border: 'none', borderRadius: 99, padding: '11px 0', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Submit</button>
      </div>
      <div style={{ marginTop: 12, padding: '12px 14px', background: '#fff', borderRadius: 12, border: `1.5px solid ${D2.gold}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
          <span style={{ background: D2.gold, color: D2.primary, fontSize: 11, fontWeight: 700, padding: '3px 12px', borderRadius: 99 }}>3 / 3 · Correct</span>
        </div>
        <p style={{ fontSize: 12, color: '#374151', margin: 0, lineHeight: 1.55 }}>
          &ldquo;fuera&rdquo; is the imperfect subjunctive — correct here because the <em>aunque</em> clause concedes a real past fact.
        </p>
      </div>
    </div>
  )
}

// ─── Direction 3 components ───────────────────────────────────────────────────

function D3Icon() {
  return (
    <svg viewBox="0 0 100 100" width={128} height={128} style={{ display: 'block', borderRadius: 22, border: '1px solid #e5e7eb' }}>
      <rect width="100" height="100" fill={D3.paper} />
      <path d="M 28 18  C 30 28, 38 50, 45 78 C 47 78, 51 78, 53 78 C 46 50, 40 28, 36 18 Z" fill={D3.ink} />
      <path d="M 53 78  C 62 56, 68 36, 66 20" stroke={D3.ink} strokeWidth={1.5} fill="none" strokeLinecap="round" />
      <path d="M 33 52  C 40 50, 50 50, 58 52" stroke={D3.ink} strokeWidth={1.2} fill="none" strokeLinecap="round" />
    </svg>
  )
}

function D3BottomNav({ active }: { active: 'home' | 'book' | 'list' | 'bar' | 'bot' }) {
  const items = [
    { id: 'home' as const, label: 'Home' },
    { id: 'book' as const, label: 'Study' },
    { id: 'list' as const, label: 'Curriculum' },
    { id: 'bar'  as const, label: 'Progress' },
    { id: 'bot'  as const, label: 'Tutor' },
  ]
  return (
    <div style={{ height: 54, borderTop: '1px solid #d4c9b8', display: 'flex', background: D3.paper, flexShrink: 0 }}>
      {items.map((item) => {
        const on = item.id === active
        return (
          <div key={item.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
            <div style={{ padding: '2px 10px', borderRadius: 99, background: on ? '#ece6dc' : 'transparent' }}>
              <SvgIcon d={ICON_PATHS[item.id]} size={20} color={on ? D3.accent : D3.mid} />
            </div>
            <span style={{ fontSize: 9, fontWeight: on ? 700 : 500, color: on ? D3.accent : D3.mid }}>{item.label}</span>
          </div>
        )
      })}
    </div>
  )
}

function D3DashboardContent() {
  return (
    <div style={{ padding: '20px 18px' }}>
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: D3.ink, letterSpacing: '-0.02em' }}>Hola, Nicolas</h1>
          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: '#fef9c3', color: '#854d0e', border: '1px solid #fde68a' }}>B2</span>
        </div>
        <div style={{ height: 1, width: 36, background: D3.mid, marginBottom: 5 }} />
        <p style={{ fontSize: 12, color: D3.mid, margin: 0 }}>7 days strong — you&apos;re building a real habit.</p>
      </div>

      <div style={{ background: '#fff', border: '1px solid #d4c9b8', borderRadius: 14, padding: '12px 14px', marginBottom: 10 }}>
        <div style={{ display: 'flex', gap: 24, marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 26, fontWeight: 900, color: D3.accent, lineHeight: 1 }}>7</div>
            <div style={{ fontSize: 10, color: D3.muted, marginTop: 2 }}>day streak</div>
          </div>
          <div>
            <div style={{ fontSize: 26, fontWeight: 900, color: D3.ink, lineHeight: 1 }}>12</div>
            <div style={{ fontSize: 10, color: D3.muted, marginTop: 2 }}>of 85 mastered</div>
          </div>
        </div>
        <div style={{ height: 7, borderRadius: 99, background: '#ede6d9', overflow: 'hidden', display: 'flex', gap: 2 }}>
          <div style={{ width: '14%', background: D3.ink, borderRadius: '99px 0 0 99px' }} />
          <div style={{ width: '21%', background: D3.mid }} />
        </div>
        <div style={{ fontSize: 10, color: D3.muted, textAlign: 'right', marginTop: 4 }}>12 mastered · 18 in progress · 55 to start</div>
      </div>

      <div style={{ background: D3.ink, borderRadius: 14, padding: '14px 16px', marginBottom: 8 }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: D3.muted, marginBottom: 6 }}>Review</div>
        <div style={{ fontSize: 17, fontWeight: 700, color: D3.paper, marginBottom: 12 }}>5 concepts due today</div>
        <button style={{ background: D3.paper, color: D3.ink, border: 'none', borderRadius: 99, padding: '9px 0', width: '100%', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Start review →</button>
      </div>

      <div style={{ background: '#fff', border: '1px solid #d4c9b8', borderLeft: `4px solid ${D3.ink}`, borderRadius: 14, padding: '14px 16px', marginBottom: 8 }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: D3.mid, marginBottom: 6 }}>Learn new</div>
        <div style={{ fontSize: 17, fontWeight: 700, color: D3.ink, marginBottom: 12 }}>55 concepts waiting</div>
        <button style={{ background: D3.ink, color: D3.paper, border: 'none', borderRadius: 99, padding: '9px 0', width: '100%', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Start learning →</button>
      </div>

      <div style={{ background: '#fff', border: '1px solid #d4c9b8', borderLeft: `4px solid ${D3.accent}`, borderRadius: 14, padding: '14px 16px' }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: D3.mid, marginBottom: 6 }}>Free write</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: D3.ink, marginBottom: 3 }}>aunque + subjunctive</div>
        <div style={{ fontSize: 11, color: D3.mid, marginBottom: 12 }}>Worth some extra time today</div>
        <button style={{ background: 'transparent', color: D3.ink, border: `1.5px solid ${D3.ink}`, borderRadius: 99, padding: '8px 0', width: '100%', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Write about this →</button>
      </div>
    </div>
  )
}

function D3CurriculumContent() {
  return (
    <div style={{ padding: '20px 18px' }}>
      <div style={{ marginBottom: 14 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: D3.ink, fontFamily: 'var(--font-dm-serif), serif', fontStyle: 'italic' } as React.CSSProperties}>Curriculum</h1>
        <p style={{ fontSize: 12, color: D3.mid, margin: '2px 0 0' }}>B1 → B2 Spanish</p>
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid #d4c9b8', marginBottom: 10 }}>
        {['All', 'New', 'Learning', 'Mastered'].map((tab, i) => (
          <div key={tab} style={{ padding: '7px 10px', fontSize: 12, fontWeight: i === 0 ? 600 : 400, color: i === 0 ? D3.ink : D3.muted, borderBottom: i === 0 ? `2px solid ${D3.accent}` : '2px solid transparent', marginBottom: -1 }}>{tab}</div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 5, marginBottom: 14 }}>
        {['All levels', 'B1', 'B2', 'C1'].map((lvl, i) => (
          <span key={lvl} style={{ padding: '3px 9px', borderRadius: 99, fontSize: 10, fontWeight: 600, border: '1px solid', background: i === 0 ? D3.ink : 'transparent', color: i === 0 ? D3.paper : D3.muted, borderColor: i === 0 ? D3.ink : '#c5b9a8' }}>{lvl}</span>
        ))}
      </div>

      <div style={{ border: '1px solid #d4c9b8', borderRadius: 14, overflow: 'hidden', marginBottom: 8, background: '#fff' }}>
        <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: D3.ink, marginBottom: 2 }}>Connectors &amp; Discourse Markers</div>
            <div style={{ fontSize: 10, color: D3.mid, marginBottom: 5 }}>🏆 3 / 23 mastered</div>
            <div style={{ height: 4, width: 150, background: '#ede6d9', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ width: '13%', height: '100%', background: D3.ink, borderRadius: 99 }} />
            </div>
          </div>
          <span style={{ fontSize: 10, color: D3.ink, fontWeight: 600, border: `1px solid ${D3.ink}`, borderRadius: 6, padding: '2px 7px', whiteSpace: 'nowrap', marginTop: 2 }}>Practice →</span>
        </div>
        <div style={{ borderTop: '1px solid #f3f4f6', padding: '8px 14px 12px' }}>
          <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: D3.muted, marginBottom: 7 }}>Additive &amp; Contrastive · 1 / 6</div>
          {CURRICULUM_CONCEPTS.map((c, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: i < 2 ? '1px solid #f9fafb' : 'none' }}>
              <span style={{ fontSize: 12, color: D3.ink, flex: 1, marginRight: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 4, background: '#dcfce7', color: '#15803d' }}>{c.level}</span>
                <span style={{ fontSize: 9, fontWeight: 600, padding: '1px 5px', borderRadius: 4, border: '1px solid', background: c.sb, color: c.sc, borderColor: c.sc + '40' }}>{c.state}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ border: '1px solid #d4c9b8', borderRadius: 14, marginBottom: 8, background: '#fff' }}>
        <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: D3.ink, marginBottom: 2 }}>The Subjunctive: Core</div>
            <div style={{ fontSize: 10, color: D3.mid }}>🏆 5 / 5 mastered</div>
          </div>
          <span style={{ color: D3.muted, fontSize: 14 }}>›</span>
        </div>
      </div>

      <div style={{ border: '1px solid #d4c9b8', borderRadius: 14, background: '#fff' }}>
        <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: D3.ink, marginBottom: 2 }}>Past Tenses</div>
            <div style={{ fontSize: 10, color: D3.mid }}>🏆 0 / 11 mastered</div>
          </div>
          <span style={{ color: D3.muted, fontSize: 14 }}>›</span>
        </div>
      </div>
    </div>
  )
}

function D3ExerciseContext() {
  return (
    <div style={{ background: D3.paper, padding: '22px 18px', borderRadius: 14, border: '1px solid #d4c9b8' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div style={{ fontSize: 12, color: D3.mid, fontWeight: 600 }}>aunque + subjunctive</div>
        <div style={{ display: 'flex', gap: 3 }}>
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} style={{ width: 18, height: 4, borderRadius: 2, background: i < 3 ? D3.ink : '#d4c9b8' }} />
          ))}
        </div>
      </div>
      <div style={{ background: '#fff', borderRadius: 14, padding: 18, border: '1px solid #d4c9b8', boxShadow: '0 2px 16px rgba(26,17,8,0.05)' }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: D3.mid, marginBottom: 8 }}>Gap Fill</div>
        <div style={{ fontSize: 14, color: D3.ink, lineHeight: 1.75, marginBottom: 14 }}>
          Aunque el examen _____ difícil, todos lo aprobaron con nota alta.
        </div>
        <label style={{ fontSize: 11, fontWeight: 600, color: D3.mid, display: 'block', marginBottom: 5 }}>Your answer</label>
        <input readOnly type="text" style={{ width: '100%', border: `1.5px solid ${D3.ink}`, borderRadius: 8, padding: '9px 11px', fontSize: 14, color: D3.ink, background: D3.paper, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' } as React.CSSProperties} />
        <button style={{ marginTop: 12, width: '100%', background: D3.ink, color: D3.paper, border: 'none', borderRadius: 99, padding: '11px 0', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Submit</button>
      </div>
      <div style={{ marginTop: 12, padding: '12px 14px', background: '#fff', borderRadius: 12, border: `1.5px solid ${D3.accent}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
          <span style={{ background: D3.accent, color: D3.paper, fontSize: 11, fontWeight: 700, padding: '3px 12px', borderRadius: 99 }}>3 / 3 · Correct</span>
        </div>
        <p style={{ fontSize: 12, color: '#374151', margin: 0, lineHeight: 1.55 }}>
          &ldquo;fuera&rdquo; is the imperfect subjunctive — correct here because the <em>aunque</em> clause concedes a real past fact.
        </p>
      </div>
    </div>
  )
}

// ─── Sidebar nav mocks (desktop strip) ────────────────────────────────────────

function D1SideNav() {
  return (
    <div style={{ background: '#fff', border: '1px solid #e5d5c5', borderRadius: 12, padding: 12, width: 180 }}>
      <div style={{ fontFamily: 'var(--font-cormorant), serif', fontWeight: 600, fontSize: 15, letterSpacing: '0.15em', color: D1.primary, marginBottom: 16, paddingBottom: 10, borderBottom: `1px solid #e5d5c5` }}>
        Avanzado
      </div>
      {[{ label: 'Dashboard', active: true }, { label: 'Study', active: false }].map((item) => (
        <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, marginBottom: 4, background: item.active ? D1.surface : 'transparent', color: item.active ? D1.primary : '#6b7280', fontWeight: item.active ? 600 : 400, fontSize: 14 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: item.active ? D1.primary : 'transparent', border: item.active ? 'none' : '1.5px solid #d1d5db' }} />
          {item.label}
        </div>
      ))}
    </div>
  )
}

function D2SideNav() {
  return (
    <div style={{ background: '#fff', border: '1px solid #dde4f0', borderRadius: 12, padding: 12, width: 180 }}>
      <div style={{ fontFamily: 'var(--font-cormorant), serif', fontWeight: 700, fontSize: 16, color: D2.primary, marginBottom: 16, paddingBottom: 10, borderBottom: '1px solid #dde4f0' }}>
        Español <span style={{ color: D2.gold }}>Avanzado</span>
      </div>
      {[{ label: 'Dashboard', active: true }, { label: 'Study', active: false }].map((item) => (
        <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, marginBottom: 4, background: item.active ? '#EEF2FB' : 'transparent', color: item.active ? D2.primary : '#6b7280', fontWeight: item.active ? 600 : 400, fontSize: 14, borderLeft: item.active ? `3px solid ${D2.primary}` : '3px solid transparent' }}>
          {item.label}
        </div>
      ))}
    </div>
  )
}

function D3SideNav() {
  return (
    <div style={{ background: D3.paper, border: '1px solid #d4c9b8', borderRadius: 12, padding: 12, width: 180 }}>
      <div style={{ fontFamily: 'var(--font-dm-serif), serif', fontStyle: 'italic', fontSize: 16, color: D3.ink, marginBottom: 16, paddingBottom: 10, borderBottom: '1px solid #d4c9b8' }}>
        Avanzado
      </div>
      {[{ label: 'Dashboard', active: true }, { label: 'Study', active: false }].map((item) => (
        <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, marginBottom: 4, background: item.active ? '#ece6dc' : 'transparent', color: item.active ? D3.accent : D3.mid, fontWeight: item.active ? 600 : 400, fontSize: 14 }}>
          <span style={{ width: 4, height: 16, borderRadius: 2, background: item.active ? D3.accent : 'transparent', marginRight: 2 }} />
          {item.label}
        </div>
      ))}
    </div>
  )
}

// ─── Direction panels ─────────────────────────────────────────────────────────

function Direction1Panel() {
  return (
    <div>
      <Section label="Icon + Wordmark + Concept">
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <D1Icon />
          <div>
            <div style={{ fontFamily: 'var(--font-cormorant), serif', fontWeight: 600, fontSize: 32, letterSpacing: '0.15em', color: D1.primary, lineHeight: 1.1 }}>Avanzado</div>
            <div style={{ fontSize: 13, color: '#6b7280', marginTop: 6, maxWidth: 260, lineHeight: 1.5 }}>The defining mark of written Spanish — built from the acute accent alone.</div>
          </div>
        </div>
      </Section>

      <Section label="Colour Palette">
        <PaletteRow palette={[
          { hex: D1.primary, token: 'Brand Primary' },
          { hex: D1.warm,    token: 'Brand Warm' },
          { hex: D1.surface, token: 'Brand Surface' },
          { hex: D1.accent,  token: 'Brand Accent' },
          { hex: D1.muted,   token: 'Brand Muted' },
        ]} />
      </Section>

      <Section label="Desktop Sidebar Navigation">
        <D1SideNav />
      </Section>

      <Section label="Exercise in App Context">
        <D1ExerciseContext />
      </Section>

      <Section label="Dashboard Page">
        <PhoneFrame bg={D1.surface} bottomNav={<D1BottomNav active="home" />}>
          <D1DashboardContent />
        </PhoneFrame>
      </Section>

      <Section label="Curriculum Page">
        <PhoneFrame bg={D1.surface} bottomNav={<D1BottomNav active="list" />}>
          <D1CurriculumContent />
        </PhoneFrame>
      </Section>
    </div>
  )
}

function Direction2Panel() {
  return (
    <div>
      <Section label="Icon + Wordmark + Concept">
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <D2Icon />
          <div>
            <div style={{ fontFamily: 'var(--font-cormorant), serif', fontWeight: 700, fontSize: 32, color: D2.primary, lineHeight: 1.1 }}>
              Español <span style={{ color: D2.gold }}>Avanzado</span>
            </div>
            <div style={{ fontSize: 13, color: '#6b7280', marginTop: 6, maxWidth: 260, lineHeight: 1.5 }}>The Ñ in a bespoke display serif — ownable, unmistakably Spanish.</div>
          </div>
        </div>
      </Section>

      <Section label="Colour Palette">
        <PaletteRow palette={[
          { hex: D2.primary, token: 'Brand Primary' },
          { hex: D2.gold,    token: 'Brand Gold' },
          { hex: D2.cream,   token: 'Brand Cream' },
          { hex: D2.blue,    token: 'Brand Blue Light' },
          { hex: D2.muted,   token: 'Brand Muted' },
        ]} />
      </Section>

      <Section label="Desktop Sidebar Navigation">
        <D2SideNav />
      </Section>

      <Section label="Exercise in App Context">
        <D2ExerciseContext />
      </Section>

      <Section label="Dashboard Page">
        <PhoneFrame bg={D2.cream} bottomNav={<D2BottomNav active="home" />}>
          <D2DashboardContent />
        </PhoneFrame>
      </Section>

      <Section label="Curriculum Page">
        <PhoneFrame bg={D2.cream} bottomNav={<D2BottomNav active="list" />}>
          <D2CurriculumContent />
        </PhoneFrame>
      </Section>
    </div>
  )
}

function Direction3Panel() {
  return (
    <div>
      <Section label="Icon + Wordmark + Concept">
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <D3Icon />
          <div>
            <div style={{ fontFamily: 'var(--font-dm-serif), serif', fontStyle: 'italic', fontSize: 32, color: D3.ink, lineHeight: 1.1 }}>Avanzado</div>
            <div style={{ fontSize: 13, color: '#6b7280', marginTop: 6, maxWidth: 260, lineHeight: 1.5 }}>The act of writing — an ink mark on paper — as the brand&apos;s visual language.</div>
          </div>
        </div>
      </Section>

      <Section label="Colour Palette">
        <PaletteRow palette={[
          { hex: D3.ink,    token: 'Brand Ink' },
          { hex: D3.paper,  token: 'Brand Paper' },
          { hex: D3.mid,    token: 'Brand Warm Mid' },
          { hex: D3.accent, token: 'Brand Accent' },
          { hex: D3.muted,  token: 'Brand Muted' },
        ]} />
      </Section>

      <Section label="Desktop Sidebar Navigation">
        <D3SideNav />
      </Section>

      <Section label="Exercise in App Context">
        <D3ExerciseContext />
      </Section>

      <Section label="Dashboard Page">
        <PhoneFrame bg={D3.paper} bottomNav={<D3BottomNav active="home" />}>
          <D3DashboardContent />
        </PhoneFrame>
      </Section>

      <Section label="Curriculum Page">
        <PhoneFrame bg={D3.paper} bottomNav={<D3BottomNav active="list" />}>
          <D3CurriculumContent />
        </PhoneFrame>
      </Section>
    </div>
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────

const TABS = [
  { id: 1, label: 'Direction 1: Acute Accent' },
  { id: 2, label: 'Direction 2: Ñ Redesigned' },
  { id: 3, label: 'Direction 3: Ink Mark' },
]

export function BrandPreviewClient() {
  const [active, setActive] = useState(1)

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '20px 40px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: 4 }}>
          Brand Identity Preview — Español Avanzado
        </div>
        <div style={{ fontSize: 14, color: '#6b7280' }}>
          Three directions. One decision. Delete this page after choosing.
        </div>
      </div>

      {/* Tab switcher */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '0 40px', display: 'flex' }}>
        {TABS.map((tab) => (
          <button key={tab.id} onClick={() => setActive(tab.id)} style={{
            padding: '14px 20px', fontSize: 14,
            fontWeight: active === tab.id ? 600 : 400,
            color: active === tab.id ? '#111827' : '#6b7280',
            background: 'none', border: 'none',
            borderBottom: active === tab.id ? '2px solid #111827' : '2px solid transparent',
            cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap',
          }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content — wider to comfortably house phone frames */}
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '40px 40px' }}>
        {active === 1 && <Direction1Panel />}
        {active === 2 && <Direction2Panel />}
        {active === 3 && <Direction3Panel />}
      </div>
    </div>
  )
}
