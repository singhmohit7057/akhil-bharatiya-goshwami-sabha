import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Plus, Edit2, Trash2, Building2, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { BusinessListing } from '../../types'
import { Spinner } from '../../components/ui/Spinner'

export function CompanyMaster() {
  const [companies, setCompanies] = useState<BusinessListing[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<BusinessListing | null>(null)
  const [form, setForm] = useState({
    business_name: '', category: '', description_en: '', description_hi: '',
    address: '', city: '', state: '', phone: '', email: '', website: '',
  })

  useEffect(() => { fetchCompanies() }, [])

  async function fetchCompanies() {
    const { data } = await supabase.from('business_directory').select('*').order('business_name')
    setCompanies((data as BusinessListing[]) || [])
    setLoading(false)
  }

  function resetForm() {
    setForm({ business_name: '', category: '', description_en: '', description_hi: '', address: '', city: '', state: '', phone: '', email: '', website: '' })
    setEditing(null)
    setShowForm(false)
  }

  function startEdit(c: BusinessListing) {
    setForm({
      business_name: c.business_name, category: c.category,
      description_en: c.description_en || '', description_hi: c.description_hi || '',
      address: c.address || '', city: c.city || '', state: c.state || '',
      phone: c.phone || '', email: c.email || '', website: c.website || '',
    })
    setEditing(c)
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const payload = {
      ...form,
      description_en: form.description_en || null,
      description_hi: form.description_hi || null,
      address: form.address || null,
      city: form.city || null,
      state: form.state || null,
      phone: form.phone || null,
      email: form.email || null,
      website: form.website || null,
      is_approved: true,
    }

    if (editing) {
      const { error } = await supabase.from('business_directory').update(payload).eq('id', editing.id)
      if (error) { toast.error('Failed to update'); return }
      toast.success('Company updated')
    } else {
      const { error } = await supabase.from('business_directory').insert({ ...payload, user_id: (await supabase.auth.getUser()).data.user?.id })
      if (error) { toast.error('Failed to add'); return }
      toast.success('Company added')
    }
    resetForm()
    fetchCompanies()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this company?')) return
    await supabase.from('business_directory').delete().eq('id', id)
    toast.success('Company deleted')
    fetchCompanies()
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  const inputClass = 'w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm'

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Company Master</h1>
          <p className="text-sm text-text-secondary mt-1">Manage the master list of community businesses</p>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark">
            <Plus className="w-4 h-4" /> Add Company
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-border p-5 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium text-text-primary">{editing ? 'Edit Company' : 'Add Company'}</h3>
            <button onClick={resetForm}><X className="w-4 h-4 text-text-secondary" /></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input type="text" required placeholder="Company Name *" value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} className={inputClass} />
              <input type="text" required placeholder="Category *" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputClass} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input type="text" placeholder="Description (English)" value={form.description_en} onChange={(e) => setForm({ ...form, description_en: e.target.value })} className={inputClass} />
              <input type="text" placeholder="Description (Hindi)" value={form.description_hi} onChange={(e) => setForm({ ...form, description_hi: e.target.value })} className={inputClass} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input type="text" placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className={inputClass} />
              <input type="text" placeholder="State" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className={inputClass} />
              <input type="text" placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputClass} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} />
              <input type="text" placeholder="Website" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} className={inputClass} />
            </div>
            <button type="submit" className="px-5 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark">
              {editing ? 'Update' : 'Add'}
            </button>
          </form>
        </div>
      )}

      {companies.length === 0 ? (
        <div className="bg-white rounded-xl border border-border p-8 text-center text-text-secondary">
          <Building2 className="w-8 h-8 mx-auto mb-2 opacity-40" />
          No companies in master list yet.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-gray-50 text-left">
                  <th className="px-4 py-3 font-medium text-text-secondary">Company</th>
                  <th className="px-4 py-3 font-medium text-text-secondary">Category</th>
                  <th className="px-4 py-3 font-medium text-text-secondary">City</th>
                  <th className="px-4 py-3 font-medium text-text-secondary">Status</th>
                  <th className="px-4 py-3 font-medium text-text-secondary">Actions</th>
                </tr>
              </thead>
              <tbody>
                {companies.map((c) => (
                  <tr key={c.id} className="border-b border-border/50 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-text-primary">{c.business_name}</td>
                    <td className="px-4 py-3 text-text-secondary">{c.category}</td>
                    <td className="px-4 py-3 text-text-secondary">{c.city || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${c.is_approved ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                        {c.is_approved ? 'Approved' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => startEdit(c)} className="p-1.5 text-text-secondary hover:text-primary"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(c.id)} className="p-1.5 text-text-secondary hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
