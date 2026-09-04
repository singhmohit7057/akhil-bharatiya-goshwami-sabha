import { useEffect, useState } from 'react'
import { Search, User, Shield, Crown } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { getRoleLabel } from '../lib/utils'
import type { Profile } from '../types'
import { ADMIN_ROLES } from '../types'
import { Spinner } from '../components/ui/Spinner'

export function Members() {
  const { t } = useTranslation('members')
  const [members, setMembers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'governing' | 'executive' | 'member'>('all')

  useEffect(() => {
    supabase
      .from('profiles')
      .select('*')
      .eq('account_status', 'active')
      .order('role')
      .order('full_name')
      .then(({ data }) => {
        setMembers((data as Profile[]) || [])
        setLoading(false)
      })
  }, [])

  const filtered = members.filter((m) => {
    const matchSearch = !search || m.full_name.toLowerCase().includes(search.toLowerCase()) || m.city?.toLowerCase().includes(search.toLowerCase())
    const matchFilter =
      filter === 'all' ||
      (filter === 'governing' && ADMIN_ROLES.includes(m.role)) ||
      (filter === 'executive' && m.is_executive_member) ||
      (filter === 'member' && !ADMIN_ROLES.includes(m.role) && !m.is_executive_member)
    return matchSearch && matchFilter
  })

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  return (
    <div>
      <section className="bg-surface py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm font-semibold text-primary tracking-widest uppercase mb-2">{t('tagline')}</p>
          <h1 className="text-5xl font-extrabold text-text-primary">{t('title')}</h1>
        </div>
      </section>
      <div className="max-w-3xl mx-auto"><hr className="border-border" /></div>

      <section className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
            className="px-4 py-2.5 border border-border rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="all">{t('filterAll')}</option>
            <option value="governing">{t('filterGoverning')}</option>
            <option value="executive">{t('filterExecutive')}</option>
            <option value="member">{t('filterMember')}</option>
          </select>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16 text-text-secondary text-sm">{t('noMembers')}</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {filtered.map((m) => (
              <div key={m.id} className="bg-white rounded-xl border border-border p-4 text-center hover:shadow-md transition-shadow">
                <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 border-2 border-border overflow-hidden flex items-center justify-center mb-3">
                  {m.profile_photo_url ? (
                    <img src={m.profile_photo_url} alt="" className="w-16 h-16 rounded-full object-cover" />
                  ) : (
                    <User className="w-7 h-7 text-gray-300" />
                  )}
                </div>
                <p className="text-xs font-semibold text-text-primary truncate">{m.full_name}</p>
                <p className="text-[10px] text-primary font-medium truncate">{getRoleLabel(m.role)}</p>
                {m.city && <p className="text-[10px] text-text-secondary truncate mt-0.5">{m.city}</p>}
                <div className="flex items-center justify-center gap-1 mt-2">
                  {ADMIN_ROLES.includes(m.role) && (
                    <span className="text-[9px] bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                      <Shield className="w-2.5 h-2.5" /> {t('governing')}
                    </span>
                  )}
                  {m.is_executive_member && (
                    <span className="text-[9px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                      <Crown className="w-2.5 h-2.5" /> {t('executive')}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
