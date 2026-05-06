import { readLocalCache, writeLocalCache } from './localCache'

export interface UnsplashImage {
  url: string
  alt: string
  photographerName: string
  photographerUrl: string
  sourceUrl: string
}

interface UnsplashPhoto {
  alt_description?: string | null
  description?: string | null
  links?: {
    html?: string
    download_location?: string
  }
  urls?: {
    regular?: string
    full?: string
    raw?: string
  }
  user?: {
    name?: string
    links?: {
      html?: string
    }
  }
}

interface UnsplashSearchResponse {
  results?: UnsplashPhoto[]
}

const UNSPLASH_API_URL = 'https://api.unsplash.com'
const UNSPLASH_CACHE_NAMESPACE = 'unsplash:destination-cover:v1'

function logUnsplashFallback(reason: string, detail?: unknown) {
  if (!import.meta.env.DEV) return

  console.warn('[unsplash] Cover image lookup skipped or failed:', reason, detail ?? '')
}

function logUnsplashCacheHit(image: UnsplashImage | null) {
  if (!import.meta.env.DEV) return

  console.info('[unsplash] Using cached cover image:', image)
}

function normalizeDestination(destination: string) {
  return destination
    .replace(/\b(a destination voya chose for you|your trip)\b/gi, '')
    .replace(/[^\p{L}\p{N}\s,.'-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

async function triggerDownload(downloadLocation: string, accessKey: string) {
  try {
    const url = new URL(downloadLocation)
    url.searchParams.set('client_id', accessKey)
    await fetch(url.toString())
  } catch (error) {
    logUnsplashFallback('download tracking failed', error)
  }
}

export async function getDestinationCoverImage(destination: string): Promise<UnsplashImage | null> {
  const accessKey = import.meta.env.VITE_UNSPLASH_ACCESS_KEY
  const query = normalizeDestination(destination)

  if (import.meta.env.MODE === 'test') {
    return null
  }

  if (!accessKey) {
    logUnsplashFallback('missing VITE_UNSPLASH_ACCESS_KEY')
    return null
  }

  if (!query) {
    logUnsplashFallback('empty destination')
    return null
  }

  const requestPayload = {
    query,
    orientation: 'landscape',
    per_page: '1',
    content_filter: 'high',
  }
  const cached = readLocalCache<UnsplashImage | null>(UNSPLASH_CACHE_NAMESPACE, requestPayload)

  if (cached !== undefined) {
    logUnsplashCacheHit(cached)
    return cached
  }

  try {
    const searchUrl = new URL(`${UNSPLASH_API_URL}/search/photos`)
    searchUrl.searchParams.set('query', requestPayload.query)
    searchUrl.searchParams.set('orientation', requestPayload.orientation)
    searchUrl.searchParams.set('per_page', requestPayload.per_page)
    searchUrl.searchParams.set('content_filter', requestPayload.content_filter)

    const response = await fetch(searchUrl.toString(), {
      headers: {
        Authorization: `Client-ID ${accessKey}`,
        'Accept-Version': 'v1',
      },
    })

    if (!response.ok) {
      let detail: unknown
      try {
        detail = await response.json()
      } catch {
        detail = await response.text()
      }
      logUnsplashFallback(`Unsplash returned ${response.status}`, detail)
      return null
    }

    const data = (await response.json()) as UnsplashSearchResponse
    const photo = data.results?.[0]
    const url = photo?.urls?.full || photo?.urls?.regular || photo?.urls?.raw

    if (!photo || !url) {
      logUnsplashFallback('no image result')
      writeLocalCache(UNSPLASH_CACHE_NAMESPACE, requestPayload, null)
      return null
    }

    if (photo.links?.download_location) {
      void triggerDownload(photo.links.download_location, accessKey)
    }

    const photographerUrl = photo.user?.links?.html
      ? `${photo.user.links.html}?utm_source=voya&utm_medium=referral`
      : 'https://unsplash.com/?utm_source=voya&utm_medium=referral'

    const image = {
      url,
      alt: photo.alt_description || photo.description || `${query} travel cover image`,
      photographerName: photo.user?.name || 'Unsplash photographer',
      photographerUrl,
      sourceUrl: photo.links?.html
        ? `${photo.links.html}?utm_source=voya&utm_medium=referral`
        : photographerUrl,
    }

    writeLocalCache(UNSPLASH_CACHE_NAMESPACE, requestPayload, image)
    return image
  } catch (error) {
    logUnsplashFallback('request failed', error)
    return null
  }
}
