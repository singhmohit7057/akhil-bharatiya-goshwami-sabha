import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { IndianRupee, Crown, User } from 'lucide-react'
import { DateInput } from '../../components/ui/DateInput'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'

import { getRoleLabel } from '../../lib/utils'
import type { Profile } from '../../types'
import { Spinner } from '../../components/ui/Spinner'


export function AddPayment() {
  const { id: editId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [members, setMembers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [paymentType, setPaymentType] = useState<'donation' | 'membership'>('donation')
  const [form, setForm] = useState({
    user_id: '',
    amount: '',
    donation_date: new Date().toISOString().split('T')[0],
    membership_start_date: new Date().toISOString().split('T')[0],
    purpose: '',
    payment_method: '',
    transaction_id: '',
  })

  useEffect(() => {
    supabase
      .from('profiles')
      .select('*')
      .eq('account_status', 'active')
      .order('full_name')
      .then(async ({ data }) => {
        setMembers((data as Profile[]) || [])
        if (editId) {
          const { data: payment } = await supabase.from('donations').select('*').eq('id', editId).single()
          if (payment) {
            const p = payment as any
            let membershipStart = p.donation_date
            if (p.purpose === 'Executive Membership') {
              const { data: prof } = await supabase.from('profiles').select('membership_start_date').eq('id', p.user_id).single()
              if (prof?.membership_start_date) membershipStart = prof.membership_start_date
            }
            setForm({
              user_id: p.user_id,
              amount: String(p.amount),
              donation_date: p.donation_date,
              membership_start_date: membershipStart,
              purpose: p.purpose === 'Executive Membership' ? '' : (p.purpose || ''),
              payment_method: p.payment_method || '',
              transaction_id: p.transaction_id || '',
            })
            setPaymentType(p.purpose === 'Executive Membership' ? 'membership' : 'donation')
          }
        }
        setLoading(false)
      })
  }, [editId])

  const selected = members.find((m) => m.id === form.user_id)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    const purpose = paymentType === 'membership' ? 'Executive Membership' : (form.purpose || 'General Donation')
    const amount = parseFloat(form.amount)

    const payload = {
      user_id: form.user_id,
      amount,
      donation_date: form.donation_date,
      purpose,
      payment_method: form.payment_method || null,
      transaction_id: form.transaction_id || null,
      recorded_by: user?.id,
    }

    if (editId) {
      const { error } = await supabase.from('donations').update(payload).eq('id', editId)
      if (error) { toast.error('Failed to update'); setSaving(false); return }
      if (paymentType === 'membership') {
        const startDate = new Date(form.membership_start_date)
        const endDate = new Date(startDate)
        endDate.setFullYear(endDate.getFullYear() + 1)
        await supabase.from('profiles').update({
          is_executive_member: true,
          membership_start_date: form.membership_start_date,
          membership_end_date: endDate.toISOString().split('T')[0],
        }).eq('id', form.user_id)
      }
      toast.success('Payment updated')
      navigate('/admin/payments')
      return
    }

    const { error } = await supabase.from('donations').insert(payload)
    if (error) { toast.error('Failed to record payment'); setSaving(false); return }

    if (paymentType === 'membership') {
      const startDate = new Date(form.membership_start_date)
      const endDate = new Date(startDate)
      endDate.setFullYear(endDate.getFullYear() + 1)
      await supabase.from('profiles').update({
        is_executive_member: true,
        membership_start_date: form.membership_start_date,
        membership_end_date: endDate.toISOString().split('T')[0],
      }).eq('id', form.user_id)
      toast.success('Membership payment recorded & executive status activated')
    } else {
      toast.success('Donation recorded')
    }

    navigate('/admin/payments')
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  const inputClass = 'w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30'

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary mb-1">{editId ? 'Edit Payment' : 'Add Payment'}</h1>
      <p className="text-sm text-text-secondary mb-6">Record a donation or membership payment</p>

      <div className="bg-white rounded-xl border border-border p-5">
        {/* Payment type toggle */}
        <div className="flex gap-3 mb-5">
          <button
            type="button"
            onClick={() => setPaymentType('donation')}
            className={`flex-1 p-4 rounded-xl border text-center transition-colors ${
              paymentType === 'donation' ? 'border-green-300 bg-green-50' : 'border-border hover:border-green-200'
            }`}
          >
            <IndianRupee className={`w-5 h-5 mx-auto mb-1 ${paymentType === 'donation' ? 'text-green-600' : 'text-text-secondary'}`} />
            <p className={`text-sm font-semibold ${paymentType === 'donation' ? 'text-green-700' : 'text-text-secondary'}`}>Donation</p>
            <p className="text-xs text-text-secondary mt-0.5">Custom amount</p>
          </button>
          <button
            type="button"
            onClick={() => setPaymentType('membership')}
            className={`flex-1 p-4 rounded-xl border text-center transition-colors ${
              paymentType === 'membership' ? 'border-amber-300 bg-amber-50' : 'border-border hover:border-amber-200'
            }`}
          >
            <Crown className={`w-5 h-5 mx-auto mb-1 ${paymentType === 'membership' ? 'text-amber-600' : 'text-text-secondary'}`} />
            <p className={`text-sm font-semibold ${paymentType === 'membership' ? 'text-amber-700' : 'text-text-secondary'}`}>Membership</p>
            <p className="text-xs text-text-secondary mt-0.5">Custom amount</p>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-text-primary mb-1">Select Member *</label>
            <select required value={form.user_id} onChange={(e) => setForm({ ...form, user_id: e.target.value })} className={`${inputClass} bg-white`}>
              <option value="">Choose member...</option>
              {members.map((m) => <option key={m.id} value={m.id}>{m.full_name} — {getRoleLabel(m.role)}</option>)}
            </select>
          </div>

          {selected && (
            <div className="flex items-center gap-3 p-3 bg-surface rounded-lg">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                {selected.profile_photo_url ? (
                  <img src={selected.profile_photo_url} alt="" className="w-9 h-9 rounded-full object-cover" />
                ) : (
                  <User className="w-4 h-4 text-primary" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">{selected.full_name}</p>
                <p className="text-xs text-text-secondary">{selected.email} · {selected.city || ''}</p>
              </div>
              {selected.is_executive_member && (
                <span className="text-[10px] bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full ml-auto">Executive</span>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-3 items-end">
            <div className="w-36 shrink-0">
              <label className="block text-xs font-medium text-text-primary mb-1">Amount (₹) *</label>
              <input type="number" required min="1" step="0.01" placeholder="e.g. 1100" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className={inputClass} />
            </div>
            <div className="flex-1 min-w-0">
              <label className="block text-xs font-medium text-text-primary mb-1">Payment Date *</label>
              <DateInput value={form.donation_date} onChange={(v) => setForm({ ...form, donation_date: v })} required />
            </div>
            {paymentType === 'membership' && (
              <div className="flex-1 min-w-0">
                <label className="block text-xs font-medium text-text-primary mb-1">Membership Start Date *</label>
                <DateInput value={form.membership_start_date} onChange={(v) => setForm({ ...form, membership_start_date: v })} required />
              </div>
            )}
          </div>

          {paymentType === 'donation' && (
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">Purpose</label>
              <input type="text" placeholder="e.g. Annual Fund, Event Sponsorship, Souvenir" value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} className={inputClass} />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">Payment Method</label>
              <select value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })} className={`${inputClass} bg-white`}>
                <option value="">Select</option>
                <option value="Online">Online</option>
                <option value="Offline">Offline</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">Remark</label>
              <input type="text" placeholder="Optional" value={form.transaction_id} onChange={(e) => setForm({ ...form, transaction_id: e.target.value })} className={inputClass} />
            </div>
          </div>

          {paymentType === 'membership' && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
              <Crown className="w-3.5 h-3.5 inline mr-1" />
              This will automatically activate <strong>Executive Member</strong> status. Membership valid for 1 year from membership start date.
            </div>
          )}

          <button type="submit" disabled={saving} className="px-5 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark disabled:opacity-50">
            {saving ? '...' : editId ? 'Update Payment' : paymentType === 'membership' ? 'Record & Activate Membership' : 'Record Donation'}
          </button>
        </form>
      </div>
    </div>
  )
}
