'use client'

import { useState } from 'react'

// ─── Shared utilities ─────────────────────────────────────────────────────────

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
  const lightHexes = ['#FFF8EE', '#F2E8D0', '#FEFBF4', '#F5EDD8', '#F7F3EC']
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

function PhoneFrame({ bg, bottomNav, children }: {
  bg: string; bottomNav: React.ReactNode; children: React.ReactNode
}) {
  return (
    <div style={{
      width: 390, height: 720,
      border: '1.5px solid #d1d5db', borderRadius: 28,
      overflow: 'hidden', boxShadow: '0 12px 48px rgba(0,0,0,0.12)',
      background: bg, display: 'flex', flexDirection: 'column',
      fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{ height: 20, flexShrink: 0 }} />
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
        {children}
      </div>
      {bottomNav}
    </div>
  )
}

const ICON_PATHS = {
  home:       'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z',
  book:       'M4 19.5A2.5 2.5 0 016.5 17H20V2H6.5A2.5 2.5 0 004 4.5v15z',
  list:       'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
  bar:        'M18 20V10M12 20V4M6 20v-6',
  bot:        'M12 8V4H8M3 12v6a2 2 0 002 2h14a2 2 0 002-2v-6M3 12h18',
}
type NavId = keyof typeof ICON_PATHS

function SvgIcon({ d, size = 20, color }: { d: string; size?: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  )
}

function BottomNav({ items, active, activeColor, activeBg }: {
  items: { id: NavId; label: string }[]
  active: NavId
  activeColor: string
  activeBg: string
}) {
  return (
    <div style={{ height: 54, borderTop: '1px solid #e5e7eb', display: 'flex', background: '#ffffff', flexShrink: 0 }}>
      {items.map((item) => {
        const on = item.id === active
        return (
          <div key={item.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
            <div style={{ padding: '2px 10px', borderRadius: 99, background: on ? activeBg : 'transparent' }}>
              <SvgIcon d={ICON_PATHS[item.id]} size={20} color={on ? activeColor : '#9ca3af'} />
            </div>
            <span style={{ fontSize: 9, fontWeight: on ? 700 : 500, color: on ? activeColor : '#9ca3af' }}>{item.label}</span>
          </div>
        )
      })}
    </div>
  )
}

const NAV_ITEMS: { id: NavId; label: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'book', label: 'Study' },
  { id: 'list', label: 'Curriculum' },
  { id: 'bar',  label: 'Progress' },
  { id: 'bot',  label: 'Tutor' },
]

const CURRICULUM_CONCEPTS = [
  { title: 'aunque + subjunctive vs indicative', level: 'B1', state: 'Learning', sc: '#3b82f6', sb: '#eff6ff' },
  { title: 'sin embargo vs. no obstante',        level: 'B1', state: 'New',      sc: '#9ca3af', sb: 'transparent' },
  { title: 'a pesar de (que)',                   level: 'B2', state: 'Mastered', sc: '#16a34a', sb: '#dcfce7' },
]

// ─── Colour tokens ─────────────────────────────────────────────────────────────

const D1 = { primary: '#9B3422', warm: '#C4522E', surface: '#FFF8EE', accent: '#F5EDD8', muted: '#6B3020' }
const D2 = { primary: '#1B3A6B', gold: '#D4A84B', cream: '#F2E8D0', blue: '#2E5BA8', muted: '#8BA3C7' }
const D3 = { ink: '#1A1108', paper: '#FEFBF4', mid: '#8C6A3F', accent: '#C4522E', muted: '#B8AA99' }
const D4 = { forest: '#2C5F2E', sage: '#5A8F60', parchment: '#F7F3EC', ochre: '#C9922A', muted: '#7A9E7D' }

// ─── Icons ────────────────────────────────────────────────────────────────────

function D1Icon() {
  return (
    <svg viewBox="0 0 100 100" width={128} height={128} style={{ display: 'block', borderRadius: 22 }}>
      <rect width="100" height="100" fill={D1.primary} />
      <path d="M 52 76 C 48 66, 44 54, 42 42 C 40 32, 46 22, 50 18 C 54 16, 59 20, 60 26 C 62 36, 62 50, 60 62 C 58 70, 56 76, 52 76 Z" fill={D1.accent} />
    </svg>
  )
}

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

function D3Icon() {
  return (
    <svg viewBox="0 0 100 100" width={128} height={128} style={{ display: 'block', borderRadius: 22, border: '1px solid #e5e7eb' }}>
      <rect width="100" height="100" fill={D3.paper} />
      <path
        d="M 32 83 C 14 81, 8 66, 18 54 C 28 42, 54 46, 66 36 C 78 26, 82 12, 70 8"
        stroke={D3.ink}
        strokeWidth={16}
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}

function D4Icon() {
  return (
    <svg viewBox="0 0 100 100" width={128} height={128} style={{ display: 'block', borderRadius: 22 }}>
      <rect width="100" height="100" fill={D4.forest} />
      <path
        d="M 36 80 C 20 78, 12 64, 20 54 C 28 44, 50 46, 62 38 C 74 30, 78 18, 68 12"
        stroke={D4.parchment}
        strokeWidth={12}
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}

// ─── Sidebar nav mocks ────────────────────────────────────────────────────────

function D1SideNav() {
  return (
    <div style={{ background: '#fff', border: '1px solid #e5d5c5', borderRadius: 12, padding: 12, width: 180 }}>
      <div style={{ fontFamily: 'var(--font-cormorant), serif', fontWeight: 600, fontSize: 18, letterSpacing: '0.12em', color: D1.primary, marginBottom: 16, paddingBottom: 10, borderBottom: '1px solid #e5d5c5' }}>
        Senda
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
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, marginBottom: 16, paddingBottom: 10, borderBottom: '1px solid #dde4f0' }}>
        <span style={{ color: D2.gold, fontSize: 16, lineHeight: 1 }}>~</span>
        <span style={{ fontFamily: 'var(--font-cormorant), serif', fontWeight: 700, fontSize: 18, color: D2.primary }}>Senda</span>
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
    <div style={{ background: '#fafaf8', border: '1px solid #d4c9b8', borderRadius: 12, padding: 12, width: 180 }}>
      <div style={{ fontFamily: 'var(--font-dm-serif), serif', fontStyle: 'italic', fontSize: 18, color: D3.ink, marginBottom: 16, paddingBottom: 10, borderBottom: '1px solid #d4c9b8' }}>
        Senda
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

function D4SideNav() {
  // Mini S-path logomark inline with wordmark
  const S = 'M 13 5 C 17 4, 18 8, 16 10 C 14 12, 8 12, 6 14 C 4 16, 5 20, 9 20'
  return (
    <div style={{ background: '#fff', border: '1px solid #c8dcc9', borderRadius: 12, padding: 12, width: 180 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, paddingBottom: 10, borderBottom: '1px solid #c8dcc9' }}>
        <svg viewBox="0 0 24 24" width={22} height={22} style={{ flexShrink: 0 }}>
          <rect width="24" height="24" rx="5" fill={D4.forest} />
          <path d={S} stroke={D4.parchment} strokeWidth={3} strokeLinecap="round" fill="none" />
        </svg>
        <span style={{ fontFamily: 'var(--font-plus-jakarta), sans-serif', fontWeight: 600, fontSize: 16, color: D4.forest, letterSpacing: '-0.02em' }}>senda</span>
      </div>
      {[{ label: 'Dashboard', active: true }, { label: 'Study', active: false }].map((item) => (
        <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, marginBottom: 4, background: item.active ? '#eaf2ea' : 'transparent', color: item.active ? D4.forest : '#6b7280', fontWeight: item.active ? 600 : 400, fontSize: 14 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: item.active ? D4.forest : 'transparent', border: item.active ? 'none' : '1.5px solid #d1d5db' }} />
          {item.label}
        </div>
      ))}
    </div>
  )
}

// ─── Exercise in context ──────────────────────────────────────────────────────

function ExerciseContext({ colors, border, inputBg, labelColor, submitBg, submitText, scoreBorder, scoreChipBg, scoreChipText, font }: {
  colors: { primary: string; warm?: string }
  border: string
  inputBg: string
  labelColor: string
  submitBg: string
  submitText: string
  scoreBorder: string
  scoreChipBg: string
  scoreChipText: string
  font?: string
}) {
  return (
    <div style={{ background: '#ffffff', padding: '22px 18px', borderRadius: 14, border: '1px solid #e5e7eb' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div style={{ fontSize: 12, color: labelColor, fontWeight: 600, fontFamily: font }}>aunque + subjunctive</div>
        <div style={{ display: 'flex', gap: 3 }}>
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} style={{ width: 18, height: 4, borderRadius: 2, background: i < 3 ? colors.primary : '#e5e7eb' }} />
          ))}
        </div>
      </div>
      <div style={{ background: '#fff', borderRadius: 14, padding: 18, border: '1px solid #e5e7eb', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.warm ?? colors.primary, marginBottom: 8 }}>Gap Fill</div>
        <div style={{ fontSize: 14, color: '#111', lineHeight: 1.75, marginBottom: 14 }}>
          Aunque el examen _____ difícil, todos lo aprobaron con nota alta.
        </div>
        <label style={{ fontSize: 11, fontWeight: 600, color: labelColor, display: 'block', marginBottom: 5 }}>Your answer</label>
        <input readOnly type="text" style={{ width: '100%', border, borderRadius: 8, padding: '9px 11px', fontSize: 14, color: '#111', background: inputBg, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' } as React.CSSProperties} />
        <button style={{ marginTop: 12, width: '100%', background: submitBg, color: submitText, border: 'none', borderRadius: 99, padding: '11px 0', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: font }}>Submit</button>
      </div>
      <div style={{ marginTop: 12, padding: '12px 14px', background: '#fff', borderRadius: 12, border: scoreBorder }}>
        <div style={{ marginBottom: 7 }}>
          <span style={{ background: scoreChipBg, color: scoreChipText, fontSize: 11, fontWeight: 700, padding: '3px 12px', borderRadius: 99 }}>3 / 3 · Correct</span>
        </div>
        <p style={{ fontSize: 12, color: '#374151', margin: 0, lineHeight: 1.55 }}>
          &ldquo;fuera&rdquo; is the imperfect subjunctive — correct here because the <em>aunque</em> clause concedes a real past fact.
        </p>
      </div>
    </div>
  )
}

// ─── Shared curriculum content (parameterised) ───────────────────────────────

function CurriculumContent({ primary, gold, underline, chipActiveBg, chipActiveText, moduleTitle, tabFont }: {
  primary: string; gold?: string; underline: string
  chipActiveBg: string; chipActiveText: string
  moduleTitle?: string; tabFont?: string
}) {
  return (
    <div style={{ padding: '20px 18px' }}>
      <div style={{ marginBottom: 14 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: primary, fontFamily: tabFont }}>{moduleTitle ?? 'Curriculum'}</h1>
        <p style={{ fontSize: 12, color: '#6b7280', margin: '2px 0 0' }}>B1 → B2 Spanish</p>
      </div>
      <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', marginBottom: 10 }}>
        {['All', 'New', 'Learning', 'Mastered'].map((tab, i) => (
          <div key={tab} style={{ padding: '7px 10px', fontSize: 12, fontWeight: i === 0 ? 600 : 400, color: i === 0 ? '#111' : '#9ca3af', borderBottom: i === 0 ? `2px solid ${underline}` : '2px solid transparent', marginBottom: -1 }}>{tab}</div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 5, marginBottom: 14 }}>
        {['All levels', 'B1', 'B2', 'C1'].map((lvl, i) => (
          <span key={lvl} style={{ padding: '3px 9px', borderRadius: 99, fontSize: 10, fontWeight: 600, border: '1px solid', background: i === 0 ? chipActiveBg : 'transparent', color: i === 0 ? chipActiveText : '#9ca3af', borderColor: i === 0 ? chipActiveBg : '#d1d5db' }}>{lvl}</span>
        ))}
      </div>
      {/* Module 1 — open */}
      <div style={{ border: '1px solid #e5e7eb', borderRadius: 14, overflow: 'hidden', marginBottom: 8, background: '#fff' }}>
        <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: primary, marginBottom: 2 }}>Connectors &amp; Discourse Markers</div>
            <div style={{ fontSize: 10, color: gold ?? '#f59e0b', marginBottom: 5 }}>🏆 3 / 23 mastered</div>
            <div style={{ height: 4, width: 150, background: '#f3f4f6', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ width: '13%', height: '100%', background: gold ?? primary, borderRadius: 99 }} />
            </div>
          </div>
          <span style={{ fontSize: 10, color: primary, fontWeight: 600, border: `1px solid ${primary}`, borderRadius: 6, padding: '2px 7px', whiteSpace: 'nowrap', marginTop: 2 }}>Practice →</span>
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
      {[{ title: 'The Subjunctive: Core', n: '5 / 5' }, { title: 'Past Tenses', n: '0 / 11' }].map((mod) => (
        <div key={mod.title} style={{ border: '1px solid #e5e7eb', borderRadius: 14, marginBottom: 8, background: '#fff' }}>
          <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#111', marginBottom: 2 }}>{mod.title}</div>
              <div style={{ fontSize: 10, color: gold ?? '#f59e0b' }}>🏆 {mod.n} mastered</div>
            </div>
            <span style={{ color: '#9ca3af', fontSize: 14 }}>›</span>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Shared dashboard content (parameterised) ────────────────────────────────

function DashboardContent({ primary, streakColor, warm, surface, muted, reviewText, h1Font }: {
  primary: string; streakColor: string; warm: string; surface: string; muted: string; reviewText: string; h1Font?: string
}) {
  return (
    <div style={{ padding: '20px 18px' }}>
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: primary, letterSpacing: '-0.02em', fontFamily: h1Font }}>Hola, Nicolas</h1>
          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: '#fef9c3', color: '#854d0e', border: '1px solid #fde68a' }}>B2</span>
        </div>
        <div style={{ height: 2, width: 36, background: `linear-gradient(to right, ${primary}, transparent)`, marginBottom: 5, borderRadius: 1 }} />
        <p style={{ fontSize: 12, color: muted, margin: 0 }}>7 days strong — you&apos;re building a real habit.</p>
      </div>
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '12px 14px', marginBottom: 10 }}>
        <div style={{ display: 'flex', gap: 24, marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 26, fontWeight: 900, color: streakColor, lineHeight: 1 }}>7</div>
            <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>day streak</div>
          </div>
          <div>
            <div style={{ fontSize: 26, fontWeight: 900, color: '#111', lineHeight: 1 }}>12</div>
            <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>of 85 mastered</div>
          </div>
        </div>
        <div style={{ height: 7, borderRadius: 99, background: '#f3f4f6', overflow: 'hidden', display: 'flex', gap: 2 }}>
          <div style={{ width: '14%', background: primary, borderRadius: '99px 0 0 99px' }} />
          <div style={{ width: '21%', background: warm }} />
        </div>
        <div style={{ fontSize: 10, color: '#9ca3af', textAlign: 'right', marginTop: 4 }}>12 mastered · 18 in progress · 55 to start</div>
      </div>
      <div style={{ background: primary, borderRadius: 14, padding: '14px 16px', marginBottom: 8 }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', marginBottom: 6 }}>Review</div>
        <div style={{ fontSize: 17, fontWeight: 700, color: reviewText, marginBottom: 12 }}>5 concepts due today</div>
        <button style={{ background: reviewText, color: primary, border: 'none', borderRadius: 99, padding: '9px 0', width: '100%', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Start review →</button>
      </div>
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderLeft: `4px solid ${primary}`, borderRadius: 14, padding: '14px 16px', marginBottom: 8 }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: muted, marginBottom: 6 }}>Learn new</div>
        <div style={{ fontSize: 17, fontWeight: 700, color: '#111', marginBottom: 12 }}>55 concepts waiting</div>
        <button style={{ background: primary, color: surface, border: 'none', borderRadius: 99, padding: '9px 0', width: '100%', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Start learning →</button>
      </div>
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderLeft: `4px solid ${warm}`, borderRadius: 14, padding: '14px 16px' }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: muted, marginBottom: 6 }}>Free write</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#111', marginBottom: 3 }}>aunque + subjunctive</div>
        <div style={{ fontSize: 11, color: muted, marginBottom: 12 }}>Worth some extra time today</div>
        <button style={{ background: 'transparent', color: primary, border: `1.5px solid ${primary}`, borderRadius: 99, padding: '8px 0', width: '100%', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Write about this →</button>
      </div>
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
            <div style={{ fontFamily: 'var(--font-cormorant), serif', fontWeight: 600, fontSize: 36, letterSpacing: '0.12em', color: D1.primary, lineHeight: 1.1 }}>Senda</div>
            <div style={{ fontSize: 13, color: '#6b7280', marginTop: 6, maxWidth: 260, lineHeight: 1.5 }}>The defining mark of written Spanish — a single calligraphic accent as the entire brand.</div>
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
        <ExerciseContext
          colors={{ primary: D1.primary, warm: D1.warm }}
          border={`1.5px solid ${D1.warm}`}
          inputBg={D1.surface}
          labelColor={D1.muted}
          submitBg={D1.primary}
          submitText={D1.accent}
          scoreBorder={`1.5px solid ${D1.primary}`}
          scoreChipBg={D1.primary}
          scoreChipText={D1.accent}
        />
      </Section>
      <Section label="Dashboard Page">
        <PhoneFrame bg="#ffffff" bottomNav={<BottomNav items={NAV_ITEMS} active="home" activeColor={D1.primary} activeBg={D1.surface} />}>
          <DashboardContent primary={D1.primary} streakColor={D1.primary} warm={D1.warm} surface={D1.accent} muted={D1.muted} reviewText={D1.accent} />
        </PhoneFrame>
      </Section>
      <Section label="Curriculum Page">
        <PhoneFrame bg="#ffffff" bottomNav={<BottomNav items={NAV_ITEMS} active="list" activeColor={D1.primary} activeBg={D1.surface} />}>
          <CurriculumContent primary={D1.primary} underline={D1.primary} chipActiveBg={D1.primary} chipActiveText="#fff" />
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
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ color: D2.gold, fontSize: 28, lineHeight: 1 }}>~</span>
              <span style={{ fontFamily: 'var(--font-cormorant), serif', fontWeight: 700, fontSize: 36, color: D2.primary, lineHeight: 1.1 }}>Senda</span>
            </div>
            <div style={{ fontSize: 13, color: '#6b7280', marginTop: 6, maxWidth: 260, lineHeight: 1.5 }}>The Ñ icon as cultural signal; the gold tilde as brand punctuation — ownable, unmistakably Spanish.</div>
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
        <ExerciseContext
          colors={{ primary: D2.primary, warm: D2.blue }}
          border={`1.5px solid ${D2.primary}`}
          inputBg={D2.cream}
          labelColor={D2.primary}
          submitBg={D2.primary}
          submitText={D2.cream}
          scoreBorder={`1.5px solid ${D2.gold}`}
          scoreChipBg={D2.gold}
          scoreChipText={D2.primary}
        />
      </Section>
      <Section label="Dashboard Page">
        <PhoneFrame bg="#ffffff" bottomNav={<BottomNav items={NAV_ITEMS} active="home" activeColor={D2.primary} activeBg="#EEF2FB" />}>
          <DashboardContent primary={D2.primary} streakColor={D2.gold} warm={D2.blue} surface={D2.cream} muted="#4b5563" reviewText={D2.cream} h1Font="var(--font-cormorant), serif" />
        </PhoneFrame>
      </Section>
      <Section label="Curriculum Page">
        <PhoneFrame bg="#ffffff" bottomNav={<BottomNav items={NAV_ITEMS} active="list" activeColor={D2.primary} activeBg="#EEF2FB" />}>
          <CurriculumContent primary={D2.primary} gold={D2.gold} underline={D2.primary} chipActiveBg={D2.primary} chipActiveText="#fff" />
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
            <div style={{ fontFamily: 'var(--font-dm-serif), serif', fontStyle: 'italic', fontSize: 36, color: D3.ink, lineHeight: 1.1 }}>Senda</div>
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
        <ExerciseContext
          colors={{ primary: D3.ink, warm: D3.mid }}
          border={`1.5px solid ${D3.ink}`}
          inputBg={D3.paper}
          labelColor={D3.mid}
          submitBg={D3.ink}
          submitText={D3.paper}
          scoreBorder={`1.5px solid ${D3.accent}`}
          scoreChipBg={D3.accent}
          scoreChipText={D3.paper}
        />
      </Section>
      <Section label="Dashboard Page">
        <PhoneFrame bg="#ffffff" bottomNav={<BottomNav items={NAV_ITEMS} active="home" activeColor={D3.accent} activeBg="#ece6dc" />}>
          <DashboardContent primary={D3.ink} streakColor={D3.accent} warm={D3.mid} surface={D3.paper} muted={D3.mid} reviewText={D3.paper} h1Font="var(--font-dm-serif), serif" />
        </PhoneFrame>
      </Section>
      <Section label="Curriculum Page">
        <PhoneFrame bg="#ffffff" bottomNav={<BottomNav items={NAV_ITEMS} active="list" activeColor={D3.accent} activeBg="#ece6dc" />}>
          <CurriculumContent primary={D3.ink} underline={D3.accent} chipActiveBg={D3.ink} chipActiveText={D3.paper} />
        </PhoneFrame>
      </Section>
    </div>
  )
}

