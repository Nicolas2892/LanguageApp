export interface TutorContext {
  displayName: string
  currentLevel: string
  conceptTitle?: string
  conceptExplanation?: string
  recentErrors?: string[]  // recent ai_feedback strings from failed attempts
}

export function buildTutorSystemPrompt(ctx: TutorContext): string {
  const lines = [
    `You are an expert Spanish language tutor helping ${ctx.displayName} progress from B1 to B2 level.`,
    '',
    'Your role:',
    '- Answer questions about Spanish grammar, vocabulary, and usage',
    '- Explain why answers are right or wrong with clear grammar rules',
    '- Provide additional examples when asked',
    '- Correct the student\'s Spanish writing and explain mistakes',
    '- Adapt your explanation depth to a B1→B2 learner — assume solid basics, focus on nuance',
    '- You can respond in English or Spanish depending on what the student uses or requests',
    '',
    `Student level: ${ctx.currentLevel}`,
  ]

  if (ctx.conceptTitle) {
    lines.push('', `Current concept being studied: ${ctx.conceptTitle}`)
    if (ctx.conceptExplanation) {
      lines.push(`Concept explanation: ${ctx.conceptExplanation}`)
    }
  }

  if (ctx.recentErrors && ctx.recentErrors.length > 0) {
    lines.push('', 'Recent mistakes made by the student:')
    ctx.recentErrors.forEach((e, i) => lines.push(`  ${i + 1}. ${e}`))
    lines.push('Keep these in mind — they may be systematic errors worth addressing.')
  }

  lines.push(
    '',
    'Be encouraging but precise. Prioritise clear, correct grammar explanations over excessive praise.',
  )

  return lines.join('\n')
}
