export type ConjugationRow = { pronoun: string; form: string; stem: string }

function stripAccents(s: string) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function ColouredForm({ form, stem }: { form: string; stem: string }) {
  if (stem === '' || !stripAccents(form).startsWith(stripAccents(stem))) {
    return <span style={{ color: 'var(--d5-terracotta)', fontWeight: 600 }}>{form}</span>
  }
  const stemPart = form.substring(0, stem.length)
  const ending = form.substring(stem.length)
  return (
    <>
      <span style={{ color: 'var(--d5-muted)' }}>{stemPart}</span>
      <span style={{ color: 'var(--d5-terracotta)', fontWeight: 600 }}>{ending}</span>
    </>
  )
}

export function ConjugationInsightTable({ rows }: { rows: ConjugationRow[] }) {
  return (
    <div>
      {rows.map((row, i) => (
        <div key={row.pronoun}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px 0',
            }}
          >
            <span style={{ fontSize: 12, color: 'var(--d5-muted)', minWidth: 80 }}>
              {row.pronoun}
            </span>
            <span style={{ fontSize: 15 }}>
              <ColouredForm form={row.form} stem={row.stem} />
            </span>
          </div>
          {i < rows.length - 1 && (
            <div style={{ height: 1, background: 'rgba(184,170,153,0.2)' }} />
          )}
        </div>
      ))}
    </div>
  )
}
