import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import LoadingScreen from './LoadingScreen'
import { generateItinerary } from '../lib/itinerary'
import { discoverRestaurantsAndActivities, type TripDiscoveryResult } from '../lib/llmlayer'
import { enrichDiscoveryWithGooglePlacesImages } from '../lib/googleMaps'
import { readLocalCache, writeLocalCache } from '../lib/localCache'
import { validateTripRequest, type TripPreflightInput, type TripPreflightResult } from '../lib/tripPreflight'
import { getDestinationCoverImage } from '../lib/unsplash'
import type { Itinerary } from '../types/trip'

const VIDEO_CLIPS = [
  '146632-789534284',
  '178732-860527368',
  '203407-921381921',
  '211152',
  '48600-454879607',
  '67201-521635037',
  '79812-570532707',
]

const PIXABAY_URLS: Record<string, string> = {
  '146632-789534284': 'https://pixabay.com/videos/couple-beach-ocean-sea-walking-146632/',
  '178732-860527368': 'https://pixabay.com/videos/waterfall-jungle-halong-bay-vietnam-178732/',
  '203407-921381921': 'https://pixabay.com/videos/mountain-volcano-forest-sky-clouds-203407/',
  '211152':           'https://pixabay.com/videos/swimming-pool-house-hotel-villa-211152/',
  '48600-454879607':  'https://pixabay.com/videos/coast-sea-landscape-paradise-48600/',
  '67201-521635037':  'https://pixabay.com/videos/lake-houses-hill-mountain-boat-67201/',
  '79812-570532707':  'https://pixabay.com/videos/sunset-pool-swimming-pool-79812/',
}

const PIXABAY_AUTHORS: Record<string, string> = {
  '146632-789534284': 'Lina Dem',
  '178732-860527368': 'Quan Tran',
  '203407-921381921': 'Tung Lam',
  '211152':           'Nuwan Pradeep',
  '48600-454879607':  'Georg H.',
  '67201-521635037':  'Marian Croitoru',
  '79812-570532707':  'mds524680',
}

const PLAY_DURATION = 8000  // ms each clip plays before fading
const FADE_DURATION = 1500  // ms crossfade duration
const MIN_LOADING_SCREEN_MS = 1_500
const GENERATED_TRIP_CACHE_NAMESPACE = 'generated-trip:v2'
const GOOGLE_PLACES_ENRICHMENT_TIMEOUT_MS = 4_000

interface CachedGeneratedTrip {
  input: TripPreflightInput
  preflight: TripPreflightResult
  discovery: TripDiscoveryResult
  itinerary: Itinerary
  coverImageUrl?: string
}

const SAMPLE_PROMPTS = [
  {
    icon: 'favorite',
    label: 'Romantic weekend in Rome',
    prompt: "3 days in Rome with my wife in May — we've been once before so skip the obvious stuff. We're into good food, slow mornings, and beautiful things. Romantic but not cheesy.",
  },
  {
    icon: 'waves',
    label: 'Week in Brittany with the kids',
    prompt: "7 days in Brittany, France next summer with two young kids (ages 5 and 8). We love the coast, seafood, and the outdoors. Looking for beaches, tide pools, boat trips, and family-friendly restaurants. Relaxed pace, nothing too touristy.",
  },
  {
    icon: 'groups',
    label: '3 weeks in Vietnam with the family',
    prompt: "3 weeks in Vietnam in December with my parents and siblings — ages 12 to 65. We want to experience the north, central, and south: food, history, nature, and some beach time. Mix of comfort and adventure, mid-range budget.",
  },
]

const LOADING_MESSAGES = {
  qualifying: {
    label: 'Reading your travel brief',
    detail: 'Confirming the essentials before building the itinerary.',
  },
  discovery: {
    label: 'Finding current recommendations',
    detail: 'Looking for restaurants, activities, and local highlights that fit your trip.',
  },
  cover: {
    label: 'Setting the scene',
    detail: 'Bringing in a destination cover while recommendations continue in the background.',
  },
  places: {
    label: 'Checking places',
    detail: 'Matching restaurants and activities to Google Maps for photos, ratings, and links.',
  },
  itinerary: {
    label: 'Composing the itinerary',
    detail: 'Organizing the route into a polished day-by-day journey.',
  },
}

