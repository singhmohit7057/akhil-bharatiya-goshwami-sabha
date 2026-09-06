import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Plus, Edit2, Trash2, CalendarDays, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { logAction } from '../../lib/adminLog'
import { formatDate } from '../../lib/utils'
import type { Event } from '../../types'
import { useAuth } from '../../hooks/useAuth'
import { Spinner } from '../../components/ui/Spinner'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export function YearlyPlanner() {
  const { user, canWrite } = useAuth()
  const canEdit = canWrite('events')
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title_en: '', title_hi: '', description_en: '', event_date: '', location: '' })

  useEffect(() => {
    fetchEvents()
  }, [])

  async function fetchEvents() {
    const { data } = await supabase.from('events').select('*').order('event_date', { ascending: true })
    setEvents((data as Event[]) || [])
    setLoading(false)
  }

  const filteredEvents = events.filter((e) => {
    const month = new Date(e.event_date).getMonth()
    return month === selectedMonth
  })

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const { error } = await supabase.from('events').insert({
      title_en: form.title_en,
      title_hi: form.title_hi || null,
      description_en: form.description_en || null,
      event_date: form.event_date,
      location: form.location || null,
      created_by: user?.id,
    })
    if (error) { toast.error('Failed to create event'); return }
    logAction('create', 'event', form.title_en)
    toast.success('Event added to planner')
    setForm({ title_en: '', title_hi: '', description_en: '', event_date: '', location: '' })
    setShowForm(false)
    fetchEvents()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this event?')) return
    const deletedEvent = events.find((e) => e.id === id)
    await supabase.from('events').delete().eq('id', id)
    logAction('delete', 'event', deletedEvent?.title_en || id, id)
    toast.success('Event removed')
    fetchEvents()
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  const inputClass = 'w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary'

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Yearly Planner</h1>
          <p className="text-sm text-text-secondary mt-1">Plan and organize events throughout the year</p>
        </div>
        {canEdit && (
          <Link to="/admin/yearly-planner/add" className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark">
            <Plus className="w-4 h-4" /> Add Event
          </Link>
        )}
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-border p-5 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium text-text-primary">New Event</h3>
            <button onClick={() => setShowForm(false)}><X className="w-4 h-4 text-text-secondary" /></button>
          </div>
          <form onSubmit={handleAdd} className="space-y-3">
            <div>
              <input type="text" required placeholder="Title *" value={form.title_en} onChange={(e) => setForm({ ...form, title_en: e.target.value })} className={inputClass} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input type="text" required placeholder="Date (YYYY-MM-DD HH:MM) *" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} className={inputClass} />
              <input type="text" placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className={inputClass} />
            </div>
            <textarea placeholder="Description" value={form.description_en} onChange={(e) => setForm({ ...form, description_en: e.target.value })} rows={2} className={inputClass} />
            <button type="submit" className="px-5 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark">Add</button>
          </form>
        </div>
      )}

      {/* Month tabs */}
      {/* Mobile: 6×6 grid | Desktop: single row */}
      <div className="grid grid-cols-6 w-full sm:flex gap-1 mb-6 sm:overflow-x-auto sm:pb-2 sm:scrollbar-hide">
        {MONTHS.map((month, i) => {
          const count = events.filter((e) => new Date(e.event_date).getMonth() === i).length
          return (
            <button
              key={month}
              onClick={() => setSelectedMonth(i)}
              className={`px-1 sm:px-3 py-2 rounded-lg text-xs font-medium transition-colors sm:shrink-0 w-full sm:w-auto text-center ${
                selectedMonth === i ? 'bg-primary text-white' : 'bg-white border border-border text-text-secondary hover:border-primary/30'
              }`}
            >
              {month.slice(0, 3)}
              {count > 0 && <span className="ml-0.5 text-[9px] sm:text-[10px] opacity-70">({count})</span>}
            </button>
          )
        })}
      </div>

      {/* Events for selected month */}
      {filteredEvents.length === 0 ? (
        <div className="bg-white rounded-xl border border-border p-8 text-center text-text-secondary">
          <CalendarDays className="w-8 h-8 mx-auto mb-2 opacity-40" />
          No events planned for {MONTHS[selectedMonth]}
        </div>
      ) : (
        <>
        {/* Mobile: compact list */}
        <div className="sm:hidden space-y-2">
          {filteredEvents.map((event) => (
            <div key={event.id} className="bg-white rounded-xl border border-border p-3 flex gap-3 items-start">
              <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0">
                {event.image_url ? (
                  <img src={event.image_url} alt="" className="w-14 h-14 object-cover" />
                ) : (
                  <div className="w-14 h-14 bg-primary/10 flex items-center justify-center">
                    <CalendarDays className="w-5 h-5 text-primary" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-primary truncate">{event.title_en}</p>
                <p className="text-[10px] text-primary flex items-center gap-1 mt-0.5">
                  <CalendarDays className="w-3 h-3" /> {formatDate(event.event_date, 'en')}
                </p>
                {event.location && <p className="text-[10px] text-text-secondary truncate">{event.location}</p>}
              </div>
              {canEdit && (
                <div className="flex flex-col gap-1 shrink-0">
                  <Link to={`/admin/yearly-planner/edit/${(event as any).slug || event.id}`}
                    className="text-[10px] text-primary bg-primary/10 px-2 py-1 rounded font-medium">Edit</Link>
                  <button onClick={() => handleDelete(event.id)}
                    className="text-[10px] text-red-500 bg-red-50 px-2 py-1 rounded font-medium">Del</button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Desktop: grid cards */}
        <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEvents.map((event) => (
            <div key={event.id} className="bg-white rounded-xl border border-border overflow-hidden flex flex-col">
              <div className="h-36 w-full overflow-hidden">
                {event.image_url ? (
                  <img src={event.image_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                    <CalendarDays className="w-8 h-8 text-white/60" />
                  </div>
                )}
              </div>
              <div className="p-3 flex flex-col flex-1">
                <p className="text-sm font-semibold text-text-primary mb-1">{event.title_en}</p>
                <p className="text-xs text-text-secondary line-clamp-2 mb-2 flex-1">{event.description_en}</p>
                <div className="flex flex-col gap-1 text-xs text-text-secondary border-t border-border pt-2 mb-2">
                  <span className="flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5 text-primary" />{formatDate(event.event_date, 'en')}</span>
                  {event.location && <span className="truncate">{event.location}</span>}
                </div>
                {canEdit && (
                  <div className="flex items-center gap-3 pt-2 border-t border-border">
                    <Link to={`/admin/yearly-planner/edit/${(event as any).slug || event.id}`} className="flex items-center gap-1 text-xs text-text-secondary hover:text-primary">
                      <Edit2 className="w-3.5 h-3.5" /> Edit
                    </Link>
                    <button onClick={() => handleDelete(event.id)} className="flex items-center gap-1 text-xs text-text-secondary hover:text-red-500">
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        </>
      )}
    </div>
  )
}
