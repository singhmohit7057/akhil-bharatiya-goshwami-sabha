import { Link, Outlet, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { User, Edit, Users, Briefcase, IndianRupee, Heart, Crown } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { Navbar } from '../shared/Navbar'
import { Footer } from '../shared/Footer'
import { cn } from '../../lib/utils'

export function ProfileLayout() {
  const { t } = useTranslation('profile')
  useAuth()
  const location = useLocation()

  const tabs = [
    { to: '/profile', icon: User, label: t('tabs.profile'), exact: true },
    { to: '/profile/edit', icon: Edit, label: t('tabs.edit') },
    { to: '/profile/family', icon: Users, label: t('tabs.family') },
    { to: '/profile/donations', icon: IndianRupee, label: t('tabs.donations') },
    { to: '/profile/membership', icon: Crown, label: 'Membership' },
    { to: '/profile/business', icon: Briefcase, label: t('tabs.business') },
    { to: '/profile/matrimonial', icon: Heart, label: t('tabs.matrimonial') },
  ]

  function isActive(path: string, exact?: boolean) {
    if (exact) return location.pathname === path
    return location.pathname.startsWith(path)
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex-1 bg-surface">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row gap-6">
            <aside className="md:w-56 shrink-0">
              <nav className="bg-white rounded-xl border border-border p-2 space-y-1 md:sticky md:top-20">
                {tabs.map((tab) => (
                  <Link
                    key={tab.to}
                    to={tab.to}
                    className={cn(
                      'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      isActive(tab.to, tab.exact)
                        ? 'bg-primary/10 text-primary'
                        : 'text-text-primary font-medium hover:bg-gray-50',
                    )}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </Link>
                ))}
              </nav>
            </aside>
            <main className="flex-1 min-w-0">
              <Outlet />
            </main>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
