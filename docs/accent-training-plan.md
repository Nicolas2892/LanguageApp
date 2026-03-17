# Feat-P: Pronunciation / Accent Training

## Problem

Generic apps only give correct/incorrect on pronunciation. Learners with specific L1 accents (e.g. German speaker with German accent in Spanish) need **targeted, actionable feedback** on specific phonemes and articulatory habits. This is a clear market gap at the B1-B2 level where accent patterns have fossilised.

## Core Idea

Use **Azure Speech Services Pronunciation Assessment API** for phoneme-level scoring, combined with **L1 interference maps** (German, English) to provide specific, linguistically-informed coaching rather than generic "try again" feedback.

## Technical Foundation

### Azure Pronunciation Assessment API

- Returns phoneme-level accuracy scores (not just word-level)
- Identifies specific mispronounced phonemes
- Provides fluency, prosody, and completeness scores
- Supports Spanish (es-ES, es-MX)
- **Free tier:** 5 audio hours/month included (pronunciation assessment = standard STT, no surcharge)
- **Paid tier:** ~$1.32/hour of audio
- **Estimated cost:** ~$0.02/user/month for typical usage (20 exercises/day × 5-10s each = ~90 min/month)

### L1 Interference Maps

Accent problems are **predictable by native language**. We map known interference patterns so feedback is specific and actionable.

#### German → Spanish

| Problem | What happens | Target | Practice focus |
|---|---|---|---|
| /r/ → uvular /ʁ/ | German guttural R instead of alveolar trill | Trilled /r/ and tap /ɾ/ | caro/carro, pero/perro, rosa |
| Aspiration of /p t k/ | German adds puff of air | Spanish unaspirated stops | pato, tiempo, casa |
| Intervocalic /b d g/ | German keeps hard stops | Spanish softens to fricatives [β ð ɣ] | lobo, nada, lago |
| Word-final devoicing | "Madrid" → "Madrit" | Voiced consonants stay voiced | Madrid, verdad, usted |
| Vowel quality | 15+ German vowels → 5 Spanish | Pure /a e i o u/, no schwas | mesa, solo, luz |
| Intonation | German falling patterns | Spanish pitch patterns | Question vs. statement pairs |

#### English → Spanish

| Problem | What happens | Target | Practice focus |
|---|---|---|---|
| /r/ → English approximant | Retroflex R instead of tap/trill | Alveolar tap /ɾ/ and trill /r/ | pero/perro, caro/carro |
| Vowel reduction | Unstressed vowels → schwa | All 5 vowels stay pure | chocolate, universidad |
| Aspiration of /p t k/ | English adds puff of air | Spanish unaspirated stops | pato, tú, casa |
| /v/ vs /b/ distinction | English separates v/b | Spanish: both → /b/ or [β] | vino, bien, volver |
| /θ/ absence | No "th" for Castilian /θ/ | Distinction between s/z and c/z | caza/casa, cena, zapato |
| Diphthong overshoot | English diphthongises | Spanish pure vowels | no, mesa, solo |

## Feature Shape

### Phase 1: Dedicated Pronunciation Drills

New route: `/pronunciation`

1. **L1 profile selection** — "What's your native language?" in onboarding or account settings; loads corresponding interference map
2. **Minimal pair drills** — pairs targeting L1 weak spots, progressive difficulty:
   - Isolated phoneme → word → sentence → connected speech
   - Examples (German L1): para/parra, caro/carro, lobo, Madrid
3. **Record + assess loop:**
   - User sees sentence + hears native TTS
   - Records themselves
   - Azure Pronunciation Assessment returns phoneme-level scores
   - Cross-reference low-scoring phonemes with L1 interference map
   - Display **specific articulatory feedback**: "Your /rr/ sounds like a German uvular R. Try: place tongue tip behind upper teeth and let it vibrate."
4. **Phoneme progress tracking:**
   - `pronunciation_progress` table: accuracy per phoneme over time
   - Surface weakest phonemes for spaced review
   - "Your /rr/ accuracy improved from 45% → 68% this month"

### Phase 2: "Say Your Answer" Mode

- After writing a translation in an existing exercise, optionally read it aloud
- Get pronunciation feedback on the sentence you just produced
- Lower friction integration into the existing study flow

### Native Speaker Comparison (Shadowing)

- **Audio playback toggle:** hear native TTS → hear yourself → hear native (A/B comparison)
- **Visual pitch contour overlay:** show intonation curves side-by-side (Azure provides prosody data)
- **Phoneme-level highlighting:** which sounds you nailed (green) vs. need work (orange/red)
- Shadowing is one of the most evidence-backed pronunciation training techniques

## New Infrastructure Required

- Azure Speech Services account + API key
- New env vars: `AZURE_SPEECH_KEY`, `AZURE_SPEECH_REGION`
- New API routes: `POST /api/pronunciation/assess`, `GET /api/pronunciation/progress`
- New DB tables: `pronunciation_progress` (user × phoneme × accuracy over time), L1 maps as JSON config
- New components: record/playback UI, waveform/pitch visualisation, phoneme feedback panel
- Account settings: L1 language selection

## Pricing References

- [Azure Speech Services Pricing](https://azure.microsoft.com/en-us/pricing/details/cognitive-services/speech-services/)
- [Pronunciation Assessment API Docs](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/how-to-pronunciation-assessment)
- [Azure Speech Quotas & Limits](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/speech-services-quotas-and-limits)

## Status

**Not started** — pending PM decision on priority and whether to gate behind premium tier.
