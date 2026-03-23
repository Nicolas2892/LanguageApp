/**
 * pnpm seed:vocab
 *
 * 1. Inserts ~200 vocabulary items into the `vocab_items` table.
 * 2. For each item, calls Claude Haiku to generate 5 in-sentence examples
 *    with blanks and English translations.
 * 3. Writes results incrementally to docs/vocab-sentences-YYYY-MM-DD.json.
 * 4. Resume-safe: skips items already in the output file.
 *
 * Run with:
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... ANTHROPIC_API_KEY=... pnpm seed:vocab
 */

import fs from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import type { Database } from '../supabase/types'
import { CATEGORY_LABELS } from '../vocab/constants'
import type { VocabCategory } from '../vocab/constants'

// ── Environment ──────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY

if (!SUPABASE_URL || !SUPABASE_KEY || !ANTHROPIC_KEY) {
  console.error('Missing required env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY')
  process.exit(1)
}

const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_KEY)
const anthropic = new Anthropic({ apiKey: ANTHROPIC_KEY })

// ── Vocab data ───────────────────────────────────────────────────────────────

type VocabItemData = {
  expression: string
  english: string
  category: VocabCategory
  level: 'B1' | 'B2' | 'C1'
  frequency_rank: number
}

const VOCAB_DATA: VocabItemData[] = [
  // ── discourse_markers (30) ─────────────────────────────────────────────────
  { expression: 'sin embargo',        english: 'however',                category: 'discourse_markers', level: 'B1', frequency_rank: 1 },
  { expression: 'por lo tanto',       english: 'therefore',              category: 'discourse_markers', level: 'B1', frequency_rank: 2 },
  { expression: 'en cambio',          english: 'on the other hand',      category: 'discourse_markers', level: 'B1', frequency_rank: 3 },
  { expression: 'de hecho',           english: 'in fact',                category: 'discourse_markers', level: 'B1', frequency_rank: 4 },
  { expression: 'en primer lugar',    english: 'in the first place',     category: 'discourse_markers', level: 'B1', frequency_rank: 5 },
  { expression: 'además',             english: 'furthermore / moreover', category: 'discourse_markers', level: 'B1', frequency_rank: 6 },
  { expression: 'por otro lado',      english: 'on the other hand',      category: 'discourse_markers', level: 'B1', frequency_rank: 7 },
  { expression: 'en conclusión',      english: 'in conclusion',          category: 'discourse_markers', level: 'B1', frequency_rank: 8 },
  { expression: 'por consiguiente',   english: 'consequently',           category: 'discourse_markers', level: 'B2', frequency_rank: 9 },
  { expression: 'no obstante',        english: 'nevertheless',           category: 'discourse_markers', level: 'B2', frequency_rank: 10 },
  { expression: 'en resumen',         english: 'in summary',             category: 'discourse_markers', level: 'B1', frequency_rank: 11 },
  { expression: 'a pesar de eso',     english: 'despite that',           category: 'discourse_markers', level: 'B2', frequency_rank: 12 },
  { expression: 'dicho de otro modo', english: 'in other words',         category: 'discourse_markers', level: 'B2', frequency_rank: 13 },
  { expression: 'en segundo lugar',   english: 'in the second place',    category: 'discourse_markers', level: 'B1', frequency_rank: 14 },
  { expression: 'por eso',            english: 'that\'s why / for that reason', category: 'discourse_markers', level: 'B1', frequency_rank: 15 },
  { expression: 'así que',            english: 'so / therefore',         category: 'discourse_markers', level: 'B1', frequency_rank: 16 },
  { expression: 'en definitiva',      english: 'in short / ultimately',  category: 'discourse_markers', level: 'B2', frequency_rank: 17 },
  { expression: 'por el contrario',   english: 'on the contrary',        category: 'discourse_markers', level: 'B2', frequency_rank: 18 },
  { expression: 'en cuanto a',        english: 'as for / regarding',     category: 'discourse_markers', level: 'B2', frequency_rank: 19 },
  { expression: 'con respecto a',     english: 'with regard to',         category: 'discourse_markers', level: 'B2', frequency_rank: 20 },
  { expression: 'por una parte',      english: 'on one hand',            category: 'discourse_markers', level: 'B1', frequency_rank: 21 },
  { expression: 'asimismo',           english: 'likewise',               category: 'discourse_markers', level: 'B2', frequency_rank: 22 },
  { expression: 'del mismo modo',     english: 'in the same way',        category: 'discourse_markers', level: 'B2', frequency_rank: 23 },
  { expression: 'en efecto',          english: 'indeed / in effect',     category: 'discourse_markers', level: 'B2', frequency_rank: 24 },
  { expression: 'aun así',            english: 'even so',                category: 'discourse_markers', level: 'B2', frequency_rank: 25 },
  { expression: 'de todas formas',    english: 'in any case',            category: 'discourse_markers', level: 'B2', frequency_rank: 26 },
  { expression: 'en todo caso',       english: 'in any case',            category: 'discourse_markers', level: 'B2', frequency_rank: 27 },
  { expression: 'por ende',           english: 'therefore / hence',      category: 'discourse_markers', level: 'B2', frequency_rank: 28 },
  { expression: 'ante todo',          english: 'above all',              category: 'discourse_markers', level: 'B2', frequency_rank: 29 },
  { expression: 'a su vez',           english: 'in turn',                category: 'discourse_markers', level: 'B2', frequency_rank: 30 },

  // ── fixed_phrases (30) ────────────────────────────────────────────────────
  { expression: 'tener que ver con',      english: 'to have to do with',       category: 'fixed_phrases', level: 'B1', frequency_rank: 1 },
  { expression: 'estar a punto de',       english: 'to be about to',           category: 'fixed_phrases', level: 'B1', frequency_rank: 2 },
  { expression: 'dar por hecho',          english: 'to take for granted',      category: 'fixed_phrases', level: 'B2', frequency_rank: 3 },
  { expression: 'echar de menos',         english: 'to miss (someone/something)', category: 'fixed_phrases', level: 'B1', frequency_rank: 4 },
  { expression: 'tener en cuenta',        english: 'to keep in mind',          category: 'fixed_phrases', level: 'B1', frequency_rank: 5 },
  { expression: 'darse cuenta de',        english: 'to realise',               category: 'fixed_phrases', level: 'B1', frequency_rank: 6 },
  { expression: 'hacerse cargo de',       english: 'to take charge of',        category: 'fixed_phrases', level: 'B2', frequency_rank: 7 },
  { expression: 'llevar a cabo',          english: 'to carry out',             category: 'fixed_phrases', level: 'B2', frequency_rank: 8 },
  { expression: 'ponerse de acuerdo',     english: 'to agree / reach agreement', category: 'fixed_phrases', level: 'B2', frequency_rank: 9 },
  { expression: 'dar a entender',         english: 'to imply / hint at',       category: 'fixed_phrases', level: 'B2', frequency_rank: 10 },
  { expression: 'tener ganas de',         english: 'to feel like (doing)',      category: 'fixed_phrases', level: 'B1', frequency_rank: 11 },
  { expression: 'hacer falta',            english: 'to be necessary',           category: 'fixed_phrases', level: 'B1', frequency_rank: 12 },
  { expression: 'echar un vistazo',       english: 'to take a look',            category: 'fixed_phrases', level: 'B1', frequency_rank: 13 },
  { expression: 'dar la vuelta',          english: 'to turn around',             category: 'fixed_phrases', level: 'B1', frequency_rank: 14 },
  { expression: 'poner en marcha',        english: 'to start up / launch',      category: 'fixed_phrases', level: 'B2', frequency_rank: 15 },
  { expression: 'tener lugar',            english: 'to take place',              category: 'fixed_phrases', level: 'B2', frequency_rank: 16 },
  { expression: 'caer en la cuenta',      english: 'to realise suddenly',        category: 'fixed_phrases', level: 'B2', frequency_rank: 17 },
  { expression: 'hacer caso',             english: 'to pay attention / obey',    category: 'fixed_phrases', level: 'B1', frequency_rank: 18 },
  { expression: 'dar igual',              english: 'to not matter',              category: 'fixed_phrases', level: 'B1', frequency_rank: 19 },
  { expression: 'ponerse en contacto',    english: 'to get in touch',            category: 'fixed_phrases', level: 'B1', frequency_rank: 20 },
  { expression: 'tener razón',            english: 'to be right',                category: 'fixed_phrases', level: 'B1', frequency_rank: 21 },
  { expression: 'dar lo mismo',           english: 'to be all the same',         category: 'fixed_phrases', level: 'B2', frequency_rank: 22 },
  { expression: 'estar de acuerdo',       english: 'to agree',                   category: 'fixed_phrases', level: 'B1', frequency_rank: 23 },
  { expression: 'tener la culpa',         english: 'to be at fault',             category: 'fixed_phrases', level: 'B2', frequency_rank: 24 },
  { expression: 'pasar por alto',         english: 'to overlook',                category: 'fixed_phrases', level: 'B2', frequency_rank: 25 },
  { expression: 'dar el visto bueno',     english: 'to give the go-ahead',       category: 'fixed_phrases', level: 'B2', frequency_rank: 26 },
  { expression: 'poner en práctica',      english: 'to put into practice',       category: 'fixed_phrases', level: 'B2', frequency_rank: 27 },
  { expression: 'salir adelante',         english: 'to get through / succeed',   category: 'fixed_phrases', level: 'B2', frequency_rank: 28 },
  { expression: 'dejar de lado',          english: 'to set aside',               category: 'fixed_phrases', level: 'B2', frequency_rank: 29 },
  { expression: 'ir al grano',            english: 'to get to the point',        category: 'fixed_phrases', level: 'B2', frequency_rank: 30 },

  // ── collocations (25) ─────────────────────────────────────────────────────
  { expression: 'prestar atención',       english: 'to pay attention',           category: 'collocations', level: 'B2', frequency_rank: 1 },
  { expression: 'tomar una decisión',     english: 'to make a decision',         category: 'collocations', level: 'B2', frequency_rank: 2 },
  { expression: 'hacer hincapié',         english: 'to emphasise',               category: 'collocations', level: 'B2', frequency_rank: 3 },
  { expression: 'correr el riesgo',       english: 'to run the risk',            category: 'collocations', level: 'B2', frequency_rank: 4 },
  { expression: 'cumplir un objetivo',    english: 'to achieve a goal',          category: 'collocations', level: 'B2', frequency_rank: 5 },
  { expression: 'desempeñar un papel',    english: 'to play a role',             category: 'collocations', level: 'B2', frequency_rank: 6 },
  { expression: 'dar un paso',            english: 'to take a step',             category: 'collocations', level: 'B2', frequency_rank: 7 },
  { expression: 'plantear una cuestión',  english: 'to raise a question',        category: 'collocations', level: 'B2', frequency_rank: 8 },
  { expression: 'alcanzar un acuerdo',    english: 'to reach an agreement',      category: 'collocations', level: 'B2', frequency_rank: 9 },
  { expression: 'guardar silencio',       english: 'to keep silent',             category: 'collocations', level: 'B2', frequency_rank: 10 },
  { expression: 'sentar las bases',       english: 'to lay the foundations',     category: 'collocations', level: 'B2', frequency_rank: 11 },
  { expression: 'marcar la diferencia',   english: 'to make a difference',       category: 'collocations', level: 'B2', frequency_rank: 12 },
  { expression: 'sacar conclusiones',     english: 'to draw conclusions',        category: 'collocations', level: 'B2', frequency_rank: 13 },
  { expression: 'entablar una conversación', english: 'to strike up a conversation', category: 'collocations', level: 'B2', frequency_rank: 14 },
  { expression: 'surtir efecto',          english: 'to take effect',             category: 'collocations', level: 'B2', frequency_rank: 15 },
  { expression: 'asumir la responsabilidad', english: 'to take responsibility',  category: 'collocations', level: 'B2', frequency_rank: 16 },
  { expression: 'ejercer influencia',     english: 'to exert influence',         category: 'collocations', level: 'B2', frequency_rank: 17 },
  { expression: 'dar a conocer',          english: 'to make known / announce',   category: 'collocations', level: 'B2', frequency_rank: 18 },
  { expression: 'tener en mente',         english: 'to have in mind',            category: 'collocations', level: 'B2', frequency_rank: 19 },
  { expression: 'abrir camino',           english: 'to pave the way',            category: 'collocations', level: 'B2', frequency_rank: 20 },
  { expression: 'poner de manifiesto',    english: 'to reveal / highlight',      category: 'collocations', level: 'B2', frequency_rank: 21 },
  { expression: 'generar debate',         english: 'to spark debate',            category: 'collocations', level: 'B2', frequency_rank: 22 },
  { expression: 'cobrar importancia',     english: 'to gain importance',         category: 'collocations', level: 'B2', frequency_rank: 23 },
  { expression: 'tomar medidas',          english: 'to take measures',           category: 'collocations', level: 'B2', frequency_rank: 24 },
  { expression: 'correr prisa',           english: 'to be urgent',               category: 'collocations', level: 'B2', frequency_rank: 25 },

  // ── register_phrases (25) ─────────────────────────────────────────────────
  { expression: 'en lo que respecta a',   english: 'as regards / regarding',     category: 'register_phrases', level: 'B2', frequency_rank: 1 },
  { expression: 'a pesar de ello',        english: 'in spite of it',             category: 'register_phrases', level: 'B2', frequency_rank: 2 },
  { expression: 'cabe destacar que',      english: 'it is worth noting that',    category: 'register_phrases', level: 'C1', frequency_rank: 3 },
  { expression: 'cabe señalar que',       english: 'it should be noted that',    category: 'register_phrases', level: 'C1', frequency_rank: 4 },
  { expression: 'conviene recordar que',  english: 'it is worth remembering that', category: 'register_phrases', level: 'C1', frequency_rank: 5 },
  { expression: 'resulta evidente que',   english: 'it is clear that',           category: 'register_phrases', level: 'B2', frequency_rank: 6 },
  { expression: 'es preciso señalar',     english: 'it is necessary to point out', category: 'register_phrases', level: 'C1', frequency_rank: 7 },
  { expression: 'tal y como',             english: 'just as / as',               category: 'register_phrases', level: 'B2', frequency_rank: 8 },
  { expression: 'a raíz de',              english: 'as a result of',             category: 'register_phrases', level: 'B2', frequency_rank: 9 },
  { expression: 'a tenor de',             english: 'in accordance with',         category: 'register_phrases', level: 'C1', frequency_rank: 10 },
  { expression: 'de acuerdo con',         english: 'according to',               category: 'register_phrases', level: 'B2', frequency_rank: 11 },
  { expression: 'por lo que se refiere a', english: 'as far as … is concerned', category: 'register_phrases', level: 'C1', frequency_rank: 12 },
  { expression: 'a fin de que',           english: 'in order that / so that',    category: 'register_phrases', level: 'B2', frequency_rank: 13 },
  { expression: 'en virtud de',           english: 'by virtue of',               category: 'register_phrases', level: 'C1', frequency_rank: 14 },
  { expression: 'con el fin de',          english: 'with the aim of',            category: 'register_phrases', level: 'B2', frequency_rank: 15 },
  { expression: 'dado que',              english: 'given that / since',          category: 'register_phrases', level: 'B2', frequency_rank: 16 },
  { expression: 'puesto que',            english: 'since / given that',          category: 'register_phrases', level: 'B2', frequency_rank: 17 },
  { expression: 'siempre y cuando',      english: 'as long as / provided that', category: 'register_phrases', level: 'B2', frequency_rank: 18 },
  { expression: 'a condición de que',    english: 'on condition that',           category: 'register_phrases', level: 'B2', frequency_rank: 19 },
  { expression: 'a menos que',           english: 'unless',                      category: 'register_phrases', level: 'B2', frequency_rank: 20 },
  { expression: 'en la medida en que',   english: 'to the extent that',          category: 'register_phrases', level: 'C1', frequency_rank: 21 },
  { expression: 'habida cuenta de',      english: 'taking into account',         category: 'register_phrases', level: 'C1', frequency_rank: 22 },
  { expression: 'en aras de',            english: 'for the sake of',             category: 'register_phrases', level: 'C1', frequency_rank: 23 },
  { expression: 'a efectos de',          english: 'for the purposes of',         category: 'register_phrases', level: 'C1', frequency_rank: 24 },
  { expression: 'en lo sucesivo',        english: 'henceforth / from now on',    category: 'register_phrases', level: 'C1', frequency_rank: 25 },

  // ── idiomatic (25) ────────────────────────────────────────────────────────
  { expression: 'meter la pata',         english: 'to put one\'s foot in it',    category: 'idiomatic', level: 'B2', frequency_rank: 1 },
  { expression: 'dar en el clavo',       english: 'to hit the nail on the head', category: 'idiomatic', level: 'B2', frequency_rank: 2 },
  { expression: 'quedarse en blanco',    english: 'to go blank',                 category: 'idiomatic', level: 'B2', frequency_rank: 3 },
  { expression: 'tomar el pelo',         english: 'to pull someone\'s leg',      category: 'idiomatic', level: 'B2', frequency_rank: 4 },
  { expression: 'ser pan comido',        english: 'to be a piece of cake',       category: 'idiomatic', level: 'B2', frequency_rank: 5 },
  { expression: 'no tener pelos en la lengua', english: 'to not mince words',    category: 'idiomatic', level: 'B2', frequency_rank: 6 },
  { expression: 'estar en las nubes',    english: 'to have one\'s head in the clouds', category: 'idiomatic', level: 'B2', frequency_rank: 7 },
  { expression: 'costar un ojo de la cara', english: 'to cost an arm and a leg', category: 'idiomatic', level: 'B2', frequency_rank: 8 },
  { expression: 'dar la lata',           english: 'to be a nuisance',            category: 'idiomatic', level: 'B2', frequency_rank: 9 },
  { expression: 'echar una mano',        english: 'to lend a hand',              category: 'idiomatic', level: 'B2', frequency_rank: 10 },
  { expression: 'irse por las ramas',    english: 'to beat around the bush',     category: 'idiomatic', level: 'B2', frequency_rank: 11 },
  { expression: 'no dar abasto',         english: 'to be unable to cope',        category: 'idiomatic', level: 'B2', frequency_rank: 12 },
  { expression: 'ponerse las pilas',     english: 'to get one\'s act together',  category: 'idiomatic', level: 'B2', frequency_rank: 13 },
  { expression: 'dar la cara',           english: 'to face up to / stand up',    category: 'idiomatic', level: 'B2', frequency_rank: 14 },
  { expression: 'hacer la vista gorda',  english: 'to turn a blind eye',         category: 'idiomatic', level: 'B2', frequency_rank: 15 },
  { expression: 'dormir a pierna suelta', english: 'to sleep like a log',        category: 'idiomatic', level: 'B2', frequency_rank: 16 },
  { expression: 'estar hecho polvo',     english: 'to be shattered / exhausted', category: 'idiomatic', level: 'B2', frequency_rank: 17 },
  { expression: 'tirar la toalla',       english: 'to throw in the towel',       category: 'idiomatic', level: 'B2', frequency_rank: 18 },
  { expression: 'pillar el punto',       english: 'to get the hang of it',       category: 'idiomatic', level: 'C1', frequency_rank: 19 },
  { expression: 'no pegar ojo',          english: 'to not sleep a wink',         category: 'idiomatic', level: 'B2', frequency_rank: 20 },
  { expression: 'matar dos pájaros de un tiro', english: 'to kill two birds with one stone', category: 'idiomatic', level: 'B2', frequency_rank: 21 },
  { expression: 'estar como una cabra',  english: 'to be crazy',                 category: 'idiomatic', level: 'B2', frequency_rank: 22 },
  { expression: 'dar calabazas',         english: 'to reject someone',           category: 'idiomatic', level: 'C1', frequency_rank: 23 },
  { expression: 'tener mala pata',       english: 'to have bad luck',            category: 'idiomatic', level: 'B2', frequency_rank: 24 },
  { expression: 'estar al loro',         english: 'to be alert / pay attention', category: 'idiomatic', level: 'C1', frequency_rank: 25 },

  // ── prepositional (25) ────────────────────────────────────────────────────
  { expression: 'consistir en',          english: 'to consist of',               category: 'prepositional', level: 'B1', frequency_rank: 1 },
  { expression: 'depender de',           english: 'to depend on',                category: 'prepositional', level: 'B1', frequency_rank: 2 },
  { expression: 'insistir en',           english: 'to insist on',                category: 'prepositional', level: 'B1', frequency_rank: 3 },
  { expression: 'soñar con',             english: 'to dream of / about',         category: 'prepositional', level: 'B1', frequency_rank: 4 },
  { expression: 'quejarse de',           english: 'to complain about',           category: 'prepositional', level: 'B1', frequency_rank: 5 },
  { expression: 'confiar en',            english: 'to trust / rely on',          category: 'prepositional', level: 'B2', frequency_rank: 6 },
  { expression: 'contribuir a',          english: 'to contribute to',            category: 'prepositional', level: 'B2', frequency_rank: 7 },
  { expression: 'empeñarse en',          english: 'to insist on / persist in',   category: 'prepositional', level: 'B2', frequency_rank: 8 },
  { expression: 'arrepentirse de',       english: 'to regret',                   category: 'prepositional', level: 'B2', frequency_rank: 9 },
  { expression: 'fijarse en',            english: 'to notice / pay attention to', category: 'prepositional', level: 'B1', frequency_rank: 10 },
  { expression: 'acordarse de',          english: 'to remember',                 category: 'prepositional', level: 'B1', frequency_rank: 11 },
  { expression: 'renunciar a',           english: 'to give up / renounce',       category: 'prepositional', level: 'B2', frequency_rank: 12 },
  { expression: 'dedicarse a',           english: 'to devote oneself to',        category: 'prepositional', level: 'B1', frequency_rank: 13 },
  { expression: 'enfrentarse a',         english: 'to face / confront',          category: 'prepositional', level: 'B2', frequency_rank: 14 },
  { expression: 'atreverse a',           english: 'to dare to',                  category: 'prepositional', level: 'B2', frequency_rank: 15 },
  { expression: 'comprometerse a',       english: 'to commit to',                category: 'prepositional', level: 'B2', frequency_rank: 16 },
  { expression: 'negarse a',             english: 'to refuse to',                category: 'prepositional', level: 'B2', frequency_rank: 17 },
  { expression: 'aspirar a',             english: 'to aspire to',                category: 'prepositional', level: 'B2', frequency_rank: 18 },
  { expression: 'contar con',            english: 'to count on / rely on',       category: 'prepositional', level: 'B1', frequency_rank: 19 },
  { expression: 'ocuparse de',           english: 'to deal with / take care of', category: 'prepositional', level: 'B2', frequency_rank: 20 },
  { expression: 'avergonzarse de',       english: 'to be ashamed of',            category: 'prepositional', level: 'B2', frequency_rank: 21 },
  { expression: 'burlarse de',           english: 'to make fun of',              category: 'prepositional', level: 'B2', frequency_rank: 22 },
  { expression: 'alegrarse de',          english: 'to be glad about',            category: 'prepositional', level: 'B1', frequency_rank: 23 },
  { expression: 'disponer de',           english: 'to have available',            category: 'prepositional', level: 'B2', frequency_rank: 24 },
  { expression: 'optar por',             english: 'to opt for / choose',         category: 'prepositional', level: 'B2', frequency_rank: 25 },

  // ── adverbial (20) ────────────────────────────────────────────────────────
  { expression: 'a menudo',              english: 'often',                        category: 'adverbial', level: 'B2', frequency_rank: 1 },
  { expression: 'por lo general',        english: 'generally / usually',          category: 'adverbial', level: 'B2', frequency_rank: 2 },
  { expression: 'a fin de cuentas',      english: 'after all / in the end',      category: 'adverbial', level: 'B2', frequency_rank: 3 },
  { expression: 'en el fondo',           english: 'deep down / at heart',        category: 'adverbial', level: 'B2', frequency_rank: 4 },
  { expression: 'a la larga',            english: 'in the long run',             category: 'adverbial', level: 'B2', frequency_rank: 5 },
  { expression: 'de vez en cuando',      english: 'from time to time',           category: 'adverbial', level: 'B2', frequency_rank: 6 },
  { expression: 'a duras penas',         english: 'with great difficulty',       category: 'adverbial', level: 'B2', frequency_rank: 7 },
  { expression: 'a toda costa',          english: 'at all costs',                category: 'adverbial', level: 'B2', frequency_rank: 8 },
  { expression: 'de antemano',           english: 'beforehand / in advance',     category: 'adverbial', level: 'B2', frequency_rank: 9 },
  { expression: 'por las buenas',        english: 'nicely / willingly',          category: 'adverbial', level: 'B2', frequency_rank: 10 },
  { expression: 'a regañadientes',       english: 'reluctantly',                 category: 'adverbial', level: 'B2', frequency_rank: 11 },
  { expression: 'sin lugar a dudas',     english: 'without a doubt',             category: 'adverbial', level: 'B2', frequency_rank: 12 },
  { expression: 'a lo largo de',         english: 'throughout / along',          category: 'adverbial', level: 'B2', frequency_rank: 13 },
  { expression: 'en un abrir y cerrar de ojos', english: 'in the blink of an eye', category: 'adverbial', level: 'B2', frequency_rank: 14 },
  { expression: 'por si acaso',          english: 'just in case',                category: 'adverbial', level: 'B2', frequency_rank: 15 },
  { expression: 'a escondidas',          english: 'secretly / on the sly',       category: 'adverbial', level: 'B2', frequency_rank: 16 },
  { expression: 'de buenas a primeras',  english: 'out of the blue / suddenly',  category: 'adverbial', level: 'B2', frequency_rank: 17 },
  { expression: 'a ciegas',              english: 'blindly',                     category: 'adverbial', level: 'B2', frequency_rank: 18 },
  { expression: 'al pie de la letra',    english: 'to the letter / literally',   category: 'adverbial', level: 'B2', frequency_rank: 19 },
  { expression: 'a grandes rasgos',      english: 'broadly / in broad terms',    category: 'adverbial', level: 'B2', frequency_rank: 20 },

  // ── pragmatic (20) ────────────────────────────────────────────────────────
  { expression: 'o sea',                 english: 'I mean / that is',            category: 'pragmatic', level: 'B2', frequency_rank: 1 },
  { expression: 'es decir',              english: 'that is to say',              category: 'pragmatic', level: 'B2', frequency_rank: 2 },
  { expression: 'a ver',                 english: 'let\'s see',                  category: 'pragmatic', level: 'B2', frequency_rank: 3 },
  { expression: 'digamos que',           english: 'let\'s say that',             category: 'pragmatic', level: 'B2', frequency_rank: 4 },
  { expression: 'la verdad es que',      english: 'the truth is that',           category: 'pragmatic', level: 'B2', frequency_rank: 5 },
  { expression: 'total que',             english: 'so basically / in the end',   category: 'pragmatic', level: 'B2', frequency_rank: 6 },
  { expression: 'bueno',                 english: 'well / okay',                 category: 'pragmatic', level: 'B2', frequency_rank: 7 },
  { expression: 'pues nada',             english: 'so anyway / well then',       category: 'pragmatic', level: 'B2', frequency_rank: 8 },
  { expression: 'vamos a ver',           english: 'let\'s see / look',           category: 'pragmatic', level: 'B2', frequency_rank: 9 },
  { expression: 'que yo sepa',           english: 'as far as I know',            category: 'pragmatic', level: 'B2', frequency_rank: 10 },
  { expression: 'por así decirlo',       english: 'so to speak',                 category: 'pragmatic', level: 'C1', frequency_rank: 11 },
  { expression: 'de todas maneras',      english: 'anyway / in any case',        category: 'pragmatic', level: 'B2', frequency_rank: 12 },
  { expression: 'en fin',                english: 'well / anyway',               category: 'pragmatic', level: 'B2', frequency_rank: 13 },
  { expression: 'que conste',            english: 'let it be known / for the record', category: 'pragmatic', level: 'C1', frequency_rank: 14 },
  { expression: 'hombre',                english: 'come on / well (interjection)', category: 'pragmatic', level: 'B2', frequency_rank: 15 },
  { expression: 'ojo',                   english: 'watch out / careful',          category: 'pragmatic', level: 'B2', frequency_rank: 16 },
  { expression: 'fíjate',                english: 'imagine / notice',             category: 'pragmatic', level: 'B2', frequency_rank: 17 },
  { expression: 'mira',                  english: 'look (discourse marker)',      category: 'pragmatic', level: 'B2', frequency_rank: 18 },
  { expression: 'vale la pena',          english: 'it\'s worth it',              category: 'pragmatic', level: 'B2', frequency_rank: 19 },
  { expression: 'no me digas',           english: 'you don\'t say / no way',     category: 'pragmatic', level: 'C1', frequency_rank: 20 },
]

