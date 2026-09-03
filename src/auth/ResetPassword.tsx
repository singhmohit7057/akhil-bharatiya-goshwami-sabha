import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { KeyRound, Eye, EyeOff, CheckCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'

export function ResetPassword() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [hasSession, setHasSession] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) {
        setHasSession(true)
      }
      setChecking(false)
    })

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setHasSession(true)
      setChecking(false)
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }
    setSuccess(true)
    setLoading(false)
    setTimeout(() => navigate('/login'), 3000)
  }

  if (checking) return null

  if (success) {
    return (
      <div className="flex items-center justify-center bg-surface px-4 py-12">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="mx-auto w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">Password Updated!</h1>
          <p className="text-sm text-text-secondary mb-6">Your password has been reset successfully. Redirecting to login...</p>
          <Link to="/login" className="px-6 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors">
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  if (!hasSession) {
    return (
      <div className="flex items-center justify-center bg-surface px-4 py-12">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="mx-auto w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mb-4">
            <KeyRound className="w-7 h-7 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">Invalid or Expired Link</h1>
          <p className="text-sm text-text-secondary mb-6">This password reset link is invalid or has expired. Please request a new one.</p>
          <Link to="/forgot-password" className="px-6 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors">
            Request New Link
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center bg-surface px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="ABGSPB" className="w-16 h-16 mx-auto mb-3 rounded-full object-cover" />
          <p className="text-sm font-bold text-text-primary">Akhil Bharatiya Goswami Sabha</p>
          <p className="text-xs text-text-secondary mb-4">Paschim Bangal</p>
          <h1 className="text-2xl font-bold text-text-primary">Reset Password</h1>
          <p className="text-text-secondary mt-1">Enter your new password</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">New Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="new-password"
                autoComplete="new-password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 pr-11 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Confirm Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-2.5 rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            {loading ? '...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  )
}
