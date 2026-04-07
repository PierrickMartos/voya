import { useEffect, useRef, useState } from 'react'
import LoadingScreen from './LoadingScreen'

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

const DEFAULT_PROMPT =
  "3 days in Rome with my wife, we've been once before so skip the obvious stuff. We're into good food, slow mornings, beautiful things. Romantic but not cheesy."

function clipSrc(name: string, isDesktop: boolean) {
  return `${import.meta.env.BASE_URL}videos/homepage/${name}_${isDesktop ? 'medium' : 'tiny'}.mp4`
}

export default function Hero() {
  const [freeform, setFreeform] = useState(true)
  const [loading, setLoading] = useState(false)
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

  return (
    <>
    {loading && <LoadingScreen />}
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
            <div className="space-y-2 text-left">
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
              <textarea
                className="font-headline w-full bg-transparent border-none p-0 focus:ring-0 focus:outline-none text-white text-base leading-relaxed placeholder:text-white/20 resize-none h-20"
                defaultValue={DEFAULT_PROMPT}
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
                />
                <div className="h-px bg-white/20 w-full" />
              </div>

              <div className="space-y-8 md:space-y-10">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] uppercase tracking-[0.3em] font-bold text-white/50 block">
                      Where to?
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        className="font-headline w-full bg-transparent border-none p-0 focus:ring-0 focus:outline-none text-white text-lg placeholder:text-white/20"
                        placeholder="Anywhere in the world..."
                      />
                      <button className="text-[#D4AF37] text-[10px] uppercase tracking-widest font-bold whitespace-nowrap hover:text-white transition-colors border border-[#D4AF37]/30 px-3 py-1 rounded-full">
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
                    />
                    <div className="h-px bg-white/20 w-full" />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-center pt-1">
            <button onClick={() => setLoading(true)} className="gold-btn-glow bg-white text-[#001e40] hover:bg-[#D4AF37] hover:text-white transition-colors duration-300 px-6 py-2.5 rounded-full font-bold text-xs tracking-[0.2em] uppercase flex items-center gap-2 group">
              Generate My Itinerary
              <span className="material-symbols-outlined text-base transition-transform group-hover:translate-x-1">
                auto_awesome
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
