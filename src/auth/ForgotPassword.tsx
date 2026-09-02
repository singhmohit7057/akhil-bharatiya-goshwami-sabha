import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { KeyRound } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

export function ForgotPassword() {
  const { t } = useTranslation('auth')
  const { resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { error } = await resetPassword(email)
    if (error) {
      toast.error(error.message)
    } else {
      toast.success(t('forgotPassword.success'))
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="mx-auto w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <KeyRound className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">{t('forgotPassword.title')}</h1>
          <p className="text-text-secondary mt-1">{t('forgotPassword.subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">{t('forgotPassword.email')}</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-2.5 rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            {loading ? '...' : t('forgotPassword.submit')}
          </button>
        </form>

        <p className="text-center text-sm text-text-secondary mt-6">
          <Link to="/login" className="text-primary font-medium hover:underline">
            {t('forgotPassword.backToLogin')}
          </Link>
        </p>
      </div>
    </div>
  )
}
