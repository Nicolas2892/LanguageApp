export const PRONUNCIATION_CATEGORIES = [
  'stress', 'fluency', 'prosody', 'rr', 'x', 'ɲ', 'vowels', 'consonants',
] as const

export type PronunciationCategory = typeof PRONUNCIATION_CATEGORIES[number]

export const PRONUNCIATION_CATEGORY_LABELS: Record<PronunciationCategory, string> = {
  stress: 'Acentuación',
  fluency: 'Fluidez',
  prosody: 'Prosodia',
  rr: 'R Vibrante (rr)',
  x: 'Jota (J/G)',
  ɲ: 'Eñe (Ñ)',
  vowels: 'Vocales',
  consonants: 'Consonantes',
}

/**
 * Classify the worst phoneme in a word into a pronunciation category.
 * Returns null if no phonemes are present.
 */
export function classifyPhoneme(word: { phonemes: { phoneme: string; score: number }[] }): PronunciationCategory | null {
  if (word.phonemes.length === 0) return null

  const worst = word.phonemes.reduce((a, b) => (a.score < b.score ? a : b))
  const p = worst.phoneme.toLowerCase()

  if (p.includes('r') || p.includes('ɾ') || p.includes('ɹ')) return 'rr'
  if (p.includes('x') || p.includes('χ') || p.includes('h')) return 'x'
  if (p.includes('ɲ') || p.includes('ñ')) return 'ɲ'
  if ('aeiou'.includes(p)) return 'vowels'

  return 'consonants'
}

interface L1Tip {
  description: string
  tip: string
}

export const L1_TIPS: Record<string, Record<string, L1Tip>> = {
  german: {
    stress: {
      description: 'German is stress-timed; Spanish is syllable-timed. You may rush unstressed syllables.',
      tip: 'Give every syllable equal time. Spanish rhythm is even — like a metronome, not like German peaks and valleys.',
    },
    fluency: {
      description: 'German speakers often pause between words where Spanish flows continuously.',
      tip: 'Link words together. In Spanish, the end of one word flows into the start of the next — "el año" sounds like "e-LA-ño".',
    },
    prosody: {
      description: 'German intonation patterns differ — questions rise more sharply, statements fall more abruptly.',
      tip: 'Spanish intonation is more melodic. Let your voice rise gently on questions and fall smoothly on statements.',
    },
    rr: {
      description: 'German uses a uvular R (back of throat). Spanish needs an alveolar trill (tongue tip).',
      tip: 'Place your tongue tip behind your upper teeth and let it vibrate. Start with "drrr" — the D helps position your tongue correctly.',
    },
    x: {
      description: 'The Spanish J/G sound (/x/) is similar to German "ch" in "Bach" — you have an advantage here.',
      tip: 'Use the same throat position as German "ach-Laut" (Bach, Dach). You already know this sound — just apply it to J and G before E/I.',
    },
    ɲ: {
      description: 'German has no palatal nasal /ɲ/. You may separate it into "n-y".',
      tip: 'Press the middle of your tongue against the roof of your mouth (not the tip). Think of it as one sound, not N+Y. Practice: niño, año, España.',
    },
    vowels: {
      description: 'German has front rounded vowels (ö, ü) and schwa. Spanish has only 5 pure vowels — no reduction.',
      tip: 'Keep all vowels crisp and open. Never reduce an unstressed vowel to schwa. Spanish "e" is always /e/, never like German "e" in "bitte".',
    },
    consonants: {
      description: 'German aspirates P, T, K (puff of air). Spanish does not aspirate these stops.',
      tip: 'Hold a paper in front of your mouth. Spanish P/T/K should NOT make it flutter. Say "pato" gently — no air burst on the P.',
    },
  },
  english: {
    stress: {
      description: 'English stress patterns transfer incorrectly to Spanish cognates (e.g. "important" → "importante").',
      tip: 'Learn Spanish stress rules: words ending in vowel/N/S stress the second-to-last syllable. Others stress the last. Accents override.',
    },
    fluency: {
      description: 'English speakers tend to insert pauses and filler sounds between Spanish words.',
      tip: 'Spanish speech flows in breath groups. Practice reading sentences in one smooth stream without pausing between words.',
    },
    prosody: {
      description: 'English intonation is more varied. Spanish has narrower pitch range.',
      tip: 'Flatten your intonation slightly. Spanish sounds more even than English — avoid the dramatic rises and falls of English.',
    },
    rr: {
      description: 'English uses a retroflex R (tongue curled back). Spanish needs a tongue-tip trill or tap.',
      tip: 'For single R, do a quick tap — like the "tt" in American English "butter". For RR, repeat that tap rapidly. Start with "butter" speed and build up.',
    },
    x: {
      description: 'English has no guttural fricative /x/. You may substitute a weak "h" sound.',
      tip: 'Constrict the back of your throat (like clearing it gently). The J in "jamón" should feel scratchy, not breathy. Think Scottish "loch".',
    },
    ɲ: {
      description: 'English has no palatal nasal /ɲ/. You may say "nee-yo" instead of one fused sound.',
      tip: 'Press the flat of your tongue against the hard palate. It is ONE sound, not N+Y. Compare: "niño" (child) vs "nino" (not a word).',
    },
    vowels: {
      description: 'English reduces unstressed vowels to schwa. Spanish never reduces vowels.',
      tip: 'Every Spanish vowel gets its full sound: A=ah, E=eh, I=ee, O=oh, U=oo. Never mumble or swallow a vowel, even in fast speech.',
    },
    consonants: {
      description: 'English aspirates P, T, K and has different D/T tongue positions.',
      tip: 'Spanish D between vowels is soft (tongue between teeth, like English "th" in "the"). Spanish T is dental — tongue touches teeth, not the ridge behind them.',
    },
  },
}
