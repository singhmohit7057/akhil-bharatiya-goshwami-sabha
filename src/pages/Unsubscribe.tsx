import { useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { MailX, CheckCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'

export function Unsubscribe() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.from('email_subscribers').update({ is_active: false }).eq('email', email)
    if (error) { toast.error('Failed. Please try again.'); setLoading(false); return }
    setSuccess(true)
    setLoading(false)
  }

  return (
    <div className="flex items-center justify-center bg-surface py-16 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 text-center">
        {success ? (
          <>
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h1 className="text-2xl font-bold text-text-primary mb-2">Unsubscribed</h1>
            <p className="text-sm text-text-secondary mb-6">
              You have been successfully unsubscribed from our newsletter. You will no longer receive emails from us.
            </p>
            <Link to="/" className="px-6 py-2.5 bg-primary text-white rounded-lg font-medium text-sm hover:bg-primary-dark transition-colors">
              Go to Homepage
            </Link>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <MailX className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-text-primary mb-2">Unsubscribe</h1>
            <p className="text-sm text-text-secondary mb-6">
              Enter your email address to unsubscribe from our newsletter.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="email"
                required
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <button type="submit" disabled={loading} className="w-full py-3 bg-red-500 text-white rounded-lg font-medium text-sm hover:bg-red-600 transition-colors disabled:opacity-50">
                {loading ? '...' : 'Unsubscribe'}
              </button>
            </form>
            <p className="text-xs text-text-secondary mt-4">
              Changed your mind? <Link to="/" className="text-primary hover:underline">Go back to homepage</Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
