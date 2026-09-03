import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { CheckCircle, Clock, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'

export function Register() {
  const { t } = useTranslation('auth')
  const { user, loading: authLoading } = useAuth()
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    gender: '',
    gotra: '',
    city: '',
    state: '',
  })
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  if (authLoading) return null
  if (!submitted && user) return <Navigate to="/profile" replace />

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
    if (!emailRegex.test(form.email)) {
      toast.error('Please enter a valid email address')
      return
    }

    setLoading(true)

    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          full_name: form.fullName,
        },
      },
    })

    if (error) {
      toast.error(t('register.error'))
      setLoading(false)
      return
    }

    if (data.user) {
      const updateProfile = async (retries = 3) => {
        const { error: updateError } = await supabase.from('profiles').update({
          phone: form.phone || null,
          gender: form.gender || null,
          gotra: form.gotra || null,
          city: form.city || null,
          state: form.state || null,
        }).eq('id', data.user!.id)
        if (updateError && retries > 0) {
          await new Promise((r) => setTimeout(r, 500))
          return updateProfile(retries - 1)
        }
      }
      await updateProfile()
    }

    setSubmitted(true)
    setLoading(false)
  }

  if (submitted) {
    return (
      <div className="flex items-center justify-center bg-surface py-12 px-4 py-10">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="mx-auto w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">Registration Successful!</h1>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <p className="text-sm font-semibold text-amber-800">Verification Pending</p>
            </div>
            <p className="text-sm text-amber-700">
              Your profile has been sent for verification. Once approved by the admin, you will be able to login and access all features.
            </p>
          </div>
          <p className="text-xs text-text-secondary mb-6">
            You will be notified once your account is approved. This usually takes 1-2 business days.
          </p>
          <div className="flex flex-col gap-2">
            <Link to="/" className="px-6 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors">
              Go to Homepage
            </Link>
            <Link to="/login" className="px-6 py-2.5 border border-border text-text-secondary rounded-lg font-medium hover:bg-gray-50 transition-colors">
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const inputClass = 'w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm'

  return (
    <div className="flex items-center justify-center bg-surface py-12 px-4 py-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6">
        <div className="text-center mb-5">
          <img src="/logo.png" alt="ABGSPB" className="w-14 h-14 mx-auto mb-2 rounded-full object-cover" />
          <p className="text-sm font-bold text-text-primary">Akhil Bharatiya Goswami Sabha</p>
          <p className="text-xs text-text-secondary mb-3">Paschim Bangal</p>
          <h1 className="text-xl font-bold text-text-primary">{t('register.title')}</h1>
          <p className="text-text-secondary text-sm mt-0.5">{t('register.subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">{t('register.fullName')} *</label>
              <input type="text" required value={form.fullName} onChange={(e) => updateField('fullName', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">{t('register.phone')}</label>
              <input type="tel" maxLength={10} value={form.phone} onChange={(e) => updateField('phone', e.target.value.replace(/\D/g, '').slice(0, 10))} className={inputClass} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-primary mb-1">{t('register.email')} *</label>
            <input type="email" required value={form.email} onChange={(e) => updateField('email', e.target.value)} className={inputClass} />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-primary mb-1">{t('register.password')} *</label>
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} required minLength={6} value={form.password} onChange={(e) => updateField('password', e.target.value)} className={`${inputClass} pr-10`} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">{t('register.gender')}</label>
              <select value={form.gender} onChange={(e) => updateField('gender', e.target.value)} className={`${inputClass} bg-white`}>
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">{t('register.gotra')}</label>
              <input type="text" value={form.gotra} onChange={(e) => updateField('gotra', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">{t('register.city')}</label>
              <input type="text" value={form.city} onChange={(e) => updateField('city', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">{t('register.state')}</label>
              <input type="text" value={form.state} onChange={(e) => updateField('state', e.target.value)} className={inputClass} />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-2 rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 text-sm mt-1"
          >
            {loading ? '...' : t('register.submit')}
          </button>
        </form>

        <p className="text-center text-xs text-text-secondary mt-4">
          {t('register.hasAccount')}{' '}
          <Link to="/login" className="text-primary font-medium hover:underline">
            {t('register.login')}
          </Link>
        </p>
      </div>
    </div>
  )
}
