# AGENTS.md

This file provides guidance to coding agents when working with code in this repository.

## Project

Voya is an AI-powered travel planning website. Users describe their dream trip in natural language and receive a personalized day-by-day itinerary with activities, restaurants, accommodation suggestions, and tips. A structured form is available as an alternative input mode.

## Tech Stack

- **Framework:** React 19, TypeScript, Vite
- **Styling:** Tailwind CSS v4
- **Testing:** Vitest
- **AI orchestration:** OpenRouter (`meta-llama/llama-3.3-70b-instruct`) for request qualification, LLMLayer for live restaurant/activity discovery
- **Place validation:** Google Maps API for open status, ratings, and review checks
- **CI/CD:** GitHub Actions
- **Hosting:** Render

## Commands

```bash
npm run dev        # Start dev server
npm run build      # Production build
npm run preview    # Preview production build
npm run test       # Run tests with Vitest
npm run lint       # Lint
```

## UI Verification

Use Chrome DevTools MCP (`mcp__chrome_devtools__*`) to verify UI work against the running dev server at **http://localhost:5173/voya/**. Check layout, styles, and console errors after making visual changes.

## Architecture

**Frontend-only prototype** — no backend server yet. The React app calls external APIs directly during local development.

### Planning Pipeline

1. **OpenRouter qualification** — Before navigating to `/itinerary`, classify the user request with Llama 3.3 70B Instruct. Confirm the app knows who is traveling, the travel vibe/type, when they want to travel, and the destination unless the user explicitly asks Voya to choose one.
2. **LLMLayer discovery** — Once the request is qualified, use LLMLayer web-enabled generation to identify candidate restaurants, activities, accommodations, and destination-specific tips that fit the settled need.
3. **Google Maps validation** — Validate LLMLayer candidates against Google Maps before presenting them. Confirm places are still open, have acceptable ratings/review signals, and have usable location metadata.

Keep these responsibilities separate: OpenRouter decides whether the trip brief is complete, LLMLayer proposes current candidates, and Google Maps verifies real-world place quality/status.

```
src/
  components/
    trip-form/        # Natural language textarea + structured form toggle
    traveler-profile/ # Vibe, group, interests, dates selectors
    itinerary/        # Day-by-day output rendering
    ui/               # Shared primitives (Button, Card, Badge...)
  hooks/
    useItinerary.ts   # LLMLayer API call + streaming state
    useTripForm.ts    # Form state management
  lib/
    tripPreflight.ts  # OpenRouter request qualification
    llmlayer.ts       # API client + prompt builder
    googleMaps.ts     # Google Maps place validation
    itinerary.ts      # Response parser → typed Itinerary
  types/
    trip.ts           # TripRequest, Itinerary, Day, Activity types
  pages/
    Home.tsx          # Input flow (/)
    Itinerary.tsx     # Results view (/itinerary)
```

## Key Data Types

```ts
type Vibe = 'budget' | 'mid-range' | 'luxury'
type Group = 'solo' | 'couple' | 'family' | 'friends'

interface TripRequest {
  naturalLanguage?: string
  destination?: string
  duration?: number
  dates?: { start: string; end: string }
  vibe: Vibe
  group: Group
  interests: string[]   // 'food' | 'culture' | 'nature' | 'nightlife' | 'adventure'
}

interface Activity {
  name: string
  description: string
  type: 'activity' | 'restaurant' | 'accommodation' | 'tip'
  timeOfDay?: 'morning' | 'afternoon' | 'evening'
  priceRange?: string
  address?: string
}

interface Day {
  day: number
  title: string
  activities: Activity[]
}

interface Itinerary {
  destination: string
  duration: number
  vibe: Vibe
  days: Day[]
  generalTips: string[]
}
```

## OpenRouter Qualification

- Model: `meta-llama/llama-3.3-70b-instruct`
- API key stored in `.env` as `VITE_OPENROUTER_API_KEY`
- Current implementation: `src/lib/tripPreflight.ts`
- Purpose: gate itinerary generation until the brief contains the traveler, vibe/type of travel, travel timing, and either a destination or explicit permission for Voya to choose one

## LLMLayer Discovery

- Model: `LLMLayer-web` (web search enabled for current recommendations)
- Prompt builder (`lib/llmlayer.ts`) should inject the qualified `TripRequest` into a system prompt that requests candidate restaurants, activities, accommodations, and tips matching the `Itinerary` shape
- API key stored in `.env` as `VITE_LLMLAYER_API_KEY`

## Google Maps Validation

- Use Google Maps API after LLMLayer discovery, before rendering final recommendations
- Confirm each restaurant/activity/accommodation is open or operational where possible
- Prefer candidates with strong ratings, sufficient review counts, and complete place metadata
- API key stored in `.env` as `VITE_GOOGLE_MAPS_API_KEY`

## User Flow

1. **Home (`/`)** — Hero → natural language input or guided input → OpenRouter qualification → ask for missing details if needed
2. **Discovery** — LLMLayer proposes restaurants, activities, accommodations, and tips from the qualified brief
3. **Validation** — Google Maps validates open status, ratings, reviews, and place metadata
4. **Itinerary (`/itinerary`)** — Day-by-day cards with morning/afternoon/evening sections, restaurant cards, Day 1 accommodation suggestion, general tips footer
