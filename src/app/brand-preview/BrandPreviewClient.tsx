'use client'

import { useState } from 'react'

// ─── Direction 1: Acute Accent ───────────────────────────────────────────────

const D1_PALETTE = [
  { hex: '#9B3422', token: 'Brand Primary',  label: 'CTAs, active states' },
  { hex: '#C4522E', token: 'Brand Warm',     label: 'Hover, progress bars' },
  { hex: '#FFF8EE', token: 'Brand Surface',  label: 'Card backgrounds' },
  { hex: '#F5EDD8', token: 'Brand Accent',   label: 'Highlight, icon stroke' },
  { hex: '#6B3020', token: 'Brand Muted',    label: 'Pressed states' },
]

function D1Icon() {
  return (
    <svg viewBox="0 0 100 100" width={128} height={128} style={{ display: 'block', borderRadius: 22 }}>
      <rect width="100" height="100" fill="#9B3422" />
      {/* Calligraphic acute accent stroke — filled bezier, thick at centre, tapered at tips */}
      <path
        d="M 52 76
           C 48 66, 44 54, 42 42
           C 40 32, 46 22, 50 18
           C 54 16, 59 20, 60 26
           C 62 36, 62 50, 60 62
           C 58 70, 56 76, 52 76
           Z"
        fill="#F5EDD8"
      />
    </svg>
  )
}

function D1NavMock() {
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 12, width: 180 }}>
      <div style={{ fontFamily: 'var(--font-cormorant), serif', fontWeight: 600, fontSize: 15, letterSpacing: '0.15em', color: '#9B3422', marginBottom: 16, paddingBottom: 10, borderBottom: '1px solid #e5e7eb' }}>
        Avanzado
      </div>
      {[{ label: 'Dashboard', active: true }, { label: 'Study', active: false }].map((item) => (
        <div key={item.label} style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, marginBottom: 4,
          background: item.active ? '#FFF8EE' : 'transparent',
          color: item.active ? '#9B3422' : '#6b7280',
          fontWeight: item.active ? 600 : 400,
          fontSize: 14,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: item.active ? '#9B3422' : 'transparent', border: item.active ? 'none' : '1.5px solid #d1d5db' }} />
          {item.label}
        </div>
      ))}
    </div>
  )
}

function D1DashCard() {
  return (
    <div style={{ background: '#FFF8EE', border: '1px solid #e5e7eb', borderRadius: 12, padding: '16px 20px', minWidth: 180 }}>
      <div style={{ fontSize: 12, color: '#6B3020', fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 6 }}>
        Current streak
      </div>
      <div style={{ fontSize: 36, fontWeight: 700, color: '#9B3422', lineHeight: 1 }}>7</div>
      <div style={{ fontSize: 12, color: '#6B3020', marginTop: 4 }}>days in a row</div>
    </div>
  )
}

