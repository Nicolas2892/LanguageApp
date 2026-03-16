/**
 * pnpm seed:verbs
 *
 * 1. Inserts 250 high-frequency verbs into the `verbs` table.
 * 2. For each verb × tense (250 × 9 = 2,250 combos), calls Claude Haiku to
 *    generate 5 in-sentence examples with different pronouns.
 * 3. Writes results incrementally to docs/verb-sentences-YYYY-MM-DD.json.
 * 4. Resume-safe: skips combos already in the output file.
 *
 * Run with:
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... ANTHROPIC_API_KEY=... pnpm seed:verbs
 */

import fs from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import type { Database } from '../supabase/types'
import { CONJUGATION_TENSES, TENSE_LABELS } from '../verbs/constants'

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

// ── Verb data ─────────────────────────────────────────────────────────────────

type VerbData = {
  infinitive: string
  english: string
  frequency_rank: number
  verb_group: 'ar' | 'er' | 'ir' | 'irregular'
}

const VERB_DATA: VerbData[] = [
  { infinitive: 'ser',       english: 'to be (permanent)',   frequency_rank: 1,  verb_group: 'irregular' },
  { infinitive: 'estar',     english: 'to be (temporary)',   frequency_rank: 2,  verb_group: 'irregular' },
  { infinitive: 'haber',     english: 'to have (auxiliary)', frequency_rank: 3,  verb_group: 'irregular' },
  { infinitive: 'tener',     english: 'to have',             frequency_rank: 4,  verb_group: 'irregular' },
  { infinitive: 'hacer',     english: 'to do / make',        frequency_rank: 5,  verb_group: 'irregular' },
  { infinitive: 'poder',     english: 'to be able to',       frequency_rank: 6,  verb_group: 'irregular' },
  { infinitive: 'decir',     english: 'to say / tell',       frequency_rank: 7,  verb_group: 'irregular' },
  { infinitive: 'ir',        english: 'to go',               frequency_rank: 8,  verb_group: 'irregular' },
  { infinitive: 'ver',       english: 'to see',              frequency_rank: 9,  verb_group: 'irregular' },
  { infinitive: 'dar',       english: 'to give',             frequency_rank: 10, verb_group: 'irregular' },
  { infinitive: 'saber',     english: 'to know (facts)',     frequency_rank: 11, verb_group: 'irregular' },
  { infinitive: 'querer',    english: 'to want / love',      frequency_rank: 12, verb_group: 'irregular' },
  { infinitive: 'llegar',    english: 'to arrive',           frequency_rank: 13, verb_group: 'ar' },
  { infinitive: 'pasar',     english: 'to pass / happen',    frequency_rank: 14, verb_group: 'ar' },
  { infinitive: 'deber',     english: 'to owe / must',       frequency_rank: 15, verb_group: 'er' },
  { infinitive: 'poner',     english: 'to put / place',      frequency_rank: 16, verb_group: 'irregular' },
  { infinitive: 'parecer',   english: 'to seem / appear',    frequency_rank: 17, verb_group: 'er' },
  { infinitive: 'quedar',    english: 'to stay / remain',    frequency_rank: 18, verb_group: 'ar' },
  { infinitive: 'creer',     english: 'to believe / think',  frequency_rank: 19, verb_group: 'er' },
  { infinitive: 'hablar',    english: 'to speak / talk',     frequency_rank: 20, verb_group: 'ar' },
  { infinitive: 'llevar',    english: 'to carry / wear',     frequency_rank: 21, verb_group: 'ar' },
  { infinitive: 'dejar',     english: 'to leave / let',      frequency_rank: 22, verb_group: 'ar' },
  { infinitive: 'seguir',    english: 'to follow / continue',frequency_rank: 23, verb_group: 'irregular' },
  { infinitive: 'encontrar', english: 'to find / meet',      frequency_rank: 24, verb_group: 'ar' },
  { infinitive: 'llamar',    english: 'to call / name',      frequency_rank: 25, verb_group: 'ar' },
  { infinitive: 'venir',     english: 'to come',             frequency_rank: 26, verb_group: 'irregular' },
  { infinitive: 'pensar',    english: 'to think',            frequency_rank: 27, verb_group: 'ar' },
  { infinitive: 'salir',     english: 'to go out / leave',   frequency_rank: 28, verb_group: 'irregular' },
  { infinitive: 'volver',    english: 'to return / come back',frequency_rank: 29, verb_group: 'er' },
  { infinitive: 'tomar',     english: 'to take / drink',     frequency_rank: 30, verb_group: 'ar' },
  { infinitive: 'conocer',   english: 'to know (people)',    frequency_rank: 31, verb_group: 'er' },
  { infinitive: 'vivir',     english: 'to live',             frequency_rank: 32, verb_group: 'ir' },
  { infinitive: 'sentir',    english: 'to feel',             frequency_rank: 33, verb_group: 'irregular' },
  { infinitive: 'tratar',    english: 'to try / treat',      frequency_rank: 34, verb_group: 'ar' },
  { infinitive: 'mirar',     english: 'to look at / watch',  frequency_rank: 35, verb_group: 'ar' },
  { infinitive: 'contar',    english: 'to count / tell',     frequency_rank: 36, verb_group: 'ar' },
  { infinitive: 'empezar',   english: 'to begin / start',    frequency_rank: 37, verb_group: 'ar' },
  { infinitive: 'esperar',   english: 'to wait / hope',      frequency_rank: 38, verb_group: 'ar' },
  { infinitive: 'buscar',    english: 'to look for',         frequency_rank: 39, verb_group: 'ar' },
  { infinitive: 'existir',   english: 'to exist',            frequency_rank: 40, verb_group: 'ir' },
  { infinitive: 'entrar',    english: 'to enter',            frequency_rank: 41, verb_group: 'ar' },
  { infinitive: 'trabajar',  english: 'to work',             frequency_rank: 42, verb_group: 'ar' },
  { infinitive: 'escribir',  english: 'to write',            frequency_rank: 43, verb_group: 'ir' },
  { infinitive: 'perder',    english: 'to lose / miss',      frequency_rank: 44, verb_group: 'er' },
  { infinitive: 'producir',  english: 'to produce',          frequency_rank: 45, verb_group: 'irregular' },
  { infinitive: 'ocurrir',   english: 'to occur / happen',   frequency_rank: 46, verb_group: 'ir' },
  { infinitive: 'entender',  english: 'to understand',       frequency_rank: 47, verb_group: 'er' },
  { infinitive: 'pedir',     english: 'to ask for / request',frequency_rank: 48, verb_group: 'irregular' },
  { infinitive: 'recibir',   english: 'to receive',          frequency_rank: 49, verb_group: 'ir' },
  { infinitive: 'recordar',  english: 'to remember',         frequency_rank: 50,  verb_group: 'ar' },
  { infinitive: 'abrir',     english: 'to open',             frequency_rank: 51,  verb_group: 'ir' },
  { infinitive: 'leer',      english: 'to read',             frequency_rank: 52,  verb_group: 'er' },
  { infinitive: 'correr',    english: 'to run',              frequency_rank: 53,  verb_group: 'er' },
  { infinitive: 'subir',     english: 'to go up / rise',     frequency_rank: 54,  verb_group: 'ir' },
  { infinitive: 'acabar',    english: 'to finish / end up',  frequency_rank: 55,  verb_group: 'ar' },
  { infinitive: 'mostrar',   english: 'to show',             frequency_rank: 56,  verb_group: 'ar' },
  { infinitive: 'pagar',     english: 'to pay',              frequency_rank: 57,  verb_group: 'ar' },
  { infinitive: 'aprender',  english: 'to learn',            frequency_rank: 58,  verb_group: 'er' },
  { infinitive: 'servir',    english: 'to serve',            frequency_rank: 59,  verb_group: 'irregular' },
  { infinitive: 'cerrar',    english: 'to close',            frequency_rank: 60,  verb_group: 'ar' },
  { infinitive: 'ayudar',    english: 'to help',             frequency_rank: 61,  verb_group: 'ar' },
  { infinitive: 'escuchar',  english: 'to listen to',        frequency_rank: 62,  verb_group: 'ar' },
  { infinitive: 'comprar',   english: 'to buy',              frequency_rank: 63,  verb_group: 'ar' },
  { infinitive: 'ganar',     english: 'to win / earn',       frequency_rank: 64,  verb_group: 'ar' },
  { infinitive: 'caer',      english: 'to fall',             frequency_rank: 65,  verb_group: 'irregular' },
  { infinitive: 'romper',    english: 'to break',            frequency_rank: 66,  verb_group: 'er' },
  { infinitive: 'permitir',  english: 'to allow / permit',   frequency_rank: 67,  verb_group: 'ir' },
  { infinitive: 'ofrecer',   english: 'to offer',            frequency_rank: 68,  verb_group: 'er' },
  { infinitive: 'mantener',  english: 'to maintain / keep',  frequency_rank: 69,  verb_group: 'irregular' },
  { infinitive: 'suponer',   english: 'to suppose / assume', frequency_rank: 70,  verb_group: 'irregular' },
  { infinitive: 'nacer',     english: 'to be born',          frequency_rank: 71,  verb_group: 'er' },
  { infinitive: 'morir',     english: 'to die',              frequency_rank: 72,  verb_group: 'irregular' },
  { infinitive: 'necesitar', english: 'to need',             frequency_rank: 73,  verb_group: 'ar' },
  { infinitive: 'cambiar',   english: 'to change',           frequency_rank: 74,  verb_group: 'ar' },
  { infinitive: 'crear',     english: 'to create',           frequency_rank: 75,  verb_group: 'ar' },
  { infinitive: 'conseguir', english: 'to achieve / get',    frequency_rank: 76,  verb_group: 'irregular' },
  { infinitive: 'presentar', english: 'to present / introduce', frequency_rank: 77, verb_group: 'ar' },
  { infinitive: 'preguntar', english: 'to ask',              frequency_rank: 78,  verb_group: 'ar' },
  { infinitive: 'terminar',  english: 'to finish / end',     frequency_rank: 79,  verb_group: 'ar' },
  { infinitive: 'lograr',    english: 'to achieve / manage to', frequency_rank: 80, verb_group: 'ar' },
  { infinitive: 'levantar',  english: 'to lift / raise',     frequency_rank: 81,  verb_group: 'ar' },
  { infinitive: 'realizar',  english: 'to carry out / achieve', frequency_rank: 82, verb_group: 'ar' },
  { infinitive: 'añadir',    english: 'to add',              frequency_rank: 83,  verb_group: 'ir' },
  { infinitive: 'cumplir',   english: 'to fulfill / complete', frequency_rank: 84, verb_group: 'ir' },
  { infinitive: 'explicar',  english: 'to explain',          frequency_rank: 85,  verb_group: 'ar' },
  { infinitive: 'guardar',   english: 'to keep / save',      frequency_rank: 86,  verb_group: 'ar' },
  { infinitive: 'bajar',     english: 'to go down / lower',  frequency_rank: 87,  verb_group: 'ar' },
  { infinitive: 'sufrir',    english: 'to suffer',           frequency_rank: 88,  verb_group: 'ir' },
  { infinitive: 'meter',     english: 'to put / insert',     frequency_rank: 89,  verb_group: 'er' },
  { infinitive: 'repetir',   english: 'to repeat',           frequency_rank: 90,  verb_group: 'irregular' },
  { infinitive: 'convertir', english: 'to convert / turn into', frequency_rank: 91, verb_group: 'irregular' },
  { infinitive: 'sacar',     english: 'to take out / get',   frequency_rank: 92,  verb_group: 'ar' },
  { infinitive: 'comer',     english: 'to eat',              frequency_rank: 93,  verb_group: 'er' },
  { infinitive: 'beber',     english: 'to drink',            frequency_rank: 94,  verb_group: 'er' },
  { infinitive: 'dormir',    english: 'to sleep',            frequency_rank: 95,  verb_group: 'irregular' },
  { infinitive: 'jugar',     english: 'to play',             frequency_rank: 96,  verb_group: 'ar' },
  { infinitive: 'traer',     english: 'to bring',            frequency_rank: 97,  verb_group: 'irregular' },
  { infinitive: 'limpiar',   english: 'to clean',            frequency_rank: 98,  verb_group: 'ar' },
  { infinitive: 'lanzar',    english: 'to launch / throw',   frequency_rank: 99,  verb_group: 'ar' },
  { infinitive: 'construir', english: 'to build / construct', frequency_rank: 100, verb_group: 'irregular' },
  // ── 101–150 ────────────────────────────────────────────────────────────────
  { infinitive: 'tocar',     english: 'to touch / play (instrument)', frequency_rank: 101, verb_group: 'ar' },
  { infinitive: 'importar',  english: 'to matter / import',      frequency_rank: 102, verb_group: 'ar' },
  { infinitive: 'intentar',  english: 'to try / attempt',        frequency_rank: 103, verb_group: 'ar' },
  { infinitive: 'resultar',  english: 'to result / turn out',    frequency_rank: 104, verb_group: 'ar' },
  { infinitive: 'dirigir',   english: 'to direct / lead',        frequency_rank: 105, verb_group: 'ir' },
  { infinitive: 'reconocer', english: 'to recognize',            frequency_rank: 106, verb_group: 'er' },
  { infinitive: 'considerar',english: 'to consider',             frequency_rank: 107, verb_group: 'ar' },
  { infinitive: 'formar',    english: 'to form / shape',         frequency_rank: 108, verb_group: 'ar' },
  { infinitive: 'representar',english: 'to represent',           frequency_rank: 109, verb_group: 'ar' },
  { infinitive: 'olvidar',   english: 'to forget',               frequency_rank: 110, verb_group: 'ar' },
  { infinitive: 'alcanzar',  english: 'to reach / achieve',      frequency_rank: 111, verb_group: 'ar' },
  { infinitive: 'responder', english: 'to answer / respond',     frequency_rank: 112, verb_group: 'er' },
  { infinitive: 'mover',     english: 'to move',                 frequency_rank: 113, verb_group: 'er' },
  { infinitive: 'corresponder',english: 'to correspond / belong',frequency_rank: 114, verb_group: 'er' },
  { infinitive: 'señalar',   english: 'to point out / signal',   frequency_rank: 115, verb_group: 'ar' },
  { infinitive: 'superar',   english: 'to overcome / surpass',   frequency_rank: 116, verb_group: 'ar' },
  { infinitive: 'utilizar',  english: 'to use / utilize',        frequency_rank: 117, verb_group: 'ar' },
  { infinitive: 'establecer',english: 'to establish',            frequency_rank: 118, verb_group: 'er' },
  { infinitive: 'ocupar',    english: 'to occupy',               frequency_rank: 119, verb_group: 'ar' },
  { infinitive: 'expresar',  english: 'to express',              frequency_rank: 120, verb_group: 'ar' },
  { infinitive: 'desarrollar',english: 'to develop',             frequency_rank: 121, verb_group: 'ar' },
  { infinitive: 'funcionar', english: 'to function / work',      frequency_rank: 122, verb_group: 'ar' },
  { infinitive: 'surgir',    english: 'to arise / emerge',       frequency_rank: 123, verb_group: 'ir' },
  { infinitive: 'casar',     english: 'to marry',                frequency_rank: 124, verb_group: 'ar' },
  { infinitive: 'detener',   english: 'to stop / detain',        frequency_rank: 125, verb_group: 'irregular' },
  { infinitive: 'dedicar',   english: 'to dedicate / devote',    frequency_rank: 126, verb_group: 'ar' },
  { infinitive: 'descubrir', english: 'to discover',             frequency_rank: 127, verb_group: 'ir' },
  { infinitive: 'proponer',  english: 'to propose / suggest',    frequency_rank: 128, verb_group: 'irregular' },
  { infinitive: 'exigir',    english: 'to demand / require',     frequency_rank: 129, verb_group: 'ir' },
  { infinitive: 'aprovechar',english: 'to take advantage of',    frequency_rank: 130, verb_group: 'ar' },
  { infinitive: 'indicar',   english: 'to indicate / point out', frequency_rank: 131, verb_group: 'ar' },
  { infinitive: 'compartir', english: 'to share',                frequency_rank: 132, verb_group: 'ir' },
  { infinitive: 'aceptar',   english: 'to accept',               frequency_rank: 133, verb_group: 'ar' },
  { infinitive: 'asegurar',  english: 'to assure / ensure',      frequency_rank: 134, verb_group: 'ar' },
  { infinitive: 'afirmar',   english: 'to affirm / state',       frequency_rank: 135, verb_group: 'ar' },
  { infinitive: 'preparar',  english: 'to prepare',              frequency_rank: 136, verb_group: 'ar' },
  { infinitive: 'decidir',   english: 'to decide',               frequency_rank: 137, verb_group: 'ir' },
  { infinitive: 'imaginar',  english: 'to imagine',              frequency_rank: 138, verb_group: 'ar' },
  { infinitive: 'elegir',    english: 'to choose / elect',       frequency_rank: 139, verb_group: 'irregular' },
  { infinitive: 'reunir',    english: 'to gather / collect',     frequency_rank: 140, verb_group: 'ir' },
  { infinitive: 'disponer',  english: 'to arrange / have available', frequency_rank: 141, verb_group: 'irregular' },
  { infinitive: 'observar',  english: 'to observe / watch',      frequency_rank: 142, verb_group: 'ar' },
  { infinitive: 'impedir',   english: 'to prevent / hinder',     frequency_rank: 143, verb_group: 'irregular' },
  { infinitive: 'reducir',   english: 'to reduce',               frequency_rank: 144, verb_group: 'irregular' },
  { infinitive: 'referir',   english: 'to refer',                frequency_rank: 145, verb_group: 'irregular' },
  { infinitive: 'mejorar',   english: 'to improve',              frequency_rank: 146, verb_group: 'ar' },
  { infinitive: 'proteger',  english: 'to protect',              frequency_rank: 147, verb_group: 'er' },
  { infinitive: 'aplicar',   english: 'to apply',                frequency_rank: 148, verb_group: 'ar' },
  { infinitive: 'resolver',  english: 'to resolve / solve',      frequency_rank: 149, verb_group: 'er' },
  { infinitive: 'defender',  english: 'to defend',               frequency_rank: 150, verb_group: 'er' },
  // ── 151–200 ────────────────────────────────────────────────────────────────
  { infinitive: 'demostrar', english: 'to demonstrate / show',   frequency_rank: 151, verb_group: 'ar' },
  { infinitive: 'participar',english: 'to participate',          frequency_rank: 152, verb_group: 'ar' },
  { infinitive: 'crecer',    english: 'to grow',                 frequency_rank: 153, verb_group: 'er' },
  { infinitive: 'definir',   english: 'to define',               frequency_rank: 154, verb_group: 'ir' },
  { infinitive: 'acompañar', english: 'to accompany',            frequency_rank: 155, verb_group: 'ar' },
  { infinitive: 'enviar',    english: 'to send',                 frequency_rank: 156, verb_group: 'ar' },
  { infinitive: 'provocar',  english: 'to provoke / cause',      frequency_rank: 157, verb_group: 'ar' },
  { infinitive: 'obligar',   english: 'to force / oblige',       frequency_rank: 158, verb_group: 'ar' },
  { infinitive: 'acercar',   english: 'to bring closer',         frequency_rank: 159, verb_group: 'ar' },
  { infinitive: 'cortar',    english: 'to cut',                  frequency_rank: 160, verb_group: 'ar' },
  { infinitive: 'anunciar',  english: 'to announce',             frequency_rank: 161, verb_group: 'ar' },
  { infinitive: 'conducir',  english: 'to drive / lead',         frequency_rank: 162, verb_group: 'irregular' },
  { infinitive: 'preferir',  english: 'to prefer',               frequency_rank: 163, verb_group: 'irregular' },
  { infinitive: 'comprobar', english: 'to check / verify',       frequency_rank: 164, verb_group: 'ar' },
  { infinitive: 'prometer',  english: 'to promise',              frequency_rank: 165, verb_group: 'er' },
  { infinitive: 'matar',     english: 'to kill',                 frequency_rank: 166, verb_group: 'ar' },
  { infinitive: 'sugerir',   english: 'to suggest',              frequency_rank: 167, verb_group: 'irregular' },
  { infinitive: 'sostener',  english: 'to sustain / hold',       frequency_rank: 168, verb_group: 'irregular' },
  { infinitive: 'oír',       english: 'to hear',                 frequency_rank: 169, verb_group: 'irregular' },
  { infinitive: 'celebrar',  english: 'to celebrate',            frequency_rank: 170, verb_group: 'ar' },
  { infinitive: 'distinguir',english: 'to distinguish',          frequency_rank: 171, verb_group: 'ir' },
  { infinitive: 'garantizar',english: 'to guarantee',            frequency_rank: 172, verb_group: 'ar' },
  { infinitive: 'obtener',   english: 'to obtain / get',         frequency_rank: 173, verb_group: 'irregular' },
  { infinitive: 'instalar',  english: 'to install',              frequency_rank: 174, verb_group: 'ar' },
  { infinitive: 'transformar',english: 'to transform',           frequency_rank: 175, verb_group: 'ar' },
  { infinitive: 'tardar',    english: 'to take (time) / delay',  frequency_rank: 176, verb_group: 'ar' },
  { infinitive: 'aumentar',  english: 'to increase / raise',     frequency_rank: 177, verb_group: 'ar' },
  { infinitive: 'soler',     english: 'to tend to / usually do', frequency_rank: 178, verb_group: 'er' },
  { infinitive: 'renunciar', english: 'to give up / resign',     frequency_rank: 179, verb_group: 'ar' },
  { infinitive: 'recoger',   english: 'to pick up / collect',    frequency_rank: 180, verb_group: 'er' },
  { infinitive: 'cubrir',    english: 'to cover',                frequency_rank: 181, verb_group: 'ir' },
  { infinitive: 'durar',     english: 'to last',                 frequency_rank: 182, verb_group: 'ar' },
  { infinitive: 'rechazar',  english: 'to reject / refuse',      frequency_rank: 183, verb_group: 'ar' },
  { infinitive: 'invertir',  english: 'to invest / reverse',     frequency_rank: 184, verb_group: 'irregular' },
  { infinitive: 'identificar',english: 'to identify',            frequency_rank: 185, verb_group: 'ar' },
  { infinitive: 'ejercer',   english: 'to practice / exert',     frequency_rank: 186, verb_group: 'er' },
  { infinitive: 'generar',   english: 'to generate',             frequency_rank: 187, verb_group: 'ar' },
  { infinitive: 'asumir',    english: 'to assume / take on',     frequency_rank: 188, verb_group: 'ir' },
  { infinitive: 'despertar', english: 'to wake up',              frequency_rank: 189, verb_group: 'ar' },
  { infinitive: 'incorporar',english: 'to incorporate / join',   frequency_rank: 190, verb_group: 'ar' },
  { infinitive: 'relacionar',english: 'to relate / connect',     frequency_rank: 191, verb_group: 'ar' },
  { infinitive: 'soñar',     english: 'to dream',                frequency_rank: 192, verb_group: 'ar' },
  { infinitive: 'bastar',    english: 'to be enough / suffice',  frequency_rank: 193, verb_group: 'ar' },
  { infinitive: 'llorar',    english: 'to cry',                  frequency_rank: 194, verb_group: 'ar' },
  { infinitive: 'negociar',  english: 'to negotiate',            frequency_rank: 195, verb_group: 'ar' },
  { infinitive: 'pertenecer',english: 'to belong',               frequency_rank: 196, verb_group: 'er' },
  { infinitive: 'constituir',english: 'to constitute / form',    frequency_rank: 197, verb_group: 'irregular' },
  { infinitive: 'depender',  english: 'to depend',               frequency_rank: 198, verb_group: 'er' },
  { infinitive: 'dominar',   english: 'to dominate / master',    frequency_rank: 199, verb_group: 'ar' },
  { infinitive: 'enseñar',   english: 'to teach / show',         frequency_rank: 200, verb_group: 'ar' },
  // ── 201–250 ────────────────────────────────────────────────────────────────
  { infinitive: 'disculpar', english: 'to forgive / excuse',     frequency_rank: 201, verb_group: 'ar' },
  { infinitive: 'manejar',   english: 'to handle / drive',       frequency_rank: 202, verb_group: 'ar' },
  { infinitive: 'echar',     english: 'to throw / pour',         frequency_rank: 203, verb_group: 'ar' },
  { infinitive: 'notar',     english: 'to notice',               frequency_rank: 204, verb_group: 'ar' },
  { infinitive: 'desear',    english: 'to wish / desire',        frequency_rank: 205, verb_group: 'ar' },
  { infinitive: 'revisar',   english: 'to review / check',       frequency_rank: 206, verb_group: 'ar' },
  { infinitive: 'denunciar', english: 'to report / denounce',    frequency_rank: 207, verb_group: 'ar' },
  { infinitive: 'organizar', english: 'to organize',             frequency_rank: 208, verb_group: 'ar' },
  { infinitive: 'aprobar',   english: 'to approve / pass',       frequency_rank: 209, verb_group: 'ar' },
  { infinitive: 'avanzar',   english: 'to advance / move forward', frequency_rank: 210, verb_group: 'ar' },
  { infinitive: 'cocinar',   english: 'to cook',                 frequency_rank: 211, verb_group: 'ar' },
  { infinitive: 'advertir',  english: 'to warn / notice',        frequency_rank: 212, verb_group: 'irregular' },
  { infinitive: 'agregar',   english: 'to add / attach',         frequency_rank: 213, verb_group: 'ar' },
  { infinitive: 'ahorrar',   english: 'to save (money/time)',    frequency_rank: 214, verb_group: 'ar' },
  { infinitive: 'apoyar',    english: 'to support / lean on',    frequency_rank: 215, verb_group: 'ar' },
  { infinitive: 'comunicar', english: 'to communicate',          frequency_rank: 216, verb_group: 'ar' },
  { infinitive: 'confiar',   english: 'to trust / confide',      frequency_rank: 217, verb_group: 'ar' },
  { infinitive: 'destruir',  english: 'to destroy',              frequency_rank: 218, verb_group: 'irregular' },
  { infinitive: 'devolver',  english: 'to return / give back',   frequency_rank: 219, verb_group: 'er' },
  { infinitive: 'disfrutar', english: 'to enjoy',                frequency_rank: 220, verb_group: 'ar' },
  { infinitive: 'distribuir',english: 'to distribute',           frequency_rank: 221, verb_group: 'irregular' },
  { infinitive: 'enfrentar', english: 'to face / confront',      frequency_rank: 222, verb_group: 'ar' },
  { infinitive: 'engañar',   english: 'to deceive / trick',      frequency_rank: 223, verb_group: 'ar' },
  { infinitive: 'explorar',  english: 'to explore',              frequency_rank: 224, verb_group: 'ar' },
  { infinitive: 'experimentar',english: 'to experience / experiment', frequency_rank: 225, verb_group: 'ar' },
  { infinitive: 'facilitar', english: 'to facilitate / provide', frequency_rank: 226, verb_group: 'ar' },
  { infinitive: 'fijar',     english: 'to fix / set',            frequency_rank: 227, verb_group: 'ar' },
  { infinitive: 'huir',      english: 'to flee / run away',      frequency_rank: 228, verb_group: 'irregular' },
  { infinitive: 'influir',   english: 'to influence',            frequency_rank: 229, verb_group: 'irregular' },
  { infinitive: 'insistir',  english: 'to insist',               frequency_rank: 230, verb_group: 'ir' },
  { infinitive: 'interpretar',english: 'to interpret / perform', frequency_rank: 231, verb_group: 'ar' },
  { infinitive: 'investigar',english: 'to investigate / research', frequency_rank: 232, verb_group: 'ar' },
  { infinitive: 'juzgar',    english: 'to judge',                frequency_rank: 233, verb_group: 'ar' },
  { infinitive: 'luchar',    english: 'to fight / struggle',     frequency_rank: 234, verb_group: 'ar' },
  { infinitive: 'marchar',   english: 'to march / leave',        frequency_rank: 235, verb_group: 'ar' },
  { infinitive: 'mencionar', english: 'to mention',              frequency_rank: 236, verb_group: 'ar' },
  { infinitive: 'modificar', english: 'to modify / change',      frequency_rank: 237, verb_group: 'ar' },
  { infinitive: 'negar',     english: 'to deny / refuse',        frequency_rank: 238, verb_group: 'ar' },
  { infinitive: 'oponer',    english: 'to oppose',               frequency_rank: 239, verb_group: 'irregular' },
  { infinitive: 'planear',   english: 'to plan',                 frequency_rank: 240, verb_group: 'ar' },
  { infinitive: 'publicar',  english: 'to publish',              frequency_rank: 241, verb_group: 'ar' },
  { infinitive: 'quemar',    english: 'to burn',                 frequency_rank: 242, verb_group: 'ar' },
  { infinitive: 'reír',      english: 'to laugh',                frequency_rank: 243, verb_group: 'irregular' },
  { infinitive: 'reparar',   english: 'to repair / notice',      frequency_rank: 244, verb_group: 'ar' },
  { infinitive: 'rescatar',  english: 'to rescue',               frequency_rank: 245, verb_group: 'ar' },
  { infinitive: 'rezar',     english: 'to pray',                 frequency_rank: 246, verb_group: 'ar' },
  { infinitive: 'robar',     english: 'to steal / rob',          frequency_rank: 247, verb_group: 'ar' },
  { infinitive: 'sorprender',english: 'to surprise',             frequency_rank: 248, verb_group: 'er' },
  { infinitive: 'viajar',    english: 'to travel',               frequency_rank: 249, verb_group: 'ar' },
  { infinitive: 'volar',     english: 'to fly',                  frequency_rank: 250, verb_group: 'ar' },
]

