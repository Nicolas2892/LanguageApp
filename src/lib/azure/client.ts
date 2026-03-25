import * as sdk from 'microsoft-cognitiveservices-speech-sdk'

const AZURE_SPEECH_KEY = process.env.AZURE_SPEECH_KEY ?? ''
const AZURE_SPEECH_REGION = process.env.AZURE_SPEECH_REGION ?? ''

export interface PhonemeScore {
  phoneme: string
  score: number
}

export interface WordScore {
  word: string
  accuracyScore: number
  phonemes: PhonemeScore[]
}

export interface PronunciationResult {
  overallScore: number
  fluencyScore: number
  prosodyScore: number
  words: WordScore[]
}

const ACCENT_LOCALE: Record<string, string> = {
  castilian: 'es-ES',
  latin_american: 'es-MX',
}

/**
 * Assess pronunciation of audio against a reference sentence.
 * Requires AZURE_SPEECH_KEY + AZURE_SPEECH_REGION env vars.
 */
export async function assessPronunciation(
  audioBuffer: Buffer,
  referenceText: string,
  targetAccent: string = 'castilian',
): Promise<PronunciationResult> {
  if (!AZURE_SPEECH_KEY || !AZURE_SPEECH_REGION) {
    throw new Error('Azure Speech credentials not configured')
  }

  const locale = ACCENT_LOCALE[targetAccent] ?? 'es-ES'

  const speechConfig = sdk.SpeechConfig.fromSubscription(AZURE_SPEECH_KEY, AZURE_SPEECH_REGION)
  speechConfig.speechRecognitionLanguage = locale

  const pronunciationConfig = new sdk.PronunciationAssessmentConfig(
    referenceText,
    sdk.PronunciationAssessmentGradingSystem.HundredMark,
    sdk.PronunciationAssessmentGranularity.Phoneme,
    true, // enableMiscue
  )
  pronunciationConfig.enableProsodyAssessment = true

  const pushStream = sdk.AudioInputStream.createPushStream()
  pushStream.write(new Uint8Array(audioBuffer).buffer as ArrayBuffer)
  pushStream.close()

  const audioConfig = sdk.AudioConfig.fromStreamInput(pushStream)
  const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig)
  pronunciationConfig.applyTo(recognizer)

  return new Promise<PronunciationResult>((resolve, reject) => {
    recognizer.recognizeOnceAsync(
      (result) => {
        recognizer.close()

        if (result.reason !== sdk.ResultReason.RecognizedSpeech) {
          reject(new Error(`Recognition failed: ${sdk.ResultReason[result.reason]}`))
          return
        }

        const pronunciationResult = sdk.PronunciationAssessmentResult.fromResult(result)

        const words: WordScore[] = []
        const detailResult = pronunciationResult.detailResult
        if (detailResult?.Words) {
          for (const w of detailResult.Words) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const phonemes: PhonemeScore[] = (w.Phonemes ?? []).map((p: any) => ({
              phoneme: p.Phoneme ?? '',
              score: p.PronunciationAssessment?.AccuracyScore ?? 0,
            }))
            words.push({
              word: w.Word,
              accuracyScore: w.PronunciationAssessment?.AccuracyScore ?? 0,
              phonemes,
            })
          }
        }

        resolve({
          overallScore: pronunciationResult.pronunciationScore,
          fluencyScore: pronunciationResult.fluencyScore,
          prosodyScore: pronunciationResult.prosodyScore,
          words,
        })
      },
      (err) => {
        recognizer.close()
        reject(new Error(`Recognition error: ${err}`))
      },
    )
  })
}
