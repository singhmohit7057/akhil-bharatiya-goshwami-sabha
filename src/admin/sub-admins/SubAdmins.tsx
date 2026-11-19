import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'
import { Shield, ShieldCheck, Plus, Trash2, User, Eye, Pencil, X, Check } from 'lucide-react'
import { supabase, supabaseAdmin } from '../../lib/supabase'
import { logAction } from '../../lib/adminLog'
import { getRoleLabel } from '../../lib/utils'
import type { Profile, AdminLevel } from '../../types'
import { ADMIN_PERMISSIONS } from '../../types'
import { Spinner } from '../../components/ui/Spinner'

export function SubAdmins() {
  const [admins, setAdmins] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [editTarget, setEditTarget] = useState<Profile | null>(null)
  const [editPerms, setEditPerms] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('account_status', 'active')
      .order('full_name')
    const profiles = (data as Profile[]) || []
    setAdmins(profiles.filter((p) => p.admin_level !== 'none'))
    setLoading(false)
  }

  async function handleChangeLevel(id: string, newLevel: AdminLevel) {
    const { error } = await supabaseAdmin.from('profiles').update({ admin_level: newLevel }).eq('id', id)
    if (error) { toast.error('Failed'); return }
    const admin = admins.find((a) => a.id === id)
    logAction(newLevel === 'none' ? 'delete' : 'update', 'sub-admin', admin?.full_name || id, id)
    toast.success('Updated')
    fetchData()
  }

  function openEdit(admin: Profile) {
    setEditTarget(admin)
    setEditPerms((admin as any).admin_permissions || [])
  }

  function togglePerm(key: string) {
    setEditPerms(prev => prev.includes(key) ? prev.filter(p => p !== key) : [...prev, key])
  }

  async function savePerms() {
    if (!editTarget) return
    setSaving(true)
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ admin_permissions: editPerms })
      .eq('id', editTarget.id)
    setSaving(false)
    if (error) { toast.error('Failed: ' + error.message); return }
    logAction('update', 'sub-admin', editTarget.full_name || editTarget.id, editTarget.id, `Permissions: ${editPerms.join(', ')}`)
    toast.success('Permissions saved')
    setEditTarget(null)
    fetchData()
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Admin Management</h1>
          <p className="text-sm text-text-secondary mt-1">Manage who has access to the admin panel</p>
        </div>
        <Link to="/admin/sub-admins/add" className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark">
          <Plus className="w-4 h-4" /> Add Admin
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-1"><ShieldCheck className="w-4 h-4 text-amber-500" /><p className="text-xs text-text-secondary">Super Admins</p></div>
          <p className="text-xl font-bold text-text-primary">{admins.filter(a => a.admin_level === 'super_admin').length}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-1"><Shield className="w-4 h-4 text-blue-500" /><p className="text-xs text-text-secondary">Admins</p></div>
          <p className="text-xl font-bold text-text-primary">{admins.filter(a => a.admin_level === 'admin').length}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-1"><Eye className="w-4 h-4 text-gray-500" /><p className="text-xs text-text-secondary">Viewers</p></div>
          <p className="text-xl font-bold text-text-primary">{admins.filter(a => a.admin_level === 'viewer').length}</p>
        </div>
      </div>

      {admins.length === 0 ? (
        <div className="bg-white rounded-xl border border-border p-8 text-center text-text-secondary">No admins assigned yet.</div>
      ) : (
        <div className="space-y-3">
          {admins.map((admin) => (
            <div key={admin.id} className="bg-white rounded-xl border border-border p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
                  {admin.profile_photo_url
                    ? <img src={admin.profile_photo_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                    : <User className="w-5 h-5 text-primary" />}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-text-primary text-sm truncate">{admin.full_name}</p>
                  <p className="text-xs text-text-secondary truncate">{admin.email} · {getRoleLabel(admin.role)}</p>
                  {admin.admin_level === 'admin' && (
                    <p className="text-[10px] text-blue-600 mt-0.5">
                      {((admin as any).admin_permissions?.length ?? 0) > 0
                        ? `Permissions: ${(admin as any).admin_permissions.join(', ')}`
                        : 'No permissions assigned'}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {admin.admin_level === 'admin' && (
                  <button
                    onClick={() => openEdit(admin)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" /> Edit Permissions
                  </button>
                )}
                <select
                  value={admin.admin_level}
                  onChange={(e) => handleChangeLevel(admin.id, e.target.value as AdminLevel)}
                  className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium ${
                    admin.admin_level === 'super_admin' ? 'bg-amber-50 border-amber-200 text-amber-700'
                    : admin.admin_level === 'viewer' ? 'bg-gray-50 border-gray-300 text-gray-600'
                    : 'bg-blue-50 border-blue-200 text-blue-700'
                  }`}
                >
                  <option value="super_admin">Super Admin</option>
                  <option value="admin">Admin</option>
                  <option value="viewer">Viewer</option>
                </select>
                <button onClick={() => handleChangeLevel(admin.id, 'none')} className="p-1.5 text-text-secondary hover:text-red-500" title="Remove admin access">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Permissions Modal */}
      {editTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 overflow-hidden flex items-center justify-center shrink-0">
                  {editTarget.profile_photo_url
                    ? <img src={editTarget.profile_photo_url} alt="" className="w-9 h-9 rounded-full object-cover" />
                    : <User className="w-4 h-4 text-primary" />}
                </div>
                <div>
                  <p className="font-semibold text-text-primary text-sm">{editTarget.full_name}</p>
                  <p className="text-xs text-text-secondary">Edit admin permissions</p>
                </div>
              </div>
              <button onClick={() => setEditTarget(null)} className="p-2 rounded-lg hover:bg-gray-100">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* Permissions */}
            <div className="p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-text-primary">Assign Permissions</p>
                <div className="flex gap-2">
                  <button onClick={() => setEditPerms(ADMIN_PERMISSIONS.map(p => p.key))} className="text-[10px] text-primary hover:underline">Select All</button>
                  <span className="text-gray-300">·</span>
                  <button onClick={() => setEditPerms([])} className="text-[10px] text-text-secondary hover:underline">Clear</button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
                {ADMIN_PERMISSIONS.map((perm) => (
                  <label key={perm.key}
                    className={`flex items-center gap-2.5 p-3 rounded-lg border cursor-pointer transition-colors ${
                      editPerms.includes(perm.key) ? 'border-blue-300 bg-blue-50' : 'border-border hover:bg-gray-50'
                    }`}>
                    <input type="checkbox" checked={editPerms.includes(perm.key)}
                      onChange={() => togglePerm(perm.key)}
                      className="accent-primary w-4 h-4 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-text-primary">{perm.label}</p>
                      <p className="text-[10px] text-text-secondary">{perm.desc}</p>
                    </div>
                  </label>
                ))}
              </div>

              {editPerms.length === 0 && (
                <p className="text-[11px] text-amber-600 mt-2">⚠ No permissions selected — this admin can only view the dashboard.</p>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 px-5 pb-5">
              <button onClick={() => setEditTarget(null)} className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={savePerms} disabled={saving}
                className="flex items-center gap-1.5 px-5 py-2 text-sm bg-primary text-white rounded-lg font-medium hover:bg-primary-dark disabled:opacity-60">
                {saving ? <Spinner className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                Save Permissions
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
