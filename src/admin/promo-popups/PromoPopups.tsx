import { useState } from 'react'
import toast from 'react-hot-toast'
import { Plus, Megaphone, Eye, EyeOff, Trash2, X } from 'lucide-react'

interface PromoPopup {
  id: string
  title: string
  message: string
  link: string
  is_active: boolean
  created_at: string
}

export function PromoPopups() {
  const [popups, setPopups] = useState<PromoPopup[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', message: '', link: '' })

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const newPopup: PromoPopup = {
      id: crypto.randomUUID(),
      title: form.title,
      message: form.message,
      link: form.link,
      is_active: true,
      created_at: new Date().toISOString(),
    }
    setPopups([newPopup, ...popups])
    setForm({ title: '', message: '', link: '' })
    setShowForm(false)
    toast.success('Promo popup created')
  }

  function toggleActive(id: string) {
    setPopups(popups.map((p) => p.id === id ? { ...p, is_active: !p.is_active } : p))
    toast.success('Status updated')
  }

  function handleDelete(id: string) {
    if (!confirm('Delete this popup?')) return
    setPopups(popups.filter((p) => p.id !== id))
    toast.success('Popup deleted')
  }

  const inputClass = 'w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm'

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Promo Popups</h1>
          <p className="text-sm text-text-secondary mt-1">Create and manage promotional popups for the website</p>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark">
            <Plus className="w-4 h-4" /> Create Popup
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-border p-5 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium text-text-primary">New Promo Popup</h3>
            <button onClick={() => setShowForm(false)}><X className="w-4 h-4 text-text-secondary" /></button>
          </div>
          <form onSubmit={handleAdd} className="space-y-3">
            <input type="text" required placeholder="Popup Title *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputClass} />
            <textarea required placeholder="Message *" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={3} className={inputClass} />
            <input type="url" placeholder="Link URL (optional)" value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} className={inputClass} />
            <button type="submit" className="px-5 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark">Create</button>
          </form>
        </div>
      )}

      {popups.length === 0 ? (
        <div className="bg-white rounded-xl border border-border p-8 text-center text-text-secondary">
          <Megaphone className="w-8 h-8 mx-auto mb-2 opacity-40" />
          No promotional popups created yet.
        </div>
      ) : (
        <div className="space-y-3">
          {popups.map((popup) => (
            <div key={popup.id} className="bg-white rounded-xl border border-border p-4 flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-text-primary">{popup.title}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${popup.is_active ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                    {popup.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-sm text-text-secondary mt-1">{popup.message}</p>
                {popup.link && <p className="text-xs text-primary mt-1">{popup.link}</p>}
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => toggleActive(popup.id)} className="p-1.5 text-text-secondary hover:text-primary">
                  {popup.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button onClick={() => handleDelete(popup.id)} className="p-1.5 text-text-secondary hover:text-red-500">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
