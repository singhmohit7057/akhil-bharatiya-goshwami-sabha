import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ShieldCheck, Eye, User } from 'lucide-react'
import { MemberSelect } from '../../components/ui/MemberSelect'
import { supabase, supabaseAdmin } from '../../lib/supabase'
import { logAction } from '../../lib/adminLog'
import { getRoleLabel } from '../../lib/utils'
import type { Profile, AdminLevel } from '../../types'
import { ADMIN_PERMISSIONS } from '../../types'
import { Spinner } from '../../components/ui/Spinner'

export function AddSubAdmin() {
  const navigate = useNavigate()
  const [members, setMembers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMember, setSelectedMember] = useState('')
  const [selectedLevel, setSelectedLevel] = useState<AdminLevel>('admin')
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    // Show all active members so existing admins can be reassigned
    supabase.from('profiles').select('*').eq('account_status', 'active').order('full_name')
      .then(({ data }) => { setMembers((data as Profile[]) || []); setLoading(false) })
  }, [])

  function togglePerm(key: string) {
    setSelectedPermissions((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedMember) return
    setError('')
    setSaving(true)

    const updateData: any = { admin_level: selectedLevel }
    if (selectedLevel === 'admin') updateData.admin_permissions = selectedPermissions

    const { error: err } = await supabaseAdmin.from('profiles').update(updateData).eq('id', selectedMember)
    setSaving(false)
    if (err) {
      setError(`Failed to assign access: ${err.message}`)
      return
    }
    const member = members.find((m) => m.id === selectedMember)
    logAction('create', 'sub-admin', member?.full_name || selectedMember, selectedMember, `Level: ${selectedLevel}`)
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
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Member Select */}
          <div>
            <label className="block text-xs font-medium text-text-primary mb-1">Select Member *</label>
            <MemberSelect
              members={members.map(m => ({ id: m.id, full_name: m.full_name, role: m.role, email: m.email, phone: (m as any).phone }))}
              value={selectedMember}
              onChange={(id) => setSelectedMember(id)}
              placeholder="Choose a member..."
              required
            />
          </div>

          {selected && (
            <div className="flex items-center gap-3 p-3 bg-surface rounded-lg">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                {selected.profile_photo_url ? (
                  <img src={selected.profile_photo_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                ) : <User className="w-5 h-5 text-primary" />}
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">{selected.full_name}</p>
                <p className="text-xs text-text-secondary">{selected.email} · {getRoleLabel(selected.role)}</p>
              </div>
            </div>
          )}

          {/* Role Selector */}
          <div>
            <label className="block text-xs font-medium text-text-primary mb-2">Access Level *</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Admin */}
              <button type="button" onClick={() => setSelectedLevel('admin')}
                className={`p-4 rounded-xl border text-left transition-colors ${selectedLevel === 'admin' ? 'border-blue-400 bg-blue-50' : 'border-border hover:border-blue-200'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <p className="text-sm font-bold text-text-primary">Admin</p>
                </div>
                <p className="text-[11px] text-text-secondary">Assigned permissions only. No delete or super actions.</p>
              </button>

              {/* Viewer */}
              <button type="button" onClick={() => setSelectedLevel('viewer')}
                className={`p-4 rounded-xl border text-left transition-colors ${selectedLevel === 'viewer' ? 'border-gray-400 bg-gray-50' : 'border-border hover:border-gray-300'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <Eye className="w-4 h-4 text-gray-500" />
                  <p className="text-sm font-bold text-text-primary">Viewer</p>
                </div>
                <p className="text-[11px] text-text-secondary">Read-only. Can see everything but cannot add, edit or delete anything.</p>
              </button>

              {/* Super Admin */}
              <button type="button" onClick={() => setSelectedLevel('super_admin')}
                className={`p-4 rounded-xl border text-left transition-colors ${selectedLevel === 'super_admin' ? 'border-amber-400 bg-amber-50' : 'border-border hover:border-amber-200'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  <p className="text-sm font-bold text-text-primary">Super Admin</p>
                </div>
                <p className="text-[11px] text-text-secondary">Full access — all features including delete and admin management.</p>
              </button>
            </div>
          </div>

          {/* Permission checkboxes — only for Admin level */}
          {selectedLevel === 'admin' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-text-primary">Assign Permissions</label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setSelectedPermissions(ADMIN_PERMISSIONS.map(p => p.key))}
                    className="text-[10px] text-primary hover:underline">Select All</button>
                  <span className="text-gray-300">·</span>
                  <button type="button" onClick={() => setSelectedPermissions([])}
                    className="text-[10px] text-text-secondary hover:underline">Clear</button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {ADMIN_PERMISSIONS.map((perm) => (
                  <label key={perm.key}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedPermissions.includes(perm.key) ? 'border-blue-300 bg-blue-50' : 'border-border hover:bg-gray-50'
                    }`}>
                    <input type="checkbox" checked={selectedPermissions.includes(perm.key)}
                      onChange={() => togglePerm(perm.key)}
                      className="mt-0.5 accent-primary w-4 h-4 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-text-primary">{perm.label}</p>
                      <p className="text-[10px] text-text-secondary">{perm.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
              {selectedPermissions.length === 0 && (
                <p className="text-[11px] text-amber-600 mt-2">⚠ No permissions selected — this admin can only view the dashboard.</p>
              )}
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <button type="submit" disabled={!selectedMember || saving}
            className="px-5 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark disabled:opacity-50">
            {saving ? 'Assigning...' : `Assign ${selectedLevel === 'admin' ? 'Admin' : selectedLevel === 'viewer' ? 'Viewer' : 'Super Admin'} Access`}
          </button>
        </form>
      </div>
    </div>
  )
}
