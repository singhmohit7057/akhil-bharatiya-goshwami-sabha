import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { localized, formatDate } from '../../lib/utils'

import type { Event } from '../../types'
import { Spinner } from '../../components/ui/Spinner'

export function ManageEvents() {
  const { t, i18n } = useTranslation('admin')
  const lang = i18n.language
  const { isSuperAdmin } = useAuth()
  const superAdmin = isSuperAdmin()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchEvents()
  }, [])

  async function fetchEvents() {
    const { data } = await supabase.from('events').select('*').order('event_date', { ascending: false })
    setEvents((data as Event[]) || [])
    setLoading(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this event?')) return
    await supabase.from('events').delete().eq('id', id)
    toast.success(t('events.deleted'))
    fetchEvents()
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text-primary">{t('events.title')}</h1>
        {superAdmin && (
          <Link to="/admin/events/add" className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark">
            <Plus className="w-4 h-4" /> {t('events.addEvent')}
          </Link>
        )}
      </div>

      {events.length === 0 ? (
        <div className="bg-white rounded-xl border border-border p-8 text-center text-text-secondary">{t('common:labels.noData')}</div>
      ) : (
        <div className="space-y-3">
          {events.map((e) => (
            <div key={e.id} className="bg-white rounded-xl border border-border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="font-medium text-text-primary">{localized(e.title_en, e.title_hi, lang)}</p>
                <p className="text-sm text-text-secondary">{formatDate(e.event_date, lang)} {e.location ? `· ${e.location}` : ''}</p>
              </div>
              {superAdmin && (
                <div className="flex gap-2 shrink-0">
                  <Link to={`/admin/events/${e.id}/edit`} className="p-2 text-text-secondary hover:text-primary"><Edit2 className="w-4 h-4" /></Link>
                  <button onClick={() => handleDelete(e.id)} className="p-2 text-text-secondary hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
