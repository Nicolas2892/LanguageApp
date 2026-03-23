export const VOCAB_CATEGORIES = [
  'discourse_markers',
  'fixed_phrases',
  'collocations',
  'register_phrases',
  'idiomatic',
  'prepositional',
  'adverbial',
  'pragmatic',
] as const

export type VocabCategory = typeof VOCAB_CATEGORIES[number]

export const CATEGORY_LABELS: Record<VocabCategory, string> = {
  discourse_markers: 'Marcadores del Discurso',
  fixed_phrases:     'Expresiones Fijas',
  collocations:      'Colocaciones',
  register_phrases:  'Registro Formal',
  idiomatic:         'Expresiones Idiomáticas',
  prepositional:     'Régimen Preposicional',
  adverbial:         'Locuciones Adverbiales',
  pragmatic:         'Marcadores Pragmáticos',
}

export const CATEGORY_DESCRIPTIONS: Record<VocabCategory, string> = {
  discourse_markers: 'Conectores y marcadores que estructuran el discurso.',
  fixed_phrases:     'Expresiones verbales fijas de uso frecuente.',
  collocations:      'Combinaciones léxicas naturales del español.',
  register_phrases:  'Expresiones de registro formal y académico.',
  idiomatic:         'Expresiones idiomáticas y refranes populares.',
  prepositional:     'Verbos con preposición fija (régimen preposicional).',
  adverbial:         'Locuciones adverbiales de uso frecuente.',
  pragmatic:         'Marcadores conversacionales y pragmáticos.',
}

export const CATEGORY_LEVELS: Record<VocabCategory, string> = {
  discourse_markers: 'B1–B2',
  fixed_phrases:     'B1–B2',
  collocations:      'B2',
  register_phrases:  'B2–C1',
  idiomatic:         'B2–C1',
  prepositional:     'B1–B2',
  adverbial:         'B2',
  pragmatic:         'B2–C1',
}