function Direction4Panel() {
  return (
    <div>
      <Section label="Icon + Wordmark + Concept">
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <D4Icon />
          <div>
            <div style={{ fontFamily: 'var(--font-plus-jakarta), sans-serif', fontWeight: 600, fontSize: 36, letterSpacing: '-0.03em', color: D4.forest, lineHeight: 1.1 }}>senda</div>
            <div style={{ fontSize: 13, color: '#6b7280', marginTop: 6, maxWidth: 260, lineHeight: 1.5 }}>A single winding trail — the S as initial and as path. Earthy, confident, forward-moving.</div>
          </div>
        </div>
      </Section>
      <Section label="Colour Palette">
        <PaletteRow palette={[
          { hex: D4.forest,    token: 'Brand Forest' },
          { hex: D4.sage,      token: 'Brand Sage' },
          { hex: D4.parchment, token: 'Brand Parchment' },
          { hex: D4.ochre,     token: 'Brand Ochre' },
          { hex: D4.muted,     token: 'Brand Muted' },
        ]} />
      </Section>
      <Section label="Desktop Sidebar Navigation">
        <D4SideNav />
      </Section>
      <Section label="Exercise in App Context">
        <ExerciseContext
          colors={{ primary: D4.forest, warm: D4.sage }}
          border={`1.5px solid ${D4.forest}`}
          inputBg={D4.parchment}
          labelColor={D4.muted}
          submitBg={D4.forest}
          submitText={D4.parchment}
          scoreBorder={`1.5px solid ${D4.ochre}`}
          scoreChipBg={D4.ochre}
          scoreChipText="#fff"
          font="var(--font-plus-jakarta), sans-serif"
        />
      </Section>
      <Section label="Dashboard Page">
        <PhoneFrame bg="#ffffff" bottomNav={<BottomNav items={NAV_ITEMS} active="home" activeColor={D4.forest} activeBg="#eaf2ea" />}>
          <DashboardContent primary={D4.forest} streakColor={D4.ochre} warm={D4.sage} surface={D4.parchment} muted={D4.muted} reviewText={D4.parchment} h1Font="var(--font-plus-jakarta), sans-serif" />
        </PhoneFrame>
      </Section>
      <Section label="Curriculum Page">
        <PhoneFrame bg="#ffffff" bottomNav={<BottomNav items={NAV_ITEMS} active="list" activeColor={D4.forest} activeBg="#eaf2ea" />}>
          <CurriculumContent primary={D4.forest} gold={D4.ochre} underline={D4.forest} chipActiveBg={D4.forest} chipActiveText="#fff" tabFont="var(--font-plus-jakarta), sans-serif" />
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
  { id: 4, label: 'Direction 4: La Senda' },
]

export function BrandPreviewClient() {
  const [active, setActive] = useState(1)

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '20px 40px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: 4 }}>
          Brand Identity Preview — Senda
        </div>
        <div style={{ fontSize: 14, color: '#6b7280' }}>
          Four directions. One decision. Delete this page after choosing.
        </div>
      </div>
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
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '40px 40px' }}>
        {active === 1 && <Direction1Panel />}
        {active === 2 && <Direction2Panel />}
        {active === 3 && <Direction3Panel />}
        {active === 4 && <Direction4Panel />}
      </div>
    </div>
  )
}
