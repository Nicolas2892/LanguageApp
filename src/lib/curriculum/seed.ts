/**
 * Curriculum seed data — Spanish B1→B2
 *
 * Module 1: Connectors & Discourse Markers
 * Module 2: Subjunctive Mastery
 *
 * Run via: tsx src/lib/curriculum/run-seed.ts
 */

export const SEED_MODULES = [
  {
    title: 'Connectors & Discourse Markers',
    description:
      'Master the linking words and phrases that make Spanish writing coherent and sophisticated at B2 level.',
    order_index: 1,
  },
  {
    title: 'Subjunctive Mastery',
    description:
      'Understand and confidently produce the present and imperfect subjunctive in all its contexts.',
    order_index: 2,
  },
]

export const SEED_UNITS: Array<{
  module_index: number // 0-based index into SEED_MODULES
  title: string
  order_index: number
}> = [
  // Module 1 — Connectors
  { module_index: 0, title: 'Concessive Connectors', order_index: 1 },
  { module_index: 0, title: 'Causal & Consecutive Connectors', order_index: 2 },
  { module_index: 0, title: 'Adversative & Contrast Connectors', order_index: 3 },
  // Module 2 — Subjunctive
  { module_index: 1, title: 'Present Subjunctive Triggers', order_index: 1 },
  { module_index: 1, title: 'Imperfect Subjunctive & Hypotheticals', order_index: 2 },
]

// Concept type aliases for readability
type ConceptSeed = {
  unit_index: number       // 0-based index into SEED_UNITS
  type: string
  title: string
  explanation: string
  examples: Array<{ es: string; en: string }>
  difficulty: number       // 1–5
  level: 'B1' | 'B2' | 'C1'
}

