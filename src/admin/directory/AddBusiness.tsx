import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { User, Globe, GlobeOff, Plus, Trash2, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { getRoleLabel } from '../../lib/utils'
import type { Profile } from '../../types'
import { Spinner } from '../../components/ui/Spinner'

interface Branch {
  id: string
  name: string
  address: string
  city: string
  phone: string
}

export function AddBusiness() {
  const navigate = useNavigate()
  const [members, setMembers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [branches, setBranches] = useState<Branch[]>([])
  const [showBranch, setShowBranch] = useState(false)
  const [branchForm, setBranchForm] = useState({ name: '', address: '', city: '', phone: '' })
  const [form, setForm] = useState({
    user_id: '',
    business_name: '',
    sector: '',
    designation: '',
    gst_number: '',
    category: '',
    description: '',
    address: '',
    city: '',
    state: '',
    phone: '',
    email: '',
    has_website: false,
    website: '',
  })

  useEffect(() => {
    supabase.from('profiles').select('*').eq('account_status', 'active').order('full_name')
      .then(({ data }) => { setMembers((data as Profile[]) || []); setLoading(false) })
  }, [])

  const selected = members.find((m) => m.id === form.user_id)

  function addBranch(e: React.FormEvent) {
    e.preventDefault()
    if (!branchForm.name || !branchForm.address) return
    setBranches([...branches, { id: crypto.randomUUID(), ...branchForm }])
    setBranchForm({ name: '', address: '', city: '', phone: '' })
    setShowBranch(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    const { error } = await supabase.from('business_directory').insert({
      user_id: form.user_id,
      business_name: form.business_name,
      category: form.category || form.sector,
      description_en: form.description || null,
      designation: form.designation || null,
      gst_number: form.gst_number || null,
      address: form.address || null,
      city: form.city || null,
      state: form.state || null,
      phone: form.phone || null,
      email: form.email || null,
      website: form.has_website ? (form.website || null) : null,
      branches: branches.length > 0 ? branches : [],
      is_approved: true,
      is_active: true,
    })

    if (error) { toast.error('Failed'); setSaving(false); return }
    toast.success('Business added')
    navigate('/admin/business')
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  const inputClass = 'w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30'

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary mb-1">Add Business</h1>
      <p className="text-sm text-text-secondary mb-6">Add a new business to the directory</p>

      <div className="space-y-4">
        <div className="bg-white rounded-xl border border-border p-5">
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Owner */}
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">Business Owner (Member) *</label>
              <select required value={form.user_id} onChange={(e) => setForm({ ...form, user_id: e.target.value })} className={`${inputClass} bg-white`}>
                <option value="">Choose member...</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>{m.full_name} — {getRoleLabel(m.role)}</option>
                ))}
              </select>
            </div>

            {selected && (
              <div className="flex items-center gap-3 p-3 bg-surface rounded-lg">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                  {selected.profile_photo_url ? (
                    <img src={selected.profile_photo_url} alt="" className="w-9 h-9 rounded-full object-cover" />
                  ) : (
                    <User className="w-4 h-4 text-primary" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">{selected.full_name}</p>
                  <p className="text-xs text-text-secondary">{selected.email} · {selected.city}</p>
                </div>
              </div>
            )}

            {/* Business Info — same order as profile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-text-primary mb-1">Business Name *</label>
                <input type="text" required value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-primary mb-1">Industry / Sector *</label>
                <input type="text" required placeholder="e.g. Retail, IT, Healthcare" value={form.sector} onChange={(e) => setForm({ ...form, sector: e.target.value })} className={inputClass} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-text-primary mb-1">Designation / Role</label>
                <input type="text" placeholder="e.g. Owner, MD, Partner" value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-primary mb-1">GST Number</label>
                <input type="text" placeholder="e.g. 19AABCG1234A1Z5" maxLength={15} value={form.gst_number} onChange={(e) => setForm({ ...form, gst_number: e.target.value.toUpperCase() })} className={inputClass} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">Address</label>
              <input type="text" placeholder="e.g. 12, MG Road" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={inputClass} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-text-primary mb-1">City</label>
                <input type="text" placeholder="e.g. Kolkata" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-primary mb-1">State</label>
                <input type="text" placeholder="e.g. West Bengal" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-primary mb-1">Phone</label>
                <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputClass} />
              </div>
            </div>

            {/* Website toggle */}
            <div>
              <label className="block text-xs font-medium text-text-primary mb-2">Website Available?</label>
              <div className="flex gap-3 mb-2">
                <button type="button" onClick={() => setForm({ ...form, has_website: true })}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${form.has_website ? 'bg-green-50 text-green-700 border-green-300' : 'border-border text-text-secondary'}`}>
                  <Globe className="w-4 h-4" /> Yes
                </button>
                <button type="button" onClick={() => setForm({ ...form, has_website: false, website: '' })}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${!form.has_website ? 'bg-gray-50 text-text-primary border-gray-300' : 'border-border text-text-secondary'}`}>
                  <GlobeOff className="w-4 h-4" /> No
                </button>
              </div>
              {form.has_website && (
                <input type="url" placeholder="https://www.business.com" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} className={inputClass} />
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">Description</label>
              <textarea placeholder="What does this business do..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className={inputClass} />
            </div>

            <button type="submit" disabled={saving} className="px-5 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark disabled:opacity-50">
              {saving ? '...' : 'Add Business'}
            </button>
          </form>
        </div>

        {/* Branches */}
        <div className="bg-white rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-text-primary">Branches</h3>
              <p className="text-xs text-text-secondary">Add multiple branch locations (optional)</p>
            </div>
            {!showBranch && (
              <button type="button" onClick={() => setShowBranch(true)} className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-medium hover:bg-primary-dark">
                <Plus className="w-3.5 h-3.5" /> Add Branch
              </button>
            )}
          </div>

          {showBranch && (
            <form onSubmit={addBranch} className="bg-surface rounded-lg p-3 mb-3 space-y-2">
              <div className="flex justify-between items-center">
                <p className="text-xs font-medium text-text-primary">New Branch</p>
                <button type="button" onClick={() => setShowBranch(false)}><X className="w-3.5 h-3.5 text-text-secondary" /></button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input type="text" required placeholder="Branch Name *" value={branchForm.name} onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })} className={inputClass} />
                <input type="text" placeholder="City" value={branchForm.city} onChange={(e) => setBranchForm({ ...branchForm, city: e.target.value })} className={inputClass} />
              </div>
              <input type="text" required placeholder="Address *" value={branchForm.address} onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })} className={inputClass} />
              <input type="tel" placeholder="Phone" value={branchForm.phone} onChange={(e) => setBranchForm({ ...branchForm, phone: e.target.value })} className={inputClass} />
              <button type="submit" className="px-4 py-1.5 bg-primary text-white rounded-lg text-xs font-medium hover:bg-primary-dark">Add</button>
            </form>
          )}

          {branches.length === 0 ? (
            <p className="text-xs text-text-secondary text-center py-4">No branches added.</p>
          ) : (
            <div className="space-y-2">
              {branches.map((b, i) => (
                <div key={b.id} className="flex items-start justify-between p-3 bg-surface rounded-lg">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">#{i + 1}</span>
                      <p className="text-sm font-medium text-text-primary">{b.name}</p>
                    </div>
                    <p className="text-xs text-text-secondary mt-0.5">{b.address}{b.city ? `, ${b.city}` : ''}{b.phone ? ` · ${b.phone}` : ''}</p>
                  </div>
                  <button type="button" onClick={() => setBranches(branches.filter((x) => x.id !== b.id))} className="p-1 text-text-secondary hover:text-red-500">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
