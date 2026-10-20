import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Eye, Edit2, EyeOff, Search, Plus, Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { logAction } from '../../lib/adminLog'
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

  const [ownerNames, setOwnerNames] = useState<Record<string, { name: string; phone?: string }>>({})

  async function fetchListings() {
    const { data } = await supabase.from('business_directory').select('*, profiles(full_name, phone)').order('created_at', { ascending: false })
    const items = (data || []) as (BusinessListing & { profiles?: { full_name: string; phone?: string } })[]
    setListings(items)
    const names: Record<string, { name: string; phone?: string }> = {}
    items.forEach((item) => {
      if (item.profiles?.full_name) names[item.id] = { name: item.profiles.full_name, phone: item.profiles.phone }
    })
    setOwnerNames(names)
    setLoading(false)
  }

  function storagePathFromUrl(url: string): { bucket: string; path: string } | null {
    for (const bucket of ['business-photos', 'profile-photos']) {
      const marker = `/${bucket}/`
      const idx = url.indexOf(marker)
      if (idx !== -1) return { bucket, path: url.slice(idx + marker.length) }
    }
    return null
  }

  async function handleDelete(id: string) {
    if (!confirm('Permanently delete this business listing and all its images?')) return
    const listing = listings.find(l => l.id === id) as any
    // Delete storage files
    const urls = [listing?.logo_url, listing?.visiting_card_front, listing?.visiting_card_back].filter(Boolean)
    for (const url of urls) {
      const p = storagePathFromUrl(url)
      if (p) await supabase.storage.from(p.bucket).remove([p.path])
    }
    await supabase.from('business_directory').delete().eq('id', id)
    logAction('delete', 'business', listing?.business_name || id, id)
    toast.success('Business deleted')
    fetchListings()
  }

  async function handleToggleActive(id: string, currentActive: boolean) {
    await supabase.from('business_directory').update({ is_active: !currentActive }).eq('id', id)
    const business = listings.find((l) => l.id === id)
    logAction('update', 'business', business?.business_name || id, id)
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
        <>
          {/* Mobile card list */}
          <div className="sm:hidden space-y-2">
            {filtered.map((l) => (
              <div key={l.id} className="bg-white rounded-xl border border-border p-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-text-primary text-sm truncate">{l.business_name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">{l.category}</span>
                    {l.city && <span className="text-xs text-text-secondary">{l.city}</span>}
                  </div>
                </div>
                {l.is_active ? (
                  <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full shrink-0">Visible</span>
                ) : (
                  <span className="text-xs bg-red-50 text-red-500 px-2 py-0.5 rounded-full shrink-0">Hidden</span>
                )}
                {superAdmin && (
                  <div className="flex items-center gap-2 shrink-0">
                    <Link to={`/admin/business/edit/${l.id}`} className="text-text-secondary hover:text-primary">
                      <Edit2 className="w-4 h-4" />
                    </Link>
                    <button onClick={() => handleToggleActive(l.id, l.is_active)}
                      className={l.is_active ? 'text-red-500 hover:text-red-700' : 'text-green-600 hover:text-green-700'}>
                      {l.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button onClick={() => handleDelete(l.id)} className="text-text-secondary hover:text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block bg-white rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-gray-50 text-left">
                    <th className="px-4 py-3 font-medium text-text-secondary">Business</th>
                    <th className="px-4 py-3 font-medium text-text-secondary">Category</th>
                    <th className="px-4 py-3 font-medium text-text-secondary">Added By</th>
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
                      <td className="px-4 py-3">
                        <p className="text-sm text-text-primary font-medium">{ownerNames[l.id]?.name || '—'}</p>
                        {ownerNames[l.id]?.phone && <p className="text-xs text-text-secondary">{ownerNames[l.id].phone}</p>}
                      </td>
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
                              <button onClick={() => handleDelete(l.id)} className="flex items-center gap-1 text-xs text-text-secondary hover:text-red-500">
                                <Trash2 className="w-3.5 h-3.5" /> Delete
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
        </>
      )}
    </div>
  )
}
