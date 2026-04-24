export interface TripPreflightInput {
  mode: 'freeform' | 'guided'
  naturalLanguage?: string
  travelerDescription?: string
  destination?: string
  vibe?: string
  timing?: string
  wantsDestinationSuggestion?: boolean
}

export interface TripPreflightResult {
  ready: boolean
  travelerKnown: boolean
  travelerSummary?: string
  hasAges: boolean
  vibeKnown: boolean
  vibeSummary?: string
  timingKnown: boolean
  timingSummary?: string
  destinationKnown: boolean
  destination?: string
  wantsDestinationSuggestion: boolean
  missingFields: Array<'traveler' | 'vibe' | 'destination' | 'timing'>
  question?: string
}

interface OpenRouterChatResponse {
  choices?: Array<{
    message?: {
      content?: string
    }
  }>
}

const PREFLIGHT_SCHEMA = {
  type: 'object',
  properties: {
    ready: { type: 'boolean' },
    travelerKnown: { type: 'boolean' },
    travelerSummary: { type: 'string' },
    hasAges: { type: 'boolean' },
    vibeKnown: { type: 'boolean' },
    vibeSummary: { type: 'string' },
    timingKnown: { type: 'boolean' },
    timingSummary: { type: 'string' },
    destinationKnown: { type: 'boolean' },
    destination: { type: 'string' },
    wantsDestinationSuggestion: { type: 'boolean' },
    missingFields: {
      type: 'array',
      items: { type: 'string', enum: ['traveler', 'vibe', 'destination', 'timing'] },
    },
    question: { type: 'string' },
  },
  required: [
    'ready',
    'travelerKnown',
    'hasAges',
    'vibeKnown',
    'timingKnown',
    'destinationKnown',
    'wantsDestinationSuggestion',
    'missingFields',
  ],
  additionalProperties: false,
}

const SYSTEM_PROMPT = `
You validate travel-planning requests before itinerary generation.

Return only JSON matching the provided schema.

Required information:
1. Who is traveling. Ages are ideal but not mandatory if the group is otherwise clear.
2. Vibe or type of travel.
3. When they want to travel, because timing improves seasonal recommendations. Exact dates are best, but month, season, holiday period, or "flexible" are acceptable.
4. Where to go, unless the user explicitly asks Voya to choose, find, suggest, surprise them, or plan around an open destination.

Rules:
- Set travelerKnown=true when the traveler or group is identified, such as solo, couple, family, friends, kids, parents, spouse, or named people.
- Set hasAges=true only when ages or age ranges are present.
- Set vibeKnown=true when travel style, budget level, pace, interests, or trip type is clear.
- Set timingKnown=true when exact dates, a month, a season, a holiday period, "this weekend", "next summer", or explicit flexibility is present.
- Set destinationKnown=true only when a real destination, region, country, city, or route is supplied.
- Set wantsDestinationSuggestion=true when the user explicitly asks the assistant to find or choose the location.
- Include "destination" in missingFields only when destinationKnown=false and wantsDestinationSuggestion=false.
- ready is true only when travelerKnown, vibeKnown, timingKnown, and either destinationKnown or wantsDestinationSuggestion are true.
- If not ready, question should be one concise sentence asking for all missing fields.
`.trim()

const DESTINATION_WORDS = [
  'bali',
  'brittany',
  'france',
  'greece',
  'iceland',
  'italy',
  'japan',
  'lisbon',
  'london',
  'morocco',
  'paris',
  'portugal',
  'rome',
  'spain',
  'thailand',
  'tokyo',
  'vietnam',
]

const TRAVELER_WORDS = [
  'alone',
  'boyfriend',
  'children',
  'couple',
  'daughter',
  'family',
  'friends',
  'girlfriend',
  'group',
  'husband',
  'kids',
  'parents',
  'partner',
  'siblings',
  'solo',
  'son',
  'wife',
]

const VIBE_WORDS = [
  'adventure',
  'beach',
  'budget',
  'comfort',
  'culture',
  'food',
  'history',
  'luxury',
  'mid-range',
  'nature',
  'nightlife',
  'outdoors',
  'relaxed',
  'romantic',
  'slow',
]

const SUGGESTION_WORDS = ['anywhere', 'choose', 'find', 'pick', 'recommend', 'suggest', 'surprise']

const TIMING_WORDS = [
  'autumn',
  'christmas',
  'fall',
  'flexible',
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december',
  'spring',
  'summer',
  'winter',
]

function logPreflightFallback(reason: string, detail?: unknown) {
  if (!import.meta.env.DEV) return

  console.warn('[tripPreflight] Falling back to local validator:', reason, detail ?? '')
}

function logPreflightSuccess(result: TripPreflightResult) {
  if (!import.meta.env.DEV) return

  console.info('[tripPreflight] OpenRouter qualification succeeded:', result)
}

