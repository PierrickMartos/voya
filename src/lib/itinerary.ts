import type { TripDiscoveryResult } from './llmlayer'
import type { TripPreflightInput, TripPreflightResult } from './tripPreflight'
import { getDestinationCoverImage, type UnsplashImage } from './unsplash'
import { normalizeCachedImageUrl, readLocalCache, writeLocalCache } from './localCache'
import { clampTripDuration, inferTripDuration } from './tripDuration'
import type { Activity, Itinerary, Vibe } from '../types/trip'

interface OpenRouterChatResponse {
  choices?: Array<{
    message?: {
      content?: string
    }
  }>
}

const OPENROUTER_ITINERARY_CACHE_NAMESPACE = 'openrouter:itinerary:v1'
const pendingItineraryRequests = new Map<string, Promise<Itinerary>>()

const IMAGE_HINTS = [
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1600&q=80',
]

const ITINERARY_SCHEMA = {
  type: 'object',
  properties: {
    destination: { type: 'string' },
    subtitle: { type: 'string' },
    duration: { type: 'number' },
    vibe: { type: 'string', enum: ['budget', 'mid-range', 'luxury'] },
    heroImageUrl: { type: 'string' },
    heroQuote: {
      type: 'object',
      properties: {
        text: { type: 'string' },
        author: { type: 'string' },
      },
      required: ['text', 'author'],
      additionalProperties: false,
    },
    days: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          day: { type: 'number' },
          title: { type: 'string' },
          description: { type: 'string' },
          imageUrl: { type: 'string' },
          activities: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                description: { type: 'string' },
                type: {
                  type: 'string',
                  enum: ['activity', 'restaurant', 'accommodation', 'tip'],
                },
                timeOfDay: {
                  type: 'string',
                  enum: ['morning', 'afternoon', 'evening'],
                },
                priceRange: { type: 'string' },
                address: { type: 'string' },
                imageUrl: { type: 'string' },
                mapUrl: { type: 'string' },
                websiteUrl: { type: 'string' },
                rating: { type: 'number' },
                ratingCount: { type: 'number' },
              },
              required: ['name', 'description', 'type'],
              additionalProperties: false,
            },
          },
        },
        required: ['day', 'title', 'description', 'activities'],
        additionalProperties: false,
      },
    },
    sight: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        description: { type: 'string' },
        imageUrl: { type: 'string' },
        mapUrl: { type: 'string' },
        websiteUrl: { type: 'string' },
        rating: { type: 'number' },
        ratingCount: { type: 'number' },
      },
      required: ['name', 'description'],
      additionalProperties: false,
    },
    dining: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        description: { type: 'string' },
        imageUrl: { type: 'string' },
        mapUrl: { type: 'string' },
        websiteUrl: { type: 'string' },
        rating: { type: 'number' },
        ratingCount: { type: 'number' },
      },
      required: ['name', 'description'],
      additionalProperties: false,
    },
    stay: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        quote: { type: 'string' },
        imageUrl: { type: 'string' },
        mapUrl: { type: 'string' },
        websiteUrl: { type: 'string' },
        rating: { type: 'number' },
        ratingCount: { type: 'number' },
      },
      required: ['name', 'quote'],
      additionalProperties: false,
    },
    logistics: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          icon: { type: 'string' },
          label: { type: 'string' },
        },
        required: ['icon', 'label'],
        additionalProperties: false,
      },
    },
    bestTime: {
      type: 'object',
      properties: {
        months: { type: 'string' },
        reason: { type: 'string' },
      },
      required: ['months', 'reason'],
      additionalProperties: false,
    },
    generalTips: {
      type: 'array',
      items: { type: 'string' },
    },
  },
  required: [
    'destination',
    'subtitle',
    'duration',
    'vibe',
    'heroImageUrl',
    'heroQuote',
    'days',
    'sight',
    'dining',
    'stay',
    'logistics',
    'bestTime',
    'generalTips',
  ],
  additionalProperties: false,
}

const SYSTEM_PROMPT = `
You convert a qualified travel brief and live discovery candidates into a complete itinerary page data object.

Return only JSON matching the provided schema. Do not include markdown.

Rules:
- Use the live discovery candidates when they fit the trip. Put restaurants into restaurant activities and activities into activity activities.
- Do not invent operational claims, addresses, ratings, or booking details that were not supplied by discovery.
- Create a day-by-day editorial itinerary with morning, afternoon, and evening pacing.
- The first day should include one accommodation suggestion when possible.
- If the duration is unclear, infer a practical duration from the request, capped between 2 and 10 days.
- Choose one of these vibes only: budget, mid-range, luxury.
- Use supplied image URLs when available. If an image URL is missing, use one of the provided generic image hints.
- Preserve supplied mapUrl, websiteUrl, rating, and ratingCount values for activities, restaurants, sights, dining, and stays when available.
- Keep descriptions concise and specific enough for the UI.
`.trim()

