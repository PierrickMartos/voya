import type { DiscoveryItem, TripDiscoveryResult } from './llmlayer'
import type { TripPreflightResult } from './tripPreflight'
import { readLocalCache, writeLocalCache } from './localCache'

interface GooglePlacePhoto {
  name?: string
}

interface GooglePlace {
  id?: string
  displayName?: {
    text?: string
  }
  formattedAddress?: string
  googleMapsUri?: string
  websiteUri?: string
  businessStatus?: string
  photos?: GooglePlacePhoto[]
  rating?: number
  userRatingCount?: number
}

interface GoogleTextSearchResponse {
  places?: GooglePlace[]
}

const GOOGLE_PLACES_TEXT_SEARCH_URL = 'https://places.googleapis.com/v1/places:searchText'
const GOOGLE_PLACE_PHOTO_URL = 'https://places.googleapis.com/v1'
const GOOGLE_PLACES_TEXT_SEARCH_CACHE_NAMESPACE = 'google-places:text-search:v2'
const PLACE_FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.googleMapsUri',
  'places.websiteUri',
  'places.businessStatus',
  'places.photos',
  'places.rating',
  'places.userRatingCount',
].join(',')

function logGooglePlacesFallback(reason: string, detail?: unknown) {
  if (!import.meta.env.DEV) return

  console.warn('[googleMaps] Place image lookup skipped or failed:', reason, detail ?? '')
}

function logGooglePlacesCacheHit(query: string, data: GoogleTextSearchResponse) {
  if (!import.meta.env.DEV) return

  console.info('[googleMaps] Using cached Places Text Search response:', query, data)
}

function placeSearchQuery(item: DiscoveryItem, qualification: TripPreflightResult) {
  return [item.name, item.location, qualification.destination].filter(Boolean).join(', ')
}

function placePhotoUrl(photoName: string, apiKey: string) {
  const url = new URL(`${GOOGLE_PLACE_PHOTO_URL}/${photoName}/media`)
  url.searchParams.set('maxWidthPx', '1000')
  url.searchParams.set('key', apiKey)
  return url.toString()
}

function normalizePlaceItem(item: DiscoveryItem, place: GooglePlace, apiKey: string): DiscoveryItem {
  const photoName = place.photos?.[0]?.name
  const imageUrl = photoName ? placePhotoUrl(photoName, apiKey) : item.imageUrl

  return {
    ...item,
    imageUrl,
    location: item.location || place.formattedAddress,
    mapUrl: item.mapUrl || place.googleMapsUri,
    rating: item.rating || place.rating,
    ratingCount: item.ratingCount || place.userRatingCount,
    sourceUrl: item.sourceUrl || place.websiteUri || place.googleMapsUri,
  }
}

async function searchTextPlace(
  requestPayload: { textQuery: string; maxResultCount: number; languageCode: string },
  apiKey: string
): Promise<GoogleTextSearchResponse | null> {
  const cachePayload = {
    endpoint: GOOGLE_PLACES_TEXT_SEARCH_URL,
    fieldMask: PLACE_FIELD_MASK,
    body: requestPayload,
  }
  const cached = readLocalCache<GoogleTextSearchResponse>(
    GOOGLE_PLACES_TEXT_SEARCH_CACHE_NAMESPACE,
    cachePayload
  )

  if (cached !== undefined) {
    logGooglePlacesCacheHit(requestPayload.textQuery, cached)
    return cached
  }

  const response = await fetch(GOOGLE_PLACES_TEXT_SEARCH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': PLACE_FIELD_MASK,
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
    logGooglePlacesFallback(`Places Text Search returned ${response.status}`, detail)
    return null
  }

  const data = (await response.json()) as GoogleTextSearchResponse
  writeLocalCache(GOOGLE_PLACES_TEXT_SEARCH_CACHE_NAMESPACE, cachePayload, data)
  return data
}

async function findPlaceImage(
  item: DiscoveryItem,
  qualification: TripPreflightResult,
  apiKey: string
): Promise<DiscoveryItem> {
  const requestPayload = {
    textQuery: placeSearchQuery(item, qualification),
    maxResultCount: 1,
    languageCode: 'en',
  }
  try {
    const data = await searchTextPlace(requestPayload, apiKey)
    if (!data) return item

    const place = data.places?.[0]

    if (!place) {
      return item
    }

    return normalizePlaceItem(item, place, apiKey)
  } catch (error) {
    logGooglePlacesFallback('place image request failed', error)
    return item
  }
}

async function enrichItemsWithGooglePlacesImages(
  items: DiscoveryItem[],
  qualification: TripPreflightResult,
  apiKey: string
) {
  return Promise.all(items.map((item) => findPlaceImage(item, qualification, apiKey)))
}

export async function enrichDiscoveryWithGooglePlacesImages(
  discovery: TripDiscoveryResult,
  qualification: TripPreflightResult
): Promise<TripDiscoveryResult> {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

  if (import.meta.env.MODE === 'test') {
    return discovery
  }

  if (!apiKey) {
    logGooglePlacesFallback('missing VITE_GOOGLE_MAPS_API_KEY')
    return discovery
  }

  const [restaurants, activities] = await Promise.all([
    enrichItemsWithGooglePlacesImages(discovery.restaurants, qualification, apiKey),
    enrichItemsWithGooglePlacesImages(discovery.activities, qualification, apiKey),
  ])

  return { restaurants, activities }
}
