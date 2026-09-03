import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Menu, X, User, LogOut, Shield, ChevronDown } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { LanguageToggle } from './LanguageToggle'
import { cn } from '../../lib/utils'

export function Navbar() {
  const { t } = useTranslation('common')
  const { user, profile, signOut, isAdmin } = useAuth()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  const navLinks = [
    { to: '/', label: t('nav.home') },
    { to: '/about', label: t('nav.about') },
    { to: '/events', label: t('nav.events') },
    { to: '/businesses', label: t('nav.directory') },
  ]

  navLinks.push({ to: '/matrimonial', label: t('nav.matrimonial') })
  navLinks.push({ to: '/gallery', label: 'Gallery' })

  function isActive(path: string) {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  return (
    <nav className="bg-white shadow-sm border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-18">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="ABGSPB" className="w-14 h-14 object-contain" />
            <div className="hidden sm:block">
              <p className="text-sm font-bold text-text-primary leading-tight">{t('orgName')}</p>
              <p className="text-xs text-text-secondary">{t('orgSubtitle')}</p>
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive(link.to)
                    ? 'bg-primary/10 text-primary'
                    : 'text-text-secondary hover:text-text-primary hover:bg-gray-50',
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <LanguageToggle />

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    {profile?.profile_photo_url ? (
                      <img src={profile.profile_photo_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <User className="w-4 h-4 text-primary" />
                    )}
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-text-primary">
                    {profile?.full_name?.split(' ')[0]}
                  </span>
                  <ChevronDown className="w-4 h-4 text-text-secondary" />
                </button>

                {profileOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
                    <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-border py-1 z-20">
                      <Link
                        to="/profile"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-text-primary hover:bg-gray-50"
                      >
                        <User className="w-4 h-4" />
                        {t('nav.profile')}
                      </Link>
                      {isAdmin() && (
                        <Link
                          to="/admin"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-text-primary hover:bg-gray-50"
                        >
                          <Shield className="w-4 h-4" />
                          {t('nav.admin')}
                        </Link>
                      )}
                      <hr className="my-1 border-border" />
                      <button
                        onClick={() => { signOut(); setProfileOpen(false) }}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full"
                      >
                        <LogOut className="w-4 h-4" />
                        {t('nav.logout')}
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-text-primary hover:text-primary transition-colors"
                >
                  {t('nav.login')}
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                >
                  {t('nav.register')}
                </Link>
              </div>
            )}

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-50"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="lg:hidden py-3 border-t border-border">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'block px-3 py-2 rounded-lg text-sm font-medium',
                  isActive(link.to) ? 'bg-primary/10 text-primary' : 'text-text-secondary',
                )}
              >
                {link.label}
              </Link>
            ))}
            {!user && (
              <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex-1 text-center px-4 py-2 text-sm font-medium border border-border rounded-lg"
                >
                  {t('nav.login')}
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileOpen(false)}
                  className="flex-1 text-center px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg"
                >
                  {t('nav.register')}
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
