import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Calendar, MapPin, ArrowLeft, Clock, Share2 } from 'lucide-react'
import { supabase } from '../lib/supabase'

import { localized, formatDate } from '../lib/utils'
import type { Event } from '../types'
import { Spinner } from '../components/ui/Spinner'

export function EventDetail() {
  const { id } = useParams()
  const { t, i18n } = useTranslation('events')
  const lang = i18n.language
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        setEvent(data as Event | null)
        setLoading(false)
      })
  }, [id])

  useEffect(() => {
    if (!event) return
    const title = localized(event.title_en, event.title_hi, lang)
    document.title = `${title} - ABGSPB`
    const setMeta = (property: string, content: string) => {
      let el = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null
      if (!el) {
        el = document.createElement('meta')
        el.setAttribute('property', property)
        document.head.appendChild(el)
      }
      el.setAttribute('content', content)
    }
    setMeta('og:title', title)
    setMeta('og:description', localized(event.description_en, event.description_hi, lang)?.substring(0, 160) || '')
    if (event.image_url) setMeta('og:image', event.image_url)
    setMeta('og:type', 'article')
    return () => { document.title = 'Akhil Bharatiya Goshwami Sabha' }
  }, [event, lang])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!event) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <p className="text-text-secondary">Event not found</p>
        <Link to="/events" className="text-primary hover:underline mt-2 inline-block">
          {t('common:buttons.back')}
        </Link>
      </div>
    )
  }

  const eventDate = new Date(event.event_date)
  const day = eventDate.getDate()
  const month = eventDate.toLocaleString(lang === 'hi' ? 'hi-IN' : 'en-IN', { month: 'long' })
  const year = eventDate.getFullYear()
  const time = eventDate.toLocaleTimeString(lang === 'hi' ? 'hi-IN' : 'en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
  const isPast = eventDate < new Date()

  return (
    <div>
      {/* Header */}
      <div className="bg-surface border-b border-border py-6 px-4">
        <div className="max-w-5xl mx-auto">
          <Link to="/events" className="flex items-center gap-1 text-sm text-text-secondary hover:text-primary mb-3">
            <ArrowLeft className="w-4 h-4" /> Back to Events
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-text-primary">
            {localized(event.title_en, event.title_hi, lang)}
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Left: Banner + Description */}
          <div className="flex-1">
            {/* Banner image */}
            {event.image_url ? (
              <img src={event.image_url} alt="" className="w-full rounded-xl mb-5" />
            ) : (
              <div className="w-full h-48 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl flex flex-col items-center justify-center mb-5">
                <p className="text-5xl font-bold text-primary">{day}</p>
                <p className="text-lg text-text-secondary">{month} {year}</p>
              </div>
            )}

            {/* Status badge */}
            {isPast && (
              <span className="inline-block text-xs bg-gray-100 text-gray-500 px-3 py-1 rounded-full mb-4">Past Event</span>
            )}

            {/* Description */}
            <div className="bg-white rounded-xl border border-border p-6 mb-6">
              <h2 className="text-base font-semibold text-text-primary mb-3">About This Event</h2>
              <div className="text-text-secondary leading-relaxed whitespace-pre-wrap text-sm">
                {localized(event.description_en, event.description_hi, lang) || 'No description provided.'}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="md:w-72 shrink-0">
            {/* Event card */}
            <div className="bg-white rounded-xl border border-border overflow-hidden mb-4">
              {event.image_url ? (
                <img src={event.image_url} alt="" className="w-full h-40 object-cover" />
              ) : (
                <div className="w-full h-32 bg-gradient-to-br from-primary to-secondary flex flex-col items-center justify-center text-white">
                  <p className="text-4xl font-bold">{day}</p>
                  <p className="text-sm font-medium">{month} {year}</p>
                </div>
              )}
              <div className="p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <Calendar className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-text-secondary">Date</p>
                    <p className="text-sm font-medium text-text-primary">{formatDate(event.event_date, lang)}</p>
                    {event.end_date && formatDate(event.end_date, lang) !== formatDate(event.event_date, lang) && (
                      <p className="text-xs text-text-secondary mt-0.5">to {formatDate(event.end_date, lang)}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-text-secondary">Time</p>
                    <p className="text-sm font-medium text-text-primary">{time}</p>
                    {event.end_date && (
                      <p className="text-xs text-text-secondary mt-0.5">to {new Date(event.end_date).toLocaleTimeString(lang === 'hi' ? 'hi-IN' : 'en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</p>
                    )}
                  </div>
                </div>

                {event.location && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-text-secondary">Location</p>
                      <p className="text-sm font-medium text-text-primary">{event.location}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Share */}
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href)
                alert('Link copied!')
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-border rounded-xl text-sm font-medium text-text-secondary hover:text-primary hover:border-primary/30 transition-colors"
            >
              <Share2 className="w-4 h-4" /> Share Event
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
