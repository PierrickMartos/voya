# Voya

AI-powered travel planning. Describe your trip, get a personalized day-by-day itinerary.

**Stack:** React 19, TypeScript, Vite, Tailwind CSS v4, Vitest  
**AI:** OpenRouter for trip brief qualification, LLMLayer for live discovery, Google Maps for place validation  
**Hosting:** Render

## Setup

```bash
cp .env.example .env   # add VITE_OPENROUTER_API_KEY, VITE_LLMLAYER_API_KEY, and VITE_GOOGLE_MAPS_API_KEY
npm install
npm run dev
```

## Planning Pipeline

1. OpenRouter qualifies the need with Llama 3.3 70B Instruct, including traveler, vibe, timing, and destination intent.
2. LLMLayer identifies current restaurants, activities, accommodations, and tips from the qualified brief.
3. Google Maps validates candidate places for open status, ratings, reviews, and location metadata.

## Commands

```bash
npm run dev      # Dev server
npm run build    # Production build
npm run test     # Run tests
npm run lint     # Lint
```
