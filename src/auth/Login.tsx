import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'

export function Login() {
  const { t } = useTranslation('auth')
  const { user, profile, signIn, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  if (authLoading) return null

  if (user && profile?.account_status === 'active') {
    return <Navigate to="/profile" replace />
  }

  if (user && profile?.account_status === 'pending_approval') {
    return <Navigate to="/pending-approval" replace />
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    const { error } = await signIn(email, password)
    if (error) {
      const msg = error.message?.toLowerCase() || ''
      if (msg.includes('invalid login') || msg.includes('invalid credentials')) {
        // Check if email exists to give specific message
        const { data: profile } = await supabase
          .from('profiles').select('id').eq('email', email).maybeSingle()
        if (!profile) {
          setErrorMsg('No account found with this email address.')
        } else {
          setErrorMsg('Incorrect password. Please try again or use Forgot Password.')
        }
      } else if (msg.includes('email not confirmed')) {
        setErrorMsg('Please confirm your email address before logging in.')
      } else if (msg.includes('too many requests') || msg.includes('rate limit')) {
        setErrorMsg('Too many attempts. Please wait a few minutes and try again.')
      } else if (msg.includes('failed to fetch') || msg.includes('network') || msg.includes('fetch')) {
        setErrorMsg('Network error — please check your internet connection and try again.')
      } else {
        setErrorMsg(error.message || 'Login failed. Please try again.')
      }
    } else {
      // Check if account is blocked before navigating
      const { data: prof } = await supabase.from('profiles').select('account_status').eq('email', email).maybeSingle()
      if (prof?.account_status === 'suspended') {
        await supabase.auth.signOut()
        setErrorMsg('Your account has been blocked by the admin. Please contact us at abgspb3@gmail.com for assistance.')
        setLoading(false)
        return
      }
      navigate('/profile')
    }
    setLoading(false)
  }

  return (
    <div className="flex items-center justify-center bg-surface py-12 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="ABGSPB" className="w-16 h-16 mx-auto mb-3 rounded-full object-cover" />
          <p className="text-sm font-bold text-text-primary">Akhil Bharatiya Goswami Sabha</p>
          <p className="text-xs text-text-secondary mb-4">Paschim Bangal</p>
          <h1 className="text-2xl font-bold text-text-primary">{t('login.title')}</h1>
          <p className="text-text-secondary mt-1">{t('login.subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">{t('login.email')}</label>
            <input
              type="email"
              name="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => { setEmail(e.target.value); setErrorMsg('') }}
              className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">{t('login.password')}</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => { setPassword(e.target.value); setErrorMsg('') }}
                className="w-full px-4 py-2.5 pr-11 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
              >
                {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div />
            <Link to="/forgot-password" className="text-sm text-primary hover:underline">
              {t('login.forgotPassword')}
            </Link>
          </div>

          {errorMsg && (
            <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-2.5 rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            {loading ? '...' : t('login.submit')}
          </button>
        </form>

        <p className="text-center text-sm text-text-secondary mt-6">
          {t('login.noAccount')}{' '}
          <Link to="/register" className="text-primary font-medium hover:underline">
            {t('login.register')}
          </Link>
        </p>
      </div>
    </div>
  )
}