function clipSrc(name: string, isDesktop: boolean) {
  return `${import.meta.env.BASE_URL}videos/homepage/${name}_${isDesktop ? 'medium' : 'tiny'}.mp4`
}

function getCoverDestination(input: TripPreflightInput, result: TripPreflightResult) {
  if (result.wantsDestinationSuggestion && !result.destination) return ''

  return result.destination?.trim() || input.destination?.trim() || ''
}

function waitForNextTask() {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, 0)
  })
}

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

async function waitForMinimumLoadingTime(startedAt: number) {
  const remaining = MIN_LOADING_SCREEN_MS - (Date.now() - startedAt)

  if (remaining > 0) {
    await wait(remaining)
  }
}

function logTripStage(stage: string, startedAt: number) {
  if (!import.meta.env.DEV) return

  console.info(`[hero] ${stage} finished in ${Math.round(performance.now() - startedAt)}ms`)
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, fallback: T, label: string) {
  return Promise.race([
    promise,
    wait(timeoutMs).then(() => {
      if (import.meta.env.DEV) {
        console.warn(`[hero] ${label} timed out after ${timeoutMs}ms; continuing without it.`)
      }
      return fallback
    }),
  ])
}

function generatedTripCachePayload(input: TripPreflightInput) {
  return {
    task: 'complete_trip_generation',
    version: GENERATED_TRIP_CACHE_NAMESPACE,
    input,
  }
}

