import { useTranslation } from 'react-i18next'

export function TermsOfService() {
  const { t } = useTranslation('legal')

  const sections = [
    { title: t('terms.membership.title'), desc: t('terms.membership.description') },
    { title: t('terms.conduct.title'), desc: t('terms.conduct.description') },
    { title: t('terms.content.title'), desc: t('terms.content.description') },
    { title: t('terms.liability.title'), desc: t('terms.liability.description') },
  ]

  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <p className="text-sm font-semibold text-primary tracking-widest uppercase mb-4">Legal Framework</p>
      <h1 className="text-4xl sm:text-5xl font-bold text-text-primary mb-4">{t('terms.title')}</h1>
      <p className="text-sm text-text-secondary mb-8">Last Updated: September 2026</p>
      <hr className="border-border mb-10" />

      <p className="text-text-secondary leading-relaxed mb-10">{t('terms.intro')}</p>

      <div className="space-y-10">
        {sections.map((s, i) => (
          <div key={s.title}>
            <h2 className="text-xl font-bold text-text-primary mb-3">{i + 1}. {s.title}</h2>
            <p className="text-text-secondary leading-relaxed">{s.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
