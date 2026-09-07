import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Search, Shield, Edit2, Eye, User, Download } from 'lucide-react'
import * as XLSX from 'xlsx'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'
import { getRoleLabel } from '../../lib/utils'
import type { Profile } from '../../types'
import { useDesignations } from '../../hooks/useDesignations'
import { useAuth } from '../../hooks/useAuth'
import { Spinner } from '../../components/ui/Spinner'

export function AllMembers() {
  const { isViewer, isSuperAdmin, isAdmin } = useAuth()
  const superAdmin = isSuperAdmin()
  const canBlock = isAdmin() || superAdmin
  const { t, i18n } = useTranslation('admin')
  const { designations } = useDesignations()
  const lang = i18n.language
  const [members, setMembers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [memberType, setMemberType] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [idSort, setIdSort] = useState<'asc' | 'desc'>('asc')

  useEffect(() => {
    fetchMembers()
  }, [])

  async function fetchMembers() {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .in('account_status', ['active', 'suspended'])
      .order('full_name')
    setMembers((data as Profile[]) || [])
    setLoading(false)
  }

  async function toggleBlock(m: Profile) {
    const isBlocked = m.account_status === 'suspended'
    const { error } = await supabase
      .from('profiles')
      .update({ account_status: isBlocked ? 'active' : 'suspended' })
      .eq('id', m.id)
    if (error) { toast.error('Failed to update status'); return }
    toast.success(`${m.full_name} ${isBlocked ? 'unblocked' : 'blocked'}`)
    fetchMembers()
  }

  const filtered = members
    .filter((m) => {
      const matchSearch = !search || m.full_name.toLowerCase().includes(search.toLowerCase()) || m.email?.toLowerCase().includes(search.toLowerCase())
      const matchRole = !roleFilter || m.role === roleFilter
      const matchType = !memberType || (memberType === 'executive' ? m.is_executive_member : !m.is_executive_member)
      const matchStatus = !statusFilter || (statusFilter === 'blocked' ? m.account_status === 'suspended' : m.account_status === 'active')
      return matchSearch && matchRole && matchType && matchStatus
    })
    .sort((a, b) => {
      const aNum = parseInt(a.member_id?.split('/')?.[1] || '9999')
      const bNum = parseInt(b.member_id?.split('/')?.[1] || '9999')
      return idSort === 'asc' ? aNum - bNum : bNum - aNum
    })

  function exportToExcel() {
    const rows = members.map((m: any) => ({
      'Member ID':        m.member_id || '',
      'Name (English)':   m.full_name || '',
      'Name (Hindi)':     m.full_name_hi || '',
      'Father\'s Name':   m.father_name || '',
      'Mother\'s Name':   m.mother_name || '',
      'Email':            m.email || '',
      'Phone':            m.phone || '',
      'Gender':           m.gender ? m.gender.charAt(0).toUpperCase() + m.gender.slice(1) : '',
      'Date of Birth':    m.date_of_birth || '',
      'Marital Status':   m.marital_status ? m.marital_status.charAt(0).toUpperCase() + m.marital_status.slice(1) : '',
      'Role':             getRoleLabel(m.role || ''),
      'Executive Member': m.is_executive_member ? 'Yes' : 'No',
      'Membership Till':  m.membership_end_date || '',
      'Member Since':     m.member_since || m.created_at?.split('T')[0] || '',
      'Caste':            m.caste || '',
      'Gotra':            m.gotra || '',
      'City':             m.city || '',
      'Local Address':    m.address || '',
      'Village Address':  m.village_address || '',
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    ws['!cols'] = Object.keys(rows[0] || {}).map(() => ({ wch: 22 }))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Members')
    XLSX.writeFile(wb, `ABGSPB_Members_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text-primary">{t('members.all')}</h1>
        {superAdmin && (
          <button onClick={exportToExcel} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors shadow-sm">
            <Download className="w-4 h-4" /> Export Excel
          </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
          <input type="text" placeholder="Search members..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        <select value={memberType} onChange={(e) => setMemberType(e.target.value)}
          className="px-4 py-2.5 border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/30">
          <option value="">All Members</option>
          <option value="executive">Executive Members</option>
          <option value="regular">Members</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/30">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="blocked">Blocked</option>
        </select>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
          className="px-4 py-2.5 border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/30">
          <option value="">All Roles</option>
          {designations.map((d) => (
            <option key={d.slug} value={d.slug}>{lang === 'hi' && d.name_hi ? d.name_hi : d.name_en}</option>
          ))}
        </select>
      </div>

      {/* Mobile card layout */}
      <div className="sm:hidden space-y-2">
        {filtered.length === 0 ? (
          <p className="text-center py-8 text-text-secondary text-sm">{t('common:labels.noData')}</p>
        ) : filtered.map((m) => (
          <div key={m.id} className="bg-white rounded-xl border border-border p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
              {m.profile_photo_url ? (
                <img src={m.profile_photo_url} alt="" className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <User className="w-5 h-5 text-primary" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-semibold text-text-primary truncate">{m.full_name}</p>
                {m.is_executive_member && <Shield className="w-3 h-3 text-amber-500 shrink-0" />}
              </div>
              <p className="text-[10px] text-text-secondary">{m.member_id || 'No ID'} · {m.phone || '—'}</p>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">{getRoleLabel(m.role)}</span>
                {m.account_status === 'suspended' && (
                  <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-medium">Blocked</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {canBlock && (
                <button
                  onClick={() => toggleBlock(m)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                    m.account_status === 'suspended' ? 'bg-red-400' : 'bg-green-500'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform duration-200 ${
                    m.account_status === 'suspended' ? 'translate-x-0' : 'translate-x-4'
                  }`} />
                </button>
              )}
              <Link to={`/admin/members/${m.member_id ? m.member_id.replace('/', '-') : m.id}`}
                className="text-primary text-xs font-medium shrink-0 px-2 py-1 bg-primary/10 rounded-lg">
                {isViewer() ? 'View' : 'Edit'}
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block bg-white rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-gray-50 text-center">
                <th className="px-4 py-3 font-medium text-text-secondary text-left">{t('common:labels.name')}</th>
                <th className="px-4 py-3 font-medium text-text-secondary">
                  <button onClick={() => setIdSort(s => s === 'asc' ? 'desc' : 'asc')}
                    className="inline-flex items-center gap-1 hover:text-primary transition-colors">
                    Member ID <span className="text-primary text-sm">{idSort === 'asc' ? '↑' : '↓'}</span>
                  </button>
                </th>
                <th className="px-4 py-3 font-medium text-text-secondary">{t('common:labels.phone')}</th>
                <th className="px-4 py-3 font-medium text-text-secondary">{t('common:labels.role')}</th>
                <th className="px-4 py-3 font-medium text-text-secondary">Membership Valid Till</th>
                {canBlock && <th className="px-4 py-3 font-medium text-text-secondary">Block / Unblock</th>}
                <th className="px-4 py-3 font-medium text-text-secondary">{t('common:labels.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => (
                <tr key={m.id} className="border-b border-border/50 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
                        {m.profile_photo_url ? (
                          <img src={m.profile_photo_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <User className="w-4 h-4 text-primary" />
                        )}
                      </div>
                      <span className="font-medium text-text-primary">{m.full_name}</span>
                      {m.is_executive_member && <Shield className="w-3.5 h-3.5 text-amber-500" />}
                      {m.account_status === 'suspended' && (
                        <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-medium">Blocked</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-text-secondary text-center">{m.member_id || '—'}</td>
                  <td className="px-4 py-3 text-text-secondary text-center">{m.phone || '—'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{getRoleLabel(m.role)}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-text-secondary text-center">{(m as any).membership_end_date || (m.is_executive_member ? 'Active' : '—')}</td>
                  {canBlock && (
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => toggleBlock(m)}
                        title={m.account_status === 'suspended' ? 'Click to unblock' : 'Click to block'}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                          m.account_status === 'suspended' ? 'bg-red-400' : 'bg-green-500'
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform duration-200 ${
                          m.account_status === 'suspended' ? 'translate-x-0' : 'translate-x-4'
                        }`} />
                      </button>
                    </td>
                  )}
                  <td className="px-4 py-3 text-center">
                    <Link to={`/admin/members/${m.member_id ? m.member_id.replace('/', '-') : m.id}`} className="text-primary hover:underline inline-flex items-center gap-1 text-xs">
                      {isViewer() ? <Eye className="w-3.5 h-3.5" /> : <Edit2 className="w-3.5 h-3.5" />} {isViewer() ? 'View' : 'Edit'}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <p className="text-center py-8 text-text-secondary">{t('common:labels.noData')}</p>
        )}
      </div>
    </div>
  )
}