function logItineraryFallback(reason: string, detail?: unknown) {
  if (!import.meta.env.DEV) return

  console.warn('[itinerary] Falling back to local itinerary:', reason, detail ?? '')
}

function logItinerarySuccess(result: Itinerary) {
  if (!import.meta.env.DEV) return

  console.info('[itinerary] OpenRouter itinerary succeeded:', result)
}

function logItineraryCacheHit(result: Itinerary) {
  if (!import.meta.env.DEV) return

  console.info('[itinerary] Using cached OpenRouter itinerary:', result)
}

function normalizeDiscoveryForCache(discovery: TripDiscoveryResult): TripDiscoveryResult {
  return {
    restaurants: discovery.restaurants.map((item) => ({
      ...item,
      imageUrl: normalizeCachedImageUrl(item.imageUrl) as string | undefined,
    })),
    activities: discovery.activities.map((item) => ({
      ...item,
      imageUrl: normalizeCachedImageUrl(item.imageUrl) as string | undefined,
    })),
  }
}

function itineraryCachePayload(
  input: TripPreflightInput,
  qualification: TripPreflightResult,
  discovery: TripDiscoveryResult
) {
  return {
    provider: 'openrouter',
    task: 'itinerary_page',
    model: 'meta-llama/llama-3.3-70b-instruct',
    promptVersion: OPENROUTER_ITINERARY_CACHE_NAMESPACE,
    input,
    qualification,
    discovery: normalizeDiscoveryForCache(discovery),
  }
}

function getBriefText(input: TripPreflightInput) {
  return [
    input.naturalLanguage,
    input.travelerDescription,
    input.destination,
    input.vibe,
    input.timing,
  ]
    .filter(Boolean)
    .join(' ')
}

function inferDuration(input: TripPreflightInput) {
  return inferTripDuration(input)
}

function clampDuration(duration: number) {
  return clampTripDuration(duration)
}

function normalizeVibe(input: TripPreflightInput, qualification: TripPreflightResult): Vibe {
  const text = `${getBriefText(input)} ${qualification.vibeSummary ?? ''}`.toLowerCase()

  if (/\b(luxury|high-end|premium|exclusive|five-star)\b/.test(text)) return 'luxury'
  if (/\b(budget|cheap|affordable|low-cost|backpack)\b/.test(text)) return 'budget'

  return 'mid-range'
}

function destinationFrom(input: TripPreflightInput, qualification: TripPreflightResult) {
  return (
    qualification.destination?.trim() ||
    input.destination?.trim() ||
    (qualification.wantsDestinationSuggestion ? 'A destination Voya chose for you' : 'Your trip')
  )
}

function itemToActivity(
  item: TripDiscoveryResult['restaurants'][number],
  type: Activity['type'],
  timeOfDay: Activity['timeOfDay']
): Activity {
  return {
    name: item.name,
    description: item.description,
    type,
    timeOfDay,
    priceRange: item.priceRange,
    address: item.location,
    imageUrl: item.imageUrl,
    mapUrl: item.mapUrl,
    websiteUrl: item.sourceUrl,
    rating: item.rating,
    ratingCount: item.ratingCount,
  }
}

