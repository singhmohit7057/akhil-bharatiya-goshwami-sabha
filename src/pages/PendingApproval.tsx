import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Clock } from 'lucide-react'

export function PendingApproval() {
  const { t } = useTranslation('auth')

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mb-4">
        <Clock className="w-8 h-8 text-amber-500" />
      </div>
      <h1 className="text-2xl font-bold text-text-primary mb-3">{t('pendingApproval.title')}</h1>
      <p className="text-text-secondary max-w-md mb-6">{t('pendingApproval.message')}</p>
      <Link to="/" className="px-6 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors">
        {t('pendingApproval.backToHome')}
      </Link>
    </div>
  )
}