export const SEED_CONCEPTS: ConceptSeed[] = [
  // ─── Unit 0: Concessive Connectors ───────────────────────────────────────

  {
    unit_index: 0,
    type: 'connector',
    title: 'aunque (+ indicativo)',
    explanation:
      '"Aunque" + indicative expresses a real concession: the speaker acknowledges a fact that does not prevent the main clause. Equivalent to "even though / although".',
    examples: [
      { es: 'Aunque está cansado, sigue trabajando.', en: 'Even though he is tired, he keeps working.' },
      { es: 'Aunque llueve, saldremos a pasear.', en: 'Even though it is raining, we will go for a walk.' },
      { es: 'Lo hizo aunque no quería.', en: 'She did it even though she did not want to.' },
    ],
    difficulty: 2,
    level: 'B1',
  },
  {
    unit_index: 0,
    type: 'connector',
    title: 'aunque (+ subjuntivo)',
    explanation:
      '"Aunque" + subjunctive expresses a hypothetical concession: the speaker is not certain about the concessive clause, or is presenting it as irrelevant. Equivalent to "even if".',
    examples: [
      { es: 'Aunque llueva, saldremos a pasear.', en: 'Even if it rains, we will go for a walk.' },
      { es: 'No te creería aunque me lo juraras.', en: 'I would not believe you even if you swore it to me.' },
      { es: 'Aunque sea difícil, lo intentaremos.', en: 'Even if it is difficult, we will try.' },
    ],
    difficulty: 3,
    level: 'B2',
  },
  {
    unit_index: 0,
    type: 'connector',
    title: 'a pesar de (que)',
    explanation:
      '"A pesar de" + noun/infinitive, or "a pesar de que" + indicative/subjunctive. Formal concessive connector meaning "in spite of / despite".',
    examples: [
      { es: 'A pesar del frío, fue a nadar.', en: 'In spite of the cold, she went swimming.' },
      { es: 'A pesar de que estaba enfermo, fue al trabajo.', en: 'Despite being ill, he went to work.' },
      { es: 'A pesar de haberlo estudiado, no aprobó.', en: 'Despite having studied it, she did not pass.' },
    ],
    difficulty: 3,
    level: 'B2',
  },
  {
    unit_index: 0,
    type: 'connector',
    title: 'sin embargo',
    explanation:
      '"Sin embargo" is a formal adversative/concessive connector placed at the start of a clause, meaning "however / nevertheless". It always follows a semicolon or full stop.',
    examples: [
      { es: 'Es caro; sin embargo, merece la pena.', en: 'It is expensive; however, it is worth it.' },
      { es: 'Estudió mucho. Sin embargo, no aprobó.', en: 'She studied a lot. Nevertheless, she did not pass.' },
      { es: 'Me gusta el proyecto; sin embargo, tiene algunos fallos.', en: 'I like the project; however, it has some flaws.' },
    ],
    difficulty: 2,
    level: 'B1',
  },
  {
    unit_index: 0,
    type: 'connector',
    title: 'por más que / por mucho que',
    explanation:
      '"Por más que" and "por mucho que" express a concessive idea of degree: "no matter how much". They require the subjunctive when the concession is general or hypothetical.',
    examples: [
      { es: 'Por más que lo intento, no lo consigo.', en: 'No matter how hard I try, I cannot manage it.' },
      { es: 'Por mucho que insistas, no cambiaré de opinión.', en: 'No matter how much you insist, I will not change my mind.' },
      { es: 'Por más que coma, nunca engorda.', en: 'No matter how much she eats, she never gains weight.' },
    ],
    difficulty: 4,
    level: 'B2',
  },

  // ─── Unit 1: Causal & Consecutive Connectors ─────────────────────────────

  {
    unit_index: 1,
    type: 'connector',
    title: 'puesto que / ya que',
    explanation:
      '"Puesto que" and "ya que" are formal causal connectors meaning "since / given that". Unlike "porque", they present the cause as already known to both speakers.',
    examples: [
      { es: 'Ya que no tienes tiempo, lo haré yo.', en: 'Since you have no time, I will do it.' },
      { es: 'Puesto que todos estamos de acuerdo, procedamos.', en: 'Given that we all agree, let us proceed.' },
      { es: 'Ya que insistes, te lo explicaré.', en: 'Since you insist, I will explain it to you.' },
    ],
    difficulty: 3,
    level: 'B2',
  },
  {
    unit_index: 1,
    type: 'connector',
    title: 'dado que / en vista de que',
    explanation:
      '"Dado que" (given that) and "en vista de que" (in view of the fact that) are formal causal connectors presenting a fact as the obvious reason for something.',
    examples: [
      { es: 'Dado que el tiempo es limitado, seré breve.', en: 'Given that time is limited, I will be brief.' },
      { es: 'En vista de que no llegaba, nos marchamos.', en: 'In view of the fact that she was not arriving, we left.' },
      { es: 'Dado que no hay más preguntas, cerramos la reunión.', en: 'Given that there are no more questions, we close the meeting.' },
    ],
    difficulty: 4,
    level: 'B2',
  },
  {
    unit_index: 1,
    type: 'connector',
    title: 'por lo tanto / por consiguiente',
    explanation:
      '"Por lo tanto" and "por consiguiente" are consecutive connectors meaning "therefore / consequently". They introduce the logical result of the preceding statement.',
    examples: [
      { es: 'No estudió; por lo tanto, suspendió.', en: 'She did not study; therefore, she failed.' },
      { es: 'El presupuesto es insuficiente; por consiguiente, el proyecto se cancela.', en: 'The budget is insufficient; consequently, the project is cancelled.' },
      { es: 'Llegó tarde. Por lo tanto, perdió la reunión.', en: 'He arrived late. Therefore, he missed the meeting.' },
    ],
    difficulty: 2,
    level: 'B1',
  },
  {
    unit_index: 1,
    type: 'connector',
    title: 'de ahí que (+ subjuntivo)',
    explanation:
      '"De ahí que" introduces a consequence and always requires the subjunctive. It means "hence / that is why".',
    examples: [
      { es: 'No había comido; de ahí que estuviera tan cansado.', en: 'He had not eaten; hence why he was so tired.' },
      { es: 'Es muy tímida, de ahí que no hable en público.', en: 'She is very shy, hence why she does not speak in public.' },
      { es: 'Llueve mucho, de ahí que el río esté crecido.', en: 'It rains a lot, hence why the river is swollen.' },
    ],
    difficulty: 5,
    level: 'C1',
  },

  // ─── Unit 2: Adversative & Contrast Connectors ───────────────────────────

  {
    unit_index: 2,
    type: 'connector',
    title: 'no obstante',
    explanation:
      '"No obstante" is a formal adversative connector meaning "nonetheless / notwithstanding". It is interchangeable with "sin embargo" but slightly more formal.',
    examples: [
      { es: 'El plan tiene riesgos; no obstante, seguiremos adelante.', en: 'The plan has risks; nonetheless, we will proceed.' },
      { es: 'Es caro. No obstante, lo compraré.', en: 'It is expensive. Nonetheless, I will buy it.' },
      { es: 'No obstante las dificultades, lograron el objetivo.', en: 'Despite the difficulties, they achieved the goal.' },
    ],
    difficulty: 3,
    level: 'B2',
  },
  {
    unit_index: 2,
    type: 'connector',
    title: 'en cambio / por el contrario',
    explanation:
      '"En cambio" (on the other hand) and "por el contrario" (on the contrary) introduce a contrasting idea. "Por el contrario" is used when directly contradicting the previous statement.',
    examples: [
      { es: 'A mí me encanta el cine; mi hermano, en cambio, prefiere el teatro.', en: 'I love cinema; my brother, on the other hand, prefers theatre.' },
      { es: 'No es difícil; por el contrario, es muy sencillo.', en: 'It is not difficult; on the contrary, it is very simple.' },
      { es: 'Ella es muy ordenada; él, en cambio, es un desastre.', en: 'She is very tidy; he, on the other hand, is a disaster.' },
    ],
    difficulty: 2,
    level: 'B1',
  },
  {
    unit_index: 2,
    type: 'connector',
    title: 'mientras que',
    explanation:
      '"Mientras que" expresses simultaneous contrast between two clauses, meaning "whereas / while". It is used to compare two different situations.',
    examples: [
      { es: 'Tú hablas mucho, mientras que ella apenas dice nada.', en: 'You talk a lot, whereas she barely says anything.' },
      { es: 'El norte es lluvioso, mientras que el sur es árido.', en: 'The north is rainy, while the south is arid.' },
      { es: 'Él trabaja de noche, mientras que ella trabaja de día.', en: 'He works at night, while she works during the day.' },
    ],
    difficulty: 2,
    level: 'B1',
  },

  // ─── Unit 3: Present Subjunctive Triggers ────────────────────────────────

  {
    unit_index: 3,
    type: 'subjunctive',
    title: 'Verbos de deseo (querer, esperar, desear)',
    explanation:
      'Verbs expressing wishes (querer, esperar, desear, ojalá) trigger the subjunctive in the subordinate clause when the subject changes. Pattern: querer que + subjunctive.',
    examples: [
      { es: 'Quiero que vengas a la fiesta.', en: 'I want you to come to the party.' },
      { es: 'Espero que todo salga bien.', en: 'I hope everything goes well.' },
      { es: 'Desean que sus hijos sean felices.', en: 'They want their children to be happy.' },
    ],
    difficulty: 2,
    level: 'B1',
  },
  {
    unit_index: 3,
    type: 'subjunctive',
    title: 'Verbos de emoción (alegrarse, temer, sorprender)',
    explanation:
      'Verbs and expressions of emotion (alegrarse de, temer, sorprender, estar contento de) trigger the subjunctive when the subject of the emotion is different from the subject of the subordinate verb.',
    examples: [
      { es: 'Me alegra que hayas venido.', en: 'I am glad that you have come.' },
      { es: 'Temo que no lleguen a tiempo.', en: 'I fear they will not arrive on time.' },
      { es: 'Me sorprende que no lo sepa.', en: 'I am surprised that she does not know it.' },
    ],
    difficulty: 3,
    level: 'B2',
  },
  {
    unit_index: 3,
    type: 'subjunctive',
    title: 'Verbos de duda y negación (dudar, no creer, negar)',
    explanation:
      'Verbs and phrases expressing doubt or denial (dudar, no creer que, negar que, no estar seguro de que) trigger the subjunctive. Affirmative "creer" takes indicative; negated "no creer" takes subjunctive.',
    examples: [
      { es: 'Dudo que tengas razón.', en: 'I doubt that you are right.' },
      { es: 'No creo que sea tan difícil.', en: 'I do not think it is that difficult.' },
      { es: 'Niega que haya mentido.', en: 'She denies having lied.' },
    ],
    difficulty: 3,
    level: 'B2',
  },
  {
    unit_index: 3,
    type: 'subjunctive',
    title: 'Conjunciones temporales con subjuntivo (cuando, en cuanto, hasta que)',
    explanation:
      'Temporal conjunctions (cuando, en cuanto, hasta que, antes de que) trigger the subjunctive when referring to future or hypothetical events. When referring to habitual or past events, use the indicative.',
    examples: [
      { es: 'Llámame cuando llegues.', en: 'Call me when you arrive.' },
      { es: 'Saldré en cuanto termine.', en: 'I will leave as soon as I finish.' },
      { es: 'Espera hasta que pare de llover.', en: 'Wait until it stops raining.' },
    ],
    difficulty: 4,
    level: 'B2',
  },
  {
    unit_index: 3,
    type: 'subjunctive',
    title: 'Conjunciones finales (para que, a fin de que)',
    explanation:
      '"Para que" and "a fin de que" (so that / in order that) always trigger the subjunctive because they refer to an intended future result whose achievement is uncertain.',
    examples: [
      { es: 'Te lo explico para que lo entiendas.', en: 'I am explaining it to you so that you understand.' },
      { es: 'Habló despacio para que todos pudieran seguirle.', en: 'He spoke slowly so that everyone could follow him.' },
      { es: 'A fin de que no haya dudas, lo repetiré.', en: 'In order that there are no doubts, I will repeat it.' },
    ],
    difficulty: 3,
    level: 'B2',
  },

  // ─── Unit 4: Imperfect Subjunctive & Hypotheticals ───────────────────────

  {
    unit_index: 4,
    type: 'subjunctive',
    title: 'Condicional tipo 2: Si + imperfecto de subjuntivo',
    explanation:
      'The type 2 conditional expresses hypothetical or unlikely situations in the present/future. Pattern: Si + imperfect subjunctive, + conditional. Used when the speaker considers the condition improbable or contrary to reality.',
    examples: [
      { es: 'Si tuviera más tiempo, aprendería a tocar la guitarra.', en: 'If I had more time, I would learn to play the guitar.' },
      { es: 'Si fuera rico, viajaría por todo el mundo.', en: 'If I were rich, I would travel all over the world.' },
      { es: 'Si pudieras elegir, ¿qué harías?', en: 'If you could choose, what would you do?' },
    ],
    difficulty: 4,
    level: 'B2',
  },
  {
    unit_index: 4,
    type: 'subjunctive',
    title: 'Condicional tipo 3: Si + pluscuamperfecto de subjuntivo',
    explanation:
      'The type 3 conditional refers to hypothetical situations in the past that did not happen. Pattern: Si + pluperfect subjunctive, + conditional perfect (or conditional + haber). Used to express regret or speculation about past events.',
    examples: [
      { es: 'Si hubiera estudiado más, habría aprobado.', en: 'If I had studied more, I would have passed.' },
      { es: 'Si hubieras llegado antes, lo habrías visto.', en: 'If you had arrived earlier, you would have seen it.' },
      { es: 'Si no hubiera llovido, habríamos salido.', en: 'If it had not rained, we would have gone out.' },
    ],
    difficulty: 5,
    level: 'C1',
  },
  {
    unit_index: 4,
    type: 'subjunctive',
    title: 'Ojalá + imperfecto de subjuntivo',
    explanation:
      '"Ojalá" + imperfect subjunctive expresses an unlikely or impossible wish in the present. "Ojalá" + present subjunctive expresses a more achievable wish. "Ojalá" + pluperfect subjunctive expresses regret about the past.',
    examples: [
      { es: 'Ojalá tuviera más dinero.', en: 'I wish I had more money. (unlikely now)' },
      { es: 'Ojalá pudiera volar.', en: 'I wish I could fly.' },
      { es: 'Ojalá hubiera ido a la fiesta.', en: 'I wish I had gone to the party.' },
    ],
    difficulty: 4,
    level: 'B2',
  },
  {
    unit_index: 4,
    type: 'subjunctive',
    title: 'Imperfecto de subjuntivo en estilo indirecto',
    explanation:
      'When reporting speech in the past, present subjunctive in the original utterance becomes imperfect subjunctive in reported speech. This is called "concordancia de tiempos" (sequence of tenses).',
    examples: [
      { es: '"Quiero que vengas" → Dijo que quería que fuera.', en: '"I want you to come" → He said he wanted her to come.' },
      { es: '"Espero que apruebe" → Esperaba que aprobara.', en: '"I hope he passes" → She hoped he would pass.' },
      { es: '"No creo que sepa" → No creía que supiera.', en: '"I do not think he knows" → She did not think he knew.' },
    ],
    difficulty: 5,
    level: 'C1',
  },
]

