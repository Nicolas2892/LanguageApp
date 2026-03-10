'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'

const EXERCISE_TYPES = [
  { value: 'gap_fill',          label: 'Completar Hueco',        desc: 'Rellena La Palabra O Conector' },
  { value: 'transformation',    label: 'Transformación',         desc: 'Reescribe Con La Estructura Objetivo' },
  { value: 'translation',       label: 'Traducción',             desc: 'Traduce Del Inglés Al Español' },
  { value: 'error_correction',  label: 'Corrección De Errores',  desc: 'Detecta Y Corrige El Error Gramatical' },
  { value: 'sentence_builder',  label: 'Constructor De Frases',  desc: 'Ordena Las Palabras Correctamente' },
  { value: 'free_write',        label: 'Escritura Libre',        desc: 'Escribe Libremente Con La Estructura Objetivo' },
]

const SESSION_SIZES = [5, 10, 15, 20, 25] as const
const DEFAULT_SIZE = 10

type SessionMode = 'srs' | 'review' | 'practice'

interface Module {
  id: string
  title: string
  mastered: number
  total: number
}

interface Props {
  modules: Module[]
  mistakeConceptCount: number
}

export function SessionConfig({ modules, mistakeConceptCount }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialMode: SessionMode = searchParams.get('mode') === 'practice' ? 'practice' : 'srs'
  const [sessionMode, setSessionMode] = useState<SessionMode>(initialMode)
  const [selectedModule, setSelectedModule] = useState<string>('all')
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [sessionSize, setSessionSize] = useState(DEFAULT_SIZE)

  function toggleType(value: string) {
    setSelectedTypes((prev) =>
      prev.includes(value) ? prev.filter((t) => t !== value) : [...prev, value]
    )
  }

  function handleStart() {
    if (sessionMode === 'review') {
      router.push('/study?mode=review')
      return
    }
    const params = new URLSearchParams()
    if (sessionMode === 'practice') params.set('practice', 'true')
    if (selectedModule !== 'all') params.set('module', selectedModule)
    if (selectedTypes.length > 0) params.set('types', selectedTypes.join(','))
    if (sessionSize !== DEFAULT_SIZE) params.set('size', String(sessionSize))
    router.push(`/study?${params.toString()}`)
  }

  const isPractice = sessionMode === 'practice'

  return (
    <div className="space-y-8">
      {/* Mode picker — always shown */}
      <section className="space-y-3">
        <h2 className="senda-eyebrow">Modo</h2>
        <div className="grid grid-cols-1 gap-2">
          <button
            onClick={() => setSessionMode('srs')}
            className={`text-left border rounded-xl px-4 py-3 text-sm transition-colors ${
              sessionMode === 'srs'
                ? 'border-primary bg-primary/5 font-medium'
                : 'hover:bg-muted'
            }`}
          >
            <span className="font-medium">Repaso Diario</span>
            <p className="text-xs text-muted-foreground mt-0.5">Trabaja Con Tu Cola De Hoy</p>
          </button>
          <button
            onClick={() => setSessionMode('practice')}
            className={`text-left border rounded-xl px-4 py-3 text-sm transition-colors ${
              sessionMode === 'practice'
                ? 'border-primary bg-primary/5 font-medium'
                : 'hover:bg-muted'
            }`}
          >
            <span className="font-medium">Práctica Abierta</span>
            <p className="text-xs text-muted-foreground mt-0.5">Practica Cualquier Tema Libremente</p>
          </button>
          {mistakeConceptCount > 0 && (
            <button
              onClick={() => setSessionMode('review')}
              className={`text-left border rounded-xl px-4 py-3 text-sm transition-colors ${
                sessionMode === 'review'
                  ? 'border-primary bg-primary/5 font-medium'
                  : 'hover:bg-muted'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">Revisar Errores</span>
                <span className="text-xs text-muted-foreground shrink-0">
                  {mistakeConceptCount} concept{mistakeConceptCount !== 1 ? 's' : ''}
                </span>
              </div>
            </button>
          )}
        </div>
      </section>

      {/* Options — hidden in review mode */}
      {sessionMode !== 'review' && (
        <>
          {/* Module picker */}
          <section className="space-y-3">
            <h2 className="senda-eyebrow">
              {isPractice ? 'Elegir Un Tema (Opcional)' : 'Módulo'}
            </h2>
            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={() => setSelectedModule('all')}
                className={`text-left border rounded-xl px-4 py-3 text-sm transition-colors ${
                  selectedModule === 'all'
                    ? 'border-primary bg-primary/5 font-medium'
                    : 'hover:bg-muted'
                }`}
              >
                <span className="font-medium">Todos Los Módulos</span>
                <span className="text-muted-foreground ml-2">
                  {isPractice ? '(Catálogo Completo)' : '(Cola SRS Del Día)'}
                </span>
              </button>
              {modules.map((mod) => (
                <button
                  key={mod.id}
                  onClick={() => setSelectedModule(mod.id)}
                  className={`text-left border rounded-xl px-4 py-3 text-sm transition-colors ${
                    selectedModule === mod.id
                      ? 'border-primary bg-primary/5 font-medium'
                      : 'hover:bg-muted'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={selectedModule === mod.id ? 'font-medium' : ''}>{mod.title}</span>
                    {mod.total > 0 && !isPractice && (
                      <span className="text-xs text-muted-foreground shrink-0">
                        {mod.mastered}/{mod.total} Dominados
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* Session size picker */}
          <section className="space-y-3">
            <h2 className="senda-eyebrow">¿Cuántos Ejercicios?</h2>
            <div className="flex gap-2 flex-wrap">
              {SESSION_SIZES.map((size) => (
                <button
                  key={size}
                  onClick={() => setSessionSize(size)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
                    sessionSize === size
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </section>

          {/* Exercise type picker */}
          <section className="space-y-3">
            <div className="flex items-baseline justify-between">
              <h2 className="senda-eyebrow">Tipos De Ejercicio</h2>
              <span className="text-xs text-muted-foreground">
                {selectedTypes.length === 0 ? 'Todos Los Tipos' : `${selectedTypes.length} Seleccionados`}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {EXERCISE_TYPES.map((type) => {
                const active = selectedTypes.includes(type.value)
                return (
                  <button
                    key={type.value}
                    onClick={() => toggleType(type.value)}
                    className={`text-left border rounded-xl px-4 py-3 transition-colors ${
                      active ? 'border-primary bg-primary/5' : 'hover:bg-muted'
                    }`}
                  >
                    <span className="text-sm font-medium">{type.label}</span>
                    <p className="text-xs text-muted-foreground mt-0.5">{type.desc}</p>
                  </button>
                )
              })}
            </div>
            {selectedTypes.length > 0 && (
              <button
                onClick={() => setSelectedTypes([])}
                className="text-xs text-muted-foreground underline"
              >
                Limpiar Selección (Usar Todos Los Tipos)
              </button>
            )}
          </section>
        </>
      )}

      <Button onClick={handleStart} className="w-full rounded-full" size="lg">
        Empezar Sesión →
      </Button>
    </div>
  )
}