// ── Types ─────────────────────────────────────────────────────────────────────

type SentenceEntry = {
  pronoun: string
  sentence: string
  correct_form: string
  tense_rule: string
}

type ComboResult = {
  verb_infinitive: string
  verb_id: string
  tense: string
  sentences: SentenceEntry[]
}

type OutputFile = {
  generated_at: string
  combos: ComboResult[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

function getTodayStr() {
  return new Date().toISOString().split('T')[0]
}

function getOutputPath() {
  const docsDir = path.join(process.cwd(), 'docs')
  fs.mkdirSync(docsDir, { recursive: true })
  return path.join(docsDir, `verb-sentences-${getTodayStr()}.json`)
}

function loadExisting(outputPath: string): OutputFile {
  if (fs.existsSync(outputPath)) {
    return JSON.parse(fs.readFileSync(outputPath, 'utf-8')) as OutputFile
  }
  return { generated_at: new Date().toISOString(), combos: [] }
}

function saveOutput(outputPath: string, data: OutputFile) {
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2))
}

// ── Claude generation ─────────────────────────────────────────────────────────

const IMPERATIVE_TENSES = new Set(['imperative_affirmative', 'imperative_negative'])

function buildSentencePrompt(infinitive: string, tense: string): string {
  const tenseLabel = TENSE_LABELS[tense as keyof typeof TENSE_LABELS] ?? tense

  if (tense === 'imperative_affirmative') {
    return `Generate exactly 5 natural Spanish sentences using the verb "${infinitive}" in the Imperativo Afirmativo.
The imperative has no yo form. Use these 5 pronouns: tú, usted (use pronoun key "el"), nosotros, vosotros, ustedes (use pronoun key "ellos").
Each sentence must contain exactly one blank (written as "_____") where the conjugated verb goes.
The sentences should be natural commands or instructions, appropriate for advanced Spanish learners (B1-B2 level).

Return a JSON array of exactly 5 objects:
[
  {
    "pronoun": "tu",
    "sentence": "_____ los documentos antes de salir.",
    "correct_form": "Firma",
    "tense_rule": "Imperativo afirmativo tú: uses 3rd person singular of present indicative (regular verbs)"
  },
  {
    "pronoun": "el",
    "sentence": "_____ usted un momento, por favor.",
    "correct_form": "Espere",
    "tense_rule": "Imperativo afirmativo usted: uses present subjunctive form"
  },
  {
    "pronoun": "nosotros",
    "sentence": "_____ juntos esta tarde.",
    "correct_form": "Estudiemos",
    "tense_rule": "Imperativo afirmativo nosotros: uses present subjunctive nosotros form"
  },
  {
    "pronoun": "vosotros",
    "sentence": "_____ la puerta al salir.",
    "correct_form": "Cerrad",
    "tense_rule": "Imperativo afirmativo vosotros: replace -r of infinitive with -d"
  },
  {
    "pronoun": "ellos",
    "sentence": "_____ ustedes con cuidado.",
    "correct_form": "Caminen",
    "tense_rule": "Imperativo afirmativo ustedes: uses present subjunctive ustedes form"
  }
]
Only return the JSON array. No other text. The tense_rule should be a short, helpful rule (max 15 words).`
  }

  if (tense === 'imperative_negative') {
    return `Generate exactly 5 natural Spanish sentences using the verb "${infinitive}" in the Imperativo Negativo.
The imperative has no yo form. Use these 5 pronouns: tú, usted (use pronoun key "el"), nosotros, vosotros, ustedes (use pronoun key "ellos").
Each sentence must start with "No" and contain exactly one blank (written as "_____") where the conjugated verb goes.
The correct_form should be ONLY the conjugated verb form (without "no").
The sentences should be natural prohibitions, appropriate for advanced Spanish learners (B1-B2 level).

Return a JSON array of exactly 5 objects:
[
  {
    "pronoun": "tu",
    "sentence": "No _____ el teléfono durante la reunión.",
    "correct_form": "uses",
    "tense_rule": "Imperativo negativo tú: no + present subjunctive tú form"
  },
  {
    "pronoun": "el",
    "sentence": "No _____ usted sin permiso.",
    "correct_form": "salga",
    "tense_rule": "Imperativo negativo usted: no + present subjunctive usted form"
  },
  {
    "pronoun": "nosotros",
    "sentence": "No _____ el tiempo en cosas sin importancia.",
    "correct_form": "perdamos",
    "tense_rule": "Imperativo negativo nosotros: no + present subjunctive nosotros form"
  },
  {
    "pronoun": "vosotros",
    "sentence": "No _____ ruido por la noche.",
    "correct_form": "hagáis",
    "tense_rule": "Imperativo negativo vosotros: no + present subjunctive vosotros form"
  },
  {
    "pronoun": "ellos",
    "sentence": "No _____ ustedes la ventana abierta.",
    "correct_form": "dejen",
    "tense_rule": "Imperativo negativo ustedes: no + present subjunctive ustedes form"
  }
]
Only return the JSON array. No other text. The tense_rule should be a short, helpful rule (max 15 words).`
  }

  // Default: non-imperative tenses use yo / tú / él / nosotros / ellos
  return `Generate exactly 5 natural Spanish sentences using the verb "${infinitive}" in the ${tenseLabel} tense.
Use 5 different subject pronouns: yo, tú, él/ella, nosotros, ellos/ellas.
Each sentence must contain exactly one blank (written as "_____") where the conjugated verb goes.
The sentences should be natural, varied, and appropriate for advanced Spanish learners (B1-B2 level).

Return a JSON array of exactly 5 objects:
[
  {
    "pronoun": "yo",
    "sentence": "Ayer yo _____ al mercado con mi familia.",
    "correct_form": "fui",
    "tense_rule": "ir/ser are irregular in preterite: fui, fuiste, fue, fuimos, fuisteis, fueron"
  },
  {
    "pronoun": "tu",
    "sentence": "...",
    "correct_form": "...",
    "tense_rule": "..."
  },
  {
    "pronoun": "el",
    "sentence": "...",
    "correct_form": "...",
    "tense_rule": "..."
  },
  {
    "pronoun": "nosotros",
    "sentence": "...",
    "correct_form": "...",
    "tense_rule": "..."
  },
  {
    "pronoun": "ellos",
    "sentence": "...",
    "correct_form": "...",
    "tense_rule": "..."
  }
]
Only return the JSON array. No other text. The tense_rule should be a short, helpful rule (max 15 words).`
}

