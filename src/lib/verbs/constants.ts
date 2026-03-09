export const TENSES = [
  'present_indicative',
  'preterite',
  'imperfect',
  'future',
  'conditional',
  'present_subjunctive',
  'imperfect_subjunctive',
  'imperative_affirmative',
  'imperative_negative',
] as const

export type VerbTense = typeof TENSES[number]

export const TENSE_LABELS: Record<VerbTense, string> = {
  present_indicative:     'Presente de Indicativo',
  preterite:              'Pretérito Indefinido',
  imperfect:              'Pretérito Imperfecto',
  future:                 'Futuro Simple',
  conditional:            'Condicional Simple',
  present_subjunctive:    'Presente de Subjuntivo',
  imperfect_subjunctive:  'Pretérito Imperfecto de Subjuntivo',
  imperative_affirmative: 'Imperativo Afirmativo',
  imperative_negative:    'Imperativo Negativo',
}

export const TENSE_DESCRIPTIONS: Record<VerbTense, string> = {
  present_indicative:     'Used for habitual actions, current states, and general truths.',
  preterite:              'Used for completed past actions at a specific point in time.',
  imperfect:              'Used for ongoing past states, habitual past actions, and background description.',
  future:                 'Used for future events and suppositions.',
  conditional:            'Used for hypothetical situations and polite requests.',
  present_subjunctive:    'Used in subordinate clauses expressing wishes, doubt, or emotion.',
  imperfect_subjunctive:  'Used in past subjunctive contexts and contrary-to-fact conditionals.',
  imperative_affirmative: 'Used to give direct commands or instructions. No yo form exists.',
  imperative_negative:    'Used to tell someone not to do something (no + subjunctive form). No yo form exists.',
}
