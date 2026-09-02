import { Outlet } from 'react-router-dom'
import { Navbar } from '../shared/Navbar'
import { Footer } from '../shared/Footer'

export function PublicLayout() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