// Exercises seed — at least 2 per concept (concept_index is 0-based into SEED_CONCEPTS)
type ExerciseSeed = {
  concept_index: number
  type: string
  prompt: string
  expected_answer: string | null
  answer_variants: string[] | null
  hint_1: string | null
  hint_2: string | null
}

export const SEED_EXERCISES: ExerciseSeed[] = [
  // aunque + indicativo
  {
    concept_index: 0,
    type: 'gap_fill',
    prompt: '___ hacía mucho calor, los niños salieron a jugar. ___, cuando volvieron a casa, estaban agotados.',
    expected_answer: JSON.stringify(['Aunque', 'Sin embargo']),
    answer_variants: null,
    hint_1: 'Blank 1: "even though" as a concessive connector (+ indicative — real fact).',
    hint_2: 'Blank 2: "however/nevertheless" — formal contrast after a comma.',
  },
  {
    concept_index: 0,
    type: 'transformation',
    prompt: 'Rewrite using "aunque": "Está cansado, pero sigue trabajando."',
    expected_answer: 'Aunque está cansado, sigue trabajando.',
    answer_variants: ['Sigue trabajando aunque está cansado.'],
    hint_1: '"Aunque" replaces the contrast structure "pero" when combining two facts.',
    hint_2: 'Indicative follows "aunque" because the tiredness is a real, confirmed fact.',
  },

  // aunque + subjuntivo
  {
    concept_index: 1,
    type: 'gap_fill',
    prompt: '___ llueva mañana, la boda se celebrará al aire libre. Hemos decidido continuar ___ haya mal tiempo.',
    expected_answer: JSON.stringify(['Aunque', 'aunque']),
    answer_variants: null,
    hint_1: 'Both blanks need the same connector meaning "even if" — it introduces a hypothetical concession.',
    hint_2: '"Even if" with uncertainty about a future event = aunque + present subjunctive.',
  },
  {
    concept_index: 1,
    type: 'translation',
    prompt: 'Translate: "I would not leave even if she asked me to."',
    expected_answer: 'No me iría aunque me lo pidiera.',
    answer_variants: ['Aunque me lo pidiera, no me iría.'],
    hint_1: '"Even if" with a hypothetical = aunque + imperfect subjunctive.',
    hint_2: '"Pedir" in the imperfect subjunctive (ella) = pidiera.',
  },

  // a pesar de que
  {
    concept_index: 2,
    type: 'gap_fill',
    prompt: '___ de que hacía mucho frío, los niños jugaron en el parque durante horas. ___, sus padres los llamaron para entrar.',
    expected_answer: JSON.stringify(['A pesar', 'Sin embargo']),
    answer_variants: null,
    hint_1: 'Blank 1: formal concessive connector meaning "despite" — A ___ de que.',
    hint_2: 'Blank 2: "however/nevertheless" to introduce the contrasting result.',
  },
  {
    concept_index: 2,
    type: 'transformation',
    prompt: 'Combine into one sentence using "a pesar de que": "Llovía mucho." + "Fueron a la playa."',
    expected_answer: 'A pesar de que llovía mucho, fueron a la playa.',
    answer_variants: ['Fueron a la playa a pesar de que llovía mucho.'],
    hint_1: '"A pesar de que" + clause with verb.',
    hint_2: null,
  },

  // sin embargo
  {
    concept_index: 3,
    type: 'gap_fill',
    prompt: 'El informe llegó con retraso; ___, decidimos presentarlo igualmente. ___ de las críticas recibidas, el proyecto siguió adelante.',
    expected_answer: JSON.stringify(['sin embargo', 'A pesar']),
    answer_variants: null,
    hint_1: 'Blank 1: formal contrast connector after semicolon — "however".',
    hint_2: 'Blank 2: "despite" — ___ de las críticas.',
  },
  {
    concept_index: 3,
    type: 'error_correction',
    prompt: 'Find and correct the error: "Es un buen estudiante, sin embargo aprueba todos los exámenes."',
    expected_answer: 'Es un buen estudiante; sin embargo, aprueba todos los exámenes.',
    answer_variants: null,
    hint_1: '"Sin embargo" must follow a semicolon or full stop, not a comma.',
    hint_2: 'Also check: does the sentence make logical sense with a contrast connector?',
  },

  // por más que
  {
    concept_index: 4,
    type: 'gap_fill',
    prompt: '___ que lo intento, no consigo pronunciar la "r" española. ___ de mis esfuerzos, el acento sigue siendo difícil.',
    expected_answer: JSON.stringify(['Por más', 'A pesar']),
    answer_variants: null,
    hint_1: 'Blank 1: "no matter how much I try" — Por ___ que.',
    hint_2: 'Blank 2: "despite" — ___ de mis esfuerzos.',
  },
  {
    concept_index: 4,
    type: 'translation',
    prompt: 'Translate: "No matter how much she practises, she cannot get it right."',
    expected_answer: 'Por más que practique, no lo consigue hacer bien.',
    answer_variants: ['Por mucho que practique, no lo consigue.'],
    hint_1: '"No matter how much" = por más que / por mucho que + subjunctive.',
    hint_2: null,
  },

  // puesto que / ya que
  {
    concept_index: 5,
    type: 'gap_fill',
    prompt: '___ no tienes hambre, no hace falta que comas. ___, podemos salir antes de lo previsto.',
    expected_answer: JSON.stringify(['Ya que', 'Por lo tanto']),
    answer_variants: null,
    hint_1: 'Blank 1: "since/given that" — the cause is already known to both speakers.',
    hint_2: 'Blank 2: logical consequence connector — "therefore".',
  },
  {
    concept_index: 5,
    type: 'transformation',
    prompt: 'Replace "porque" with a more formal causal connector: "No vino porque estaba enfermo."',
    expected_answer: 'No vino puesto que estaba enfermo.',
    answer_variants: ['No vino ya que estaba enfermo.', 'No vino dado que estaba enfermo.'],
    hint_1: '"Puesto que" and "ya que" present the cause as shared, known information.',
    hint_2: null,
  },

  // dado que
  {
    concept_index: 6,
    type: 'gap_fill',
    prompt: '___ la situación es grave, debemos actuar de inmediato. ___, hemos convocado una reunión urgente.',
    expected_answer: JSON.stringify(['Dado que', 'Por lo tanto']),
    answer_variants: null,
    hint_1: 'Blank 1: "given that" — formal causal connector presenting an obvious reason.',
    hint_2: 'Blank 2: "therefore" — consecutive connector introducing the result.',
  },
  {
    concept_index: 6,
    type: 'free_write',
    prompt: 'Write two sentences using "dado que" or "en vista de que" to explain a decision you made recently.',
    expected_answer: null,
    answer_variants: null,
    hint_1: 'Pattern: Dado que [reason], [consequence/decision].',
    hint_2: null,
  },

  // por lo tanto
  {
    concept_index: 7,
    type: 'gap_fill',
    prompt: '___ el tren salió tarde, llegamos con dos horas de retraso. ___, tuvimos que cancelar la reunión.',
    expected_answer: JSON.stringify(['Dado que', 'Por lo tanto']),
    answer_variants: null,
    hint_1: 'Blank 1: causal connector presenting a reason — "given that / since".',
    hint_2: 'Blank 2: logical consequence — "therefore".',
  },
  {
    concept_index: 7,
    type: 'sentence_builder',
    prompt: 'Build a correct sentence: [no / tiene / experiencia / por consiguiente / el / puesto / rechazado / fue]',
    expected_answer: 'No tiene experiencia; por consiguiente, el puesto fue rechazado.',
    answer_variants: ['El puesto fue rechazado por consiguiente no tiene experiencia.'],
    hint_1: '"Por consiguiente" introduces the result/consequence.',
    hint_2: null,
  },

  // de ahí que
  {
    concept_index: 8,
    type: 'gap_fill',
    prompt: 'Es muy insegura, de ahí que no se atreva a hablar en público. ___ de sus miedos, ha decidido apuntarse a un curso de oratoria. ___, sus compañeros la admiran por su valentía.',
    expected_answer: JSON.stringify(['A pesar', 'Sin embargo']),
    answer_variants: null,
    hint_1: 'Blank 1: "despite" her fears — A ___ de.',
    hint_2: 'Blank 2: contrast introducing admiration — "however/nevertheless".',
  },
  {
    concept_index: 8,
    type: 'transformation',
    prompt: 'Combine using "de ahí que": "Durmió muy poco." + "Está agotada."',
    expected_answer: 'Durmió muy poco, de ahí que esté agotada.',
    answer_variants: null,
    hint_1: '"De ahí que" + subjunctive to express consequence.',
    hint_2: '"Estar" in present subjunctive (ella) = esté.',
  },

  // no obstante
  {
    concept_index: 9,
    type: 'gap_fill',
    prompt: 'El proyecto tiene muchos puntos positivos; ___, presenta algunas deficiencias. ___ de ello, el comité ha decidido aprobarlo con condiciones.',
    expected_answer: JSON.stringify(['no obstante', 'A pesar']),
    answer_variants: null,
    hint_1: 'Blank 1: formal "nevertheless/however" — more formal than "sin embargo".',
    hint_2: 'Blank 2: "despite" — ___ de ello.',
  },
  {
    concept_index: 9,
    type: 'error_correction',
    prompt: 'Correct if necessary: "No me gusta el frío, no obstante me he mudado a Noruega."',
    expected_answer: 'No me gusta el frío; no obstante, me he mudado a Noruega.',
    answer_variants: null,
    hint_1: '"No obstante" follows a semicolon or period and is followed by a comma.',
    hint_2: null,
  },

  // en cambio / por el contrario
  {
    concept_index: 10,
    type: 'gap_fill',
    prompt: 'A mí me encanta madrugar; mi pareja, ___, no se levanta antes de las diez. No es pereza, ___; simplemente tiene un ritmo biológico diferente.',
    expected_answer: JSON.stringify(['en cambio', 'por el contrario']),
    answer_variants: null,
    hint_1: 'Blank 1: "on the other hand" — contrasting two different preferences.',
    hint_2: 'Blank 2: "on the contrary" — directly contradicting the previous claim.',
  },
  {
    concept_index: 10,
    type: 'translation',
    prompt: 'Translate: "It is not a problem; on the contrary, it is an opportunity."',
    expected_answer: 'No es un problema; por el contrario, es una oportunidad.',
    answer_variants: null,
    hint_1: '"On the contrary" directly contradicts the previous statement.',
    hint_2: null,
  },

  // mientras que
  {
    concept_index: 11,
    type: 'gap_fill',
    prompt: 'España es un país cálido, ___ los países escandinavos tienen un clima frío. ___, el turismo en el norte de Europa sigue creciendo año tras año.',
    expected_answer: JSON.stringify(['mientras que', 'Sin embargo']),
    answer_variants: null,
    hint_1: 'Blank 1: "whereas" — simultaneous contrast between two facts.',
    hint_2: 'Blank 2: "however" — introducing a surprising or contrasting observation.',
  },
  {
    concept_index: 11,
    type: 'sentence_builder',
    prompt: 'Build a sentence contrasting two people using "mientras que": [Lucía estudia medicina / su hermano estudia arte]',
    expected_answer: 'Lucía estudia medicina, mientras que su hermano estudia arte.',
    answer_variants: ['Mientras que Lucía estudia medicina, su hermano estudia arte.'],
    hint_1: '"Mientras que" can go at the beginning or in the middle of the sentence.',
    hint_2: null,
  },

  // verbos de deseo
  {
    concept_index: 12,
    type: 'gap_fill',
    prompt: 'Quiero que tú ___ a cenar el sábado. Además, espero que todos ___ a tiempo.',
    expected_answer: JSON.stringify(['vengas', 'lleguen']),
    answer_variants: null,
    hint_1: 'Blank 1: "venir" present subjunctive (tú) — "querer que" triggers subjunctive.',
    hint_2: 'Blank 2: "llegar" present subjunctive (ellos) — "esperar que" also triggers subjunctive.',
  },
  {
    concept_index: 12,
    type: 'transformation',
    prompt: 'Rewrite using "esperar que": "Ojalá todo salga bien."',
    expected_answer: 'Espero que todo salga bien.',
    answer_variants: null,
    hint_1: '"Esperar que" + present subjunctive.',
    hint_2: null,
  },

  // verbos de emoción
  {
    concept_index: 13,
    type: 'gap_fill',
    prompt: 'Me sorprende que ella no ___ la respuesta. Temo que los demás tampoco la ___.',
    expected_answer: JSON.stringify(['sepa', 'sepan']),
    answer_variants: null,
    hint_1: 'Blank 1: "saber" present subjunctive (ella) — emotion verb triggers subjunctive.',
    hint_2: 'Blank 2: "saber" present subjunctive (ellos) — "temer que" also triggers subjunctive.',
  },
  {
    concept_index: 13,
    type: 'translation',
    prompt: 'Translate: "I am glad that you passed the exam."',
    expected_answer: 'Me alegra que hayas aprobado el examen.',
    answer_variants: ['Me alegro de que hayas aprobado el examen.'],
    hint_1: '"Alegrarse de que" + present perfect subjunctive for a past event.',
    hint_2: '"Haber" present subjunctive (tú) = hayas.',
  },

  // verbos de duda
  {
    concept_index: 14,
    type: 'gap_fill',
    prompt: 'No creo que Pedro ___ razón en este caso. Dudo que los demás ___ de acuerdo con él.',
    expected_answer: JSON.stringify(['tenga', 'estén']),
    answer_variants: null,
    hint_1: 'Blank 1: "tener" present subjunctive (él) — "no creer que" triggers subjunctive.',
    hint_2: 'Blank 2: "estar" present subjunctive (ellos) — "dudar que" always requires subjunctive.',
  },
  {
    concept_index: 14,
    type: 'error_correction',
    prompt: 'Correct: "Dudo que él sabe la verdad."',
    expected_answer: 'Dudo que él sepa la verdad.',
    answer_variants: null,
    hint_1: '"Dudar que" always requires the subjunctive.',
    hint_2: '"Saber" present subjunctive (él) = sepa.',
  },

  // conjunciones temporales
  {
    concept_index: 15,
    type: 'gap_fill',
    prompt: 'Llámame cuando ___ al aeropuerto. Esperaré aquí hasta que ___ tu mensaje.',
    expected_answer: JSON.stringify(['llegues', 'reciba']),
    answer_variants: null,
    hint_1: 'Blank 1: "llegar" present subjunctive (tú) — "cuando" + future = subjunctive.',
    hint_2: 'Blank 2: "recibir" present subjunctive (yo) — "hasta que" + future = subjunctive.',
  },
  {
    concept_index: 15,
    type: 'transformation',
    prompt: 'Change to future context (use subjunctive): "Cuando llego a casa, como." → "Tomorrow..."',
    expected_answer: 'Mañana, cuando llegue a casa, comeré.',
    answer_variants: null,
    hint_1: 'Future reference after "cuando" requires the subjunctive.',
    hint_2: null,
  },

  // para que
  {
    concept_index: 16,
    type: 'gap_fill',
    prompt: 'Te lo repito para que lo ___ bien. Habla más despacio para que todos te ___.',
    expected_answer: JSON.stringify(['entiendas', 'entiendan']),
    answer_variants: null,
    hint_1: 'Blank 1: "entender" present subjunctive (tú) — "para que" always takes subjunctive.',
    hint_2: 'Blank 2: "entender" present subjunctive (ellos) — same rule applies.',
  },
  {
    concept_index: 16,
    type: 'translation',
    prompt: 'Translate: "Speak louder so that everyone can hear you."',
    expected_answer: 'Habla más alto para que todos te puedan oír.',
    answer_variants: ['Habla más alto para que todos puedan oírte.'],
    hint_1: '"So that" = para que + subjunctive.',
    hint_2: null,
  },

  // condicional tipo 2
  {
    concept_index: 17,
    type: 'gap_fill',
    prompt: 'Si ___ más tiempo libre, aprendería a pintar. También ___ a tocar la guitarra si pudiera.',
    expected_answer: JSON.stringify(['tuviera', 'aprendería']),
    answer_variants: null,
    hint_1: 'Blank 1: "tener" imperfect subjunctive (yo) — Si + imperfect subj. expresses hypothetical.',
    hint_2: 'Blank 2: conditional of "aprender" (yo) — the result clause uses the conditional tense.',
  },
  {
    concept_index: 17,
    type: 'translation',
    prompt: 'Translate: "If she studied more, she would get better grades."',
    expected_answer: 'Si estudiara más, sacaría mejores notas.',
    answer_variants: ['Si estudiase más, sacaría mejores notas.'],
    hint_1: 'Type 2: Si + imperfect subjunctive, + conditional.',
    hint_2: null,
  },

  // condicional tipo 3
  {
    concept_index: 18,
    type: 'gap_fill',
    prompt: 'Si hubieras estudiado más, ___ el examen. ___, no habrías tenido que repetir el curso.',
    expected_answer: JSON.stringify(['habrías aprobado', 'Por lo tanto']),
    answer_variants: null,
    hint_1: 'Blank 1: conditional perfect of "aprobar" (tú) — result clause of type 3 conditional.',
    hint_2: 'Blank 2: consecutive connector meaning "therefore" — introduces the logical consequence.',
  },
  {
    concept_index: 18,
    type: 'transformation',
    prompt: 'Express regret about the past using type 3 conditional: "No fui a la fiesta. No conocí a nadie interesante."',
    expected_answer: 'Si hubiera ido a la fiesta, habría conocido a alguien interesante.',
    answer_variants: ['Si hubiese ido a la fiesta, habría conocido a alguien interesante.'],
    hint_1: 'Si + pluperfect subjunctive, + conditional perfect.',
    hint_2: null,
  },

  // ojalá
  {
    concept_index: 19,
    type: 'gap_fill',
    prompt: 'Ojalá ___ viajar más a menudo. Si ___ más dinero, lo haría sin dudarlo.',
    expected_answer: JSON.stringify(['pudiera', 'tuviera']),
    answer_variants: null,
    hint_1: 'Blank 1: "poder" imperfect subjunctive (yo) — unlikely wish = Ojalá + imperfect subj.',
    hint_2: 'Blank 2: "tener" imperfect subjunctive (yo) — type 2 conditional: Si + imperfect subj.',
  },
  {
    concept_index: 19,
    type: 'translation',
    prompt: 'Translate: "I wish I had called you." (regret about the past)',
    expected_answer: 'Ojalá te hubiera llamado.',
    answer_variants: ['Ojalá te hubiese llamado.'],
    hint_1: 'Past regret with "ojalá" = Ojalá + pluperfect subjunctive.',
    hint_2: '"Haber" imperfect subjunctive (yo) = hubiera / hubiese.',
  },

  // estilo indirecto
  {
    concept_index: 20,
    type: 'gap_fill',
    prompt: 'María dijo que ___ que yo fuera. También esperaba que todos ___ a tiempo.',
    expected_answer: JSON.stringify(['quería', 'llegaran']),
    answer_variants: null,
    hint_1: 'Blank 1: imperfect indicative of "querer" — sequence of tenses shifts present → imperfect.',
    hint_2: 'Blank 2: "llegar" imperfect subjunctive (ellos) — "esperar que" in past context requires imperfect subj.',
  },
  {
    concept_index: 20,
    type: 'error_correction',
    prompt: 'Correct: "El médico dijo que esperaba que me recupere pronto."',
    expected_answer: 'El médico dijo que esperaba que me recuperara pronto.',
    answer_variants: ['El médico dijo que esperaba que me recuperase pronto.'],
    hint_1: 'Sequence of tenses: past main verb → imperfect subjunctive in subordinate.',
    hint_2: '"Recuperarse" imperfect subjunctive = se recuperara / se recuperase.',
  },

  // ─── Extra exercises (one per concept) ───────────────────────────────────

  // aunque + indicativo (concept 0)
  {
    concept_index: 0,
    type: 'free_write',
    prompt: 'Write two sentences about your own life using "aunque" + indicative. Show a real concession where one fact does not prevent another.',
    expected_answer: null,
    answer_variants: null,
    hint_1: 'Pattern: Aunque [known fact], [main clause].',
    hint_2: null,
  },

  // aunque + subjuntivo (concept 1)
  {
    concept_index: 1,
    type: 'free_write',
    prompt: 'Write a short paragraph (3–4 sentences) describing a hypothetical scenario using "aunque" + subjunctive at least twice.',
    expected_answer: null,
    answer_variants: null,
    hint_1: '"Aunque" + subjunctive = "even if" (uncertain/hypothetical concession).',
    hint_2: null,
  },

  // a pesar de que (concept 2)
  {
    concept_index: 2,
    type: 'error_correction',
    prompt: 'Correct if necessary: "A pesar de que el tiempo era malo, pero decidimos salir."',
    expected_answer: 'A pesar de que el tiempo era malo, decidimos salir.',
    answer_variants: null,
    hint_1: '"A pesar de que" already expresses contrast — "pero" is redundant.',
    hint_2: null,
  },

  // sin embargo (concept 3)
  {
    concept_index: 3,
    type: 'free_write',
    prompt: 'Write a 3-sentence mini-paragraph about a film or book you enjoyed. Use "sin embargo" to introduce a reservation or contrast in the second or third sentence.',
    expected_answer: null,
    answer_variants: null,
    hint_1: '"Sin embargo" follows a full stop or semicolon and is followed by a comma.',
    hint_2: null,
  },

  // por más que (concept 4)
  {
    concept_index: 4,
    type: 'error_correction',
    prompt: 'Correct: "Por más que estudia, no aprueba los exámenes."',
    expected_answer: 'Por más que estudie, no aprueba los exámenes.',
    answer_variants: ['Por más que estudie, no aprueba.'],
    hint_1: '"Por más que" expressing a general/habitual situation requires the subjunctive.',
    hint_2: '"Estudiar" present subjunctive (él/ella) = estudie.',
  },

  // puesto que / ya que (concept 5)
  {
    concept_index: 5,
    type: 'free_write',
    prompt: 'Write two sentences explaining decisions you made today, using "puesto que" in one and "ya que" in the other.',
    expected_answer: null,
    answer_variants: null,
    hint_1: 'Both connectors present the cause as already known. Place them at the start of the sentence.',
    hint_2: null,
  },

  // dado que (concept 6)
  {
    concept_index: 6,
    type: 'error_correction',
    prompt: 'Correct: "Dado que no hay entradas, así que no podemos ir al concierto."',
    expected_answer: 'Dado que no hay entradas, no podemos ir al concierto.',
    answer_variants: null,
    hint_1: '"Dado que" already introduces the cause — "así que" is redundant.',
    hint_2: null,
  },

  // por lo tanto (concept 7)
  {
    concept_index: 7,
    type: 'free_write',
    prompt: 'Write a short argument (3–4 sentences) presenting a problem and its logical consequence. Use "por lo tanto" or "por consiguiente" to introduce the conclusion.',
    expected_answer: null,
    answer_variants: null,
    hint_1: '"Por lo tanto" / "por consiguiente" follow a semicolon or full stop.',
    hint_2: null,
  },

  // de ahí que (concept 8)
  {
    concept_index: 8,
    type: 'free_write',
    prompt: 'Describe a quality a person has and use "de ahí que" + subjunctive to explain a consequence of that quality.',
    expected_answer: null,
    answer_variants: null,
    hint_1: '"De ahí que" always requires the subjunctive in the following clause.',
    hint_2: null,
  },

  // no obstante (concept 9)
  {
    concept_index: 9,
    type: 'free_write',
    prompt: 'Write a short formal opinion paragraph (3 sentences) about a controversial topic. Use "no obstante" to acknowledge the opposing view.',
    expected_answer: null,
    answer_variants: null,
    hint_1: '"No obstante" is more formal than "sin embargo" — suitable for written opinions.',
    hint_2: null,
  },

  // en cambio / por el contrario (concept 10)
  {
    concept_index: 10,
    type: 'free_write',
    prompt: 'Compare two people you know (real or fictional) across two traits. Use "en cambio" in one sentence and "por el contrario" in another.',
    expected_answer: null,
    answer_variants: null,
    hint_1: '"En cambio" contrasts two different things; "por el contrario" directly contradicts.',
    hint_2: null,
  },

  // mientras que (concept 11)
  {
    concept_index: 11,
    type: 'free_write',
    prompt: 'Write three sentences contrasting life in a big city with life in a small town. Use "mientras que" at least once.',
    expected_answer: null,
    answer_variants: null,
    hint_1: '"Mientras que" can appear at the start or in the middle of the sentence.',
    hint_2: null,
  },

  // verbos de deseo (concept 12)
  {
    concept_index: 12,
    type: 'free_write',
    prompt: 'Write 3 sentences expressing wishes for yourself and others using querer que, esperar que, and desear que.',
    expected_answer: null,
    answer_variants: null,
    hint_1: 'Change of subject triggers the subjunctive: Quiero que tú... / Espero que él...',
    hint_2: null,
  },

  // verbos de emoción (concept 13)
  {
    concept_index: 13,
    type: 'error_correction',
    prompt: 'Correct: "Me alegra que has venido. Temo que no llegan a tiempo."',
    expected_answer: 'Me alegra que hayas venido. Temo que no lleguen a tiempo.',
    answer_variants: null,
    hint_1: 'Emotion verbs (alegrarse, temer) + que trigger the subjunctive.',
    hint_2: null,
  },

  // verbos de duda (concept 14)
  {
    concept_index: 14,
    type: 'free_write',
    prompt: 'Write two contrasting sentences: one with "creo que" (indicative) and one with "no creo que" (subjunctive) about the same topic.',
    expected_answer: null,
    answer_variants: null,
    hint_1: 'Affirmative "creer que" → indicative. Negated "no creer que" → subjunctive.',
    hint_2: null,
  },

  // temporal conjunctions (concept 15)
  {
    concept_index: 15,
    type: 'free_write',
    prompt: 'Write your plans for this evening using "cuando", "en cuanto", and "hasta que" at least once each. All future-reference temporal clauses need the subjunctive.',
    expected_answer: null,
    answer_variants: null,
    hint_1: 'Future reference: cuando llegue, en cuanto termine, hasta que sea tarde...',
    hint_2: null,
  },

  // para que (concept 16)
  {
    concept_index: 16,
    type: 'error_correction',
    prompt: 'Correct: "Te lo digo para que puedes mejorar tu español."',
    expected_answer: 'Te lo digo para que puedas mejorar tu español.',
    answer_variants: null,
    hint_1: '"Para que" always requires the subjunctive.',
    hint_2: '"Poder" present subjunctive (tú) = puedas.',
  },

  // condicional tipo 2 (concept 17)
  {
    concept_index: 17,
    type: 'free_write',
    prompt: 'Write a paragraph of 3–4 sentences describing what you would do differently if you had more money, time, or a different career. Use the type 2 conditional throughout.',
    expected_answer: null,
    answer_variants: null,
    hint_1: 'Si + imperfect subjunctive, + conditional. e.g. Si tuviera..., haría...',
    hint_2: null,
  },

  // condicional tipo 3 (concept 18)
  {
    concept_index: 18,
    type: 'free_write',
    prompt: 'Think of a past decision you made. Write 3 sentences expressing regret or speculation about what might have happened if things had been different. Use the type 3 conditional.',
    expected_answer: null,
    answer_variants: null,
    hint_1: 'Si + pluperfect subjunctive, + conditional perfect.',
    hint_2: null,
  },

  // ojalá (concept 19)
  {
    concept_index: 19,
    type: 'free_write',
    prompt: 'Write three sentences starting with "Ojalá": one for an achievable wish (present subjunctive), one for an unlikely wish (imperfect subjunctive), and one expressing past regret (pluperfect subjunctive).',
    expected_answer: null,
    answer_variants: null,
    hint_1: 'Ojalá + present subj. (achievable) / imperfect subj. (unlikely) / pluperfect subj. (past regret).',
    hint_2: null,
  },

  // estilo indirecto (concept 20)
  {
    concept_index: 20,
    type: 'free_write',
    prompt: 'Imagine a conversation you had yesterday. Report what was said using the imperfect subjunctive sequence of tenses. Write at least 3 reported speech sentences.',
    expected_answer: null,
    answer_variants: null,
    hint_1: 'Past reporting: present subjunctive in original → imperfect subjunctive in reported speech.',
    hint_2: null,
  },
]
