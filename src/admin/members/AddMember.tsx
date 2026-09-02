import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { UserPlus } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { ALL_ROLES } from '../../types'
import type { MemberRole } from '../../types'

export function AddMember() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    full_name: '',
    full_name_hi: '',
    email: '',
    password: '',
    phone: '',
    gender: '',
    gotra: '',
    city: '',
    state: '',
    role: 'member' as MemberRole,
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { full_name: form.full_name } },
    })

    if (error) {
      toast.error(error.message || 'Failed to create account')
      setLoading(false)
      return
    }

    if (data.user) {
      await supabase.from('profiles').update({
        full_name: form.full_name,
        full_name_hi: form.full_name_hi || null,
        phone: form.phone || null,
        gender: form.gender || null,
        gotra: form.gotra || null,
        city: form.city || null,
        state: form.state || null,
        role: form.role,
        account_status: 'active',
        approved_by: user?.id,
        approved_at: new Date().toISOString(),
      }).eq('id', data.user.id)
    }

    toast.success(`Member "${form.full_name}" created and auto-approved`)
    navigate('/admin/members')
  }

  const inputClass = 'w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30'

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary mb-1">Add Member</h1>
      <p className="text-sm text-text-secondary mb-6">Create a new member account (auto-approved by admin)</p>

      <div className="bg-white rounded-xl border border-border p-5">
        <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg mb-5 text-xs text-green-700">
          <UserPlus className="w-4 h-4 shrink-0" />
          Members created by admin are auto-approved and can login immediately. No verification needed.
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">Full Name (English) *</label>
              <input type="text" required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">Full Name (Hindi)</label>
              <input type="text" value={form.full_name_hi} onChange={(e) => setForm({ ...form, full_name_hi: e.target.value })} className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">Email *</label>
              <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">Password *</label>
              <input type="password" required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">Phone</label>
              <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">Designation</label>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as MemberRole })} className={`${inputClass} bg-white`}>
                {ALL_ROLES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label_en}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">Gender</label>
              <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className={`${inputClass} bg-white`}>
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">Gotra</label>
              <input type="text" value={form.gotra} onChange={(e) => setForm({ ...form, gotra: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">City</label>
              <input type="text" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">State</label>
              <input type="text" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className={inputClass} />
            </div>
          </div>

          <button type="submit" disabled={loading} className="px-5 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark disabled:opacity-50">
            {loading ? '...' : 'Create Member'}
          </button>
        </form>
      </div>
    </div>
  )
}
