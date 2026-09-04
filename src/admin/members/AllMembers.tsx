import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Search, Shield, Edit2, User } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { getRoleLabel } from '../../lib/utils'
import type { Profile } from '../../types'
import { useDesignations } from '../../hooks/useDesignations'
import { Spinner } from '../../components/ui/Spinner'

export function AllMembers() {
  const { t, i18n } = useTranslation('admin')
  const { designations } = useDesignations()
  const lang = i18n.language
  const [members, setMembers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [memberType, setMemberType] = useState('')
  const [idSort, setIdSort] = useState<'asc' | 'desc'>('asc')

  useEffect(() => {
    fetchMembers()
  }, [])

  async function fetchMembers() {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('account_status', 'active')
      .order('full_name')
    setMembers((data as Profile[]) || [])
    setLoading(false)
  }

  const filtered = members
    .filter((m) => {
      const matchSearch = !search || m.full_name.toLowerCase().includes(search.toLowerCase()) || m.email?.toLowerCase().includes(search.toLowerCase())
      const matchRole = !roleFilter || m.role === roleFilter
      const matchType = !memberType || (memberType === 'executive' ? m.is_executive_member : !m.is_executive_member)
      return matchSearch && matchRole && matchType
    })
    .sort((a, b) => {
      const aNum = parseInt(a.member_id?.split('/')?.[1] || '9999')
      const bNum = parseInt(b.member_id?.split('/')?.[1] || '9999')
      return idSort === 'asc' ? aNum - bNum : bNum - aNum
    })

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary mb-6">{t('members.all')}</h1>

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
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
          className="px-4 py-2.5 border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/30">
          <option value="">All Roles</option>
          {designations.map((d) => (
            <option key={d.slug} value={d.slug}>{lang === 'hi' && d.name_hi ? d.name_hi : d.name_en}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-gray-50 text-left">
                <th className="px-4 py-3 font-medium text-text-secondary">{t('common:labels.name')}</th>
                <th className="px-4 py-3 font-medium text-text-secondary">
                  <button
                    onClick={() => setIdSort(s => s === 'asc' ? 'desc' : 'asc')}
                    className="flex items-center gap-1 hover:text-primary transition-colors"
                  >
                    Member ID
                    <span className="text-primary text-sm">{idSort === 'asc' ? '↑' : '↓'}</span>
                  </button>
                </th>
                <th className="px-4 py-3 font-medium text-text-secondary">{t('common:labels.phone')}</th>
                <th className="px-4 py-3 font-medium text-text-secondary">{t('common:labels.role')}</th>
                <th className="px-4 py-3 font-medium text-text-secondary">Membership Valid Till</th>
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
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-text-secondary">{m.member_id || '—'}</td>
                  <td className="px-4 py-3 text-text-secondary">{m.phone || '—'}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{getRoleLabel(m.role)}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-text-secondary">{(m as any).membership_end_date || (m.is_executive_member ? 'Active' : '—')}</td>
                  <td className="px-4 py-3">
                    <Link to={`/admin/members/${m.member_id ? m.member_id.replace('/', '-') : m.id}`} className="text-primary hover:underline flex items-center gap-1 text-xs">
                      <Edit2 className="w-3.5 h-3.5" /> Edit
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
