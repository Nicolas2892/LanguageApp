import type { VocabCategory } from './constants'

export interface VocabSessionItem {
  vocabId:         string
  expression:      string
  category:        VocabCategory
  sentence:        string   // contains '_____'
  correctForm:     string
  answerVariants:  string[] | null
  english:         string
  hint:            string | null
}

export interface VocabCategoryStat {
  category: string
  correct: number
  total: number
}
