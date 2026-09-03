import { useEffect, useState, useRef } from 'react'
import toast from 'react-hot-toast'
import { Plus, Trash2, X, Eye, EyeOff, Upload, Edit2, Megaphone } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Spinner } from '../../components/ui/Spinner'

interface Popup {
  id: string
  title: string
  description: string | null
  image_url: string | null
  link_url: string | null
  link_text: string | null
  is_active: boolean
  created_at: string
}

export function PromoPopups() {
  const [popups, setPopups] = useState<Popup[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState({ title: '', description: '', link_url: '', link_text: 'Learn More' })

  useEffect(() => { fetchPopups() }, [])

  async function fetchPopups() {
    const { data } = await supabase.from('promo_popups').select('*').order('created_at', { ascending: false })
    setPopups((data as Popup[]) || [])
    setLoading(false)
  }

  function resetForm() {
    setForm({ title: '', description: '', link_url: '', link_text: 'Learn More' })
    setImageUrl(null)
    setEditingId(null)
    setShowForm(false)
  }

  function startEdit(p: Popup) {
    setForm({ title: p.title, description: p.description || '', link_url: p.link_url || '', link_text: p.link_text || 'Learn More' })
    setImageUrl(p.image_url)
    setEditingId(p.id)
    setShowForm(true)
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { toast.error('Image must be under 2MB'); return }
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `popups/${crypto.randomUUID()}.${ext}`
    const { error } = await supabase.storage.from('profile-photos').upload(path, file)
    if (error) { toast.error('Upload failed'); setUploading(false); return }
    const { data } = supabase.storage.from('profile-photos').getPublicUrl(path)
    setImageUrl(data.publicUrl)
    setUploading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const payload = {
      title: form.title,
      description: form.description || null,
      image_url: imageUrl,
      link_url: form.link_url || null,
      link_text: form.link_text || 'Learn More',
    }
    if (editingId) {
      const { error } = await supabase.from('promo_popups').update(payload).eq('id', editingId)
      if (error) { toast.error('Failed'); setSaving(false); return }
      toast.success('Popup updated')
    } else {
      const { error } = await supabase.from('promo_popups').insert(payload)
      if (error) { toast.error('Failed'); setSaving(false); return }
      toast.success('Popup created')
    }
    resetForm()
    setSaving(false)
    fetchPopups()
  }

  async function handleToggle(p: Popup) {
    if (!p.is_active) {
      await supabase.from('promo_popups').update({ is_active: false }).neq('id', p.id)
    }
    await supabase.from('promo_popups').update({ is_active: !p.is_active }).eq('id', p.id)
    toast.success(p.is_active ? 'Popup deactivated' : 'Popup activated')
    fetchPopups()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this popup?')) return
    await supabase.from('promo_popups').delete().eq('id', id)
    toast.success('Deleted')
    fetchPopups()
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  const inputClass = 'w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30'

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Promo Popups</h1>
          <p className="text-sm text-text-secondary mt-1">Manage promotional popups shown to visitors</p>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark">
            <Plus className="w-4 h-4" /> New Popup
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-border p-5 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-semibold text-text-primary">{editingId ? 'Edit Popup' : 'Create Popup'}</h3>
            <button onClick={resetForm}><X className="w-4 h-4 text-text-secondary" /></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">Title *</label>
              <input type="text" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-primary mb-2">Popup Image</label>
              <label className="block border-2 border-dashed border-border rounded-xl p-4 text-center cursor-pointer hover:border-primary/30 transition-colors">
                {imageUrl ? (
                  <img src={imageUrl} alt="" className="max-h-32 mx-auto rounded-lg" />
                ) : (
                  <><Upload className="w-5 h-5 text-gray-400 mx-auto mb-1" /><p className="text-xs text-text-secondary">Click to upload image</p></>
                )}
                <input ref={fileRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                {uploading && <p className="text-xs text-primary mt-1">Uploading...</p>}
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-text-primary mb-1">Button Link URL</label>
                <input type="text" placeholder="https://... or /events/..." value={form.link_url} onChange={(e) => setForm({ ...form, link_url: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-primary mb-1">Button Text</label>
                <input type="text" value={form.link_text} onChange={(e) => setForm({ ...form, link_text: e.target.value })} className={inputClass} />
              </div>
            </div>
            <button type="submit" disabled={saving} className="px-5 py-2 bg-primary text-white rounded-lg text-xs font-medium hover:bg-primary-dark disabled:opacity-50">
              {saving ? '...' : editingId ? 'Update Popup' : 'Create Popup'}
            </button>
          </form>
        </div>
      )}

      {popups.length === 0 ? (
        <div className="bg-white rounded-xl border border-border p-8 text-center text-text-secondary">
          <Megaphone className="w-8 h-8 mx-auto mb-2 opacity-40" />
          No popups created yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {popups.map((p) => (
            <div key={p.id} className={`bg-white rounded-xl border overflow-hidden ${p.is_active ? 'border-green-300 ring-1 ring-green-200' : 'border-border'}`}>
              {p.image_url ? (
                <img src={p.image_url} alt="" className="w-full h-36 object-cover" />
              ) : (
                <div className="w-full h-24 bg-gray-100 flex items-center justify-center">
                  <Megaphone className="w-8 h-8 text-gray-300" />
                </div>
              )}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-sm font-semibold text-text-primary">{p.title}</h3>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 ${p.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {p.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                {p.description && <p className="text-xs text-text-secondary line-clamp-2 mb-3">{p.description}</p>}
                <div className="flex items-center gap-1.5">
                  <button onClick={() => handleToggle(p)} className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-medium ${p.is_active ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
                    {p.is_active ? <><EyeOff className="w-3 h-3" /> Deactivate</> : <><Eye className="w-3 h-3" /> Activate</>}
                  </button>
                  <button onClick={() => startEdit(p)} className="p-1.5 text-text-secondary hover:text-primary"><Edit2 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleDelete(p.id)} className="p-1.5 text-text-secondary hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
