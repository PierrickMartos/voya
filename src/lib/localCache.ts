const CACHE_PREFIX = 'voya:api-cache'

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`
  }

  if (isRecord(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
      .join(',')}}`
  }

  return JSON.stringify(value)
}

function hashString(value: string) {
  let hash = 5381

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 33) ^ value.charCodeAt(index)
  }

  return (hash >>> 0).toString(36)
}

function cacheKey(namespace: string, payload: unknown) {
  return `${CACHE_PREFIX}:${namespace}:${hashString(stableStringify(payload))}`
}

function getStorage() {
  try {
    return window.localStorage
  } catch {
    return undefined
  }
}

export function readLocalCache<T>(namespace: string, payload: unknown): T | undefined {
  const storage = getStorage()
  if (!storage) return undefined

  try {
    const cached = storage.getItem(cacheKey(namespace, payload))
    if (!cached) return undefined

    return JSON.parse(cached) as T
  } catch {
    return undefined
  }
}

export function writeLocalCache<T>(namespace: string, payload: unknown, value: T) {
  const storage = getStorage()
  if (!storage) return

  try {
    storage.setItem(cacheKey(namespace, payload), JSON.stringify(value))
  } catch {
    // localStorage can be full or blocked; cache failures should never break trip planning.
  }
}

export function normalizeCachedImageUrl(value: unknown) {
  if (typeof value !== 'string') return value

  try {
    const url = new URL(value)
    url.searchParams.delete('key')
    return url.toString()
  } catch {
    return value
  }
}