export default function Hero() {
  const navigate = useNavigate()
  const [freeform, setFreeform] = useState(true)
  const [loading, setLoading] = useState(false)
  const [activePromptIndex, setActivePromptIndex] = useState(0)
  const [promptText, setPromptText] = useState(SAMPLE_PROMPTS[0].prompt)
  const [travelerDescription, setTravelerDescription] = useState('')
  const [destination, setDestination] = useState('')
  const [vibe, setVibe] = useState('')
  const [timing, setTiming] = useState('')
  const [wantsDestinationSuggestion, setWantsDestinationSuggestion] = useState(false)
  const [clarification, setClarification] = useState('')
  const [checkingDetails, setCheckingDetails] = useState(false)
  const [loadingCoverImageUrl, setLoadingCoverImageUrl] = useState<string>()
  const [loadingMessage, setLoadingMessage] = useState(LOADING_MESSAGES.qualifying)
  const [promptVisible, setPromptVisible] = useState(true)
  const [activeClipName, setActiveClipName] = useState(VIDEO_CLIPS[0])
  const [videoReady, setVideoReady] = useState(false)

  const videoRefs = [useRef<HTMLVideoElement>(null), useRef<HTMLVideoElement>(null)]
  const [activeSlot, setActiveSlot] = useState(0)
  const clipIndexRef = useRef(0)       // which clip is currently active
  const isDesktopRef = useRef(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    isDesktopRef.current = mq.matches
    const handler = (e: MediaQueryListEvent) => { isDesktopRef.current = e.matches }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const loadClip = (slot: number, clipName: string) => {
    const video = videoRefs[slot].current
    if (!video) return
    video.src = clipSrc(clipName, isDesktopRef.current)
    video.load()
    video.play().catch(() => {})
  }

  const fadeToNext = (currentSlot: number) => {
    const nextSlot = currentSlot === 0 ? 1 : 0
    const nextClipIndex = (clipIndexRef.current + 1) % VIDEO_CLIPS.length
    clipIndexRef.current = nextClipIndex

    loadClip(nextSlot, VIDEO_CLIPS[nextClipIndex])

    setActiveSlot(nextSlot)
    setActiveClipName(VIDEO_CLIPS[nextClipIndex])

    timerRef.current = setTimeout(() => fadeToNext(nextSlot), PLAY_DURATION)
  }

  const stopVideoRotation = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }

    videoRefs.forEach((ref) => ref.current?.pause())
  }

  useEffect(() => {
    const startIndex = Math.floor(Math.random() * VIDEO_CLIPS.length)
    clipIndexRef.current = startIndex
    loadClip(0, VIDEO_CLIPS[startIndex])
    setActiveSlot(0)
    setActiveClipName(VIDEO_CLIPS[startIndex])

    timerRef.current = setTimeout(() => fadeToNext(0), PLAY_DURATION)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleGenerate = async () => {
    setCheckingDetails(true)
    setLoadingCoverImageUrl(undefined)
    setLoadingMessage(LOADING_MESSAGES.qualifying)
    setClarification('')

    const tripInput: TripPreflightInput = {
      mode: freeform ? 'freeform' : 'guided',
      naturalLanguage: freeform ? promptText : undefined,
      travelerDescription: freeform ? undefined : travelerDescription,
      destination: freeform ? undefined : destination,
      vibe: freeform ? undefined : vibe,
      timing: freeform ? undefined : timing,
      wantsDestinationSuggestion: freeform ? undefined : wantsDestinationSuggestion,
    }

    const cachedTrip = readLocalCache<CachedGeneratedTrip>(
      GENERATED_TRIP_CACHE_NAMESPACE,
      generatedTripCachePayload(tripInput)
    )

    if (cachedTrip) {
      sessionStorage.setItem('voya:trip-preflight', JSON.stringify(cachedTrip.preflight))
      sessionStorage.setItem('voya:trip-input', JSON.stringify(cachedTrip.input))
      sessionStorage.setItem('voya:trip-discovery', JSON.stringify(cachedTrip.discovery))
      sessionStorage.setItem('voya:itinerary', JSON.stringify(cachedTrip.itinerary))
      setCheckingDetails(false)
      stopVideoRotation()
      setLoading(true)
      setLoadingMessage(LOADING_MESSAGES.itinerary)
      setLoadingCoverImageUrl(cachedTrip.coverImageUrl || cachedTrip.itinerary.heroImageUrl)
      const loadingStartedAt = Date.now()
      await waitForNextTask()
      await waitForMinimumLoadingTime(loadingStartedAt)
      navigate('/itinerary')
      return
    }

    const preflightStartedAt = performance.now()
    const result = await validateTripRequest(tripInput)
    logTripStage('preflight', preflightStartedAt)

    if (!result.ready) {
      setCheckingDetails(false)
      setClarification(
        result.question ||
          'Please add who is traveling, the vibe or type of trip, when you want to travel, and where you want to go.'
      )
      return
    }

    const coverDestination = getCoverDestination(tripInput, result)
    const coverImagePromise = coverDestination
      ? getDestinationCoverImage(coverDestination)
      : Promise.resolve(undefined)

    if (coverDestination) {
      await waitForNextTask()
    }

    sessionStorage.setItem('voya:trip-preflight', JSON.stringify(result))
    sessionStorage.setItem('voya:trip-input', JSON.stringify(tripInput))
    setCheckingDetails(false)
    stopVideoRotation()
    setLoading(true)
    const loadingStartedAt = Date.now()
    setLoadingMessage(coverDestination ? LOADING_MESSAGES.cover : LOADING_MESSAGES.discovery)
    await waitForNextTask()

    void coverImagePromise.then((coverImage) => {
      if (coverImage?.url) {
        setLoadingCoverImageUrl(coverImage.url)
        setLoadingMessage(LOADING_MESSAGES.cover)
      }
    }).catch((reason) => {
      console.log(reason);
    });

    setLoadingMessage(LOADING_MESSAGES.discovery)
    const discoveryPromise = (async () => {
      const discoveryStartedAt = performance.now()
      const discovery = await discoverRestaurantsAndActivities(tripInput, result)
      logTripStage('discovery', discoveryStartedAt)

      setLoadingMessage(LOADING_MESSAGES.places)
      const placesStartedAt = performance.now()
      const enrichedDiscovery = await withTimeout(
        enrichDiscoveryWithGooglePlacesImages(discovery, result),
        GOOGLE_PLACES_ENRICHMENT_TIMEOUT_MS,
        discovery,
        'Google Places enrichment'
      )
      logTripStage('places', placesStartedAt)
      return enrichedDiscovery
    })()
    const [discovery, coverImage] = await Promise.all([discoveryPromise, coverImagePromise])

    if (coverImage?.url) {
      setLoadingCoverImageUrl(coverImage.url)
      setLoadingMessage(LOADING_MESSAGES.cover)
      await waitForNextTask()
    }

    setLoadingMessage(LOADING_MESSAGES.itinerary)
    const itineraryStartedAt = performance.now()
    const itinerary = await generateItinerary(tripInput, result, discovery, coverImage)
    logTripStage('itinerary', itineraryStartedAt)

    sessionStorage.setItem('voya:trip-discovery', JSON.stringify(discovery))
    sessionStorage.setItem('voya:itinerary', JSON.stringify(itinerary))
    writeLocalCache<CachedGeneratedTrip>(
      GENERATED_TRIP_CACHE_NAMESPACE,
      generatedTripCachePayload(tripInput),
      {
        input: tripInput,
        preflight: result,
        discovery,
        itinerary,
        coverImageUrl: coverImage?.url,
      }
    )

    await waitForMinimumLoadingTime(loadingStartedAt)
    navigate('/itinerary')
  }

  return (
    <>
    {loading && (
      <LoadingScreen
        coverImageUrl={loadingCoverImageUrl}
        progressLabel={loadingMessage.label}
        progressDetail={loadingMessage.detail}
      />
    )}
    <section className="relative h-screen w-full overflow-hidden flex items-center justify-center">
      <div className="absolute inset-0 z-0">
        {/* Poster image — fades out once the first video is ready */}
        <img
          src={`${import.meta.env.BASE_URL}hero-poster.jpg`}
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover scale-105"
          style={{
            opacity: videoReady ? 0 : 1,
            transition: `opacity ${FADE_DURATION}ms ease-in-out`,
          }}
        />
        {[0, 1].map((slot) => (
          <video
            key={slot}
            ref={videoRefs[slot]}
            className="absolute inset-0 w-full h-full object-cover scale-105"
            style={{
              opacity: slot === activeSlot ? 1 : 0,
              transition: `opacity ${FADE_DURATION}ms ease-in-out`,
            }}
            muted
            loop
            playsInline
            aria-hidden="true"
            onCanPlay={() => !videoReady && setVideoReady(true)}
          />
        ))}
        <div className="absolute inset-0 hero-video-overlay" />
      </div>

      <div className="relative z-10 w-full max-w-7xl px-6 md:px-8 flex flex-col items-center text-center">
        <h1 className="font-headline text-6xl md:text-8xl lg:text-9xl font-bold text-white mb-6 md:mb-8 leading-[0.9] tracking-tighter">
          Escape the
          <br />
          <span className="italic font-normal text-[#D4AF37]">Ordinary.</span>
        </h1>

        <div className="glass-hero p-5 md:p-7 rounded-[2rem] w-full max-w-5xl shadow-2xl space-y-4">

          {freeform ? (
            <div className="space-y-3 text-left">
              <div className="flex items-center justify-between">
                <label className="text-[10px] uppercase tracking-[0.3em] font-bold text-white/50">
                  Tell us about your dream trip
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-white/40">Free text</span>
                  <button
                    onClick={() => setFreeform(v => !v)}
                    aria-label="Toggle input mode"
                    className="relative w-10 h-5 rounded-full bg-[#D4AF37]/60 transition-colors duration-300"
                  >
                    <span className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-300 translate-x-5" />
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {SAMPLE_PROMPTS.map((sample, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setPromptVisible(false)
                      setTimeout(() => {
                        setActivePromptIndex(i)
                        setPromptText(sample.prompt)
                        setPromptVisible(true)
                      }, 180)
                    }}
                    className={`flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] font-bold px-3 py-1.5 rounded-full border transition-all duration-200 ${
                      activePromptIndex === i
                        ? 'bg-[#D4AF37] border-[#D4AF37] text-[#001e40]'
                        : 'bg-white/5 border-white/20 text-white/50 hover:border-white/40 hover:text-white/70'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[13px] leading-none">{sample.icon}</span>
                    {sample.label}
                  </button>
                ))}
              </div>
              <textarea
                className="font-headline w-full bg-transparent border-none p-0 focus:ring-0 focus:outline-none text-white text-base leading-relaxed placeholder:text-white/20 resize-none h-20 transition-opacity duration-200"
                style={{ opacity: promptVisible ? 1 : 0 }}
                value={promptText}
                onChange={e => {
                  setPromptText(e.target.value)
                  setActivePromptIndex(-1)
                  setClarification('')
                }}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 text-left">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] uppercase tracking-[0.3em] font-bold text-white/50">
                    Who are you and with whom are you traveling?
                  </label>
                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-white/40">Guided</span>
                    <button
                      onClick={() => setFreeform(v => !v)}
                      aria-label="Toggle input mode"
                      className="relative w-10 h-5 rounded-full bg-white/20 transition-colors duration-300"
                    >
                      <span className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-300 translate-x-0" />
                    </button>
                  </div>
                </div>
                <textarea
                  className="font-headline w-full bg-transparent border-none p-0 focus:ring-0 focus:outline-none text-white text-lg leading-relaxed placeholder:text-white/20 resize-none h-20"
                  placeholder="Describe your group..."
                  value={travelerDescription}
                  onChange={e => {
                    setTravelerDescription(e.target.value)
                    setClarification('')
                  }}
                />
                <div className="h-px bg-white/20 w-full" />
              </div>

              <div className="space-y-8 md:space-y-10">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 md:gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] uppercase tracking-[0.3em] font-bold text-white/50 block">
                      Where to?
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        className="font-headline w-full bg-transparent border-none p-0 focus:ring-0 focus:outline-none text-white text-lg placeholder:text-white/20"
                        placeholder="Anywhere in the world..."
                        value={destination}
                        onChange={e => {
                          setDestination(e.target.value)
                          setWantsDestinationSuggestion(false)
                          setClarification('')
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setDestination('')
                          setWantsDestinationSuggestion(true)
                          setClarification('')
                        }}
                        className={`text-[10px] uppercase tracking-widest font-bold whitespace-nowrap transition-colors border px-3 py-1 rounded-full ${
                          wantsDestinationSuggestion
                            ? 'bg-[#D4AF37] border-[#D4AF37] text-[#001e40]'
                            : 'text-[#D4AF37] hover:text-white border-[#D4AF37]/30'
                        }`}
                      >
                        Surprise Me
                      </button>
                    </div>
                    <div className="h-px bg-white/20 w-full" />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] uppercase tracking-[0.3em] font-bold text-white/50 block">
                      The Vibe
                    </label>
                    <input
                      type="text"
                      className="font-headline w-full bg-transparent border-none p-0 focus:ring-0 focus:outline-none text-white text-lg placeholder:text-white/20"
                      placeholder="e.g. romantic, adventure..."
                      value={vibe}
                      onChange={e => {
                        setVibe(e.target.value)
                        setClarification('')
                      }}
                    />
                    <div className="h-px bg-white/20 w-full" />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] uppercase tracking-[0.3em] font-bold text-white/50 block">
                      When?
                    </label>
                    <input
                      type="text"
                      className="font-headline w-full bg-transparent border-none p-0 focus:ring-0 focus:outline-none text-white text-lg placeholder:text-white/20"
                      placeholder="e.g. May, summer..."
                      value={timing}
                      onChange={e => {
                        setTiming(e.target.value)
                        setClarification('')
                      }}
                    />
                    <div className="h-px bg-white/20 w-full" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {clarification && (
            <div
              role="alert"
              className="rounded-xl border border-[#D4AF37]/40 bg-[#001e40]/45 px-4 py-3 text-left text-sm text-white"
            >
              {clarification}
            </div>
          )}

          <div className="flex justify-center pt-1">
            <button
              onClick={handleGenerate}
              disabled={checkingDetails}
              className="gold-btn-glow bg-white text-[#001e40] hover:bg-[#D4AF37] hover:text-white disabled:opacity-70 disabled:hover:bg-white disabled:hover:text-[#001e40] transition-colors duration-300 px-6 py-2.5 rounded-full font-bold text-xs tracking-[0.2em] uppercase flex items-center gap-2 group"
            >
              {checkingDetails ? 'Checking Details' : 'Generate My Itinerary'}
              <span
                className={`material-symbols-outlined text-base transition-transform ${
                  checkingDetails ? 'animate-spin' : 'group-hover:translate-x-1'
                }`}
              >
                {checkingDetails ? 'progress_activity' : 'auto_awesome'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Video copyright — bottom right, links to current clip */}
      <a
        href={PIXABAY_URLS[activeClipName]}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-4 right-4 z-10 text-[10px] text-white/40 hover:text-white/70 transition-colors duration-300"
      >
        Video by {PIXABAY_AUTHORS[activeClipName]} via Pixabay
      </a>
    </section>
    </>
  )
}
