import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { Check, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { formatDate } from '../../lib/utils'

import type { Profile } from '../../types'
import { Spinner } from '../../components/ui/Spinner'

export function PendingApprovals() {
  const { t, i18n } = useTranslation('admin')
  const lang = i18n.language
  const { user, isSuperAdmin } = useAuth()
  const superAdmin = isSuperAdmin()
  const [members, setMembers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPending()
  }, [])

  async function fetchPending() {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('account_status', 'pending_approval')
      .order('created_at', { ascending: false })
    setMembers((data as Profile[]) || [])
    setLoading(false)
  }

  async function generateMemberId(): Promise<string> {
    const { count } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .not('member_id', 'is', null)
    const nextNum = (count || 0) + 1
    return `ABGSPB/${String(nextNum).padStart(4, '0')}`
  }

  async function handleApprove(id: string) {
    const memberId = await generateMemberId()

    const { error } = await supabase.from('profiles').update({
      account_status: 'active',
      member_id: memberId,
      approved_by: user?.id,
      approved_at: new Date().toISOString(),
    }).eq('id', id)
    if (error) { toast.error('Failed'); return }
    toast.success(`${t('members.approved')} — ID: ${memberId}`)
    fetchPending()
  }

  async function handleReject(id: string) {
    if (!confirm(t('members.rejectConfirm'))) return
    const { error } = await supabase.from('profiles').update({ account_status: 'rejected' }).eq('id', id)
    if (error) { toast.error('Failed'); return }
    toast.success(t('members.rejected'))
    fetchPending()
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary mb-6">{t('members.pending')}</h1>

      {members.length === 0 ? (
        <div className="bg-white rounded-xl border border-border p-8 text-center text-text-secondary">
          No pending approvals
        </div>
      ) : (
        <div className="space-y-3">
          {members.map((m) => (
            <div key={m.id} className="bg-white rounded-xl border border-border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="font-medium text-text-primary">{m.full_name}</p>
                <p className="text-sm text-text-secondary">{m.email} {m.phone ? `· ${m.phone}` : ''}</p>
                <p className="text-xs text-text-secondary mt-1">
                  {m.city}{m.state ? `, ${m.state}` : ''} · Registered {formatDate(m.created_at, lang)}
                </p>
              </div>
              {superAdmin && (
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => handleApprove(m.id)} className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
                    <Check className="w-4 h-4" /> {t('common:buttons.approve')}
                  </button>
                  <button onClick={() => handleReject(m.id)} className="flex items-center gap-1 px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100">
                    <X className="w-4 h-4" /> {t('common:buttons.reject')}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
