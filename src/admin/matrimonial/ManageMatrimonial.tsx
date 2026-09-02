import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { Check, X, Eye, Edit2, Search, User } from 'lucide-react'

import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { calculateAge } from '../../lib/utils'
import type { MatrimonialProfile, Profile } from '../../types'
import { Spinner } from '../../components/ui/Spinner'

interface MpWithProfile extends MatrimonialProfile {
  profiles: Pick<Profile, 'full_name' | 'email' | 'city' | 'gender' | 'date_of_birth' | 'profile_photo_url'>
}

export function ManageMatrimonial() {
  const { } = useTranslation('admin')
  const { isSuperAdmin } = useAuth()
  const superAdmin = isSuperAdmin()
  const [profiles, setProfiles] = useState<MpWithProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    fetchProfiles()
  }, [])

  async function fetchProfiles() {
    const { data } = await supabase
      .from('matrimonial_profiles')
      .select('*, profiles(full_name, email, city, gender, date_of_birth, profile_photo_url)')
      .order('created_at', { ascending: false })
    setProfiles((data as MpWithProfile[]) || [])
    setLoading(false)
  }

  async function handleToggleActive(id: string, currentActive: boolean) {
    await supabase.from('matrimonial_profiles').update({ is_active: !currentActive }).eq('id', id)
    toast.success(currentActive ? 'Profile hidden from public' : 'Profile visible to public')
    fetchProfiles()
  }

  const filtered = profiles.filter((mp) => {
    const matchSearch = !search || mp.profiles?.full_name?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = !statusFilter ||
      (statusFilter === 'male' && mp.is_active && mp.profiles?.gender === 'male') ||
      (statusFilter === 'female' && mp.is_active && mp.profiles?.gender === 'female') ||
      (statusFilter === 'inactive' && !mp.is_active)
    return matchSearch && matchStatus
  })

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  const total = profiles.length
  const activeMale = profiles.filter((p) => p.is_active && p.profiles?.gender === 'male').length
  const activeFemale = profiles.filter((p) => p.is_active && p.profiles?.gender === 'female').length
  const inactive = profiles.filter((p) => !p.is_active).length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Matrimonials</h1>
          <p className="text-sm text-text-secondary mt-1">Manage all matrimonial profiles</p>
        </div>
        {superAdmin && (
          <Link to="/admin/matrimonial/add" className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark">
            + Add Profile
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <button onClick={() => setStatusFilter('')}
          className={`bg-white rounded-xl border p-3 text-left transition-colors ${!statusFilter ? 'border-primary bg-primary/5' : 'border-border'}`}>
          <p className="text-xl font-bold text-text-primary">{total}</p>
          <p className="text-xs text-primary">Total Profiles</p>
        </button>
        <button onClick={() => setStatusFilter(statusFilter === 'male' ? '' : 'male')}
          className={`bg-white rounded-xl border p-3 text-left transition-colors ${statusFilter === 'male' ? 'border-blue-300 bg-blue-50' : 'border-border'}`}>
          <p className="text-xl font-bold text-text-primary">{activeMale}</p>
          <p className="text-xs text-blue-600">Active Male</p>
        </button>
        <button onClick={() => setStatusFilter(statusFilter === 'female' ? '' : 'female')}
          className={`bg-white rounded-xl border p-3 text-left transition-colors ${statusFilter === 'female' ? 'border-pink-300 bg-pink-50' : 'border-border'}`}>
          <p className="text-xl font-bold text-text-primary">{activeFemale}</p>
          <p className="text-xs text-pink-600">Active Female</p>
        </button>
        <button onClick={() => setStatusFilter(statusFilter === 'inactive' ? '' : 'inactive')}
          className={`bg-white rounded-xl border p-3 text-left transition-colors ${statusFilter === 'inactive' ? 'border-red-300 bg-red-50' : 'border-border'}`}>
          <p className="text-xl font-bold text-text-primary">{inactive}</p>
          <p className="text-xs text-red-500">Hidden</p>
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
        <input type="text" placeholder="Search by name..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-border p-8 text-center text-text-secondary">No profiles found.</div>
      ) : (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-gray-50 text-left">
                  <th className="px-4 py-3 font-medium text-text-secondary">Profile</th>
                  <th className="px-4 py-3 font-medium text-text-secondary">Education</th>
                  <th className="px-4 py-3 font-medium text-text-secondary">Occupation</th>
                  <th className="px-4 py-3 font-medium text-text-secondary">City</th>
                  <th className="px-4 py-3 font-medium text-text-secondary">Status</th>
                  <th className="px-4 py-3 font-medium text-text-secondary">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((mp) => (
                  <tr key={mp.id} className="border-b border-border/50 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
                          {mp.profiles?.profile_photo_url ? (
                            <img src={mp.profiles.profile_photo_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <User className="w-4 h-4 text-primary" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-text-primary">{mp.profiles?.full_name}</p>
                          <p className="text-xs text-text-secondary">
                            {mp.profiles?.gender === 'male' ? 'M' : 'F'}
                            {mp.profiles?.date_of_birth ? ` · ${calculateAge(mp.profiles.date_of_birth)}y` : ''}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{mp.education || '—'}</td>
                    <td className="px-4 py-3 text-text-secondary">{mp.occupation || '—'}</td>
                    <td className="px-4 py-3 text-text-secondary">{mp.profiles?.city || '—'}</td>
                    <td className="px-4 py-3">
                      {mp.is_active ? (
                        <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full">Visible</span>
                      ) : (
                        <span className="text-xs bg-red-50 text-red-500 px-2 py-0.5 rounded-full">Hidden</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link to={`/matrimonial/${mp.id}`} className="flex items-center gap-1 text-xs text-primary hover:underline">
                          <Eye className="w-3.5 h-3.5" /> View
                        </Link>
                        {superAdmin && (
                          <>
                            <Link to={`/admin/matrimonial/edit/${mp.id}`} className="flex items-center gap-1 text-xs text-text-secondary hover:text-primary">
                              <Edit2 className="w-3.5 h-3.5" /> Edit
                            </Link>
                            <button onClick={() => handleToggleActive(mp.id, mp.is_active)}
                              className={`flex items-center gap-1 text-xs ${mp.is_active ? 'text-red-500 hover:text-red-700' : 'text-green-600 hover:text-green-700'}`}>
                              {mp.is_active ? <><X className="w-3.5 h-3.5" /> Hide</> : <><Check className="w-3.5 h-3.5" /> Show</>}
                            </button>
                          </>
                        )}
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
