import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import type { Profile } from '../../types'

export function RecordDonation() {
  const { t } = useTranslation('admin')
  const { user } = useAuth()
  const navigate = useNavigate()
  const [members, setMembers] = useState<Pick<Profile, 'id' | 'full_name'>[]>([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    user_id: '', amount: '', donation_date: new Date().toISOString().split('T')[0],
    purpose: '', payment_method: '', transaction_id: '',
  })

  useEffect(() => {
    supabase.from('profiles').select('id, full_name').eq('account_status', 'active').order('full_name').then(({ data }) => {
      setMembers(data || [])
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.from('donations').insert({
      user_id: form.user_id,
      amount: parseFloat(form.amount),
      donation_date: form.donation_date,
      purpose: form.purpose || null,
      payment_method: form.payment_method || null,
      transaction_id: form.transaction_id || null,
      recorded_by: user?.id,
    })
    if (error) { toast.error('Failed to record donation'); setLoading(false); return }
    toast.success(t('donations.recorded'))
    navigate('/admin/donations')
  }

  const inputClass = 'w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary'

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary mb-6">{t('donations.record')}</h1>
      <div className="bg-white rounded-xl border border-border p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">{t('donations.selectMember')} *</label>
            <select required value={form.user_id} onChange={(e) => setForm({ ...form, user_id: e.target.value })} className={`${inputClass} bg-white`}>
              <option value="">Select member...</option>
              {members.map((m) => <option key={m.id} value={m.id}>{m.full_name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">{t('donations.amount')} *</label>
              <input type="number" required min="1" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">{t('donations.date')} *</label>
              <input type="text" required placeholder="YYYY-MM-DD" value={form.donation_date} onChange={(e) => setForm({ ...form, donation_date: e.target.value })} className={inputClass} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">{t('donations.purpose')}</label>
            <input type="text" value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} className={inputClass} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">{t('donations.paymentMethod')}</label>
              <input type="text" value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">{t('donations.transactionId')}</label>
              <input type="text" value={form.transaction_id} onChange={(e) => setForm({ ...form, transaction_id: e.target.value })} className={inputClass} />
            </div>
          </div>
          <button type="submit" disabled={loading} className="px-6 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark disabled:opacity-50">
            {loading ? '...' : t('common:buttons.submit')}
          </button>
        </form>
      </div>
    </div>
  )
}
