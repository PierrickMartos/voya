import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function LoadingScreen() {
  const navigate = useNavigate()

  useEffect(() => {
    const t = setTimeout(() => navigate('/itinerary'), 2000)
    return () => clearTimeout(t)
  }, [navigate])

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-body">
      {/* Immersive background */}
      <div className="absolute inset-0">
        <img
          alt="Amalfi Coast at Sunset"
          className="w-full h-full object-cover"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuC_KdfUBpOjAeTfDyqfavukOCC1jDMhDmu8_A7mzzub15DUKWdyMqZ2h6oxffx8DCd3SblsVrkM5ueAZ4NCOJprvX5hDHtc5mjC6eWUSpz1_dIt6-Vw1OCaMnZ4jmPGEuJBQmd-Ljp02Iuo7wT3Qt3OSzgbsJxJtnsts8eHCjq5Bn-2eL454OfKdI356HoA_UpD9BPExZPz6PAFrfVjaTKy4uc_yW1sGNX-CoMW9kCja208hiSU1aLkDveMOnwl9RjOfafN3xZfyTmJ"
        />
        <div
          className="absolute inset-0 backdrop-blur-[2px]"
          style={{ background: 'linear-gradient(to bottom, rgba(0,30,64,0.4), rgba(0,30,64,0.8))' }}
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

        {/* Editorial statement */}
        <div className="max-w-2xl space-y-8">
          <h2 className="font-headline text-3xl md:text-5xl text-white leading-tight tracking-tight">
            Curating your editorial odyssey...
          </h2>

          {/* Progress bar */}
          <div className="relative w-64 md:w-80 h-[2px] mx-auto overflow-hidden rounded-full" style={{ background: 'rgba(255,255,255,0.2)' }}>
            <div
              className="absolute inset-y-0 left-0 w-1/3 animate-[loading_3s_ease-in-out_infinite]"
              style={{
                background: '#fed65b',
                boxShadow: '0 0 15px rgba(254,214,91,0.5)',
              }}
            />
          </div>

          {/* Glass card */}
          <div
            className="pt-4 px-8 py-6 rounded-xl backdrop-blur-md border border-white/10 max-w-lg mx-auto"
            style={{ background: 'rgba(0,51,102,0.3)' }}
          >
            <p className="font-body text-lg md:text-xl font-light leading-relaxed" style={{ color: '#d5e3ff' }}>
              Voya is orchestrating your aesthetic match, finding the perfect rhythm for your journey.
            </p>
            <div className="flex items-center justify-center gap-3 mt-6" style={{ color: 'rgba(254,214,91,0.8)' }}>
              <span className="material-symbols-outlined text-sm">auto_awesome</span>
              <span className="font-label text-[10px] tracking-[0.2em] uppercase font-bold">Personalizing Itinerary</span>
              <span className="material-symbols-outlined text-sm">auto_awesome</span>
            </div>
          </div>
        </div>

        {/* Ambient footer */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 opacity-40">
          <p className="font-label text-xs text-white tracking-widest uppercase">The Digital Concierge</p>
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
