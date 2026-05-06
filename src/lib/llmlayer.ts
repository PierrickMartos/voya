import type { TripPreflightInput, TripPreflightResult } from './tripPreflight'
import { readLocalCache, writeLocalCache } from './localCache'
import { inferTripDuration } from './tripDuration'

export type DiscoveryKind = 'restaurants' | 'activities'

export interface DiscoveryItem {
  name: string
  description: string
  whyItMatches: string
  location?: string
  priceRange?: string
  bestFor?: string
  sourceUrl?: string
  imageUrl?: string
  mapUrl?: string
  rating?: number
  ratingCount?: number
}

export interface TripDiscoveryResult {
  restaurants: DiscoveryItem[]
  activities: DiscoveryItem[]
}

interface LLMLayerAnswerResponse {
  answer?: string | { items?: DiscoveryItem[] }
  images?: LLMLayerImage[]
}

interface LLMLayerImage {
  imageUrl?: string
  thumbnailUrl?: string
  title?: string
  source?: string
  link?: string
}

const LLMLAYER_CACHE_NAMESPACE = 'llmlayer:discovery:v3'

const DISCOVERY_SCHEMA = {
  type: 'object',
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          whyItMatches: { type: 'string' },
          location: { type: 'string' },
          priceRange: { type: 'string' },
          bestFor: { type: 'string' },
          sourceUrl: { type: 'string' },
        },
        required: ['name', 'description', 'whyItMatches'],
        additionalProperties: false,
      },
    },
  },
  required: ['items'],
  additionalProperties: false,
}

function logDiscoveryFallback(reason: string, detail?: unknown) {
  if (!import.meta.env.DEV) return

  console.warn('[llmlayer] Discovery skipped or failed:', reason, detail ?? '')
}

function logDiscoveryAnswer(kind: DiscoveryKind, answer: LLMLayerAnswerResponse['answer']) {
  if (!import.meta.env.DEV) return

  console.info(`[llmlayer] Raw ${kind} answer:`, answer)
}

function logDiscoveryItems(kind: DiscoveryKind, items: DiscoveryItem[]) {
  if (!import.meta.env.DEV) return

  console.info(`[llmlayer] Normalized ${kind} items:`, items)
}

function logDiscoveryCacheHit(kind: DiscoveryKind, items: DiscoveryItem[]) {
  if (!import.meta.env.DEV) return

  console.info(`[llmlayer] Using cached ${kind} items:`, items)
}

function logDiscoveryImages(kind: DiscoveryKind, images: LLMLayerImage[] | undefined) {
  if (!import.meta.env.DEV) return

  console.info(`[llmlayer] ${kind} images:`, images ?? [])
}

function buildTripContext(input: TripPreflightInput, qualification: TripPreflightResult) {
  return {
    originalInput: input,
    qualification: {
      travelerSummary: qualification.travelerSummary,
      hasAges: qualification.hasAges,
      vibeSummary: qualification.vibeSummary,
      timingSummary: qualification.timingSummary,
      destination: qualification.destination,
      wantsDestinationSuggestion: qualification.wantsDestinationSuggestion,
    },
  }
}

function buildDiscoveryPrompt(
  kind: DiscoveryKind,
  input: TripPreflightInput,
  qualification: TripPreflightResult
) {
  const target = kind === 'restaurants' ? 'restaurants and food stops' : 'activities and experiences'
  const duration = inferTripDuration(input)
  const targetCount = kind === 'restaurants'
    ? Math.min(12, Math.max(3, duration))
    : Math.min(16, Math.max(4, duration * 2))

  return `
Find current ${target} for this qualified travel brief.

Return exactly ${targetCount} strong options for a ${duration}-day stay.

Return options that fit every signal the user shared: destination or open-destination request, trip timing, traveler group, ages, budget, vibe, pace, interests, food preferences, accessibility, and anything else present in the brief.

Avoid generic tourist lists. Prefer options that are currently relevant, destination-specific, and defensible from recent web information. If the user asked Voya to choose the destination, choose options in one coherent destination and make that destination clear in the location fields.

Do not include image URLs. The app uses its own image source for visuals.

Qualified trip context:
${JSON.stringify(buildTripContext(input, qualification), null, 2)}
`.trim()
}

function normalizeDiscoveryItems(
  answer: LLMLayerAnswerResponse['answer'],
  _images: LLMLayerImage[] | undefined
): DiscoveryItem[] {
  if (!answer) return []

  const parsed = typeof answer === 'string'
    ? (JSON.parse(answer) as { items?: DiscoveryItem[] })
    : answer

  if (!Array.isArray(parsed.items)) return []

  return parsed.items
    .filter((item): item is DiscoveryItem => {
      return Boolean(item?.name && item.description && item.whyItMatches)
    })
    .map((item) => {
      const normalizedItem = { ...item }
      delete normalizedItem.imageUrl
      return normalizedItem
    })
}

export async function discoverTripOptions(
  kind: DiscoveryKind,
  input: TripPreflightInput,
  qualification: TripPreflightResult
): Promise<DiscoveryItem[]> {
  const apiKey = import.meta.env.VITE_LLMLAYER_API_KEY

  if (import.meta.env.MODE === 'test') {
    return []
  }

  if (!apiKey) {
    logDiscoveryFallback('missing VITE_LLMLAYER_API_KEY')
    return []
  }

  const duration = inferTripDuration(input)
  const targetCount = kind === 'restaurants'
    ? Math.min(12, Math.max(3, duration))
    : Math.min(16, Math.max(4, duration * 2))
  const requestPayload = {
    query: buildDiscoveryPrompt(kind, input, qualification),
    model: 'llmlayer-web',
    response_language: 'auto',
    answer_type: 'json',
    search_type: 'general',
    json_schema: JSON.stringify(DISCOVERY_SCHEMA),
    citations: false,
    return_sources: false,
    return_images: true,
    date_filter: 'anytime',
    max_queries: duration >= 7 ? 3 : 2,
    max_tokens: Math.min(2600, 900 + targetCount * 140),
    temperature: 0.2,
    search_context_size: 'medium',
  }
  const cached = readLocalCache<DiscoveryItem[]>(LLMLAYER_CACHE_NAMESPACE, {
    kind,
    requestPayload,
  })

  if (cached) {
    logDiscoveryCacheHit(kind, cached)
    return cached
  }

  try {
    const response = await fetch('https://api.llmlayer.dev/api/v2/answer', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestPayload),
    })

    if (!response.ok) {
      let detail: unknown
      try {
        detail = await response.json()
      } catch {
        detail = await response.text()
      }
      logDiscoveryFallback(`LLMLayer returned ${response.status}`, detail)
      return []
    }

    const data = (await response.json()) as LLMLayerAnswerResponse
    logDiscoveryAnswer(kind, data.answer)
    logDiscoveryImages(kind, data.images)

    const items = normalizeDiscoveryItems(data.answer, data.images)
    writeLocalCache(LLMLAYER_CACHE_NAMESPACE, { kind, requestPayload }, items)
    logDiscoveryItems(kind, items)
    return items
  } catch (error) {
    logDiscoveryFallback(`${kind} request failed`, error)
    return []
  }
}

export async function discoverRestaurantsAndActivities(
  input: TripPreflightInput,
  qualification: TripPreflightResult
): Promise<TripDiscoveryResult> {
  const [restaurants, activities] = await Promise.all([
    discoverTripOptions('restaurants', input, qualification),
    discoverTripOptions('activities', input, qualification),
  ])

  return { restaurants, activities }
}
