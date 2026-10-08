import { Outlet } from 'react-router-dom'
import { Navbar } from '../shared/Navbar'
import { Footer } from '../shared/Footer'
import { PromoPopup } from '../shared/PromoPopup'
import { CookieBanner } from '../shared/CookieBanner'
import { AudioPlayer } from '../shared/AudioPlayer'

export function PublicLayout() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <PromoPopup />
      <CookieBanner />
      <AudioPlayer />
    </div>
  )
}
