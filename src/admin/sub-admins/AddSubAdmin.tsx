import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ShieldCheck, User } from 'lucide-react'
import { supabase } from '../../lib/supabase'

import { getRoleLabel } from '../../lib/utils'
import type { Profile, AdminLevel } from '../../types'
import { Spinner } from '../../components/ui/Spinner'

export function AddSubAdmin() {
  const navigate = useNavigate()
  const [members, setMembers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMember, setSelectedMember] = useState('')
  const [selectedLevel, setSelectedLevel] = useState<AdminLevel>('admin')

  useEffect(() => {
    supabase
      .from('profiles')
      .select('*')
      .eq('account_status', 'active')
      .eq('admin_level', 'none')
      .order('full_name')
      .then(({ data }) => {
        setMembers((data as Profile[]) || [])
        setLoading(false)
      })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedMember) return

    const { error } = await supabase.from('profiles').update({ admin_level: selectedLevel }).eq('id', selectedMember)
    if (error) { toast.error('Failed'); return }
    toast.success('Admin role assigned')
    navigate('/admin/sub-admins')
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  const selected = members.find((m) => m.id === selectedMember)

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary mb-1">Add Sub-Admin</h1>
      <p className="text-sm text-text-secondary mb-6">Select a member and assign admin access level</p>

      <div className="bg-white rounded-xl border border-border p-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-text-primary mb-1">Select Member *</label>
            <select
              required
              value={selectedMember}
              onChange={(e) => setSelectedMember(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">Choose a member...</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>{m.full_name} — {getRoleLabel(m.role)} ({m.email})</option>
              ))}
            </select>
          </div>

          {selected && (
            <div className="flex items-center gap-3 p-3 bg-surface rounded-lg">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                {selected.profile_photo_url ? (
                  <img src={selected.profile_photo_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <User className="w-5 h-5 text-primary" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">{selected.full_name}</p>
                <p className="text-xs text-text-secondary">{selected.email} · {getRoleLabel(selected.role)} · {selected.city || ''}</p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-text-primary mb-1">Admin Level *</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setSelectedLevel('admin')}
                className={`flex-1 p-4 rounded-xl border text-left transition-colors ${
                  selectedLevel === 'admin' ? 'border-blue-300 bg-blue-50' : 'border-border hover:border-blue-200'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <p className="text-sm font-semibold text-text-primary">Admin</p>
                </div>
                <p className="text-xs text-text-secondary">Can view all data in admin panel. Cannot edit, delete, or approve.</p>
              </button>
              <button
                type="button"
                onClick={() => setSelectedLevel('super_admin')}
                className={`flex-1 p-4 rounded-xl border text-left transition-colors ${
                  selectedLevel === 'super_admin' ? 'border-amber-300 bg-amber-50' : 'border-border hover:border-amber-200'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  <p className="text-sm font-semibold text-text-primary">Super Admin</p>
                </div>
                <p className="text-xs text-text-secondary">Full access — can edit, delete, approve, assign roles, manage admins.</p>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={!selectedMember}
            className="px-5 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark disabled:opacity-50"
          >
            Assign Admin Access
          </button>
        </form>
      </div>
    </div>
  )
}
