import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Calendar, MapPin } from 'lucide-react'
import { supabase } from '../lib/supabase'

import { localized, formatDate } from '../lib/utils'
import type { Event } from '../types'

export function Events() {
  const { t, i18n } = useTranslation('events')
  const lang = i18n.language
  const [tab, setTab] = useState<'all' | 'upcoming' | 'past'>('all')
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const now = new Date().toISOString()

    let query = supabase
      .from('events')
      .select('*')
      .eq('is_published', true)

    if (tab === 'upcoming') {
      query = query.gte('event_date', now).order('event_date', { ascending: true })
    } else if (tab === 'past') {
      query = query.lt('event_date', now).order('event_date', { ascending: false })
    } else {
      query = query.order('event_date', { ascending: false })
    }

    query.then(({ data }) => {
      setEvents((data as Event[]) || [])
      setLoading(false)
    })
  }, [tab])

  return (
    <div>
      <section className="bg-surface py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm font-semibold text-primary tracking-widest uppercase mb-3">Community Gatherings</p>
          <h1 className="text-5xl font-extrabold text-text-primary">{t('title')}</h1>
        </div>
      </section>
      <div className="max-w-3xl mx-auto"><hr className="border-border" /></div>

      <section className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex gap-2 mb-8">
          <button
            onClick={() => setTab('all')}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === 'all' ? 'bg-primary text-white' : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setTab('upcoming')}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === 'upcoming' ? 'bg-primary text-white' : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
            }`}
          >
            {t('upcoming')}
          </button>
          <button
            onClick={() => setTab('past')}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === 'past' ? 'bg-primary text-white' : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
            }`}
          >
            {t('past')}
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20 text-text-secondary">{t('common:buttons.loading')}</div>
        ) : events.length === 0 ? (
          <div className="text-center py-20 text-text-secondary">
            {tab === 'upcoming' ? t('noUpcoming') : t('noPast')}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <Link
                key={event.id}
                to={`/events/${(event as any).slug || event.id}`}
                className="bg-white rounded-xl border border-border overflow-hidden hover:shadow-lg transition-all group flex flex-col"
              >
                <div className="h-44 w-full overflow-hidden">
                  {event.image_url ? (
                    <img src={event.image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                      <Calendar className="w-10 h-10 text-white/60" />
                    </div>
                  )}
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="font-semibold text-text-primary group-hover:text-primary transition-colors mb-1.5">
                    {localized(event.title_en, event.title_hi, lang)}
                  </h3>
                  <p className="text-sm text-text-secondary line-clamp-2 mb-3 flex-1">
                    {localized(event.description_en, event.description_hi, lang)}
                  </p>
                  <div className="flex flex-col gap-1.5 text-xs text-text-secondary border-t border-border pt-3">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-primary" />
                      {formatDate(event.event_date, lang)}
                    </span>
                    {event.location && (
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-primary" /> {event.location}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
