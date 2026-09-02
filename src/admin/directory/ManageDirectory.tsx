import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Eye, Edit2, EyeOff, Search, Plus } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import type { BusinessListing } from '../../types'
import { Spinner } from '../../components/ui/Spinner'

export function ManageDirectory() {
  const { isSuperAdmin } = useAuth()
  const superAdmin = isSuperAdmin()
  const [listings, setListings] = useState<BusinessListing[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    fetchListings()
  }, [])

  async function fetchListings() {
    const { data } = await supabase.from('business_directory').select('*').order('created_at', { ascending: false })
    setListings((data as BusinessListing[]) || [])
    setLoading(false)
  }

  async function handleToggleActive(id: string, currentActive: boolean) {
    await supabase.from('business_directory').update({ is_active: !currentActive }).eq('id', id)
    toast.success(currentActive ? 'Business hidden' : 'Business visible')
    fetchListings()
  }

  const filtered = listings.filter((l) => {
    const matchSearch = !search || l.business_name.toLowerCase().includes(search.toLowerCase())
    const matchStatus = !statusFilter ||
      (statusFilter === 'active' && l.is_active) ||
      (statusFilter === 'hidden' && !l.is_active)
    return matchSearch && matchStatus
  })

  const ownerNames: Record<string, string> = {}

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  const active = listings.filter((l) => l.is_active).length
  const hidden = listings.filter((l) => !l.is_active).length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Business Directory</h1>
          <p className="text-sm text-text-secondary mt-1">Manage all business listings</p>
        </div>
        {superAdmin && (
          <Link to="/admin/business/add" className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark">
            <Plus className="w-4 h-4" /> Add Business
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <button onClick={() => setStatusFilter(statusFilter === 'active' ? '' : 'active')}
          className={`bg-white rounded-xl border p-3 text-left transition-colors ${statusFilter === 'active' ? 'border-green-300 bg-green-50' : 'border-border'}`}>
          <p className="text-xl font-bold text-text-primary">{active}</p>
          <p className="text-xs text-green-600">Visible</p>
        </button>
        <button onClick={() => setStatusFilter(statusFilter === 'hidden' ? '' : 'hidden')}
          className={`bg-white rounded-xl border p-3 text-left transition-colors ${statusFilter === 'hidden' ? 'border-red-300 bg-red-50' : 'border-border'}`}>
          <p className="text-xl font-bold text-text-primary">{hidden}</p>
          <p className="text-xs text-red-500">Hidden</p>
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
        <input type="text" placeholder="Search by business name..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-border p-8 text-center text-text-secondary">No businesses found.</div>
      ) : (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-gray-50 text-left">
                  <th className="px-4 py-3 font-medium text-text-secondary">Business</th>
                  <th className="px-4 py-3 font-medium text-text-secondary">Category</th>
                  <th className="px-4 py-3 font-medium text-text-secondary">Owner</th>
                  <th className="px-4 py-3 font-medium text-text-secondary">City</th>
                  <th className="px-4 py-3 font-medium text-text-secondary">Status</th>
                  <th className="px-4 py-3 font-medium text-text-secondary">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((l) => (
                  <tr key={l.id} className="border-b border-border/50 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-text-primary">{l.business_name}</p>
                      {l.phone && <p className="text-xs text-text-secondary">{l.phone}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{l.category}</span>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{ownerNames[l.id] || '—'}</td>
                    <td className="px-4 py-3 text-text-secondary">{l.city || '—'}</td>
                    <td className="px-4 py-3">
                      {l.is_active ? (
                        <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full">Visible</span>
                      ) : (
                        <span className="text-xs bg-red-50 text-red-500 px-2 py-0.5 rounded-full">Hidden</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link to={`/businesses`} className="flex items-center gap-1 text-xs text-primary hover:underline">
                          <Eye className="w-3.5 h-3.5" /> View
                        </Link>
                        {superAdmin && (
                          <>
                            <Link to={`/admin/business/edit/${l.id}`} className="flex items-center gap-1 text-xs text-text-secondary hover:text-primary">
                              <Edit2 className="w-3.5 h-3.5" /> Edit
                            </Link>
                            <button onClick={() => handleToggleActive(l.id, l.is_active)}
                              className={`flex items-center gap-1 text-xs ${l.is_active ? 'text-red-500 hover:text-red-700' : 'text-green-600 hover:text-green-700'}`}>
                              {l.is_active ? <><EyeOff className="w-3.5 h-3.5" /> Hide</> : <><Eye className="w-3.5 h-3.5" /> Show</>}
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
