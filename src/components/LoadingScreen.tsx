import { useEffect, useState } from 'react'

interface LoadingScreenProps {
  coverImageUrl?: string
  progressLabel?: string
  progressDetail?: string
}

const DEFAULT_BACKGROUND =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuC_KdfUBpOjAeTfDyqfavukOCC1jDMhDmu8_A7mzzub15DUKWdyMqZ2h6oxffx8DCd3SblsVrkM5ueAZ4NCOJprvX5hDHtc5mjC6eWUSpz1_dIt6-Vw1OCaMnZ4jmPGEuJBQmd-Ljp02Iuo7wT3Qt3OSzgbsJxJtnsts8eHCjq5Bn-2eL454OfKdI356HoA_UpD9BPExZPz6PAFrfVjaTKy4uc_yW1sGNX-CoMW9kCja208hiSU1aLkDveMOnwl9RjOfafN3xZfyTmJ'

export default function LoadingScreen({
  coverImageUrl,
  progressLabel = 'Preparing your itinerary',
  progressDetail = 'Checking the brief and shaping the route.',
}: LoadingScreenProps) {
  const [showCoverImage, setShowCoverImage] = useState(false)

  useEffect(() => {
    setShowCoverImage(false)
  }, [coverImageUrl])

  const revealCoverImage = () => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setShowCoverImage(true))
    })
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-body">
      {/* Immersive background */}
      <div className="absolute inset-0">
        <img
          alt="Amalfi Coast at Sunset"
          className="absolute inset-0 w-full h-full object-cover opacity-100 scale-100"
          src={DEFAULT_BACKGROUND}
        />
        {coverImageUrl && (
          <img
            alt=""
            aria-hidden="true"
            className={`absolute inset-0 w-full h-full object-cover transition-[opacity,transform] duration-[1400ms] ease-out ${
              showCoverImage ? 'opacity-100 scale-100' : 'opacity-0 scale-[1.03]'
            }`}
            src={coverImageUrl}
            onLoad={revealCoverImage}
            onError={() => setShowCoverImage(false)}
          />
        )}
        <div
          className="absolute inset-0 backdrop-blur-[2px]"
          style={{ background: 'linear-gradient(to bottom, rgba(0,30,64,0.25), rgba(0,30,64,0.82))' }}
        />
      </div>

      {/* Main content */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 text-center">
        {/* Brand */}
        <div className="mb-12">
          <h1
            className="font-headline text-5xl md:text-7xl font-black tracking-tighter drop-shadow-2xl"
            style={{ color: '#fed65b' }}
          >
            Voya
          </h1>
          <div className="h-px w-12 mx-auto mt-4 opacity-60" style={{ background: '#fed65b' }} />
        </div>

        <div className="max-w-2xl space-y-8">
          <h2 className="font-headline text-3xl md:text-5xl text-white leading-tight tracking-tight">
            Curating your trip...
          </h2>

          <div className="relative w-64 md:w-80 h-[2px] mx-auto overflow-hidden rounded-full" style={{ background: 'rgba(255,255,255,0.2)' }}>
            <div
              className="absolute inset-y-0 left-0 w-1/3 animate-[loading_3s_ease-in-out_infinite]"
              style={{
                background: '#fed65b',
                boxShadow: '0 0 15px rgba(254,214,91,0.5)',
              }}
            />
          </div>

          <div className="flex items-center justify-center gap-3" style={{ color: 'rgba(254,214,91,0.85)' }}>
            <span className="material-symbols-outlined text-sm">auto_awesome</span>
            <span className="font-label text-[10px] tracking-[0.2em] uppercase font-bold">
              {progressLabel}
            </span>
            <span className="material-symbols-outlined text-sm">auto_awesome</span>
          </div>

          <p className="mx-auto max-w-md text-sm leading-relaxed text-white/70">
            {progressDetail}
          </p>
        </div>

        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 opacity-40">
          <div className="flex gap-2">
            <span className="w-1 h-1 rounded-full bg-white" />
            <span className="w-1 h-1 rounded-full bg-white" />
            <span className="w-1 h-1 rounded-full bg-white" />
          </div>
        </div>
      </main>

      {/* Grain texture overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03] mix-blend-overlay"
        style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/natural-paper.png')" }}
      />

      <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(300%); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
    </div>
  )
}
