# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Voya is an AI-powered travel planning website. Users describe their dream trip in natural language and receive a personalized day-by-day itinerary with activities, restaurants, accommodation suggestions, and tips. A structured form is available as an alternative input mode.

## Tech Stack

- **Framework:** React 19, TypeScript, Vite
- **Styling:** Tailwind CSS v4
- **Testing:** Vitest
- **AI:** LLMLayer API (`LLMLayer-web` model — OpenAI GPT-4o with live web search)
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

Use Chrome DevTools MCP (`mcp__chrome_devtools__*`) to verify UI work against the running dev server at **http://localhost:5175/**. Check layout, styles, and console errors after making visual changes.

## Architecture

**Frontend-only** — no backend server. The React app calls LLMLayer directly.

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
    llmlayer.ts       # API client + prompt builder
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

## LLMLayer Integration

- Model: `LLMLayer-web` (web search enabled for current recommendations)
- Prompt builder (`lib/llmlayer.ts`) injects `TripRequest` into a system prompt that requests a valid JSON response matching the `Itinerary` shape
- Streaming response — itinerary cards appear progressively as the response streams in
- API key stored in `.env` as `VITE_LLMLAYER_API_KEY`

## User Flow

1. **Home (`/`)** — Hero → natural language input → traveler profile (vibe, group, interests, dates) → "Plan my trip"
2. **Itinerary (`/itinerary`)** — Day-by-day cards with morning/afternoon/evening sections, restaurant cards, Day 1 accommodation suggestion, general tips footer
