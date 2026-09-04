import { useState, useRef, useEffect } from 'react'
import toast from 'react-hot-toast'
import { Plus, Edit2, Trash2, X, Search } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { transliterateToHindi } from '../../lib/transliterate'
import { useDesignations } from '../../hooks/useDesignations'
import type { Designation } from '../../hooks/useDesignations'

function toSlug(str: string): string {
  return str.toLowerCase().trim().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
}

export function Designations() {
  const { isSuperAdmin } = useAuth()
  const superAdmin = isSuperAdmin()
  const { invalidateCache } = useDesignations()
  const [designations, setDesignations] = useState<Designation[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Designation | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name_en: '', name_hi: '', description: '', is_admin_role: false })
  const hiManuallyEdited = useRef(false)

  useEffect(() => { fetchDesignations() }, [])

  async function fetchDesignations() {
    const { data } = await supabase.from('designations').select('*').order('sort_order')
    setDesignations((data as Designation[]) || [])
    setLoading(false)
  }

  function resetForm() {
    setForm({ name_en: '', name_hi: '', description: '', is_admin_role: false })
    hiManuallyEdited.current = false
    setEditing(null)
    setShowForm(false)
  }

  function startEdit(d: Designation) {
    hiManuallyEdited.current = true
    setForm({ name_en: d.name_en, name_hi: d.name_hi || '', description: d.description || '', is_admin_role: d.is_admin_role })
    setEditing(d)
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    if (editing) {
      const { error } = await supabase.from('designations').update({
        name_en: form.name_en,
        name_hi: form.name_hi || null,
        description: form.description || null,
        is_admin_role: form.is_admin_role,
      }).eq('id', editing.id)
      if (error) { toast.error('Failed to update'); setSaving(false); return }
      toast.success('Designation updated')
    } else {
      const slug = toSlug(form.name_en)
      const maxOrder = Math.max(0, ...designations.map((d) => d.sort_order))
      const { error } = await supabase.from('designations').insert({
        name_en: form.name_en,
        name_hi: form.name_hi || null,
        description: form.description || null,
        slug,
        is_admin_role: form.is_admin_role,
        sort_order: maxOrder + 1,
      })
      if (error) { toast.error(error.message || 'Failed to add'); setSaving(false); return }
      toast.success('Designation added')
    }
    setSaving(false)
    invalidateCache()
    resetForm()
    fetchDesignations()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this designation?')) return
    const { error } = await supabase.from('designations').delete().eq('id', id)
    if (error) { toast.error('Failed to delete'); return }
    toast.success('Deleted')
    invalidateCache()
    fetchDesignations()
  }

  const filtered = designations.filter((d) =>
    !search || d.name_en.toLowerCase().includes(search.toLowerCase()) || d.name_hi?.includes(search)
  )

  const inputClass = 'w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30'

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Designation List</h1>
          <p className="text-sm text-text-secondary mt-0.5">Manage member designations / roles</p>
        </div>
        {superAdmin && !showForm && (
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark">
            <Plus className="w-4 h-4" /> Add Designation
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-border p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-text-primary">{editing ? 'Edit Designation' : 'Add Designation'}</h2>
            <button onClick={resetForm}><X className="w-4 h-4 text-text-secondary" /></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-text-primary mb-1">Designation Name (English) *</label>
                <input type="text" required value={form.name_en} onChange={(e) => {
                  const val = e.target.value
                  setForm((prev) => ({ ...prev, name_en: val, ...(hiManuallyEdited.current ? {} : { name_hi: transliterateToHindi(val) }) }))
                }} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-primary mb-1">Designation Name (Hindi)</label>
                <input type="text" value={form.name_hi} onChange={(e) => { hiManuallyEdited.current = true; setForm({ ...form, name_hi: e.target.value }) }} className={inputClass} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-text-primary mb-1">Description *</label>
                <input type="text" required placeholder="e.g. Board Member, General Member" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputClass} />
              </div>
              <div className="flex items-center gap-2 pt-5">
                <input type="checkbox" id="is_admin" checked={form.is_admin_role} onChange={(e) => setForm({ ...form, is_admin_role: e.target.checked })} className="w-4 h-4 accent-primary" />
                <label htmlFor="is_admin" className="text-sm text-text-primary">Governing Role <span className="text-xs text-text-secondary">(shown as board member)</span></label>
              </div>
            </div>
            <button type="submit" disabled={saving} className="px-5 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark disabled:opacity-50">
              {saving ? '...' : editing ? 'Update' : 'Add'}
            </button>
          </form>
        </div>
      )}

      {/* Search */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-text-secondary">Showing <strong>{filtered.length}</strong> designations</p>
        <div className="relative w-60">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-secondary" />
          <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-gray-50 text-left">
                <th className="px-4 py-3 font-medium text-text-secondary">#</th>
                <th className="px-4 py-3 font-medium text-text-secondary">English Name</th>
                <th className="px-4 py-3 font-medium text-text-secondary">Hindi Name</th>
                <th className="px-4 py-3 font-medium text-text-secondary">Description</th>
                <th className="px-4 py-3 font-medium text-text-secondary">Type</th>
                {superAdmin && <th className="px-4 py-3 font-medium text-text-secondary">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-10 text-text-secondary">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10 text-text-secondary">No designations found</td></tr>
              ) : filtered.map((d, i) => (
                <tr key={d.id} className="border-b border-border hover:bg-gray-50">
                  <td className="px-4 py-3 text-text-secondary">{i + 1}</td>
                  <td className="px-4 py-3 font-medium text-text-primary">{d.name_en}</td>
                  <td className="px-4 py-3 text-text-secondary">{d.name_hi || '—'}</td>
                  <td className="px-4 py-3 text-text-secondary">{d.description || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${d.is_admin_role ? 'bg-orange-50 text-orange-600' : 'bg-gray-100 text-gray-600'}`}>
                      {d.is_admin_role ? 'Governing' : 'Member'}
                    </span>
                  </td>
                  {superAdmin && (
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => startEdit(d)} className="text-primary hover:text-primary-dark"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(d.id)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
