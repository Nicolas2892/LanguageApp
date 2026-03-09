export const TENSES = [
  'present_indicative',
  'preterite',
  'imperfect',
  'future',
  'conditional',
  'present_subjunctive',
  'imperfect_subjunctive',
] as const

export type VerbTense = typeof TENSES[number]

export const TENSE_LABELS: Record<VerbTense, string> = {
  present_indicative:   'Present Indicative',
  preterite:            'Preterite',
  imperfect:            'Imperfect',
  future:               'Future',
  conditional:          'Conditional',
  present_subjunctive:  'Present Subjunctive',
  imperfect_subjunctive: 'Imperfect Subjunctive',
}

export const TENSE_DESCRIPTIONS: Record<VerbTense, string> = {
  present_indicative:    'Used for habitual actions, current states, and general truths.',
  preterite:             'Used for completed past actions at a specific point in time.',
  imperfect:             'Used for ongoing past states, habitual past actions, and background description.',
  future:                'Used for future events and suppositions.',
  conditional:           'Used for hypothetical situations and polite requests.',
  present_subjunctive:   'Used in subordinate clauses expressing wishes, doubt, or emotion.',
  imperfect_subjunctive: 'Used in past subjunctive contexts and contrary-to-fact conditionals.',
}
