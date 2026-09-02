import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'
import { Shield, ShieldCheck, Plus, Trash2, User } from 'lucide-react'
import { supabase } from '../../lib/supabase'

import { getRoleLabel } from '../../lib/utils'
import type { Profile, AdminLevel } from '../../types'
import { Spinner } from '../../components/ui/Spinner'

export function SubAdmins() {
  const [admins, setAdmins] = useState<Profile[]>([])
  const [, setAllMembers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('account_status', 'active')
      .order('full_name')
    const profiles = (data as Profile[]) || []
    setAdmins(profiles.filter((p) => p.admin_level !== 'none'))
    setAllMembers(profiles.filter((p) => p.admin_level === 'none'))
    setLoading(false)
  }

  async function handleChangeLevel(id: string, newLevel: AdminLevel) {
    const { error } = await supabase.from('profiles').update({ admin_level: newLevel }).eq('id', id)
    if (error) { toast.error('Failed'); return }
    toast.success('Updated')
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
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-4 h-4 text-amber-500" />
            <p className="text-xs text-text-secondary">Super Admins</p>
          </div>
          <p className="text-xl font-bold text-text-primary">{admins.filter((a) => a.admin_level === 'super_admin').length}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-4 h-4 text-blue-500" />
            <p className="text-xs text-text-secondary">Admins</p>
          </div>
          <p className="text-xl font-bold text-text-primary">{admins.filter((a) => a.admin_level === 'admin').length}</p>
        </div>
      </div>

      {admins.length === 0 ? (
        <div className="bg-white rounded-xl border border-border p-8 text-center text-text-secondary">No admins assigned yet.</div>
      ) : (
        <div className="space-y-3">
          {admins.map((admin) => (
            <div key={admin.id} className="bg-white rounded-xl border border-border p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                  {admin.profile_photo_url ? (
                    <img src={admin.profile_photo_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <User className="w-5 h-5 text-primary" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-text-primary text-sm">{admin.full_name}</p>
                  <p className="text-xs text-text-secondary">{admin.email} · {getRoleLabel(admin.role)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={admin.admin_level}
                  onChange={(e) => handleChangeLevel(admin.id, e.target.value as AdminLevel)}
                  className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium ${
                    admin.admin_level === 'super_admin'
                      ? 'bg-amber-50 border-amber-200 text-amber-700'
                      : 'bg-blue-50 border-blue-200 text-blue-700'
                  }`}
                >
                  <option value="super_admin">Super Admin</option>
                  <option value="admin">Admin</option>
                </select>
                <button onClick={() => handleChangeLevel(admin.id, 'none')} className="p-1.5 text-text-secondary hover:text-red-500" title="Remove admin access">
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
