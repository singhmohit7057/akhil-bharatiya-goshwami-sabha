import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { X } from 'lucide-react'

const CONSENT_KEY = 'abgspb_cookie_consent'

export function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem(CONSENT_KEY)) setVisible(true)
  }, [])

  function accept() {
    localStorage.setItem(CONSENT_KEY, 'accepted')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border shadow-lg px-4 py-3 sm:px-6">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <p className="text-xs text-text-secondary flex-1">
          We use essential cookies for authentication and to keep your session secure. By continuing to use this site, you agree to our{' '}
          <Link to="/cookie-policy" className="text-primary underline underline-offset-2 hover:no-underline">
            Cookie Policy
          </Link>
          .
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={accept}
            className="px-4 py-1.5 bg-primary text-white text-xs font-medium rounded-lg hover:bg-primary-dark transition-colors"
          >
            Accept
          </button>
          <button
            onClick={accept}
            aria-label="Dismiss cookie notice"
            className="p-1 text-text-secondary hover:text-text-primary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
