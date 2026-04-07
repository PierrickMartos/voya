import { Link, useLocation } from 'react-router-dom'

interface HeaderProps {
  variant?: 'home' | 'explore'
}

export default function Header({ variant = 'home' }: HeaderProps) {
  const location = useLocation()
  const isExplore = variant === 'explore'
  const isItinerary = location.pathname === '/itinerary'

  return (
    <header
      className={`fixed top-0 w-full z-50 flex items-center justify-between px-8 h-20 shadow-[0_20px_40px_rgba(25,28,29,0.06)] transition-colors ${
        isExplore ? 'bg-white/60 backdrop-blur-xl' : 'bg-transparent'
      }`}
    >
      <div className="flex items-center gap-10 lg:gap-16">
        <Link
          to="/"
          className={`font-headline text-4xl md:text-3xl font-black tracking-tighter ${
            isExplore ? 'text-[#001e40]' : 'text-white'
          }`}
        >
          Voya
        </Link>
        <nav className="flex items-center gap-6 md:gap-10">
          <Link
            to="/explore"
            className={`font-headline text-sm tracking-widest uppercase transition-colors ${
              isExplore
                ? location.pathname === '/explore'
                  ? 'text-[#001e40] border-b-2 border-[#001e40] pb-0.5'
                  : 'text-[#001e40]/70 hover:text-[#001e40]'
                : 'text-white hover:text-[#D4AF37]'
            }`}
          >
            Explore
          </Link>

          {isItinerary && (
            <div className="flex items-center gap-6">
              <span className="text-[#c3c6d1]">·</span>
              <a href="#itinerary" className="font-headline text-sm tracking-widest uppercase text-[#001e40] border-b-2 border-[#001e40] pb-0.5 transition-colors">
                Itinerary
              </a>
              <a href="#sight" className="font-headline text-sm tracking-widest uppercase text-[#001e40]/60 hover:text-[#001e40] transition-colors">
                Sights
              </a>
              <a href="#dining" className="font-headline text-sm tracking-widest uppercase text-[#001e40]/60 hover:text-[#001e40] transition-colors">
                Dining
              </a>
              <a href="#stay" className="font-headline text-sm tracking-widest uppercase text-[#001e40]/60 hover:text-[#001e40] transition-colors">
                Stays
              </a>
            </div>
          )}
        </nav>
      </div>

      {isItinerary && (
        <button className="p-2 text-[#001e40] hover:text-[#D4AF37] transition-colors" aria-label="Share">
          <span className="material-symbols-outlined">share</span>
        </button>
      )}
    </header>
  )
}