async function generateSentences(infinitive: string, tense: string): Promise<SentenceEntry[]> {
  const prompt = buildSentencePrompt(infinitive, tense)

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type')

  // Strip markdown fences if present
  let text = content.text.trim()
  if (text.startsWith('```')) {
    text = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
  }

  const parsed = JSON.parse(text) as SentenceEntry[]
  if (!Array.isArray(parsed) || parsed.length !== 5) {
    throw new Error(`Expected 5 sentences, got ${Array.isArray(parsed) ? parsed.length : 'non-array'}`)
  }

  // Validate imperative sentences don't use yo
  if (IMPERATIVE_TENSES.has(tense)) {
    for (const s of parsed) {
      if (s.pronoun === 'yo') {
        throw new Error(`Imperative sentence incorrectly uses pronoun "yo"`)
      }
    }
  }

  return parsed
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const outputPath = getOutputPath()
  const output = loadExisting(outputPath)

  // Build set of already-done combos
  const done = new Set(output.combos.map((c) => `${c.verb_infinitive}:${c.tense}`))

  console.log(`Output: ${outputPath}`)
  console.log(`Already done: ${done.size} / ${VERB_DATA.length * CONJUGATION_TENSES.length} combos (${VERB_DATA.length} verbs × ${CONJUGATION_TENSES.length} tenses)`)

  // Step 1: Upsert verbs and get their IDs
  console.log('\n── Upserting verbs table ──')
  const { data: verbRows, error: verbErr } = await supabase
    .from('verbs')
    .upsert(VERB_DATA, { onConflict: 'infinitive' })
    .select('id, infinitive')

  if (verbErr || !verbRows) {
    console.error('Failed to upsert verbs:', verbErr)
    process.exit(1)
  }

  const verbIdMap = new Map(verbRows.map((v) => [v.infinitive, v.id]))
  console.log(`Verbs in DB: ${verbRows.length}`)

  // Step 2: Generate sentences for each combo
  let generated = 0
  let errors = 0

  for (const verb of VERB_DATA) {
    const verbId = verbIdMap.get(verb.infinitive)
    if (!verbId) {
      console.warn(`No ID for verb: ${verb.infinitive}`)
      continue
    }

    for (const tense of CONJUGATION_TENSES) {
      const key = `${verb.infinitive}:${tense}`
      if (done.has(key)) continue

      try {
        console.log(`Generating: ${verb.infinitive} / ${TENSE_LABELS[tense]}`)
        const sentences = await generateSentences(verb.infinitive, tense)

        output.combos.push({
          verb_infinitive: verb.infinitive,
          verb_id:         verbId,
          tense,
          sentences,
        })

        saveOutput(outputPath, output)
        done.add(key)
        generated++

        // 300ms delay between API calls
        await delay(300)
      } catch (err) {
        console.error(`Error for ${verb.infinitive}/${tense}:`, err)
        errors++
      }
    }
  }

  console.log(`\n✓ Done. Generated: ${generated}, Errors: ${errors}`)
  console.log(`Total combos: ${output.combos.length}`)
  console.log(`\nReview the output at: ${outputPath}`)
  console.log('Then run: pnpm seed:verbs:apply <path>')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