function textFromInput(input: TripPreflightInput) {
  return [
    input.naturalLanguage,
    input.travelerDescription,
    input.destination,
    input.vibe,
    input.timing,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

function hasAny(text: string, words: string[]) {
  return words.some((word) => new RegExp(`\\b${word}\\b`, 'i').test(text))
}

function hasDestination(input: TripPreflightInput, text: string) {
  if (input.destination?.trim()) return true
  if (hasAny(text, DESTINATION_WORDS)) return true
  const originalText = [
    input.naturalLanguage,
    input.travelerDescription,
    input.destination,
    input.vibe,
    input.timing,
  ]
    .filter(Boolean)
    .join(' ')
  const placeMatches = originalText.matchAll(/\b(?:in|to|around|through)\s+([A-Z][A-Za-z]+)/g)

  for (const match of placeMatches) {
    const candidate = match[1]?.toLowerCase()
    if (candidate && !TIMING_WORDS.includes(candidate)) {
      return true
    }
  }

  return false
}

function buildQuestion(missingFields: TripPreflightResult['missingFields']) {
  const labels = missingFields.map((field) => {
    if (field === 'traveler') return 'who is traveling'
    if (field === 'vibe') return 'the vibe or type of trip'
    if (field === 'timing') return 'when you want to travel, or say that your dates are flexible'
    return 'where you want to go, or say that you want Voya to choose'
  })

  return `Please add ${labels.join(', ')}.`
}

function localPreflight(input: TripPreflightInput): TripPreflightResult {
  const text = textFromInput(input)
  const travelerKnown = Boolean(input.travelerDescription?.trim()) || hasAny(text, TRAVELER_WORDS)
  const vibeKnown = Boolean(input.vibe?.trim()) || hasAny(text, VIBE_WORDS)
  const timingKnown = Boolean(input.timing?.trim()) || hasAny(text, TIMING_WORDS) || /\b(?:20\d{2}|next|this)\s+(?:week|weekend|month|spring|summer|fall|autumn|winter)\b/i.test(text) || /\b\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?\b/.test(text)
  const destinationKnown = hasDestination(input, text)
  const wantsDestinationSuggestion =
    Boolean(input.wantsDestinationSuggestion) || hasAny(text, SUGGESTION_WORDS)
  const hasAges = /\b(?:age|ages|aged)\s+\d|\b\d{1,2}\s*(?:years old|yo|y\/o)\b/i.test(text)

  const missingFields: TripPreflightResult['missingFields'] = []
  if (!travelerKnown) missingFields.push('traveler')
  if (!vibeKnown) missingFields.push('vibe')
  if (!timingKnown) missingFields.push('timing')
  if (!destinationKnown && !wantsDestinationSuggestion) missingFields.push('destination')

  return {
    ready: missingFields.length === 0,
    travelerKnown,
    hasAges,
    vibeKnown,
    timingKnown,
    destinationKnown,
    wantsDestinationSuggestion,
    missingFields,
    question: missingFields.length > 0 ? buildQuestion(missingFields) : undefined,
  }
}

function normalizePreflightResult(answer: unknown, fallback: TripPreflightResult): TripPreflightResult {
  const parsed = typeof answer === 'string' ? JSON.parse(answer) : answer

  if (!parsed || typeof parsed !== 'object') {
    return fallback
  }

  const result = parsed as Partial<TripPreflightResult>
  const missingFields = Array.isArray(result.missingFields)
    ? result.missingFields.filter((field): field is 'traveler' | 'vibe' | 'destination' | 'timing' =>
        field === 'traveler' || field === 'vibe' || field === 'destination' || field === 'timing'
      )
    : fallback.missingFields

  return {
    ready: Boolean(result.ready),
    travelerKnown: Boolean(result.travelerKnown),
    travelerSummary: result.travelerSummary,
    hasAges: Boolean(result.hasAges),
    vibeKnown: Boolean(result.vibeKnown),
    vibeSummary: result.vibeSummary,
    timingKnown: Boolean(result.timingKnown),
    timingSummary: result.timingSummary,
    destinationKnown: Boolean(result.destinationKnown),
    destination: result.destination,
    wantsDestinationSuggestion: Boolean(result.wantsDestinationSuggestion),
    missingFields,
    question: result.question || (missingFields.length > 0 ? buildQuestion(missingFields) : undefined),
  }
}

export async function validateTripRequest(input: TripPreflightInput): Promise<TripPreflightResult> {
  const fallback = localPreflight(input)
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY

  if (import.meta.env.MODE === 'test') {
    return fallback
  }

  if (!apiKey) {
    logPreflightFallback('missing VITE_OPENROUTER_API_KEY')
    return fallback
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-OpenRouter-Title': 'Voya',
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b:free',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: JSON.stringify(input) },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'trip_preflight',
            strict: true,
            schema: PREFLIGHT_SCHEMA,
          },
        },
        max_tokens: 500,
        temperature: 0,
      }),
    })

    if (!response.ok) {
      let detail: unknown
      try {
        detail = await response.json()
      } catch {
        detail = await response.text()
      }
      logPreflightFallback(`OpenRouter returned ${response.status}`, detail)
      return fallback
    }

    const data = (await response.json()) as OpenRouterChatResponse
    const result = normalizePreflightResult(data.choices?.[0]?.message?.content, fallback)
    logPreflightSuccess(result)
    return result
  } catch (error) {
    logPreflightFallback('OpenRouter request or parsing failed', error)
    return fallback
  }
}
