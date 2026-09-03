import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface Popup {
  id: string
  title: string
  description: string | null
  image_url: string | null
  link_url: string | null
  link_text: string | null
}

export function PromoPopup() {
  const [popup, setPopup] = useState<Popup | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    supabase
      .from('promo_popups')
      .select('*')
      .eq('is_active', true)
      .limit(1)
      .then(({ data }) => {
        if (!data || data.length === 0) return
        const p = data[0] as Popup
        const dismissed = localStorage.getItem(`popup_dismissed_${p.id}`)
        if (dismissed) return
        setPopup(p)
        setTimeout(() => setVisible(true), 5000)
      })
  }, [])

  function handleClose() {
    if (popup) localStorage.setItem(`popup_dismissed_${popup.id}`, 'true')
    setVisible(false)
  }

  if (!visible || !popup) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={handleClose}>
      <div className="relative w-full max-w-md bg-white rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in" onClick={(e) => e.stopPropagation()}>
        <button onClick={handleClose} className="absolute top-3 right-3 z-10 w-8 h-8 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center text-white transition-colors">
          <X className="w-4 h-4" />
        </button>

        {popup.image_url && (
          <img src={popup.image_url} alt="" className="w-full max-h-64 object-cover" />
        )}

        <div className="p-6 text-center">
          <h2 className="text-xl font-bold text-text-primary mb-2">{popup.title}</h2>
          {popup.description && (
            <p className="text-sm text-text-secondary mb-4">{popup.description}</p>
          )}
          {popup.link_url && (
            <a
              href={popup.link_url}
              {...(popup.link_url.startsWith('/') ? {} : { target: '_blank', rel: 'noopener noreferrer' })}
              onClick={handleClose}
              className="inline-block px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
            >
              {popup.link_text || 'Learn More'}
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
