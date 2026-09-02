import { useState } from 'react'
import toast from 'react-hot-toast'
import { Plus, Edit2, Trash2, X, Search } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { ALL_ROLES } from '../../types'

interface Designation {
  id: number
  name: string
  name_hi: string
  description: string
}

const INITIAL_DESIGNATIONS: Designation[] = ALL_ROLES.map((r, i) => ({
  id: i + 1,
  name: r.label_en,
  name_hi: r.label_hi,
  description: ['president', 'vice_president', 'chairman', 'vice_chairman', 'working_president', 'joint_working_president', 'secretary', 'joint_secretary', 'treasurer', 'joint_treasurer', 'deputy_chairman', 'coordinator'].includes(r.value)
    ? 'Board Member'
    : r.value === 'member' ? 'General Member'
    : r.value === 'executive_member' ? 'Executive Member (Paid)'
    : r.value === 'mentor' ? 'Advisory Role'
    : 'Special Role',
}))

export function Designations() {
  const { isSuperAdmin } = useAuth()
  const superAdmin = isSuperAdmin()
  const [designations, setDesignations] = useState<Designation[]>(INITIAL_DESIGNATIONS)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Designation | null>(null)
  const [form, setForm] = useState({ name: '', name_hi: '', description: '' })

  function resetForm() {
    setForm({ name: '', name_hi: '', description: '' })
    setEditing(null)
    setShowForm(false)
  }

  function startEdit(d: Designation) {
    setForm({ name: d.name, name_hi: d.name_hi, description: d.description })
    setEditing(d)
    setShowForm(true)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (editing) {
      setDesignations(designations.map((d) => d.id === editing.id ? { ...d, ...form } : d))
      toast.success('Designation updated')
    } else {
      setDesignations([...designations, { id: designations.length + 1, ...form }])
      toast.success('Designation added')
    }
    resetForm()
  }

  function handleDelete(id: number) {
    if (!confirm('Delete this designation?')) return
    setDesignations(designations.filter((d) => d.id !== id))
    toast.success('Designation deleted')
  }

  const filtered = designations.filter((d) =>
    !search || d.name.toLowerCase().includes(search.toLowerCase()) || d.description.toLowerCase().includes(search.toLowerCase())
  )

  const inputClass = 'w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30'

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Designation List</h1>
          <p className="text-sm text-text-secondary mt-1">Table to display all designation list</p>
        </div>
        {superAdmin && !showForm && (
          <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark">
            <Plus className="w-4 h-4" /> Add New
          </button>
        )}
      </div>

      {/* Add/Edit Form */}
      {showForm && superAdmin && (
        <div className="bg-white rounded-xl border border-border p-5 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-semibold text-text-primary">{editing ? 'Edit Designation' : 'Add Designation'}</h3>
            <button onClick={resetForm}><X className="w-4 h-4 text-text-secondary" /></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-text-primary mb-1">Designation Name (English) *</label>
                <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-primary mb-1">Designation Name (Hindi)</label>
                <input type="text" value={form.name_hi} onChange={(e) => setForm({ ...form, name_hi: e.target.value })} className={inputClass} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">Description *</label>
              <input type="text" required placeholder="e.g. Board Member, General Member" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputClass} />
            </div>
            <button type="submit" className="px-5 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark">
              {editing ? 'Update' : 'Add'}
            </button>
          </form>
        </div>
      )}

      {/* Search */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-text-secondary">Show <strong>{filtered.length}</strong> entries</p>
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
                <th className="px-4 py-3 font-medium text-text-secondary w-16">SL NO</th>
                <th className="px-4 py-3 font-medium text-text-secondary">DESIGNATION</th>
                <th className="px-4 py-3 font-medium text-text-secondary">HINDI</th>
                <th className="px-4 py-3 font-medium text-text-secondary">DESCRIPTION</th>
                {superAdmin && <th className="px-4 py-3 font-medium text-text-secondary w-24">ACTION</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((d, i) => (
                <tr key={d.id} className="border-b border-border/50 hover:bg-gray-50">
                  <td className="px-4 py-3 text-text-primary">{i + 1}</td>
                  <td className="px-4 py-3 font-medium text-text-primary">{d.name}</td>
                  <td className="px-4 py-3 text-text-secondary">{d.name_hi}</td>
                  <td className="px-4 py-3 text-text-secondary">{d.description}</td>
                  {superAdmin && (
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => startEdit(d)} className="p-1.5 text-text-secondary hover:text-primary"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(d.id)} className="p-1.5 text-text-secondary hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <p className="text-center py-8 text-text-secondary">No designations found.</p>
        )}
      </div>
    </div>
  )
}