function buildLocalItinerary(
  input: TripPreflightInput,
  qualification: TripPreflightResult,
  discovery: TripDiscoveryResult
): Itinerary {
  const duration = inferDuration(input)
  const destination = destinationFrom(input, qualification)
  const vibe = normalizeVibe(input, qualification)
  const activities = discovery.activities
  const restaurants = discovery.restaurants
  const heroImageUrl =
    activities.find((item) => item.imageUrl)?.imageUrl ||
    restaurants.find((item) => item.imageUrl)?.imageUrl ||
    IMAGE_HINTS[0]

  const days = Array.from({ length: duration }, (_, index) => {
    const activity = activities[index % Math.max(activities.length, 1)]
    const restaurant = restaurants[index % Math.max(restaurants.length, 1)]
    const dayActivities: Activity[] = []

    if (activity) dayActivities.push(itemToActivity(activity, 'activity', 'morning'))
    if (restaurant) dayActivities.push(itemToActivity(restaurant, 'restaurant', 'evening'))

    if (index === 0) {
      dayActivities.push({
        name: `Stay in ${destination}`,
        description: 'Use this first evening to settle into a well-located base that keeps the next days easy.',
        type: 'accommodation',
        timeOfDay: 'evening',
      })
    }

    return {
      day: index + 1,
      title: index === 0 ? `Arrival in ${destination}` : `Discover ${destination}`,
      description:
        activity?.whyItMatches ||
        qualification.vibeSummary ||
        'A paced day shaped around the details from your travel brief.',
      imageUrl: activity?.imageUrl || restaurant?.imageUrl || IMAGE_HINTS[index % IMAGE_HINTS.length],
      activities: dayActivities,
    }
  })

  const firstActivity = activities[0]
  const firstRestaurant = restaurants[0]

  return {
    destination,
    subtitle: qualification.timingSummary || qualification.vibeSummary || 'A Personal Journey',
    duration,
    vibe,
    heroImageUrl,
    heroQuote: {
      text: 'Travel feels better when the days match the people taking them.',
      author: 'Voya',
    },
    days,
    sight: {
      name: firstActivity?.name || `A signature experience in ${destination}`,
      description: firstActivity?.description || 'A highlight selected from the rhythm and interests in your brief.',
      imageUrl: firstActivity?.imageUrl || heroImageUrl,
      mapUrl: firstActivity?.mapUrl,
      websiteUrl: firstActivity?.sourceUrl,
      rating: firstActivity?.rating,
      ratingCount: firstActivity?.ratingCount,
    },
    dining: {
      name: firstRestaurant?.name || `A fitting table in ${destination}`,
      description: firstRestaurant?.description || 'A restaurant direction chosen to match the trip style.',
      imageUrl: firstRestaurant?.imageUrl || heroImageUrl,
      mapUrl: firstRestaurant?.mapUrl,
      websiteUrl: firstRestaurant?.sourceUrl,
      rating: firstRestaurant?.rating,
      ratingCount: firstRestaurant?.ratingCount,
    },
    stay: {
      name: `A well-located stay in ${destination}`,
      quote: qualification.travelerSummary
        ? `"A base chosen around ${qualification.travelerSummary}."`
        : '"A base chosen around your route, pace, and priorities."',
      imageUrl: heroImageUrl,
    },
    logistics: [
      { icon: 'flight', label: `Arrive near ${destination}` },
      { icon: 'directions_walk', label: 'Keep each day grouped by neighborhood or area' },
      { icon: 'event', label: qualification.timingSummary || 'Dates flexible' },
    ],
    bestTime: {
      months: qualification.timingSummary || 'Flexible',
      reason: 'Based on the timing shared in your brief.',
    },
    generalTips: [
      'Book the highest-priority meals and activities first.',
      'Keep one flexible block each day for weather, energy, or local finds.',
      'Re-check opening hours close to departure.',
    ],
  }
}

