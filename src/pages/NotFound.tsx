import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export function NotFound() {
  const { t } = useTranslation('common')

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
      <p className="text-7xl font-bold text-primary mb-4">404</p>
      <p className="text-xl text-text-primary mb-2">Page Not Found</p>
      <p className="text-text-secondary mb-6">The page you are looking for does not exist.</p>
      <Link to="/" className="px-6 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors">
        {t('nav.home')}
      </Link>
    </div>
  )
}
