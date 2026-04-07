import { Link } from 'react-router-dom'
import Header from '../components/Header'

interface Destination {
  id: string
  name: string
  tag: string
  group: string
  span: 'both-2' | 'v-2' | 'h-2' | 'normal'
  image: string
}

const DESTINATIONS: Destination[] = [
  {
    id: 'amalfi',
    name: 'Amalfi Coast',
    tag: 'Romantic',
    group: '2 People',
    span: 'both-2',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCrcAKxTyobY8LGgzZWOUyN5dNAg7zwXLRuZeqAmt2DljiStLosLuZxx9cItoF1cceSR-puB4T3-67rK7L9uGVyQIgaGnZL0OmC7W_EXdvc4R6VAHACmcvIwN9n9JPdBBUoPbEUOP2sSHt-Je5OsTNXNFHjRblHHDrPlbTMjxAXn7waGkp5JroIODUEWKY9q68A_qkf1rZoiJvjJPdVWxpi3QVp4G0pfRFdgnSu0HKeMD36os5OsTJGVBFoymrwFoXDf96u--cIbwTH',
  },
  {
    id: 'kyoto',
    name: 'Kyoto',
    tag: 'Cultural',
    group: 'Solo Explorer',
    span: 'v-2',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDGmWjtsvjq2QKSl7OmI57qjKwNWyHBDJUE5X3YNjKyugBwXK1qIQdC8xuefNfQ70MNum5guAfSiHCLlkf6TjdJRnY8pIdSF5BJ2DqY5gFAd1JyizRfvqaGGIlk_p6X2q3P6erNyMHH5JwbmAftpX6O_vGcX9NkhfAmZoa1VUIkcIfY27JOMMfo-5sbt9bbWgdgAPzTLl0y0fTk6QF4Y39TOD25GPMuhXvdaIuuFkQh3ByaKNgisRDaO3OfrDX9GdVWJupubo262w6C',
  },
  {
    id: 'santorini',
    name: 'Santorini',
    tag: 'Dreamy',
    group: '2 People',
    span: 'normal',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBewdzC1UbQJS10iiGPJ5EhNsXsHsjxU4n58XoNX78uqjRhjYBhj1pbM5aTsmNLYFTYzaM9etavdC9mBOTh2i7sq-2hOF8ylweAmR7_3hGQ-VlcTBPjJjLNfrdiF5hcrhBFSffTGjP-SnjxBXpPn_U_CFcoeNKe6CeZHepHVarDMRoLUZS69B0ELqgKch46OInin4f0JdPUzQ-z-PI_IjCudS3I-3qS2MarSl9bPytPSTVqdtB4hIX6iYA9Y4DQxz5WlB_SgAMvxOiS',
  },
  {
    id: 'patagonia',
    name: 'Patagonia',
    tag: 'Adventurous',
    group: 'Group of 4',
    span: 'h-2',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCRPotVJoHbcsqYSDBPMJvaJD0MyxEiSAJ_KICsm9SDoSgfAlH5SbEJgr2-Hb8c8G6QZRPoaBugIUQ-xn5wor0s4tuA83KD_jKZpVSvIaFolbI3Cz_-eSX9y1dpZe9OvUBEd-r2AmWRNuMdLWhgJs_uJeuhZBEC86Yp1aiCOjmrt1HV7SSgJvw1wka8pmSuQdUoMZMYKrzBU3yvKSewHAIqB0sISO_fHH1h2fx3HqrYSg5z_9MMMRWLptP14vkebcFaioVBXi29x0j9',
  },
  {
    id: 'maldives',
    name: 'Maldives',
    tag: 'Exclusive',
    group: 'Family of 4',
    span: 'v-2',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAds-iyfTVCMRB9ZKbOrmw6VIovYbzJPAOudatLa3bbhoUOsVSalTTdEXF1sp547JCx4-Z2IJlXq3xDynL_1z5bU5-L5lOHOzwzMSBy26m4kGo8q2KdHr-9vN2o_yj9IdwUrADUCBMSMjeHGSgph5G4WFl5uc4HO0vwVLhd2xGUkELv43EAbJf_2FUP0LaBVaCNknRu-lnXv5JZHM3ed_oxhwge6iSdyZJhnafBXYeOFiX9-r60X8bzRmMH2AmSFNXJP-ZAfPkzlWMp',
  },
  {
    id: 'serengeti',
    name: 'Serengeti',
    tag: 'Safari',
    group: 'Group of 6',
    span: 'normal',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAfxs7xLoCc2OW9WyV4JTOY_rA416FsNuUmAargOxk7xRoGStERwTLWFfZChXI3J2Wki3fkb-UPEsZAtC8WFdwWEyPZGvX4X_WuK0_LZ4sE9rFOFVqRGH5hmtCLb_niHONWgcGex1yMhD_SzlP-zU5zkhlHLlL5MfjVgOIznURbz_rMyGrSzWfYGkdpRAzSFD3YWicOeJ1Ulisi5GqXnkl1LOmHiwYHjCVKpXxSzV2mQzoCkO8F6SWILGBxaXejIybL-phugXVcNcmU',
  },
  {
    id: 'provence',
    name: 'Provence',
    tag: 'Rustic',
    group: '2 People',
    span: 'h-2',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDU3bYmUtG-_yerYgUtnkYpitGlm3gcp7ecFek-ZhYo1Z5l1VR4yN-r9iZnhET_KMxl2dGLlIh_gOeAoRbiC9jxQO5sjGtzrhYeQ3zsYP1ih1TjgEZ8iIqNTYp_lVyPltdfKaD4MT8Vt9TOCJTwf6-79NR9CPg9eq8SQeozxF3i-P1iBqNSgJSte2U8h8ptNvxA8TlMqSZwM7PqXiJLX-e6XJHbP928XBuJLiZJcRaBREcVzXYP_kSXmAQrw1ooHFkPjUYGT1LONnfP',
  },
  {
    id: 'iceland',
    name: 'Iceland',
    tag: 'Mystical',
    group: 'Solo Explorer',
    span: 'normal',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDoGSih9SWmI4aYfLZ_4D9vl-rfaz1xlZvHj3SX8RJO9ZSQwW9w0zaPzwJS1wXssi2ikt9SHdRQLLEz9AoOcbcYjJTnRvzsVi8_IUNMuRUZjSdnSt_OMElCs2HqWscD8Dlqj6uH_ps1mhMHVjp4-3Gw-zBDldtUuEuvAjCswWp4yK7S24a1J9wBZZ9nnz5wqbVZDv2GBHPqq9LaU8mRK8uRrM-jpISb5qWpnTKzCMIEcy3w2X_1D3Gpp6bcY7Qr2OIi9UCkkCkP97dD',
  },
  {
    id: 'swiss-alps',
    name: 'Swiss Alps',
    tag: 'Cozy',
    group: 'Family of 5',
    span: 'v-2',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDrMg4VDNrKGx8eE-7b7vmIA-AC834i2c7bXtp-GPrAznuE49wPHKBYXc7GtQUIy_8jLQeUvrce2pvGlW6dp72YTZYyq1pMc57BvXZWgHxJ77lTr8Is3DmB5q5_WKddUQmJ2xSOQuhFO5fhVdLtJWptcu4hk0FbOxVdchI0ypkyzjXmDoqHxdZebf3mXTuY2eRK1lCHMMM-NF1q7sRx_1RCJOiNYyjVdKa3TrYt8bwd7W2DNe-aDWRloy4fOGQfuaTAcQ9apLz-Gbmb',
  },
  {
    id: 'bora-bora',
    name: 'Bora Bora',
    tag: 'Tropical',
    group: '2 People',
    span: 'normal',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBbQuEvU3MVTjX1u42c33_skOtHX7xabgYKZOEuiY2BBmMxQ-vbChB3V9JVYDoEiCs33jorIa94cUFr_0nIVqjCnMnNFXImkitr6zHBd2JY5xke1agBA6MNRfz13KVk9MKqRV64dj5G9WPvE1dpiHjr63NxsChWmRCSRniYCWJopeJbTFHAL2ueMmx_PegmzaMSM06tYknnK4j_faUy_zM4p6A9zoG6R3j0PQSi5Wqxoweu4oLquTwCgR3OYVgm2Y11fVFQ2VBiNzSD',
  },
]

