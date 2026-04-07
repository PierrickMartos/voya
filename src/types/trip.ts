export type Vibe = 'budget' | 'mid-range' | 'luxury'
export type Group = 'solo' | 'couple' | 'family' | 'friends'

export interface TripRequest {
  naturalLanguage?: string
  destination?: string
  duration?: number
  dates?: { start: string; end: string }
  vibe: Vibe
  group: Group
  interests: string[]
}

export interface Activity {
  name: string
  description: string
  type: 'activity' | 'restaurant' | 'accommodation' | 'tip'
  timeOfDay?: 'morning' | 'afternoon' | 'evening'
  priceRange?: string
  address?: string
  imageUrl?: string
  mapUrl?: string
  websiteUrl?: string
}

export interface Day {
  day: number
  title: string
  description: string
  imageUrl?: string
  activities: Activity[]
}

export interface Itinerary {
  destination: string
  subtitle: string
  duration: number
  vibe: Vibe
  heroImageUrl?: string
  heroQuote?: { text: string; author: string }
  days: Day[]
  sight?: { name: string; description: string; imageUrl?: string }
  dining?: { name: string; description: string; imageUrl?: string }
  stay?: { name: string; quote: string; imageUrl?: string }
  logistics?: Array<{ icon: string; label: string }>
  bestTime?: { months: string; reason: string }
  generalTips: string[]
}
