import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { MapPin, Phone, Mail } from 'lucide-react'

export function Footer() {
  const { t } = useTranslation('common')
  const year = new Date().getFullYear()

  return (
    <footer className="bg-surface border-t border-border mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 pb-4">

        {/* ── MOBILE layout ── */}
        <div className="sm:hidden text-center">
          {/* Brand */}
          <div className="flex items-center justify-center gap-2 mb-5">
            <img src="/logo.png" alt="ABGSPB" className="w-10 h-10 object-contain shrink-0" />
            <div className="text-left">
              <p className="text-xs font-bold text-text-primary leading-tight">{t('orgName')}</p>
              <p className="text-[10px] text-text-secondary">{t('orgSubtitle')}</p>
            </div>
          </div>

          {/* 2-column: Quick Links | Community */}
          <div className="grid grid-cols-2 gap-x-4 mb-5">
            <div>
              <p className="text-[11px] font-semibold text-text-primary mb-2">{t('footer.quickLinks')}</p>
              <ul className="space-y-1.5">
                <li><Link to="/about" className="text-xs text-text-secondary">{t('nav.about')}</Link></li>
                <li><Link to="/events" className="text-xs text-text-secondary">{t('nav.events')}</Link></li>
                <li><Link to="/businesses" className="text-xs text-text-secondary">{t('nav.directory')}</Link></li>
                <li><Link to="/matrimonial" className="text-xs text-text-secondary">{t('nav.matrimonial')}</Link></li>
                <li><Link to="/contact" className="text-xs text-text-secondary">{t('nav.contact')}</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-text-primary mb-2">{t('footer.community')}</p>
              <ul className="space-y-1.5">
                <li><Link to="/members" className="text-xs text-text-secondary">{t('nav.members')}</Link></li>
                <li><Link to="/gallery" className="text-xs text-text-secondary">{t('nav.gallery')}</Link></li>
                <li><Link to="/souvenirs" className="text-xs text-text-secondary">{t('nav.souvenirs')}</Link></li>
                <li><Link to="/verify" className="text-xs text-text-secondary">{t('nav.verify')}</Link></li>
                <li><Link to="/donate" className="text-xs text-text-secondary">{t('nav.donate')}</Link></li>
              </ul>
            </div>
          </div>

          {/* Contact */}
          <div className="flex flex-col items-center gap-1.5 mb-4">
            <div className="flex items-center justify-center gap-3">
              <a href="tel:+919876543210" className="text-xs text-text-secondary flex items-center gap-1"><Phone className="w-3 h-3 text-primary" /> +91 98765 43210</a>
              <span className="text-border">·</span>
              <a href="mailto:info@akhilbharatiyagoswami.com" className="text-xs text-text-secondary flex items-center gap-1"><Mail className="w-3 h-3 text-primary" /> info@akhilbharatiyagoswami.com</a>
            </div>
            <span className="text-xs text-text-secondary flex items-center gap-1"><MapPin className="w-3 h-3 text-primary" /> West Bengal, India</span>
          </div>

          {/* Legal — 1 row centered */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <Link to="/privacy-policy" className="text-[10px] text-text-secondary hover:text-primary">{t('footer.privacyPolicy')}</Link>
            <span className="text-border">·</span>
            <Link to="/terms-of-service" className="text-[10px] text-text-secondary hover:text-primary">{t('footer.termsOfService')}</Link>
            <span className="text-border">·</span>
            <Link to="/cookie-policy" className="text-[10px] text-text-secondary hover:text-primary">{t('footer.cookiePolicy')}</Link>
          </div>

          {/* Copyright */}
          <div className="border-t border-border pt-3 flex items-center justify-between">
            <p className="text-[10px] text-text-secondary">&copy; {year} {t('orgSubtitle')}. {t('footer.rights')}</p>
            <p className="text-[10px] text-text-secondary">Made with <span className="text-red-500">❤️</span> by <a href="https://tmmt.in" target="_blank" rel="noopener noreferrer" className="text-primary font-medium">TMMT</a></p>
          </div>
        </div>

        {/* ── DESKTOP layout (unchanged) ── */}
        <div className="hidden sm:grid grid-cols-5 gap-8">
          <div className="col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <img src="/logo.png" alt="ABGSPB" className="w-12 h-12 object-contain" />
              <div>
                <p className="text-sm font-bold text-text-primary leading-tight">{t('orgName')}</p>
                <p className="text-[11px] text-text-secondary">{t('orgSubtitle')}</p>
              </div>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">{t('footer.description')}</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-3">{t('footer.quickLinks')}</h3>
            <ul className="space-y-2">
              <li><Link to="/about" className="text-xs text-text-secondary hover:text-primary transition-colors">{t('nav.about')}</Link></li>
              <li><Link to="/events" className="text-xs text-text-secondary hover:text-primary transition-colors">{t('nav.events')}</Link></li>
              <li><Link to="/businesses" className="text-xs text-text-secondary hover:text-primary transition-colors">{t('nav.directory')}</Link></li>
              <li><Link to="/matrimonial" className="text-xs text-text-secondary hover:text-primary transition-colors">{t('nav.matrimonial')}</Link></li>
              <li><Link to="/contact" className="text-xs text-text-secondary hover:text-primary transition-colors">{t('nav.contact')}</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-3">{t('footer.community')}</h3>
            <ul className="space-y-2">
              <li><Link to="/members" className="text-xs text-text-secondary hover:text-primary transition-colors">{t('nav.members')}</Link></li>
              <li><Link to="/gallery" className="text-xs text-text-secondary hover:text-primary transition-colors">{t('nav.gallery')}</Link></li>
              <li><Link to="/souvenirs" className="text-xs text-text-secondary hover:text-primary transition-colors">{t('nav.souvenirs')}</Link></li>
              <li><Link to="/verify" className="text-xs text-text-secondary hover:text-primary transition-colors">{t('nav.verify')}</Link></li>
              <li><Link to="/donate" className="text-xs text-text-secondary hover:text-primary transition-colors">{t('nav.donate')}</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-3">{t('footer.legal')}</h3>
            <ul className="space-y-2">
              <li><Link to="/privacy-policy" className="text-xs text-text-secondary hover:text-primary transition-colors">{t('footer.privacyPolicy')}</Link></li>
              <li><Link to="/terms-of-service" className="text-xs text-text-secondary hover:text-primary transition-colors">{t('footer.termsOfService')}</Link></li>
              <li><Link to="/cookie-policy" className="text-xs text-text-secondary hover:text-primary transition-colors">{t('footer.cookiePolicy')}</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-3">{t('footer.contact')}</h3>
            <ul className="space-y-2.5">
              <li className="flex items-start gap-2"><MapPin className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" /><p className="text-xs text-text-secondary">West Bengal, India</p></li>
              <li className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-primary shrink-0" /><p className="text-xs text-text-secondary">+91 98765 43210</p></li>
              <li className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-primary shrink-0" /><p className="text-xs text-text-secondary">info@akhilbharatiyagoswami.com</p></li>
            </ul>
          </div>
        </div>
        <div className="hidden sm:flex border-t border-border mt-8 pt-4 flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-text-secondary">&copy; {year} {t('orgName')}, {t('orgSubtitle')}. {t('footer.rights')}</p>
          <p className="text-xs text-text-secondary">Made with <span className="text-red-500">❤️</span> by <a href="https://tmmt.in" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">TMMT</a></p>
        </div>
      </div>
    </footer>
  )
}
