import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { MapPin, Phone, Mail } from 'lucide-react'

export function Footer() {
  const { t } = useTranslation('common')
  const year = new Date().getFullYear()

  return (
    <footer className="bg-surface border-t border-border mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <img src="/logo.png" alt="ABGSPB" className="w-12 h-12 object-contain" />
              <div>
                <p className="text-sm font-bold text-text-primary leading-tight">{t('orgName')}</p>
                <p className="text-[11px] text-text-secondary">{t('orgSubtitle')}</p>
              </div>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">{t('footer.description')}</p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-3">{t('footer.quickLinks')}</h3>
            <ul className="space-y-2">
              <li><Link to="/about" className="text-xs text-text-secondary hover:text-primary transition-colors">{t('nav.about')}</Link></li>
              <li><Link to="/events" className="text-xs text-text-secondary hover:text-primary transition-colors">{t('nav.events')}</Link></li>
              <li><Link to="/businesses" className="text-xs text-text-secondary hover:text-primary transition-colors">{t('nav.directory')}</Link></li>
              <li><Link to="/matrimonial" className="text-xs text-text-secondary hover:text-primary transition-colors">{t('nav.matrimonial')}</Link></li>
            </ul>
          </div>

          {/* Community */}
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-3">Community</h3>
            <ul className="space-y-2">
              <li><Link to="/members" className="text-xs text-text-secondary hover:text-primary transition-colors">Members</Link></li>
              <li><Link to="/gallery" className="text-xs text-text-secondary hover:text-primary transition-colors">Gallery</Link></li>
              <li><Link to="/souvenirs" className="text-xs text-text-secondary hover:text-primary transition-colors">Souvenirs</Link></li>
              <li><Link to="/verify" className="text-xs text-text-secondary hover:text-primary transition-colors">Verify Member</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-3">{t('footer.legal')}</h3>
            <ul className="space-y-2">
              <li><Link to="/privacy-policy" className="text-xs text-text-secondary hover:text-primary transition-colors">{t('footer.privacyPolicy')}</Link></li>
              <li><Link to="/terms-of-service" className="text-xs text-text-secondary hover:text-primary transition-colors">{t('footer.termsOfService')}</Link></li>
              <li><Link to="/cookie-policy" className="text-xs text-text-secondary hover:text-primary transition-colors">{t('footer.cookiePolicy')}</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-3">{t('footer.contact')}</h3>
            <ul className="space-y-2.5">
              <li className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                <p className="text-xs text-text-secondary">West Bengal, India</p>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-primary shrink-0" />
                <p className="text-xs text-text-secondary">+91 98765 43210</p>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-primary shrink-0" />
                <p className="text-xs text-text-secondary">info@akhilbharatiyagoswami.com</p>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-border mt-8 pt-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-text-secondary">
            &copy; {year} {t('orgName')}, {t('orgSubtitle')}. {t('footer.rights')}
          </p>
          <p className="text-xs text-text-secondary">
            Made with <span className="text-red-500">❤️</span> by <a href="https://tmmt.in" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">TMMT</a>
          </p>
        </div>
      </div>
    </footer>
  )
}
