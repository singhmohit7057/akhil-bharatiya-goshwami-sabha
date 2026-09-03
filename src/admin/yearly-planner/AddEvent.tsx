import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { ImagePlus, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { DateMaskInput } from '../../components/ui/DateMaskInput'
import { TimeMaskInput } from '../../components/ui/TimeMaskInput'


export function AddEvent() {
  const { } = useTranslation('admin')
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [bannerPreview, setBannerPreview] = useState<string | null>(null)
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [form, setForm] = useState({
    title_en: '', description_en: '', slug: '',
    event_date: '', event_time: '', end_date: '', end_time: '', location: '',
  })
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)

  function generateSlug(title: string, date?: string) {
    const base = title.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-')
    const datePart = date ? `-${date}` : ''
    return `${base}${datePart}`
  }

  function handleBannerChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error('Banner must be under 5MB'); return }
    setBannerFile(file)
    setBannerPreview(URL.createObjectURL(file))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    let image_url: string | null = null

    if (bannerFile) {
      const ext = bannerFile.name.split('.').pop()
      const path = `event-${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('event-images')
        .upload(path, bannerFile)
      if (!uploadError) {
        const { data } = supabase.storage.from('event-images').getPublicUrl(path)
        image_url = data.publicUrl
      }
    }

    const eventDateTime = form.event_time ? `${form.event_date}T${form.event_time}:00` : `${form.event_date}T00:00:00`
    const endDateTime = form.end_date ? (form.end_time ? `${form.end_date}T${form.end_time}:00` : `${form.end_date}T23:59:00`) : null
    const slug = form.slug || generateSlug(form.title_en, form.event_date)
    const { error } = await supabase.from('events').insert({
      title_en: form.title_en,
      slug: slug || null,
      description_en: form.description_en || null,
      event_date: eventDateTime,
      end_date: endDateTime,
      location: form.location || null,
      image_url,
      created_by: user?.id,
    })
    if (error) { toast.error('Failed to create event'); setLoading(false); return }
    toast.success('Event created')
    navigate('/admin/yearly-planner')
  }

  const inputClass = 'w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30'

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary mb-1">Add Event</h1>
      <p className="text-sm text-text-secondary mb-6">Create a new event for the community</p>

      <div className="bg-white rounded-xl border border-border p-5">
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Banner Image */}
          <div>
            <label className="block text-xs font-medium text-text-primary mb-2">Banner Image</label>
            {bannerPreview ? (
              <div className="relative">
                <img src={bannerPreview} alt="" className="w-full h-48 object-cover rounded-lg border border-border" />
                <button
                  type="button"
                  onClick={() => { setBannerPreview(null); setBannerFile(null) }}
                  className="absolute top-2 right-2 w-7 h-7 bg-white rounded-full shadow flex items-center justify-center hover:bg-gray-100"
                >
                  <X className="w-4 h-4 text-text-primary" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary transition-colors bg-gray-50">
                <ImagePlus className="w-8 h-8 text-gray-400 mb-2" />
                <p className="text-xs text-text-secondary">Click to upload banner image</p>
                <p className="text-[11px] text-text-secondary/60">JPG, PNG · Max 5MB · Recommended 1200x400</p>
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleBannerChange} className="hidden" />
              </label>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-text-primary mb-1">Title *</label>
            <input type="text" required value={form.title_en} onChange={(e) => {
              const val = e.target.value
              setForm((prev) => ({ ...prev, title_en: val, ...(slugManuallyEdited ? {} : { slug: generateSlug(val, prev.event_date) }) }))
            }} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-primary mb-1">URL Slug <span className="text-text-secondary font-normal">(auto-generated, editable)</span></label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-secondary shrink-0">/events/</span>
              <input type="text" value={form.slug} onChange={(e) => { setSlugManuallyEdited(true); setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') }) }} placeholder="blood-donation-camp" className={inputClass} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-primary mb-1">Description</label>
            <textarea value={form.description_en} onChange={(e) => setForm({ ...form, description_en: e.target.value })} rows={3} className={inputClass} />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">Event Date *</label>
              <DateMaskInput required value={form.event_date} onChange={(date) => {
                setForm((prev) => ({ ...prev, event_date: date, ...(slugManuallyEdited ? {} : { slug: generateSlug(prev.title_en, date) }) }))
              }} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">Event Time <span className="text-text-secondary font-normal">(optional)</span></label>
              <TimeMaskInput value={form.event_time} onChange={(t) => setForm({ ...form, event_time: t })} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">End Date <span className="text-text-secondary font-normal">(optional)</span></label>
              <DateMaskInput value={form.end_date} onChange={(date) => setForm({ ...form, end_date: date })} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">End Time <span className="text-text-secondary font-normal">(optional)</span></label>
              <TimeMaskInput value={form.end_time} onChange={(t) => setForm({ ...form, end_time: t })} className={inputClass} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-primary mb-1">Location</label>
            <input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className={inputClass} />
          </div>

          <button type="submit" disabled={loading} className="px-5 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark disabled:opacity-50">
            {loading ? '...' : 'Create Event'}
          </button>
        </form>
      </div>
    </div>
  )
}
