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

function BottomNav({ items, active, activeColor, activeBg, bg = '#ffffff', borderColor = '#e5e7eb' }: {
  items: { id: NavId; label: string }[]
  active: NavId
  activeColor: string
  activeBg: string
  bg?: string
  borderColor?: string
}) {
  return (
    <div style={{ height: 54, borderTop: `1px solid ${borderColor}`, display: 'flex', background: bg, flexShrink: 0 }}>
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

// ─── D5 data interface ────────────────────────────────────────────────────────

export interface D5ModuleData {
  title: string
  state: 'mastered' | 'active' | 'upcoming'
  total: number
  mastered: number
  studied: number
}

export interface D5Data {
  displayName: string
  level: string
  dueCount: number
  totalConcepts: number
  masteredCount: number
  modules: D5ModuleData[]
  writeConcept?: { id: string; title: string } | null
}

export interface D5ProgressData {
  streak: number
  masteredCount: number
  totalConcepts: number
  level: string
  overallAccuracy: number
  totalAttempts: number
  totalMinutes: number
  cefrData: Array<{ level: string; mastered: number; total: number }>
  tenseMastery: Array<{ tense: string; label: string; pct: number; attempts: number }>
}

export interface D5ConceptData {
  id: string
  title: string
  explanation: string
  level: string
  intervalDays: number
  exercises: Array<{ id: string; type: string; prompt: string }>
}

export interface D5VerbData {
  infinitive: string
  english: string
  tenseData: Array<{
    tense: string
    label: string
    rows: Array<{ pronoun: string; form: string }>
    masteryPct: number | null
    attempts: number
  }>
}

// ─── Colour tokens ─────────────────────────────────────────────────────────────

const D1 = { primary: '#9B3422', warm: '#C4522E', surface: '#FFF8EE', accent: '#F5EDD8', muted: '#6B3020' }
const D2 = { primary: '#1B3A6B', gold: '#D4A84B', cream: '#F2E8D0', blue: '#2E5BA8', muted: '#8BA3C7' }
const D3 = { ink: '#1A1108', paper: '#FEFBF4', mid: '#8C6A3F', accent: '#C4522E', muted: '#B8AA99' }
const D4 = { forest: '#2C5F2E', sage: '#5A8F60', parchment: '#F7F3EC', ochre: '#C9922A', muted: '#7A9E7D' }
const D5 = { ink: '#1A1108', paper: '#FDFCF9', warm: '#8C6A3F', terracotta: '#C4522E', muted: '#B8AA99', warmCream: '#E8E6E1' }
const D5_CURRICULUM_CONCEPTS = [
  { title: 'aunque + subjunctive vs indicative', level: 'B1', state: 'Mastered', sc: '#1A1108', sb: '#B8AA99' },
  { title: 'sin embargo vs. no obstante',        level: 'B1', state: 'New',      sc: '#8C6A3F', sb: 'transparent' },
  { title: 'a pesar de (que)',                   level: 'B2', state: 'Learning', sc: '#FEFBF4', sb: '#C4522E' },
]

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

function D5Icon() {
  return (
    <svg viewBox="0 0 100 100" width={128} height={128} style={{ display: 'block', borderRadius: 22, border: '1px solid #e5d5c5' }}>
      <rect width="100" height="100" fill={D5.paper} />
      <path
        d="M 30 82 C 10 80, 4 64, 16 52 C 28 40, 56 44, 68 34 C 80 24, 84 10, 72 6"
        stroke={D5.terracotta}
        strokeWidth={18}
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

function D5SideNav() {
  return (
    <div style={{ background: D5.paper, border: `1px solid ${D5.muted}60`, borderRadius: 12, padding: 12, width: 180 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, paddingBottom: 10, borderBottom: `1px solid ${D5.muted}50` }}>
        <svg viewBox="0 0 24 24" width={20} height={20} style={{ flexShrink: 0 }}>
          <path d="M 7 20 C 3 19, 1 15, 4 12 C 7 9, 15 11, 18 8 C 21 5, 21 1, 17 2"
            stroke={D5.terracotta} strokeWidth={3} strokeLinecap="round" fill="none" />
        </svg>
        <span style={{ fontFamily: 'var(--font-dm-serif), serif', fontStyle: 'italic', fontSize: 18, color: D5.ink }}>Senda</span>
      </div>
      {[{ label: 'Dashboard', active: true }, { label: 'Study', active: false }].map((item) => (
        <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, marginBottom: 4, background: item.active ? `${D5.muted}25` : 'transparent', color: item.active ? D5.terracotta : D5.warm, fontWeight: item.active ? 600 : 400, fontSize: 14 }}>
          <span style={{ width: 3, height: 16, borderRadius: 2, background: item.active ? D5.terracotta : 'transparent', flexShrink: 0 }} />
          {item.label}
        </div>
      ))}
    </div>
  )
}

// ─── Exercise in context ──────────────────────────────────────────────────────

function ExerciseContext({ colors, border, inputBg, labelColor, submitBg, submitText, scoreBorder, scoreChipBg, scoreChipText, font, tildeColor, scoreLabel = '3 / 3 · Correct' }: {
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
  tildeColor?: string
  scoreLabel?: string
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
          <span style={{ background: scoreChipBg, color: scoreChipText, fontSize: 11, fontWeight: 700, padding: '3px 12px', borderRadius: 99, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            {tildeColor && (
              <svg viewBox="0 0 38 16" width={38} height={16} style={{ flexShrink: 0 }}>
                {/* Calligraphic virgulilla — senda_tilde_success */}
                <path d="M 2 11 C 8 3, 16 3, 20 8 C 24 13, 32 13, 38 5"
                  stroke={tildeColor} strokeWidth={2.8} strokeLinecap="round" fill="none" />
              </svg>
            )}
            {scoreLabel}
          </span>
        </div>
        <p style={{ fontSize: 12, color: '#374151', margin: 0, lineHeight: 1.55 }}>
          &ldquo;fuera&rdquo; is the imperfect subjunctive — correct here because the <em>aunque</em> clause concedes a real past fact.
        </p>
      </div>
    </div>
  )
}

// ─── Shared curriculum content (parameterised) ───────────────────────────────

function CurriculumContent({ primary, gold, underline, chipActiveBg, chipActiveText, moduleTitle, tabFont, concepts = CURRICULUM_CONCEPTS }: {
  primary: string; gold?: string; underline: string
  chipActiveBg: string; chipActiveText: string
  moduleTitle?: string; tabFont?: string
  concepts?: { title: string; level: string; state: string; sc: string; sb: string }[]
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
          {concepts.map((c, i) => (
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

// ─── Direction 5 — Senda Craft ────────────────────────────────────────────────

function WindingPathSeparator({ dark = false }: { dark?: boolean }) {
  return (
    <div style={{ padding: '0 12px', margin: '8px 0' }}>
      <svg viewBox="0 0 354 30" width="100%" height={30} style={{ display: 'block', overflow: 'visible' }}>
        {/* Calligraphic path separator — asymmetric cubic beziers, varied stroke weight */}
        <path
          d="M 4 20 C 55 6, 115 26, 177 16 C 235 7, 295 22, 350 12"
          stroke={dark ? D5.muted : D5.warm}
          strokeWidth={1.2}
          strokeLinecap="round"
          fill="none"
          opacity={dark ? 0.35 : 0.50}
        />
        {/* Subtle echo stroke — thicker, lower opacity, for depth */}
        <path
          d="M 4 20 C 55 6, 115 26, 177 16 C 235 7, 295 22, 350 12"
          stroke={dark ? D5.muted : D5.warm}
          strokeWidth={3}
          strokeLinecap="round"
          fill="none"
          opacity={dark ? 0.06 : 0.10}
        />
      </svg>
    </div>
  )
}

function BackgroundMagicS({ opacity = 0.07 }: { opacity?: number }) {
  return (
    <svg viewBox="0 0 200 260" width={200} height={260}
      style={{ position: 'absolute', right: -30, top: -10, opacity, pointerEvents: 'none' } as React.CSSProperties}>
      <path
        d="M 80 230 C 20 220, 0 185, 28 158 C 56 131, 130 138, 158 110 C 186 82, 192 42, 158 20"
        stroke={D5.muted}
        strokeWidth={44}
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}

function D5DashboardLight({ data }: { data?: D5Data | null }) {
  const grot  = 'var(--font-plus-jakarta), system-ui, sans-serif'
  const serif = 'var(--font-dm-serif), serif'

  const name          = data?.displayName ?? 'Nicolás'
  const level         = data?.level ?? 'B2'
  const dueCount      = data?.dueCount ?? 5
  const practiceCount = data ? data.totalConcepts - data.masteredCount : 55
  const writeConcept  = data !== undefined ? data?.writeConcept : { id: 'x', title: 'aunque + subjunctive' }

  // Humanized SRS copy
  const srsHeading = dueCount > 0
    ? `Ready for Review: ${dueCount} Key Concept${dueCount !== 1 ? 's' : ''}`
    : 'Todo al día en tu Senda hoy.'
  const srsSubtext = dueCount > 0
    ? 'Maintain your foundation with a quick sprint.'
    : 'Perfecto — vuelve mañana o explora a tu ritmo.'

  // Curriculum preview rows (up to 3)
  const curriculumRows = data?.modules.slice(0, 3).map(m => ({
    title:      m.title,
    state:      m.state === 'mastered' ? 'Completado' : m.state === 'active' ? 'En Progreso' : 'Próximamente',
    stateBg:    m.state === 'mastered' ? `${D5.muted}30` : m.state === 'active' ? D5.terracotta : 'transparent',
    stateColor: m.state === 'mastered' ? D5.warm : m.state === 'active' ? D5.paper : `${D5.ink}35`,
    faded:      m.state === 'upcoming',
  })) ?? [
    { title: 'Conectores del Discurso', state: 'Completado',   stateBg: `${D5.muted}30`, stateColor: D5.warm,       faded: false },
    { title: 'El Subjuntivo: Matices',  state: 'En Progreso',  stateBg: D5.terracotta,   stateColor: D5.paper,      faded: false },
    { title: 'Tiempos del Pasado',      state: 'Próximamente', stateBg: 'transparent',   stateColor: `${D5.ink}35`, faded: true  },
  ]

  return (
    <div style={{ padding: 0, background: D5.paper, minHeight: '100%', fontFamily: grot }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px 8px' }}>
        <svg viewBox="0 0 24 24" width={26} height={26}>
          <path d="M 7 20 C 3 19, 1 15, 4 12 C 7 9, 15 11, 18 8 C 21 5, 21 1, 17 2"
            stroke={D5.terracotta} strokeWidth={3.5} strokeLinecap="round" fill="none" />
        </svg>
        <div style={{ width: 30, height: 30, borderRadius: '50%', background: `${D5.ink}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: `${D5.ink}55`, fontSize: 11, fontWeight: 700, fontFamily: grot }}>
          {name.slice(0, 2).toUpperCase()}
        </div>
      </div>
      {/* Greeting */}
      <div style={{ padding: '8px 18px 12px' }}>
        <div style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 24, color: D5.ink, lineHeight: 1.2, marginBottom: 8 }}>Hola, {name}.</div>
        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: '#fef9c3', color: '#854d0e', letterSpacing: '0.01em', fontFamily: grot }}>Nivel {level}</span>
      </div>
      <WindingPathSeparator />
      {/* Tu Senda Diaria — elevated surface, no border */}
      <div style={{ margin: '10px 18px', background: 'rgba(140,106,63,0.07)', borderRadius: 20, padding: '16px 18px', boxShadow: '0 2px 24px rgba(26,17,8,0.06)' }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: D5.warm, marginBottom: 10, fontFamily: grot }}>Tu Senda Diaria</div>
        <div style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 16, color: D5.ink, lineHeight: 1.4, marginBottom: 5 }}>{srsHeading}</div>
        <div style={{ fontSize: 11, color: D5.warm, marginBottom: dueCount > 0 ? 16 : 0, lineHeight: 1.5, fontFamily: grot }}>{srsSubtext}</div>
        {dueCount > 0 && (
          <button style={{ background: D5.terracotta, color: D5.paper, border: 'none', borderRadius: 99, padding: '11px 0', width: '100%', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: grot, letterSpacing: '0.01em' }}>Empezar Repaso</button>
        )}
      </div>
      <WindingPathSeparator />
      {/* Exploración Abierta */}
      <div style={{ position: 'relative', margin: '10px 18px', minHeight: 170, overflow: 'hidden' }}>
        <BackgroundMagicS />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: D5.warm, marginBottom: 10, fontFamily: grot }}>Exploración Abierta</div>
          <div style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 16, color: D5.ink, lineHeight: 1.4, marginBottom: 5 }}>
            Tu Práctica: {practiceCount} Concepto{practiceCount !== 1 ? 's' : ''} Esperándote
          </div>
          <div style={{ fontSize: 11, color: D5.warm, marginBottom: 16, lineHeight: 1.5, fontFamily: grot }}>Continúa tu camino con práctica libre.</div>
          <button style={{ background: 'transparent', color: D5.terracotta, border: `1.5px solid ${D5.terracotta}`, borderRadius: 99, padding: '10px 0', width: '100%', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: grot }}>Ir a Práctica Abierta</button>
        </div>
      </div>
      {/* Escritura Libre — only when there's a concept to suggest */}
      {writeConcept && (
        <>
          <WindingPathSeparator />
          <div style={{ margin: '10px 18px', background: 'rgba(140,106,63,0.05)', borderRadius: 20, padding: '16px 18px', boxShadow: '0 2px 16px rgba(26,17,8,0.04)' }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: D5.warm, marginBottom: 10, fontFamily: grot }}>Escritura Libre</div>
            <div style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 16, color: D5.ink, lineHeight: 1.4, marginBottom: 5 }}>{writeConcept.title}</div>
            <div style={{ fontSize: 11, color: D5.warm, marginBottom: 16, lineHeight: 1.5, fontFamily: grot }}>Consolida tu comprensión con escritura libre.</div>
            <button style={{ background: 'transparent', color: D5.terracotta, border: `1.5px solid ${D5.terracotta}`, borderRadius: 99, padding: '10px 0', width: '100%', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: grot }}>Escribir Ahora</button>
          </div>
        </>
      )}
      {/* Sesión Rápida — only when review items exist */}
      {dueCount > 0 && (
        <>
          <WindingPathSeparator />
          <div style={{ margin: '10px 18px', background: 'rgba(140,106,63,0.05)', borderRadius: 20, padding: '16px 18px', boxShadow: '0 2px 16px rgba(26,17,8,0.04)' }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: D5.warm, marginBottom: 10, fontFamily: grot }}>Sesión Rápida</div>
            <div style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 16, color: D5.ink, lineHeight: 1.4, marginBottom: 5 }}>Repasa en 5 minutos</div>
            <div style={{ fontSize: 11, color: D5.warm, marginBottom: 16, lineHeight: 1.5, fontFamily: grot }}>Una sesión corta para mantener el ritmo.</div>
            <button style={{ background: 'transparent', color: D5.terracotta, border: `1.5px solid ${D5.terracotta}`, borderRadius: 99, padding: '10px 0', width: '100%', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: grot }}>Empezar Sprint</button>
          </div>
        </>
      )}
      <WindingPathSeparator />
      {/* Tu Currículo */}
      <div style={{ padding: '10px 18px 18px' }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: D5.warm, marginBottom: 10, fontFamily: grot }}>Tu Currículo</div>
        {curriculumRows.map((c, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0', borderBottom: i < curriculumRows.length - 1 ? `1px solid ${D5.muted}25` : 'none' }}>
            <span style={{ fontSize: 12, color: c.faded ? `${D5.ink}45` : D5.ink, flex: 1, marginRight: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: grot }}>{c.title}</span>
            <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 9px', borderRadius: 99, background: c.stateBg, color: c.stateColor, whiteSpace: 'nowrap', fontFamily: grot }}>{c.state}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function D5DashboardDark({ data }: { data?: D5Data | null }) {
  // Fix 5: Deep Ink #1A1108 bg — explicitly NOT #000 or cool grey
  // Fix 5: Warm Cream #E8E6E1 text — explicitly NOT #FFF
  const cream = '#E8E6E1'  // D5.warmCream
  const bg    = '#1A1108'  // D5.ink — deep brown-black, not pure black
  const grot  = 'var(--font-plus-jakarta), system-ui, sans-serif'
  const serif = 'var(--font-dm-serif), serif'

  const name          = data?.displayName ?? 'Nicolás'
  const level         = data?.level ?? 'B2'
  const dueCount      = data?.dueCount ?? 5
  const practiceCount = data ? data.totalConcepts - data.masteredCount : 55
  const writeConcept  = data !== undefined ? data?.writeConcept : { id: 'x', title: 'aunque + subjunctive' }

  const srsHeading = dueCount > 0
    ? `Ready for Review: ${dueCount} Key Concept${dueCount !== 1 ? 's' : ''}`
    : 'Todo al día en tu Senda hoy.'
  const srsSubtext = dueCount > 0
    ? 'Maintain your foundation with a quick sprint.'
    : 'Perfecto — vuelve mañana o explora a tu ritmo.'

  const curriculumRows = data?.modules.slice(0, 3).map(m => ({
    title:      m.title,
    state:      m.state === 'mastered' ? 'Completado' : m.state === 'active' ? 'En Progreso' : 'Próximamente',
    stateBg:    m.state === 'mastered' ? `${D5.muted}25` : m.state === 'active' ? `${D5.terracotta}d0` : 'transparent',
    stateColor: m.state === 'mastered' ? D5.muted : m.state === 'active' ? D5.paper : `${D5.muted}60`,
    faded:      m.state === 'upcoming',
  })) ?? [
    { title: 'Conectores del Discurso', state: 'Completado',   stateBg: `${D5.muted}25`,      stateColor: D5.muted,        faded: false },
    { title: 'El Subjuntivo: Matices',  state: 'En Progreso',  stateBg: `${D5.terracotta}d0`, stateColor: D5.paper,        faded: false },
    { title: 'Tiempos del Pasado',      state: 'Próximamente', stateBg: 'transparent',        stateColor: `${D5.muted}60`, faded: true  },
  ]
  return (
    <div style={{ padding: 0, background: bg, minHeight: '100%', fontFamily: grot }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px 8px' }}>
        <svg viewBox="0 0 24 24" width={26} height={26}>
          <path d="M 7 20 C 3 19, 1 15, 4 12 C 7 9, 15 11, 18 8 C 21 5, 21 1, 17 2"
            stroke={D5.terracotta} strokeWidth={3.5} strokeLinecap="round" fill="none" />
        </svg>
        <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(232,230,225,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(232,230,225,0.55)', fontSize: 11, fontWeight: 700, fontFamily: grot }}>NI</div>
      </div>
      {/* Greeting */}
      <div style={{ padding: '8px 18px 12px' }}>
        <div style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 24, color: cream, lineHeight: 1.2, marginBottom: 8 }}>Hola, {name}.</div>
        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: 'rgba(254,249,195,0.10)', color: '#fde68a', letterSpacing: '0.01em', fontFamily: grot }}>Nivel {level}</span>
      </div>
      <WindingPathSeparator dark />
      {/* Tu Senda Diaria — elevated surface, no border */}
      <div style={{ margin: '10px 18px', background: 'rgba(140,106,63,0.16)', borderRadius: 20, padding: '16px 18px', boxShadow: '0 2px 24px rgba(0,0,0,0.18)' }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: D5.muted, marginBottom: 10, fontFamily: grot }}>Tu Senda Diaria</div>
        <div style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 16, color: cream, lineHeight: 1.4, marginBottom: 5 }}>{srsHeading}</div>
        <div style={{ fontSize: 11, color: D5.muted, marginBottom: dueCount > 0 ? 16 : 0, lineHeight: 1.5, fontFamily: grot }}>{srsSubtext}</div>
        {dueCount > 0 && (
          <button style={{ background: D5.terracotta, color: D5.paper, border: 'none', borderRadius: 99, padding: '11px 0', width: '100%', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: grot, letterSpacing: '0.01em' }}>Empezar Repaso</button>
        )}
      </div>
      <WindingPathSeparator dark />
      {/* Exploración Abierta */}
      <div style={{ position: 'relative', margin: '10px 18px', minHeight: 170, overflow: 'hidden' }}>
        <BackgroundMagicS opacity={0.04} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: D5.muted, marginBottom: 10, fontFamily: grot }}>Exploración Abierta</div>
          <div style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 16, color: cream, lineHeight: 1.4, marginBottom: 5 }}>
            Tu Práctica: {practiceCount} Concepto{practiceCount !== 1 ? 's' : ''} Esperándote
          </div>
          <div style={{ fontSize: 11, color: D5.muted, marginBottom: 16, lineHeight: 1.5, fontFamily: grot }}>Continúa tu camino con práctica libre.</div>
          <button style={{ background: 'transparent', color: D5.terracotta, border: `1.5px solid ${D5.terracotta}`, borderRadius: 99, padding: '10px 0', width: '100%', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: grot }}>Ir a Práctica Abierta</button>
        </div>
      </div>
      {/* Escritura Libre — only when there's a concept to suggest */}
      {writeConcept && (
        <>
          <WindingPathSeparator dark />
          <div style={{ margin: '10px 18px', background: 'rgba(140,106,63,0.08)', borderRadius: 20, padding: '16px 18px', boxShadow: '0 2px 24px rgba(0,0,0,0.18)' }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: D5.muted, marginBottom: 10, fontFamily: grot }}>Escritura Libre</div>
            <div style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 16, color: cream, lineHeight: 1.4, marginBottom: 5 }}>{writeConcept.title}</div>
            <div style={{ fontSize: 11, color: D5.muted, marginBottom: 16, lineHeight: 1.5, fontFamily: grot }}>Consolida tu comprensión con escritura libre.</div>
            <button style={{ background: 'transparent', color: D5.terracotta, border: `1.5px solid ${D5.terracotta}`, borderRadius: 99, padding: '10px 0', width: '100%', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: grot }}>Escribir Ahora</button>
          </div>
        </>
      )}
      {/* Sesión Rápida — only when review items exist */}
      {dueCount > 0 && (
        <>
          <WindingPathSeparator dark />
          <div style={{ margin: '10px 18px', background: 'rgba(140,106,63,0.08)', borderRadius: 20, padding: '16px 18px', boxShadow: '0 2px 24px rgba(0,0,0,0.18)' }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: D5.muted, marginBottom: 10, fontFamily: grot }}>Sesión Rápida</div>
            <div style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 16, color: cream, lineHeight: 1.4, marginBottom: 5 }}>Repasa en 5 minutos</div>
            <div style={{ fontSize: 11, color: D5.muted, marginBottom: 16, lineHeight: 1.5, fontFamily: grot }}>Una sesión corta para mantener el ritmo.</div>
            <button style={{ background: 'transparent', color: D5.terracotta, border: `1.5px solid ${D5.terracotta}`, borderRadius: 99, padding: '10px 0', width: '100%', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: grot }}>Empezar Sprint</button>
          </div>
        </>
      )}
      <WindingPathSeparator dark />
      {/* Tu Currículo */}
      <div style={{ padding: '10px 18px 18px' }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: D5.muted, marginBottom: 10, fontFamily: grot }}>Tu Currículo</div>
        {curriculumRows.map((c, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0', borderBottom: i < curriculumRows.length - 1 ? `1px solid ${D5.muted}15` : 'none' }}>
            <span style={{ fontSize: 12, color: c.faded ? `${cream}55` : cream, flex: 1, marginRight: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: grot }}>{c.title}</span>
            <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 9px', borderRadius: 99, background: c.stateBg, color: c.stateColor, whiteSpace: 'nowrap', fontFamily: grot }}>{c.state}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const FALLBACK_MODULES: Array<{ title: string; meta: string; state: string; progressPct?: number; progressLabel?: string }> = [
  { title: 'Conectores del Discurso', meta: 'B1 · Indicativo · 23 conceptos',      state: 'mastered' },
  { title: 'El Subjuntivo: Matices',  meta: 'B1–B2 · Subjuntivo · 13 conceptos',   state: 'active',  progressPct: 38, progressLabel: '5 / 13 dominados' },
  { title: 'Tiempos del Pasado',      meta: 'B2 · Indicativo · 11 conceptos',      state: 'upcoming' },
  { title: 'Contrastes Esenciales',   meta: 'B2 · Ambos modos · 12 conceptos',     state: 'upcoming' },
]

function D5CurriculumTimeline({ data }: { data?: D5Data | null }) {
  const modules: Array<{ title: string; meta: string; state: string; progressPct?: number; progressLabel?: string }> =
    data?.modules.map((m, i) => ({
      title:         m.title,
      meta:          `${m.total} conceptos · Módulo ${i + 1}`,
      state:         m.state,
      progressPct:   m.state === 'active' && m.total > 0 ? Math.round((m.mastered / m.total) * 100) : undefined,
      progressLabel: m.state === 'active' ? `${m.mastered} / ${m.total} dominados` : undefined,
    })) ?? FALLBACK_MODULES

  const grot  = 'var(--font-plus-jakarta), system-ui, sans-serif'
  const serif = 'var(--font-dm-serif), serif'
  return (
    <div style={{ padding: 0, background: D5.paper, minHeight: '100%', fontFamily: grot }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px 8px' }}>
        <svg viewBox="0 0 24 24" width={26} height={26}>
          <path d="M 7 20 C 3 19, 1 15, 4 12 C 7 9, 15 11, 18 8 C 21 5, 21 1, 17 2"
            stroke={D5.terracotta} strokeWidth={3.5} strokeLinecap="round" fill="none" />
        </svg>
        <div style={{ width: 30, height: 30, borderRadius: '50%', background: `${D5.ink}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: `${D5.ink}55`, fontSize: 11, fontWeight: 700, fontFamily: grot }}>NI</div>
      </div>

      {/* Title */}
      <div style={{ padding: '4px 18px 22px' }}>
        <div style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 26, color: D5.ink, lineHeight: 1.15, marginBottom: 5 }}>Tu Currículo</div>
        <div style={{ fontSize: 11, color: D5.warm, fontFamily: grot }}>B1 → B2 · Tu camino personal</div>
      </div>

      {/* Timeline — Fix 3: increased node spacing, explicit typography */}
      <div style={{ paddingLeft: 18, paddingRight: 18 }}>
        {modules.map((mod, i) => {
          const isMastered = mod.state === 'mastered'
          const isActive   = mod.state === 'active'
          const isFuture   = mod.state === 'upcoming' || mod.state === 'locked'

          const nodeSize   = isActive ? 16 : 11
          const nodeBg     = isMastered ? D5.muted : D5.paper
          const nodeBorder = isActive ? `3px solid ${D5.terracotta}` : isFuture ? `1.5px solid ${D5.ink}22` : 'none'
          const nodeGlow   = isActive ? `0 0 0 5px ${D5.terracotta}18` : 'none'
          const lineAboveColor = i === 1 ? D5.muted : `${D5.ink}20`
          const lineBelowColor = i === 0 ? D5.muted : `${D5.ink}20`

          return (
            <div key={i} style={{ display: 'flex', alignItems: 'stretch' }}>
              {/* Left gutter: line + node */}
              <div style={{ width: 28, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {i > 0
                  ? <div style={{ width: 2, height: 24, background: lineAboveColor, borderRadius: 2, flexShrink: 0 }} />
                  : <div style={{ height: 4, flexShrink: 0 }} />
                }
                <div style={{ width: nodeSize, height: nodeSize, borderRadius: '50%', background: nodeBg, border: nodeBorder, flexShrink: 0, boxShadow: nodeGlow }} />
                {i < modules.length - 1 && (
                  <div style={{ width: 2, flex: 1, minHeight: 28, background: lineBelowColor, borderRadius: 2 }} />
                )}
              </div>

              {/* Content — Fix 3: paddingBottom 24 → 36 for breathing room */}
              <div style={{ flex: 1, paddingLeft: 16, paddingBottom: i < modules.length - 1 ? 36 : 14 }}>
                {/* Row: title + status chip — chip vertically centered via alignItems center */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <div style={{ flex: 1, marginRight: 8 }}>
                    <div style={{
                      fontSize: isActive ? 15 : 13,
                      fontWeight: isActive ? 700 : (isMastered ? 500 : 400),
                      color: isFuture ? `${D5.ink}40` : D5.ink,
                      lineHeight: 1.35,
                      marginBottom: 2,
                      fontFamily: isActive ? serif : grot,
                      fontStyle: isActive ? 'italic' : 'normal',
                    }}>
                      {mod.title}
                    </div>
                    <div style={{ fontSize: 10, color: isFuture ? `${D5.ink}30` : D5.warm, fontFamily: grot }}>{mod.meta}</div>
                  </div>
                  {/* Status chips — all vertically centered with alignItems: center on parent */}
                  {isMastered && (
                    <span style={{ fontSize: 9, fontWeight: 600, padding: '3px 9px', borderRadius: 99, background: `${D5.muted}30`, color: D5.warm, flexShrink: 0, fontFamily: grot }}>Completado</span>
                  )}
                  {isActive && (
                    <span style={{ fontSize: 9, fontWeight: 700, padding: '3px 9px', borderRadius: 99, background: D5.terracotta, color: D5.paper, flexShrink: 0, fontFamily: grot }}>En Progreso</span>
                  )}
                  {isFuture && (
                    <span style={{ fontSize: 9, color: `${D5.ink}30`, flexShrink: 0, fontFamily: grot }}>Próximamente</span>
                  )}
                </div>
                {isMastered && (
                  <div style={{ height: 3, width: '58%', borderRadius: 99, background: `${D5.muted}35`, overflow: 'hidden', marginTop: 6 }}>
                    <div style={{ width: '100%', height: '100%', background: D5.muted, borderRadius: 99 }} />
                  </div>
                )}
                {isActive && mod.progressPct !== undefined && (
                  <>
                    <div style={{ height: 3, width: '58%', borderRadius: 99, background: `${D5.muted}30`, overflow: 'hidden', marginTop: 6, marginBottom: 4 }}>
                      <div style={{ width: `${mod.progressPct}%`, height: '100%', background: D5.terracotta, borderRadius: 99 }} />
                    </div>
                    <div style={{ fontSize: 10, color: D5.warm, fontFamily: grot }}>{mod.progressLabel}</div>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Path continues hint */}
      <WindingPathSeparator />
      <div style={{ padding: '6px 18px 20px', textAlign: 'center' }}>
        <span style={{ fontSize: 10, color: `${D5.ink}30`, fontFamily: serif, fontStyle: 'italic' }}>tu senda continúa…</span>
      </div>
    </div>
  )
}

// ─── D5 shared level chip helper ───────────────────────────────────────────────

const D5_LEVEL_CHIP: Record<string, { bg: string; text: string }> = {
  B1: { bg: 'rgba(34,197,94,0.12)',   text: '#166534' },
  B2: { bg: 'rgba(245,158,11,0.12)',  text: '#92400e' },
  C1: { bg: 'rgba(139,92,246,0.12)', text: '#4c1d95' },
}

// ─── D5 Progress Page ──────────────────────────────────────────────────────────

function D5ProgressPage({ data }: { data?: D5ProgressData | null }) {
  const grot  = 'var(--font-plus-jakarta), system-ui, sans-serif'
  const serif = 'var(--font-dm-serif), serif'

  const streak   = data?.streak ?? 7
  const mastered = data?.masteredCount ?? 12
  const total    = data?.totalConcepts ?? 85
  const level    = data?.level ?? 'B2'
  const accuracy = data?.overallAccuracy ?? 78
  const attempts = data?.totalAttempts ?? 234
  const minutes  = data?.totalMinutes ?? 420

  const cefrData = data?.cefrData ?? [
    { level: 'B1', mastered: 12, total: 30 },
    { level: 'B2', mastered: 0,  total: 42 },
    { level: 'C1', mastered: 0,  total: 13 },
  ]

  const tenseMastery = data?.tenseMastery ?? [
    { tense: 'imperfect_subjunctive', label: 'Subj. Imperfecto', pct: 42, attempts: 24 },
    { tense: 'future',                label: 'Futuro',           pct: 61, attempts: 18 },
    { tense: 'preterite',             label: 'Indefinido',       pct: 73, attempts: 31 },
  ]

  const chip = D5_LEVEL_CHIP[level]

  return (
    <div style={{ position: 'relative', padding: 0, background: D5.paper, minHeight: '100%', fontFamily: grot, overflow: 'hidden' }}>
      {/* Winding trail watermark — anchors progress to the path metaphor */}
      <div style={{ position: 'absolute', top: '15%', right: -20, opacity: 0.025, pointerEvents: 'none', zIndex: 0 }}>
        <BackgroundMagicS opacity={1} />
      </div>

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px 8px' }}>
          <svg viewBox="0 0 24 24" width={26} height={26}>
            <path d="M 7 20 C 3 19, 1 15, 4 12 C 7 9, 15 11, 18 8 C 21 5, 21 1, 17 2"
              stroke={D5.terracotta} strokeWidth={3.5} strokeLinecap="round" fill="none" />
          </svg>
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: `${D5.ink}08`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: `${D5.ink}50`, fontSize: 11, fontWeight: 700, fontFamily: grot }}>NI</div>
        </div>

        {/* Title — serif italic h1 */}
        <div style={{ padding: '4px 18px 10px' }}>
          <div style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 24, color: D5.ink, lineHeight: 1.15, marginBottom: 4 }}>Tu Progreso</div>
          <div style={{ fontSize: 10, color: D5.muted, fontFamily: grot }}>Nivel {level} · {attempts} ejercicios</div>
        </div>

        <WindingPathSeparator />

        {/* Stats row — surface elevation only, no colour-coded borders */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, padding: '4px 18px 10px' }}>
          <div style={{ background: `rgba(26,17,8,0.04)`, borderRadius: 14, padding: '10px 10px', textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: D5.terracotta, fontFamily: grot, lineHeight: 1 }}>{streak}</div>
            <div style={{ fontSize: 9, color: D5.muted, marginTop: 3, fontFamily: grot, lineHeight: 1.3 }}>días<br/>seguidos</div>
          </div>
          <div style={{ background: `rgba(26,17,8,0.04)`, borderRadius: 14, padding: '10px 10px', textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: D5.ink, fontFamily: grot, lineHeight: 1 }}>{mastered}</div>
            <div style={{ fontSize: 9, color: D5.muted, marginTop: 3, fontFamily: grot, lineHeight: 1.3 }}>de {total}<br/>dominados</div>
          </div>
          <div style={{ background: `rgba(26,17,8,0.04)`, borderRadius: 14, padding: '10px 10px', textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: D5.ink, fontFamily: grot, lineHeight: 1 }}>{accuracy}%</div>
            <div style={{ fontSize: 9, color: D5.muted, marginTop: 3, fontFamily: grot, lineHeight: 1.3 }}>precisión<br/>global</div>
          </div>
        </div>

        <WindingPathSeparator />

        {/* CEFR Journey — text-only level labels, no coloured chip containers */}
        <div style={{ padding: '4px 18px 10px' }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: D5.muted, marginBottom: 12, fontFamily: grot }}>Tu Camino CEFR</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {cefrData.map(({ level: lvl, mastered: m, total: t }) => {
              const pct = t > 0 ? Math.round((m / t) * 100) : 0
              const barColor = lvl === 'B1' ? D5.muted : lvl === 'B2' ? D5.terracotta : `${D5.ink}40`
              return (
                <div key={lvl}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: D5.ink, fontFamily: grot }}>{lvl}</span>
                    <span style={{ fontSize: 10, color: D5.muted, fontFamily: grot }}>{m} / {t} dominados</span>
                  </div>
                  <div style={{ height: 4, borderRadius: 99, background: `${D5.muted}20`, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: barColor, borderRadius: 99 }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

      <WindingPathSeparator />

        {/* Verb tense mastery */}
        <div style={{ padding: '4px 18px 18px' }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: D5.muted, marginBottom: 12, fontFamily: grot }}>Verbos por Tiempo</div>
          {tenseMastery.length === 0 ? (
            <div style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 12, color: D5.muted, lineHeight: 1.5 }}>Completa ejercicios de verbos para ver tu progreso.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {tenseMastery.slice(0, 5).map(({ tense, label, pct, attempts: att }) => (
                <div key={tense}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: 11, color: D5.ink, fontFamily: grot }}>{label}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: D5.ink, fontFamily: grot }}>{pct}%</span>
                  </div>
                  <div style={{ height: 3, borderRadius: 99, background: `${D5.muted}20`, overflow: 'hidden', marginBottom: 2 }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: pct >= 70 ? D5.muted : D5.terracotta, borderRadius: 99 }} />
                  </div>
                  <div style={{ fontSize: 9, color: `${D5.ink}35`, fontFamily: grot }}>{att} intentos</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <WindingPathSeparator />
        <div style={{ padding: '6px 18px 20px', textAlign: 'center' }}>
          <span style={{ fontSize: 10, color: `${D5.ink}25`, fontFamily: serif, fontStyle: 'italic' }}>tu senda continúa…</span>
        </div>
      </div>
    </div>
  )
}

// ─── D5 Study Configure Page ───────────────────────────────────────────────────

function D5StudyConfigurePage({ data }: { data?: D5Data | null }) {
  const grot  = 'var(--font-plus-jakarta), system-ui, sans-serif'
  const serif = 'var(--font-dm-serif), serif'

  const dueCount = data?.dueCount ?? 5
  const modules  = data?.modules ?? [
    { title: 'Conectores del Discurso', state: 'mastered' as const, total: 23, mastered: 23, studied: 23 },
    { title: 'El Subjuntivo: Matices',  state: 'active' as const,   total: 13, mastered: 5,  studied: 9  },
    { title: 'Tiempos del Pasado',      state: 'upcoming' as const, total: 11, mastered: 0,  studied: 0  },
  ]

  const modes = [
    { id: 'srs',      title: 'Repaso Diario',    subtitle: `${dueCount} concepto${dueCount !== 1 ? 's' : ''} pendientes hoy`,  selected: true  },
    { id: 'practice', title: 'Práctica Abierta', subtitle: 'Todo el catálogo · sin límite SRS',                                 selected: false },
    { id: 'mistakes', title: 'Revisar Errores',  subtitle: 'Conceptos donde fallaste',                                          selected: false },
  ]

  const typeLabels = ['Completar', 'Transformación', 'Traducción', 'Constructor', 'Errores', 'Escritura']
  const activeTypes = [0, 1, 2]

  return (
    <div style={{ padding: 0, background: D5.paper, minHeight: '100%', fontFamily: grot }}>
      {/* Header with back */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px 8px' }}>
        <div style={{ fontSize: 11, color: D5.warm, fontFamily: grot, fontWeight: 600 }}>← Inicio</div>
        <svg viewBox="0 0 24 24" width={22} height={22}>
          <path d="M 7 20 C 3 19, 1 15, 4 12 C 7 9, 15 11, 18 8 C 21 5, 21 1, 17 2"
            stroke={D5.terracotta} strokeWidth={3.5} strokeLinecap="round" fill="none" />
        </svg>
        <div style={{ width: 22 }} />
      </div>

      {/* Title */}
      <div style={{ padding: '4px 18px 10px' }}>
        <div style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 22, color: D5.ink, lineHeight: 1.2 }}>Configura tu Sesión</div>
      </div>

      <WindingPathSeparator />

      {/* Mode cards — left accent strip for selected; neutral ink surfaces; no colour clutter */}
      <div style={{ padding: '4px 18px 8px' }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: D5.muted, marginBottom: 8, fontFamily: grot }}>Modo de estudio</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {modes.map(mode => (
            <div key={mode.id} style={{
              borderRadius: 12, padding: '10px 14px',
              background: mode.selected ? `rgba(26,17,8,0.05)` : `rgba(26,17,8,0.02)`,
              borderLeft: mode.selected ? `3px solid ${D5.terracotta}` : '3px solid transparent',
              position: 'relative',
            }}>
              {mode.selected && (
                <div style={{ position: 'absolute', top: 10, right: 12 }}>
                  <svg viewBox="0 0 18 8" width={13} height={6}>
                    <path d="M 1 5 C 4 2, 7 6, 11 4 C 14 2, 17 4, 17 4"
                      stroke={D5.terracotta} strokeWidth={2} strokeLinecap="round" fill="none" />
                  </svg>
                </div>
              )}
              <div style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 14, color: D5.ink, fontWeight: mode.selected ? 600 : 400, marginBottom: 2 }}>{mode.title}</div>
              <div style={{ fontSize: 10, color: mode.selected ? `${D5.ink}60` : D5.muted, fontFamily: grot }}>{mode.subtitle}</div>
            </div>
          ))}
        </div>
      </div>

      <WindingPathSeparator />

      {/* Module selector — neutral ink surfaces; active = ink weight, no terracotta bg */}
      <div style={{ padding: '4px 18px 8px' }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: D5.muted, marginBottom: 8, fontFamily: grot }}>Módulo</div>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
          <div style={{ padding: '5px 12px', borderRadius: 99, background: `rgba(26,17,8,0.08)`, color: D5.ink, fontSize: 10, fontWeight: 700, fontFamily: grot, whiteSpace: 'nowrap', flexShrink: 0 }}>Todos</div>
          {modules.slice(0, 3).map((mod, i) => (
            <div key={i} style={{ padding: '5px 10px', borderRadius: 99, background: `rgba(26,17,8,0.03)`, color: `${D5.ink}60`, fontSize: 10, fontFamily: grot, whiteSpace: 'nowrap', flexShrink: 0, maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {mod.title.split(':')[0].trim()}
            </div>
          ))}
        </div>
      </div>

      {/* Exercise type grid — all neutral; active = dark ink + deeper tint; no colour borders */}
      <div style={{ padding: '4px 18px 8px' }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: D5.muted, marginBottom: 8, fontFamily: grot }}>Tipos de ejercicio</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
          {typeLabels.map((label, i) => (
            <div key={i} style={{
              padding: '7px 8px', borderRadius: 8, textAlign: 'center', fontFamily: grot, fontSize: 9,
              background: activeTypes.includes(i) ? `rgba(26,17,8,0.07)` : `rgba(26,17,8,0.03)`,
              fontWeight: activeTypes.includes(i) ? 700 : 400,
              color: activeTypes.includes(i) ? D5.ink : `${D5.ink}40`,
              borderLeft: activeTypes.includes(i) ? `2px solid ${D5.warm}` : '2px solid transparent',
            }}>
              {label}
            </div>
          ))}
        </div>
      </div>

      <WindingPathSeparator />

      {/* CTA */}
      <div style={{ padding: '8px 18px 20px' }}>
        <button style={{ background: D5.terracotta, color: D5.paper, border: 'none', borderRadius: 99, padding: '13px 0', width: '100%', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: grot }}>
          Empezar Sesión →
        </button>
      </div>
    </div>
  )
}

// ─── D5 Concept Detail Page ────────────────────────────────────────────────────

function D5ConceptDetailPage({ data }: { data?: D5ConceptData | null }) {
  const grot  = 'var(--font-plus-jakarta), system-ui, sans-serif'
  const serif = 'var(--font-dm-serif), serif'

  const title        = data?.title       ?? 'aunque + subjuntivo vs. indicativo'
  const explanation  = data?.explanation ?? 'En español, aunque puede usarse tanto con indicativo como con subjuntivo. Con indicativo presenta un hecho real; con subjuntivo una concesión hipotética o subjetiva.'
  const level        = data?.level       ?? 'B1'
  const intervalDays = data?.intervalDays ?? 3
  const exercises    = data?.exercises   ?? [
    { id: '1', type: 'gap_fill',       prompt: '' },
    { id: '2', type: 'translation',    prompt: '' },
    { id: '3', type: 'transformation', prompt: '' },
  ]

  const uniqueTypes = [...new Set(exercises.map(e => e.type))]
  const typeLabels: Record<string, string> = {
    gap_fill: 'Completar', translation: 'Traducción', transformation: 'Transformación',
    error_correction: 'Errores', sentence_builder: 'Constructor', free_write: 'Escritura',
  }
  const chip = D5_LEVEL_CHIP[level]

  return (
    <div style={{ position: 'relative', padding: 0, background: D5.paper, minHeight: '100%', fontFamily: grot, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '15%', right: -20, opacity: 0.025, pointerEvents: 'none', zIndex: 0 }}><BackgroundMagicS opacity={1} /></div>
      <div style={{ position: 'relative', zIndex: 1 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px 8px' }}>
        <div style={{ fontSize: 11, color: D5.warm, fontFamily: grot, fontWeight: 600 }}>← Currículo</div>
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: `${D5.ink}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: `${D5.ink}55`, fontSize: 11, fontWeight: 700 }}>NI</div>
      </div>

      {/* Level chip + title */}
      <div style={{ padding: '4px 18px 10px' }}>
        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: chip?.bg ?? `${D5.warm}15`, color: chip?.text ?? D5.warm, fontFamily: grot, letterSpacing: '0.01em' }}>{level}</span>
        <div style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 21, color: D5.ink, lineHeight: 1.2, marginTop: 6 }}>{title}</div>
      </div>

      <WindingPathSeparator />

      {/* Explanation card */}
      <div style={{ margin: '4px 18px', background: 'rgba(26,17,8,0.05)', borderRadius: 16, padding: '14px 16px' }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: D5.warm, marginBottom: 8, fontFamily: grot }}>Cómo funciona</div>
        <div style={{ fontSize: 12, color: D5.ink, fontFamily: grot, lineHeight: 1.6, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical' as const }}>
          {explanation}
        </div>
      </div>

      <WindingPathSeparator />

      {/* Exercise types */}
      <div style={{ padding: '0 18px' }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: D5.muted, marginBottom: 8, fontFamily: grot }}>Ejercicios disponibles</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {uniqueTypes.map(type => (
            <span key={type} style={{ fontSize: 10, padding: '4px 10px', borderRadius: 99, border: `1.5px solid ${D5.warm}`, color: D5.warm, fontFamily: grot, fontWeight: 500 }}>
              {typeLabels[type] ?? type}
            </span>
          ))}
        </div>
      </div>

      <WindingPathSeparator />

      {/* SRS interval hint */}
      <div style={{ padding: '0 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 10, color: D5.warm, fontFamily: grot }}>Próxima revisión</div>
        <div style={{ fontSize: 12, fontWeight: 600, color: D5.ink, fontFamily: grot }}>en {intervalDays} día{intervalDays !== 1 ? 's' : ''}</div>
      </div>

      <WindingPathSeparator />

      {/* Buttons */}
      <div style={{ padding: '0 18px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button style={{ background: D5.terracotta, color: D5.paper, border: 'none', borderRadius: 99, padding: '12px 0', width: '100%', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: grot }}>
          Practicar este concepto →
        </button>
        <button style={{ background: 'transparent', color: D5.terracotta, border: `1.5px solid ${D5.terracotta}`, borderRadius: 99, padding: '11px 0', width: '100%', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: grot }}>
          Escritura libre →
        </button>
      </div>
      </div>
    </div>
  )
}

// ─── D5 Verb Detail Page ───────────────────────────────────────────────────────

function D5VerbDetailPage({ data }: { data?: D5VerbData | null }) {
  const grot  = 'var(--font-plus-jakarta), system-ui, sans-serif'
  const serif = 'var(--font-dm-serif), serif'

  const FALLBACK_ROWS = [
    { pronoun: 'yo',       form: 'soy'    },
    { pronoun: 'tú',       form: 'eres'   },
    { pronoun: 'él/ella',  form: 'es'     },
    { pronoun: 'nosotros', form: 'somos'  },
    { pronoun: 'vosotros', form: 'sois'   },
    { pronoun: 'ellos',    form: 'son'    },
  ]

  const infinitive = data?.infinitive ?? 'ser'
  const english    = data?.english    ?? 'to be'
  const firstTense = data?.tenseData?.[0]
  const tenseLabel = firstTense?.label ?? 'Presente de Indicativo'
  const rows       = (firstTense?.rows?.length ? firstTense.rows : FALLBACK_ROWS)
  const masteryPct = firstTense?.masteryPct ?? null
  const attemptCount = firstTense?.attempts ?? 0

  const tenseTabs = data?.tenseData?.slice(0, 5).map(t =>
    t.label.length > 14 ? t.label.slice(0, 13) + '…' : t.label
  ) ?? ['Presente', 'Indefinido', 'Imperfecto', 'Futuro', 'Subj. Pres.']

  const pronounDisplay: Record<string, string> = {
    'yo': 'yo', 'tú': 'tú', 'él/ella': 'él/ella/Ud.',
    'nosotros': 'nosotros/as', 'vosotros': 'vosotros/as', 'ellos': 'ellos/as',
  }

  return (
    <div style={{ padding: 0, background: D5.paper, minHeight: '100%', fontFamily: grot }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px 8px' }}>
        <div style={{ fontSize: 11, color: D5.warm, fontFamily: grot, fontWeight: 600 }}>← Verbos</div>
        <svg viewBox="0 0 24 24" width={18} height={18} fill="none">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
            stroke={D5.terracotta} strokeWidth={1.5} />
        </svg>
      </div>

      {/* Verb heading */}
      <div style={{ padding: '4px 18px 8px' }}>
        <div style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 30, color: D5.terracotta, lineHeight: 1.1, marginBottom: 2 }}>{infinitive}</div>
        <div style={{ fontSize: 13, color: D5.warm, fontFamily: grot }}>{english}</div>
      </div>

      <WindingPathSeparator />

      {/* Tense tab selector */}
      <div style={{ padding: '4px 18px 10px' }}>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
          {tenseTabs.map((label, i) => (
            <div key={i} style={{
              padding: '5px 10px', borderRadius: 99, flexShrink: 0, fontSize: 9, fontFamily: grot, whiteSpace: 'nowrap',
              background: i === 0 ? D5.terracotta : 'transparent',
              color: i === 0 ? D5.paper : D5.warm,
              border: i === 0 ? 'none' : `1.5px solid ${D5.muted}40`,
              fontWeight: i === 0 ? 700 : 400,
            }}>
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* Conjugation table */}
      <div style={{ margin: '0 18px 6px', background: 'rgba(26,17,8,0.025)', borderRadius: 14, padding: '4px 14px', overflow: 'hidden' }}>
        {rows.map((row, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', padding: '8px 2px',
            borderBottom: i < rows.length - 1 ? `1px solid ${D5.muted}15` : 'none',
            background: i % 2 === 1 ? `rgba(140,106,63,0.03)` : 'transparent',
          }}>
            <div style={{ width: 82, fontSize: 11, color: D5.muted, fontFamily: grot, flexShrink: 0 }}>
              {pronounDisplay[row.pronoun] ?? row.pronoun}
            </div>
            <div style={{ fontSize: 14, fontFamily: serif, fontStyle: 'italic', color: D5.ink, flex: 1 }}>
              {row.form || '—'}
            </div>
          </div>
        ))}
      </div>

      <WindingPathSeparator />

      {/* Mastery bar */}
      <div style={{ padding: '0 18px' }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: D5.muted, marginBottom: 8, fontFamily: grot }}>Tu Dominio · {tenseLabel}</div>
        {masteryPct !== null ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <span style={{ fontSize: 10, color: D5.warm, fontFamily: grot }}>{attemptCount} intentos</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: D5.ink, fontFamily: grot }}>{masteryPct}%</span>
            </div>
            <div style={{ height: 5, borderRadius: 99, background: `${D5.muted}25`, overflow: 'hidden' }}>
              <div style={{ width: `${masteryPct}%`, height: '100%', background: masteryPct >= 70 ? D5.muted : D5.terracotta, borderRadius: 99 }} />
            </div>
          </>
        ) : (
          <div style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 12, color: D5.warm, lineHeight: 1.5 }}>
            Sin datos aún — practica para ver tu progreso.
          </div>
        )}
      </div>

      <WindingPathSeparator />

      {/* CTA */}
      <div style={{ padding: '0 18px 20px' }}>
        <button style={{ background: D5.terracotta, color: D5.paper, border: 'none', borderRadius: 99, padding: '12px 0', width: '100%', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: grot }}>
          Practicar {infinitive} →
        </button>
      </div>
    </div>
  )
}

// ─── D5 Exercise Full Screen (two frames: answering + feedback) ────────────────

function D5ExerciseFullScreen() {
  const grot  = 'var(--font-plus-jakarta), system-ui, sans-serif'
  const serif = 'var(--font-dm-serif), serif'

  const Tilde = () => (
    <svg viewBox="0 0 48 20" width={48} height={20}>
      <path d="M 3 14 C 10 4, 18 18, 24 12 C 30 6, 38 16, 45 10"
        stroke={D5.terracotta} strokeWidth={2.5} strokeLinecap="round" fill="none" />
    </svg>
  )

  const SharedHeader = ({ dotsComplete }: { dotsComplete: boolean }) => (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px 8px' }}>
        <svg viewBox="0 0 24 24" width={22} height={22}>
          <path d="M 7 20 C 3 19, 1 15, 4 12 C 7 9, 15 11, 18 8 C 21 5, 21 1, 17 2"
            stroke={D5.terracotta} strokeWidth={3.5} strokeLinecap="round" fill="none" />
        </svg>
        <div style={{ fontSize: 11, color: D5.muted, fontFamily: grot }}>10 / 10</div>
      </div>
      <div style={{ padding: '2px 18px 8px', display: 'flex', gap: 4 }}>
        {Array.from({ length: 10 }, (_, i) => (
          <div key={i} style={{ flex: 1, height: 4, borderRadius: 99, background: (!dotsComplete && i === 9) ? `${D5.muted}30` : D5.terracotta }} />
        ))}
      </div>
    </>
  )

  return (
    <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
      {/* Frame A — Answering */}
      <PhoneFrame bg={D5.paper} bottomNav={<div style={{ height: 0 }} />}>
        <div style={{ padding: 0, background: D5.paper, minHeight: '100%', fontFamily: grot }}>
          <SharedHeader dotsComplete={false} />
          <WindingPathSeparator />
          <div style={{ margin: '8px 18px', background: '#fff', border: `1px solid ${D5.muted}30`, borderRadius: 20, padding: '16px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: D5.terracotta, fontFamily: grot }}>Completar Hueco</span>
              <span style={{ width: 3, height: 3, borderRadius: '50%', background: `${D5.muted}50`, display: 'inline-block' }} />
              <span style={{ fontSize: 9, color: D5.muted, fontFamily: grot }}>aunque + subjuntivo</span>
            </div>
            <div style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 15, color: D5.ink, lineHeight: 1.55, marginBottom: 14 }}>
              Aunque el examen _____ difícil, todos aprobaron.
            </div>
            <div style={{ border: `1.5px dashed ${D5.muted}60`, borderRadius: 8, height: 40, background: D5.paper, display: 'flex', alignItems: 'center', padding: '0 12px' }}>
              <span style={{ fontSize: 12, color: `${D5.muted}80`, fontFamily: grot, fontStyle: 'italic' }}>escribe la forma correcta…</span>
            </div>
          </div>
          <div style={{ padding: '8px 18px' }}>
            <span style={{ fontSize: 11, color: D5.warm, fontFamily: grot }}>💡 ¿indicativo o subjuntivo?</span>
          </div>
          <WindingPathSeparator />
          <div style={{ padding: '8px 18px 20px' }}>
            <button style={{ background: D5.terracotta, color: D5.paper, border: 'none', borderRadius: 99, padding: '13px 0', width: '100%', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: grot }}>
              Confirmar →
            </button>
          </div>
        </div>
      </PhoneFrame>

      {/* Frame B — Feedback */}
      <PhoneFrame bg={D5.paper} bottomNav={<div style={{ height: 0 }} />}>
        <div style={{ padding: 0, background: D5.paper, minHeight: '100%', fontFamily: grot }}>
          <SharedHeader dotsComplete={true} />
          <WindingPathSeparator />
          <div style={{ margin: '8px 18px', background: 'rgba(196,82,46,0.06)', borderRadius: 20, padding: '20px 16px', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
              <Tilde />
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: D5.terracotta, color: D5.paper, borderRadius: 99, padding: '4px 14px', fontSize: 11, fontWeight: 700, fontFamily: grot, marginBottom: 14 }}>
              3 / 3 · Correcto
            </div>
            <div style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 22, color: D5.terracotta, marginBottom: 14 }}>fuera</div>
            <div style={{ height: 1, background: `${D5.muted}25`, marginBottom: 12 }} />
            <div style={{ fontSize: 12, color: D5.ink, fontFamily: grot, lineHeight: 1.6, textAlign: 'left' }}>
              <span style={{ fontFamily: serif, fontStyle: 'italic' }}>Fuera</span> es el imperfecto de subjuntivo — correcto porque <span style={{ fontFamily: serif, fontStyle: 'italic' }}>aunque</span> concede un hecho pasado hipotético.
            </div>
          </div>
          <WindingPathSeparator />
          <div style={{ padding: '8px 18px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button style={{ background: D5.terracotta, color: D5.paper, border: 'none', borderRadius: 99, padding: '13px 0', width: '100%', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: grot }}>
              Siguiente →
            </button>
            <button style={{ background: 'transparent', color: D5.terracotta, border: `1.5px solid ${D5.terracotta}`, borderRadius: 99, padding: '10px 0', width: '100%', fontWeight: 600, fontSize: 12, cursor: 'pointer', fontFamily: grot }}>
              Intentar de nuevo
            </button>
          </div>
        </div>
      </PhoneFrame>
    </div>
  )
}

// ─── D5 Account Page ───────────────────────────────────────────────────────────

function D5AccountPage() {
  const grot  = 'var(--font-plus-jakarta), system-ui, sans-serif'
  const serif = 'var(--font-dm-serif), serif'

  return (
    <div style={{ position: 'relative', padding: 0, background: D5.paper, minHeight: '100%', fontFamily: grot, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '5%', right: -20, opacity: 0.025, pointerEvents: 'none', zIndex: 0 }}><BackgroundMagicS opacity={1} /></div>
      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px 8px' }}>
          <div style={{ fontSize: 11, color: D5.warm, fontWeight: 600, fontFamily: grot }}>← Inicio</div>
          <svg viewBox="0 0 24 24" width={22} height={22}>
            <path d="M 7 20 C 3 19, 1 15, 4 12 C 7 9, 15 11, 18 8 C 21 5, 21 1, 17 2"
              stroke={D5.terracotta} strokeWidth={3.5} strokeLinecap="round" fill="none" />
          </svg>
          <div style={{ width: 22 }} />
        </div>

        {/* Title + Avatar */}
        <div style={{ padding: '4px 18px 14px' }}>
          <div style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 22, color: D5.ink, lineHeight: 1.2, marginBottom: 14 }}>Mi Cuenta</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: `${D5.ink}08`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: `${D5.ink}40`, fontSize: 15, fontWeight: 700, fontFamily: grot }}>NI</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: D5.ink, fontFamily: grot }}>Nicolás Illg</div>
              <div style={{ fontSize: 11, color: D5.muted, marginTop: 2, fontFamily: grot }}>nicolas@example.com</div>
            </div>
          </div>
        </div>

        <WindingPathSeparator />

        {/* Profile fields — bottom-border-only inputs */}
        <div style={{ padding: '4px 18px 12px' }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: D5.muted, marginBottom: 14, fontFamily: grot }}>Perfil</div>
          {[
            { label: 'Nombre', value: 'Nicolás Illg' },
            { label: 'Meta diaria', value: '15 minutos' },
          ].map(({ label, value }) => (
            <div key={label} style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 10, color: D5.warm, fontWeight: 600, marginBottom: 4, fontFamily: grot }}>{label}</div>
              <div style={{ fontSize: 13, color: D5.ink, borderBottom: `1px solid ${D5.muted}40`, paddingBottom: 8, fontFamily: grot }}>{value}</div>
            </div>
          ))}
        </div>

        <WindingPathSeparator />

        {/* Appearance — neutral ink chips */}
        <div style={{ padding: '4px 18px 12px' }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: D5.muted, marginBottom: 12, fontFamily: grot }}>Apariencia</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {['Sistema', 'Claro', 'Oscuro'].map((theme, i) => (
              <div key={theme} style={{
                padding: '6px 14px', borderRadius: 99, fontSize: 10, fontFamily: grot,
                fontWeight: i === 0 ? 700 : 400,
                background: i === 0 ? 'rgba(26,17,8,0.08)' : 'rgba(26,17,8,0.03)',
                color: i === 0 ? D5.ink : `${D5.ink}45`,
              }}>
                {theme}
              </div>
            ))}
          </div>
        </div>

        <WindingPathSeparator />

        {/* Level indicator */}
        <div style={{ padding: '0 18px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 10, color: D5.warm, fontFamily: grot }}>Nivel actual</div>
          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 10px', borderRadius: 99, background: 'rgba(245,158,11,0.12)', color: '#92400e', fontFamily: grot }}>B2</span>
        </div>

        <WindingPathSeparator />

        {/* CTA */}
        <div style={{ padding: '4px 18px 14px' }}>
          <button style={{ background: D5.terracotta, color: D5.paper, border: 'none', borderRadius: 99, padding: '12px 0', width: '100%', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: grot }}>
            Guardar cambios
          </button>
        </div>

        {/* Danger zone */}
        <div style={{ padding: '0 18px 20px', textAlign: 'center' }}>
          <span style={{ fontSize: 10, color: `${D5.ink}25`, fontFamily: grot, cursor: 'pointer' }}>Eliminar cuenta</span>
        </div>

      </div>
    </div>
  )
}

// ─── Direction 5 Panel ─────────────────────────────────────────────────────────

function Direction5Panel({
  data, progressData, conceptData, verbData,
}: {
  data?: D5Data | null
  progressData?: D5ProgressData | null
  conceptData?: D5ConceptData | null
  verbData?: D5VerbData | null
}) {
  return (
    <div>
      <Section label="Icon + Wordmark + Concept">
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <D5Icon />
          <div>
            <div style={{ fontFamily: 'var(--font-dm-serif), serif', fontStyle: 'italic', fontSize: 36, color: D5.terracotta, lineHeight: 1.1 }}>Senda</div>
            <div style={{ fontSize: 13, color: '#6b7280', marginTop: 6, maxWidth: 260, lineHeight: 1.5 }}>The winding trail — terracotta on paper. Warm, craft-forward, unmistakably human.</div>
          </div>
        </div>
      </Section>
      <Section label="Colour Palette">
        <PaletteRow palette={[
          { hex: D5.ink,        token: 'Brand Ink' },
          { hex: D5.paper,      token: 'Brand Paper' },
          { hex: D5.warm,       token: 'Brand Warm' },
          { hex: D5.terracotta, token: 'Brand Terracotta' },
          { hex: D5.muted,      token: 'Brand Muted' },
          { hex: D5.warmCream,  token: 'Dark Cream (text)' },
        ]} />
      </Section>
      <Section label="Desktop Sidebar Navigation">
        <D5SideNav />
      </Section>
      <Section label="Exercise in App Context (calligraphic tilde success)">
        <ExerciseContext
          colors={{ primary: D5.ink, warm: D5.warm }}
          border={`1.5px solid ${D5.muted}`}
          inputBg={D5.paper}
          labelColor={D5.warm}
          submitBg={D5.terracotta}
          submitText={D5.paper}
          scoreBorder={`1.5px solid ${D5.terracotta}`}
          scoreChipBg={D5.terracotta}
          scoreChipText={D5.paper}
          tildeColor={D5.paper}
          scoreLabel="3 / 3 · Correcto"
        />
      </Section>
      <Section label="Dashboard Page — Light Theme (Paper / Craft)">
        <PhoneFrame bg={D5.paper} bottomNav={
          <BottomNav items={NAV_ITEMS} active="home" activeColor={D5.terracotta} activeBg={`${D5.muted}28`} bg={D5.paper} borderColor={`${D5.muted}50`} />
        }>
          <D5DashboardLight data={data} />
        </PhoneFrame>
      </Section>
      <Section label="Dashboard Page — Dark Theme (Ink / Charcoal)">
        <PhoneFrame bg={D5.ink} bottomNav={
          <BottomNav items={NAV_ITEMS} active="home" activeColor={D5.terracotta} activeBg={`${D5.muted}20`} bg={D5.ink} borderColor={`${D5.muted}25`} />
        }>
          <D5DashboardDark data={data} />
        </PhoneFrame>
      </Section>
      <Section label="Curriculum Page — Winding Path Timeline">
        <PhoneFrame bg={D5.paper} bottomNav={
          <BottomNav items={NAV_ITEMS} active="list" activeColor={D5.terracotta} activeBg={`${D5.muted}28`} bg={D5.paper} borderColor={`${D5.muted}50`} />
        }>
          <D5CurriculumTimeline data={data} />
        </PhoneFrame>
      </Section>
      <Section label="Progress Page — Streak · CEFR Journey · Verb Mastery">
        <PhoneFrame bg={D5.paper} bottomNav={
          <BottomNav items={NAV_ITEMS} active="bar" activeColor={D5.terracotta} activeBg={`${D5.muted}28`} bg={D5.paper} borderColor={`${D5.muted}50`} />
        }>
          <D5ProgressPage data={progressData} />
        </PhoneFrame>
      </Section>
      <Section label="Study Configure Page — Mode · Module · Exercise Types">
        <PhoneFrame bg={D5.paper} bottomNav={
          <BottomNav items={NAV_ITEMS} active="book" activeColor={D5.terracotta} activeBg={`${D5.muted}28`} bg={D5.paper} borderColor={`${D5.muted}50`} />
        }>
          <D5StudyConfigurePage data={data} />
        </PhoneFrame>
      </Section>
      <Section label="Concept Detail Page — Explanation · Exercise Types · SRS">
        <PhoneFrame bg={D5.paper} bottomNav={
          <BottomNav items={NAV_ITEMS} active="list" activeColor={D5.terracotta} activeBg={`${D5.muted}28`} bg={D5.paper} borderColor={`${D5.muted}50`} />
        }>
          <D5ConceptDetailPage data={conceptData} />
        </PhoneFrame>
      </Section>
      <Section label="Verb Detail Page — Conjugation Table · Tense Tabs · Mastery">
        <PhoneFrame bg={D5.paper} bottomNav={
          <BottomNav items={NAV_ITEMS} active="list" activeColor={D5.terracotta} activeBg={`${D5.muted}28`} bg={D5.paper} borderColor={`${D5.muted}50`} />
        }>
          <D5VerbDetailPage data={verbData} />
        </PhoneFrame>
      </Section>
      <Section label="Exercise Full Screen — Answering State · Feedback State">
        <D5ExerciseFullScreen />
      </Section>
      <Section label="Account Page — Profile · Appearance · Level">
        <PhoneFrame bg={D5.paper} bottomNav={
          <BottomNav items={NAV_ITEMS} active="home" activeColor={D5.terracotta} activeBg={`${D5.muted}28`} bg={D5.paper} borderColor={`${D5.muted}50`} />
        }>
          <D5AccountPage />
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
  { id: 5, label: 'Direction 5: Senda Craft' },
]

export function BrandPreviewClient({
  d5Data, d5ProgressData, d5ConceptData, d5VerbData,
}: {
  d5Data?: D5Data | null
  d5ProgressData?: D5ProgressData | null
  d5ConceptData?: D5ConceptData | null
  d5VerbData?: D5VerbData | null
}) {
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
        {active === 5 && <Direction5Panel data={d5Data} progressData={d5ProgressData} conceptData={d5ConceptData} verbData={d5VerbData} />}
      </div>
    </div>
  )
}
