import { Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import Explore from './pages/Explore'
import ItineraryPage from './pages/Itinerary'
import PageTransition from './components/PageTransition'

export default function App() {
  return (
    <PageTransition>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/itinerary" element={<ItineraryPage />} />
      </Routes>
    </PageTransition>
  )
}