// ── Output file ──────────────────────────────────────────────────────────────

const today = new Date().toISOString().slice(0, 10)
const outPath = path.resolve(__dirname, `../../../docs/vocab-sentences-${today}.json`)

type SentenceEntry = {
  sentence: string
  correct_form: string
  answer_variants: string[] | null
  english: string
  hint: string
}

type ItemResult = {
  expression: string
  vocab_id: string
  category: string
  sentences: SentenceEntry[]
}

type OutputFile = {
  generated_at: string
  items: ItemResult[]
}

function loadOutput(): OutputFile {
  if (fs.existsSync(outPath)) {
    return JSON.parse(fs.readFileSync(outPath, 'utf-8')) as OutputFile
  }
  return { generated_at: new Date().toISOString(), items: [] }
}

function saveOutput(data: OutputFile) {
  fs.writeFileSync(outPath, JSON.stringify(data, null, 2))
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`Vocab seed: ${VOCAB_DATA.length} items`)
  console.log(`Output: ${outPath}`)

  // 1. Insert vocab items into DB (skip existing)
  console.log('\n── Step 1: Inserting vocab items into DB ──')
  const insertedIds = new Map<string, string>() // expression → id

  for (const item of VOCAB_DATA) {
    // Check if already exists
    const { data: existing } = await supabase
      .from('vocab_items')
      .select('id')
      .eq('expression', item.expression)
      .single()

    if (existing) {
      insertedIds.set(item.expression, (existing as { id: string }).id)
      continue
    }

    const { data: inserted, error } = await supabase
      .from('vocab_items')
      .insert({
        expression: item.expression,
        english: item.english,
        category: item.category,
        level: item.level,
        frequency_rank: item.frequency_rank,
      })
      .select('id')
      .single()

    if (error) {
      console.error(`  ✗ Error inserting "${item.expression}":`, error.message)
      continue
    }

    insertedIds.set(item.expression, (inserted as { id: string }).id)
    console.log(`  ✓ Inserted "${item.expression}" (${item.category})`)
  }

  console.log(`\n  Total items in DB: ${insertedIds.size}`)

  // 2. Generate sentences via Claude Haiku
  console.log('\n── Step 2: Generating sentences via Claude Haiku ──')
  const output = loadOutput()
  const doneExpressions = new Set(output.items.map((i) => i.expression))

  let generated = 0
  let skipped = 0

  for (const item of VOCAB_DATA) {
    if (doneExpressions.has(item.expression)) {
      skipped++
      continue
    }

    const vocabId = insertedIds.get(item.expression)
    if (!vocabId) {
      console.warn(`  ⚠ No DB id for "${item.expression}" — skipping`)
      continue
    }

    const categoryLabel = CATEGORY_LABELS[item.category as VocabCategory]

    try {
      const response = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2048,
        messages: [{
          role: 'user',
          content: `Generate exactly 5 example sentences for the Spanish expression "${item.expression}" (${item.english}).

Category: ${categoryLabel}
Level: ${item.level}

Rules:
- Each sentence must use "${item.expression}" naturally in context.
- Replace the expression with "_____" (five underscores) as a blank.
- The sentence must be clear enough that a B1–C1 learner can fill in the blank from context.
- Each sentence should use a different context/topic.
- Provide the English translation of the full sentence.
- Provide a short English hint (1–3 words) that hints at the blank.
- If there are common accepted variants (synonyms that fit the exact same blank), include them.

Return ONLY a JSON array (no markdown fences, no explanation) with this structure:
[
  {
    "sentence": "Spanish sentence with _____ blank",
    "correct_form": "${item.expression}",
    "answer_variants": ["variant1"] or null,
    "english": "English translation of the full sentence",
    "hint": "short English hint"
  }
]`,
        }],
      })

      const text = response.content[0].type === 'text' ? response.content[0].text : ''
      const sentences = JSON.parse(text.trim()) as SentenceEntry[]

      if (!Array.isArray(sentences) || sentences.length === 0) {
        console.warn(`  ⚠ Invalid response for "${item.expression}" — skipping`)
        continue
      }

      output.items.push({
        expression: item.expression,
        vocab_id: vocabId,
        category: item.category,
        sentences,
      })
      saveOutput(output)
      generated++

      console.log(`  ✓ [${generated}] ${item.expression} → ${sentences.length} sentences`)
    } catch (err) {
      console.error(`  ✗ Error generating for "${item.expression}":`, err)
    }
  }

  console.log(`\nDone! Generated: ${generated}, Skipped (already done): ${skipped}`)
  console.log(`Output: ${outPath}`)
}

main().catch(console.error)
