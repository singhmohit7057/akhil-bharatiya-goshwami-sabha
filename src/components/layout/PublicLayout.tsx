import { Outlet } from 'react-router-dom'
import { Navbar } from '../shared/Navbar'
import { Footer } from '../shared/Footer'
import { PromoPopup } from '../shared/PromoPopup'

export function PublicLayout() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <PromoPopup />
    </div>
  )
}