function DestinationCard({ destination }: { destination: Destination }) {
  const spanClass =
    destination.span === 'both-2'
      ? 'span-both-2'
      : destination.span === 'v-2'
      ? 'span-v-2'
      : destination.span === 'h-2'
      ? 'span-h-2'
      : ''

  const isLarge = destination.span === 'both-2' || destination.span === 'h-2'
  const isTall = destination.span === 'v-2' || destination.span === 'both-2'

  return (
    <Link to="/itinerary" className={`group relative overflow-hidden rounded-xl bg-[#edeeef] cursor-pointer ${spanClass}`}>
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
        style={{ backgroundImage: `url('${destination.image}')` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#001e40]/80 via-transparent to-transparent" />
      <div
        className={`absolute bottom-0 left-0 w-full flex ${
          isLarge && !isTall ? 'justify-between items-end' : 'flex-col'
        } ${isLarge ? 'p-6 md:p-8' : 'p-4'}`}
      >
        <div>
          {(destination.span !== 'normal') && (
            <span className="inline-block px-3 py-1 mb-2 rounded-full bg-[#fed65b] text-[#745c00] text-[10px] font-extrabold uppercase tracking-widest">
              {destination.tag}
            </span>
          )}
          <h3
            className={`font-headline font-bold text-white leading-none ${
              destination.span === 'both-2'
                ? 'text-4xl mb-2'
                : destination.span === 'h-2'
                ? 'text-3xl'
                : destination.span === 'v-2'
                ? 'text-2xl mb-1'
                : 'text-xl'
            }`}
          >
            {destination.name}
          </h3>
          {destination.span === 'normal' && (
            <div className="flex justify-between items-center mt-2">
              <span className="text-white/70 text-[10px] uppercase font-bold tracking-wider">
                {destination.tag}
              </span>
              <span className="text-white/70 text-[10px] font-bold">{destination.group}</span>
            </div>
          )}
        </div>
        {destination.span !== 'normal' && (
          <div className={`flex items-center gap-2 text-white/80 font-medium ${isLarge && !isTall ? 'pb-1 text-sm' : 'text-xs mt-1'}`}>
            <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>group</span>
            <span>{destination.group}</span>
          </div>
        )}
      </div>
    </Link>
  )
}

export default function Explore() {
  return (
    <div className="bg-[#f8f9fa] min-h-screen">
      <Header variant="explore" />

      {/* Main content */}
      <main className="pt-24 pb-24 md:pb-8 px-4 md:px-8 max-w-[1920px] mx-auto">
        <div className="masonry-grid">
          {DESTINATIONS.map((d) => (
            <DestinationCard key={d.id} destination={d} />
          ))}
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white/80 backdrop-blur-xl h-16 flex justify-around items-center z-50 border-t border-slate-100">
        <button className="text-slate-400 flex flex-col items-center">
          <span className="material-symbols-outlined text-2xl">home</span>
        </button>
        <button className="text-[#001e40] flex flex-col items-center">
          <span
            className="material-symbols-outlined text-2xl"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            explore
          </span>
        </button>
        <button className="text-slate-400 flex flex-col items-center">
          <span className="material-symbols-outlined text-2xl">bookmark</span>
        </button>
        <button className="text-slate-400 flex flex-col items-center">
          <span className="material-symbols-outlined text-2xl">account_circle</span>
        </button>
      </nav>
    </div>
  )
}