function normalizeString(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeActivity(activity: Partial<Activity>): Activity | null {
  const name = normalizeString(activity.name)
  const description = normalizeString(activity.description)
  const allowedTypes: Activity['type'][] = ['activity', 'restaurant', 'accommodation', 'tip']
  const type = allowedTypes.includes(activity.type as Activity['type'])
    ? (activity.type as Activity['type'])
    : null

  if (!name || !description || !type) return null

  const allowedTimes: Activity['timeOfDay'][] = ['morning', 'afternoon', 'evening']
  const timeOfDay = allowedTimes.includes(activity.timeOfDay as Activity['timeOfDay'])
    ? (activity.timeOfDay as Activity['timeOfDay'])
    : undefined

  return {
    name,
    description,
    type,
    timeOfDay,
    priceRange: normalizeString(activity.priceRange) || undefined,
    address: normalizeString(activity.address) || undefined,
    imageUrl: normalizeString(activity.imageUrl) || undefined,
    mapUrl: normalizeString(activity.mapUrl) || undefined,
    websiteUrl: normalizeString(activity.websiteUrl) || undefined,
    rating: typeof activity.rating === 'number' ? activity.rating : undefined,
    ratingCount: typeof activity.ratingCount === 'number' ? activity.ratingCount : undefined,
  }
}

function normalizeItinerary(answer: unknown, fallback: Itinerary): Itinerary {
  const parsed = typeof answer === 'string' ? JSON.parse(answer) : answer

  if (!parsed || typeof parsed !== 'object') return fallback

  const raw = parsed as Partial<Itinerary>
  const destination = normalizeString(raw.destination) || fallback.destination
  const duration = clampDuration(Number(raw.duration || fallback.duration))
  const vibe: Vibe =
    raw.vibe === 'budget' || raw.vibe === 'mid-range' || raw.vibe === 'luxury'
      ? raw.vibe
      : fallback.vibe
  const days = Array.isArray(raw.days)
    ? raw.days
        .map((day, index) => ({
          day: Number(day.day) || index + 1,
          title: normalizeString(day.title) || `Day ${index + 1}`,
          description: normalizeString(day.description) || fallback.days[index]?.description || '',
          imageUrl: normalizeString(day.imageUrl) || fallback.days[index]?.imageUrl,
          activities: Array.isArray(day.activities)
            ? day.activities
                .map((activity) => normalizeActivity(activity))
                .filter((activity): activity is Activity => Boolean(activity))
            : [],
        }))
        .filter((day) => day.title && day.description)
    : fallback.days

  return {
    destination,
    subtitle: normalizeString(raw.subtitle) || fallback.subtitle,
    duration,
    vibe,
    heroImageUrl: normalizeString(raw.heroImageUrl) || fallback.heroImageUrl,
    heroQuote: raw.heroQuote?.text && raw.heroQuote?.author
      ? {
          text: raw.heroQuote.text,
          author: raw.heroQuote.author,
        }
      : fallback.heroQuote,
    days: days.length > 0 ? days : fallback.days,
    sight: raw.sight?.name && raw.sight?.description ? raw.sight : fallback.sight,
    dining: raw.dining?.name && raw.dining?.description ? raw.dining : fallback.dining,
    stay: raw.stay?.name && raw.stay?.quote ? raw.stay : fallback.stay,
    logistics: Array.isArray(raw.logistics) && raw.logistics.length > 0 ? raw.logistics : fallback.logistics,
    bestTime: raw.bestTime?.months && raw.bestTime?.reason ? raw.bestTime : fallback.bestTime,
    generalTips: Array.isArray(raw.generalTips) && raw.generalTips.length > 0
      ? raw.generalTips.filter((tip) => typeof tip === 'string' && tip.trim())
      : fallback.generalTips,
  }
}

function withCoverImage(itinerary: Itinerary, coverImage: UnsplashImage | null | undefined): Itinerary {
  if (!coverImage) return itinerary

  return {
    ...itinerary,
    heroImageUrl: coverImage.url,
  }
}

async function withDestinationCoverImage(
  itinerary: Itinerary,
  coverImage: UnsplashImage | null | undefined
): Promise<Itinerary> {
  if (coverImage !== undefined) return withCoverImage(itinerary, coverImage)

  const fetchedCoverImage = await getDestinationCoverImage(itinerary.destination)

  if (!fetchedCoverImage) return itinerary

  return {
    ...itinerary,
    heroImageUrl: fetchedCoverImage.url,
  }
}

export async function generateItinerary(
  input: TripPreflightInput,
  qualification: TripPreflightResult,
  discovery: TripDiscoveryResult,
  coverImage?: UnsplashImage | null
): Promise<Itinerary> {
  const fallback = buildLocalItinerary(input, qualification, discovery)
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY

  if (import.meta.env.MODE === 'test') {
    return fallback
  }

  if (!apiKey) {
    logItineraryFallback('missing VITE_OPENROUTER_API_KEY')
    return withDestinationCoverImage(fallback, coverImage)
  }

  const requestPayload = {
    model: 'meta-llama/llama-3.3-70b-instruct',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: JSON.stringify({
          input,
          qualification,
          discovery,
          imageHints: IMAGE_HINTS,
        }),
      },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'itinerary_page',
        strict: true,
        schema: ITINERARY_SCHEMA,
      },
    },
    max_tokens: 5000,
    temperature: 0.4,
  }
  const cachePayload = itineraryCachePayload(input, qualification, discovery)
  const cached = readLocalCache<Itinerary>(OPENROUTER_ITINERARY_CACHE_NAMESPACE, cachePayload)

  if (cached) {
    logItineraryCacheHit(cached)
    return withDestinationCoverImage(cached, coverImage)
  }

  const pendingCacheKey = JSON.stringify(cachePayload)
  const pending = pendingItineraryRequests.get(pendingCacheKey)

  if (pending) return withDestinationCoverImage(await pending, coverImage)

  const request = (async () => {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-OpenRouter-Title': 'Voya',
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
      logItineraryFallback(`OpenRouter returned ${response.status}`, detail)
      return withDestinationCoverImage(fallback, coverImage)
    }

    const data = (await response.json()) as OpenRouterChatResponse
    const itinerary = normalizeItinerary(data.choices?.[0]?.message?.content, fallback)
    writeLocalCache(OPENROUTER_ITINERARY_CACHE_NAMESPACE, cachePayload, itinerary)
    logItinerarySuccess(itinerary)
    return itinerary
  } catch (error) {
    logItineraryFallback('OpenRouter request or parsing failed', error)
    return fallback
  }
  })()

  pendingItineraryRequests.set(pendingCacheKey, request)

  try {
    return withDestinationCoverImage(await request, coverImage)
  } finally {
    pendingItineraryRequests.delete(pendingCacheKey)
  }
}
