import type { TripPreflightInput } from './tripPreflight'

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

export function clampTripDuration(duration: number) {
  if (!Number.isFinite(duration)) return 5
  return Math.min(10, Math.max(2, Math.round(duration)))
}

export function inferTripDuration(input: TripPreflightInput) {
  const text = getBriefText(input)
  const numericDays = text.match(/\b(\d{1,2})\s*(?:days?|nights?)\b/i)
  if (numericDays?.[1]) return clampTripDuration(Number(numericDays[1]))

  const weeks = text.match(/\b(\d{1,2})\s*(?:weeks?)\b/i)
  if (weeks?.[1]) return clampTripDuration(Number(weeks[1]) * 7)

  if (/\bweekend\b/i.test(text)) return 3
  if (/\bweek\b/i.test(text)) return 7

  return 5
}
