import { useTranslation } from 'react-i18next'
import { cn } from '../../lib/utils'

export function LanguageToggle() {
  const { i18n } = useTranslation()
  const currentLang = i18n.language

  return (
    <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
      <button
        onClick={() => i18n.changeLanguage('en')}
        className={cn(
          'px-2.5 py-1 text-xs font-medium rounded-md transition-colors',
          currentLang === 'en' || !currentLang.startsWith('hi')
            ? 'bg-white text-text-primary shadow-sm'
            : 'text-text-secondary hover:text-text-primary',
        )}
      >
        EN
      </button>
      <button
        onClick={() => i18n.changeLanguage('hi')}
        className={cn(
          'px-2.5 py-1 text-xs font-medium rounded-md transition-colors',
          currentLang.startsWith('hi')
            ? 'bg-white text-text-primary shadow-sm'
            : 'text-text-secondary hover:text-text-primary',
        )}
      >
        हि
      </button>
    </div>
  )
}