function D1Exercise() {
  return (
    <div style={{ maxWidth: 380 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#6B3020', marginBottom: 8, letterSpacing: '0.04em' }}>
        Complete the sentence
      </div>
      <div style={{ fontSize: 15, color: '#1f2937', marginBottom: 12, lineHeight: 1.6 }}>
        Aunque llegué tarde, _____ a tiempo para la reunión.
      </div>
      <textarea rows={2} style={{
        width: '100%', border: '1.5px solid #C4522E', borderRadius: 8, padding: '10px 12px',
        fontSize: 15, color: '#1f2937', background: '#FFF8EE', resize: 'none', outline: 'none',
        fontFamily: 'inherit', boxSizing: 'border-box',
      }} placeholder="Your answer…" readOnly />
      <button style={{
        marginTop: 10, width: '100%', background: '#9B3422', color: '#F5EDD8',
        border: 'none', borderRadius: 8, padding: '10px 0', fontSize: 14, fontWeight: 600,
        cursor: 'pointer', letterSpacing: '0.04em',
      }}>
        Submit
      </button>
    </div>
  )
}

function D1ScoreChips() {
  const chips = [
    { label: 'Correct', score: '3 / 3', bg: '#9B3422', color: '#F5EDD8' },
    { label: 'Partial', score: '1 / 3', bg: '#C4522E', color: '#FFF8EE' },
    { label: 'Wrong',   score: '0 / 3', bg: '#6B3020', color: '#F5EDD8' },
  ]
  return (
    <div style={{ display: 'flex', gap: 10 }}>
      {chips.map((c) => (
        <div key={c.label} style={{
          background: c.bg, color: c.color, borderRadius: 20,
          padding: '6px 16px', fontSize: 13, fontWeight: 600, display: 'flex', flexDirection: 'column', alignItems: 'center',
        }}>
          <span style={{ fontSize: 11, opacity: 0.85 }}>{c.label}</span>
          <span>{c.score}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Direction 2: Ñ Redesigned ───────────────────────────────────────────────

const D2_PALETTE = [
  { hex: '#1B3A6B', token: 'Brand Primary',    label: 'CTAs, active states, headers' },
  { hex: '#D4A84B', token: 'Brand Gold',        label: 'Accents, scores, tilde mark' },
  { hex: '#F2E8D0', token: 'Brand Cream',       label: 'Light mode surfaces' },
  { hex: '#2E5BA8', token: 'Brand Blue Light',  label: 'Hover states' },
  { hex: '#8BA3C7', token: 'Brand Muted',       label: 'Secondary text on dark bg' },
]

function D2Icon() {
  return (
    <svg viewBox="0 0 100 100" width={128} height={128} style={{ display: 'block', borderRadius: 22 }}>
      <rect width="100" height="100" fill="#1B3A6B" />
      {/* Main Ñ letterform via text element — font loaded by server component */}
      <text
        x="50"
        y="72"
        textAnchor="middle"
        fill="#F2E8D0"
        fontSize={72}
        fontFamily="var(--font-cormorant), serif"
        fontWeight={600}
      >
        N
      </text>
      {/* Gold tilde — custom path, independently coloured and bolder than typeface default */}
      <path
        d="M 35 31  C 40 24, 46 24, 50 29  C 54 34, 60 34, 65 27"
        stroke="#D4A84B"
        strokeWidth={3.5}
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  )
}

function D2NavMock() {
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 12, width: 180 }}>
      <div style={{ fontFamily: 'var(--font-cormorant), serif', fontWeight: 700, fontSize: 16, color: '#1B3A6B', marginBottom: 16, paddingBottom: 10, borderBottom: '1px solid #e5e7eb' }}>
        Español{' '}
        <span style={{ color: '#D4A84B' }}>Avanzado</span>
      </div>
      {[{ label: 'Dashboard', active: true }, { label: 'Study', active: false }].map((item) => (
        <div key={item.label} style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, marginBottom: 4,
          background: item.active ? '#EEF2FB' : 'transparent',
          color: item.active ? '#1B3A6B' : '#6b7280',
          fontWeight: item.active ? 600 : 400,
          fontSize: 14,
          borderLeft: item.active ? '3px solid #1B3A6B' : '3px solid transparent',
        }}>
          {item.label}
        </div>
      ))}
    </div>
  )
}

function D2DashCard() {
  return (
    <div style={{ background: '#F2E8D0', border: '1px solid #d1c8b0', borderRadius: 12, padding: '16px 20px', minWidth: 180 }}>
      <div style={{ fontSize: 12, color: '#1B3A6B', fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 6 }}>
        Current streak
      </div>
      <div style={{ fontSize: 36, fontWeight: 700, color: '#D4A84B', lineHeight: 1 }}>7</div>
      <div style={{ fontSize: 12, color: '#1B3A6B', marginTop: 4 }}>days in a row</div>
    </div>
  )
}

function D2Exercise() {
  return (
    <div style={{ maxWidth: 380 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#1B3A6B', marginBottom: 8, letterSpacing: '0.04em' }}>
        Complete the sentence
      </div>
      <div style={{ fontSize: 15, color: '#1f2937', marginBottom: 12, lineHeight: 1.6 }}>
        Aunque llegué tarde, _____ a tiempo para la reunión.
      </div>
      <textarea rows={2} style={{
        width: '100%', border: '1.5px solid #1B3A6B', borderRadius: 8, padding: '10px 12px',
        fontSize: 15, color: '#1f2937', background: '#F2E8D0', resize: 'none', outline: 'none',
        fontFamily: 'inherit', boxSizing: 'border-box',
      }} placeholder="Your answer…" readOnly />
      <button style={{
        marginTop: 10, width: '100%', background: '#1B3A6B', color: '#F2E8D0',
        border: 'none', borderRadius: 8, padding: '10px 0', fontSize: 14, fontWeight: 600,
        cursor: 'pointer', letterSpacing: '0.04em',
      }}>
        Submit
      </button>
    </div>
  )
}

function D2ScoreChips() {
  const chips = [
    { label: 'Correct', score: '3 / 3', bg: '#1B3A6B', color: '#F2E8D0' },
    { label: 'Partial', score: '1 / 3', bg: '#2E5BA8', color: '#F2E8D0' },
    { label: 'Wrong',   score: '0 / 3', bg: '#8BA3C7', color: '#1B3A6B' },
  ]
  return (
    <div style={{ display: 'flex', gap: 10 }}>
      {chips.map((c) => (
        <div key={c.label} style={{
          background: c.bg, color: c.color, borderRadius: 20,
          padding: '6px 16px', fontSize: 13, fontWeight: 600, display: 'flex', flexDirection: 'column', alignItems: 'center',
        }}>
          <span style={{ fontSize: 11, opacity: 0.85 }}>{c.label}</span>
          <span>{c.score}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Direction 3: Ink Mark ───────────────────────────────────────────────────

const D3_PALETTE = [
  { hex: '#1A1108', token: 'Brand Ink',       label: 'Primary text, CTA, icon stroke' },
  { hex: '#FEFBF4', token: 'Brand Paper',     label: 'All surface backgrounds' },
  { hex: '#8C6A3F', token: 'Brand Warm Mid',  label: 'Secondary UI elements, icons' },
  { hex: '#C4522E', token: 'Brand Accent',    label: 'Scores, streak, active nav' },
  { hex: '#B8AA99', token: 'Brand Muted',     label: 'Disabled, secondary text' },
]

function D3Icon() {
  return (
    <svg viewBox="0 0 100 100" width={128} height={128} style={{ display: 'block', borderRadius: 22, border: '1px solid #e5e7eb' }}>
      <rect width="100" height="100" fill="#FEFBF4" />
      {/* Thick main downstroke — filled shape */}
      <path
        d="M 28 18  C 30 28, 38 50, 45 78
           C 47 78, 51 78, 53 78
           C 46 50, 40 28, 36 18
           Z"
        fill="#1A1108"
      />
      {/* Hairline return stroke */}
      <path
        d="M 53 78  C 62 56, 68 36, 66 20"
        stroke="#1A1108"
        strokeWidth={1.5}
        fill="none"
        strokeLinecap="round"
      />
      {/* Optional thin crossbar */}
      <path
        d="M 33 52  C 40 50, 50 50, 58 52"
        stroke="#1A1108"
        strokeWidth={1.2}
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  )
}

function D3NavMock() {
  return (
    <div style={{ background: '#FEFBF4', border: '1px solid #e5e7eb', borderRadius: 12, padding: 12, width: 180 }}>
      <div style={{ fontFamily: 'var(--font-dm-serif), serif', fontStyle: 'italic', fontSize: 16, color: '#1A1108', marginBottom: 16, paddingBottom: 10, borderBottom: '1px solid #d4c9b8' }}>
        Avanzado
      </div>
      {[{ label: 'Dashboard', active: true }, { label: 'Study', active: false }].map((item) => (
        <div key={item.label} style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, marginBottom: 4,
          background: item.active ? '#f0ece4' : 'transparent',
          color: item.active ? '#C4522E' : '#8C6A3F',
          fontWeight: item.active ? 600 : 400,
          fontSize: 14,
        }}>
          <span style={{ width: 4, height: 16, borderRadius: 2, background: item.active ? '#C4522E' : 'transparent', marginRight: 2 }} />
          {item.label}
        </div>
      ))}
    </div>
  )
}

function D3DashCard() {
  return (
    <div style={{ background: '#FEFBF4', border: '1px solid #d4c9b8', borderRadius: 12, padding: '16px 20px', minWidth: 180 }}>
      <div style={{ fontSize: 12, color: '#8C6A3F', fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 6 }}>
        Current streak
      </div>
      <div style={{ fontSize: 36, fontWeight: 700, color: '#C4522E', lineHeight: 1 }}>7</div>
      <div style={{ fontSize: 12, color: '#8C6A3F', marginTop: 4 }}>days in a row</div>
    </div>
  )
}

function D3Exercise() {
  return (
    <div style={{ maxWidth: 380 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#8C6A3F', marginBottom: 8, letterSpacing: '0.04em' }}>
        Complete the sentence
      </div>
      <div style={{ fontSize: 15, color: '#1A1108', marginBottom: 12, lineHeight: 1.6 }}>
        Aunque llegué tarde, _____ a tiempo para la reunión.
      </div>
      <textarea rows={2} style={{
        width: '100%', border: '1.5px solid #1A1108', borderRadius: 8, padding: '10px 12px',
        fontSize: 15, color: '#1A1108', background: '#FEFBF4', resize: 'none', outline: 'none',
        fontFamily: 'inherit', boxSizing: 'border-box',
      }} placeholder="Your answer…" readOnly />
      <button style={{
        marginTop: 10, width: '100%', background: '#1A1108', color: '#FEFBF4',
        border: 'none', borderRadius: 8, padding: '10px 0', fontSize: 14, fontWeight: 600,
        cursor: 'pointer', letterSpacing: '0.04em',
      }}>
        Submit
      </button>
    </div>
  )
}

function D3ScoreChips() {
  const chips = [
    { label: 'Correct', score: '3 / 3', bg: '#C4522E', color: '#FEFBF4' },
    { label: 'Partial', score: '1 / 3', bg: '#8C6A3F', color: '#FEFBF4' },
    { label: 'Wrong',   score: '0 / 3', bg: '#B8AA99', color: '#1A1108' },
  ]
  return (
    <div style={{ display: 'flex', gap: 10 }}>
      {chips.map((c) => (
        <div key={c.label} style={{
          background: c.bg, color: c.color, borderRadius: 20,
          padding: '6px 16px', fontSize: 13, fontWeight: 600, display: 'flex', flexDirection: 'column', alignItems: 'center',
        }}>
          <span style={{ fontSize: 11, opacity: 0.85 }}>{c.label}</span>
          <span>{c.score}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Shared palette swatch ───────────────────────────────────────────────────

function PaletteRow({ palette }: { palette: typeof D1_PALETTE }) {
  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      {palette.map((c) => (
        <div key={c.hex} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 12, background: c.hex,
            border: c.hex === '#FFF8EE' || c.hex === '#F2E8D0' || c.hex === '#FEFBF4' ? '1px solid #e5e7eb' : 'none',
          }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: '#1f2937', textAlign: 'center' }}>{c.hex}</span>
          <span style={{ fontSize: 10, color: '#6b7280', textAlign: 'center', maxWidth: 72 }}>{c.token}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Section label ────────────────────────────────────────────────────────────

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 32 }}>
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

// ─── Direction panels ─────────────────────────────────────────────────────────

function Direction1Panel() {
  return (
    <div>
      <Section label="Icon + Wordmark + Concept">
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <D1Icon />
          <div>
            <div style={{
              fontFamily: 'var(--font-cormorant), serif',
              fontWeight: 600,
              fontSize: 32,
              letterSpacing: '0.15em',
              color: '#9B3422',
              lineHeight: 1.1,
            }}>
              Avanzado
            </div>
            <div style={{ fontSize: 13, color: '#6b7280', marginTop: 6, maxWidth: 260, lineHeight: 1.5 }}>
              The defining mark of written Spanish — built from the acute accent alone.
            </div>
          </div>
        </div>
      </Section>
      <Section label="Colour Palette">
        <PaletteRow palette={D1_PALETTE} />
      </Section>
      <Section label="Navigation Mock">
        <D1NavMock />
      </Section>
      <Section label="Dashboard Card">
        <D1DashCard />
      </Section>
      <Section label="Exercise Input">
        <D1Exercise />
      </Section>
      <Section label="Score Feedback">
        <D1ScoreChips />
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
            <div style={{
              fontFamily: 'var(--font-cormorant), serif',
              fontWeight: 700,
              fontSize: 32,
              color: '#1B3A6B',
              lineHeight: 1.1,
            }}>
              Español{' '}
              <span style={{ color: '#D4A84B' }}>Avanzado</span>
            </div>
            <div style={{ fontSize: 13, color: '#6b7280', marginTop: 6, maxWidth: 260, lineHeight: 1.5 }}>
              The Ñ in a bespoke display serif — ownable, unmistakably Spanish.
            </div>
          </div>
        </div>
      </Section>
      <Section label="Colour Palette">
        <PaletteRow palette={D2_PALETTE} />
      </Section>
      <Section label="Navigation Mock">
        <D2NavMock />
      </Section>
      <Section label="Dashboard Card">
        <D2DashCard />
      </Section>
      <Section label="Exercise Input">
        <D2Exercise />
      </Section>
      <Section label="Score Feedback">
        <D2ScoreChips />
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
            <div style={{
              fontFamily: 'var(--font-dm-serif), serif',
              fontStyle: 'italic',
              fontSize: 32,
              color: '#1A1108',
              lineHeight: 1.1,
            }}>
              Avanzado
            </div>
            <div style={{ fontSize: 13, color: '#6b7280', marginTop: 6, maxWidth: 260, lineHeight: 1.5 }}>
              The act of writing — an ink mark on paper — as the brand's visual language.
            </div>
          </div>
        </div>
      </Section>
      <Section label="Colour Palette">
        <PaletteRow palette={D3_PALETTE} />
      </Section>
      <Section label="Navigation Mock">
        <D3NavMock />
      </Section>
      <Section label="Dashboard Card">
        <D3DashCard />
      </Section>
      <Section label="Exercise Input">
        <D3Exercise />
      </Section>
      <Section label="Score Feedback">
        <D3ScoreChips />
      </Section>
    </div>
  )
}

// ─── Main client component ────────────────────────────────────────────────────

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
      <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '20px 32px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: 4 }}>
          Brand Identity Preview — Español Avanzado
        </div>
        <div style={{ fontSize: 14, color: '#6b7280' }}>
          Three directions. One decision. Delete this page after choosing.
        </div>
      </div>

      {/* Tab switcher */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '0 32px', display: 'flex', gap: 0 }}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            style={{
              padding: '14px 20px',
              fontSize: 14,
              fontWeight: active === tab.id ? 600 : 400,
              color: active === tab.id ? '#111827' : '#6b7280',
              background: 'none',
              border: 'none',
              borderBottom: active === tab.id ? '2px solid #111827' : '2px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.15s',
              whiteSpace: 'nowrap',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 32px' }}>
        {active === 1 && <Direction1Panel />}
        {active === 2 && <Direction2Panel />}
        {active === 3 && <Direction3Panel />}
      </div>
    </div>
  )
}
