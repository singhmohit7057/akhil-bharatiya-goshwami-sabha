import { useEffect, useState } from 'react'
import { IndianRupee, Crown, Search, Plus, X, Edit2, Trash2, BookOpen, FileDown } from 'lucide-react'
import { generatePaymentReceiptPdf, generateSouvenirReceiptPdf } from '../../lib/receiptPdf'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'

import { formatDate } from '../../lib/utils'
import type { Donation, Profile } from '../../types'
import { Spinner } from '../../components/ui/Spinner'

interface PaymentWithProfile extends Donation {
  profiles: Pick<Profile, 'full_name' | 'email'> & { member_id?: string }
}

const MEMBERSHIP_FEE = 1100

export function PaymentHistory() {
  const { user, isSuperAdmin } = useAuth()
  const superAdmin = isSuperAdmin()
  const [payments, setPayments] = useState<PaymentWithProfile[]>([])
  const [souvenirPayments, setSouvenirPayments] = useState<any[]>([])
  const [members, setMembers] = useState<Pick<Profile, 'id' | 'full_name'>[]>([])
  const [loading, setLoading] = useState(true)
  const [souvenirCollected, setSouvenirCollected] = useState(0)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [paymentType, setPaymentType] = useState<'donation' | 'membership'>('donation')
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    user_id: '',
    amount: '',
    donation_date: new Date().toISOString().split('T')[0],
    purpose: '',
    payment_method: '',
    transaction_id: '',
  })

  useEffect(() => {
    Promise.all([
      supabase.from('donations').select('*, profiles!donations_user_id_fkey(full_name, email, member_id)').order('donation_date', { ascending: false }),
      supabase.from('profiles').select('id, full_name').eq('account_status', 'active').order('full_name'),
      supabase.from('souvenir_sponsors').select('*, souvenirs(title, event_name, year)').eq('is_paid', true).order('created_at', { ascending: false }),
    ]).then(([payRes, memRes, souvenirRes]) => {
      setPayments((payRes.data as PaymentWithProfile[]) || [])
      setMembers(memRes.data || [])
      const sData = (souvenirRes.data || []) as any[]
      setSouvenirPayments(sData)
      setSouvenirCollected(sData.reduce((sum, s) => sum + Number(s.amount), 0))
      setLoading(false)
    })
  }, [])

  function resetForm() {
    setForm({ user_id: '', amount: '', donation_date: new Date().toISOString().split('T')[0], purpose: '', payment_method: '', transaction_id: '' })
    setShowForm(false)
    setPaymentType('donation')
    setEditingId(null)
  }

  function downloadSouvenirReceipt(s: any) {
    generateSouvenirReceiptPdf({
      id: s.id,
      amount: s.amount,
      date: s.created_at ? s.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
      sponsorName: s.sponsor_name || '',
      companyName: s.company_name || undefined,
      phone: s.phone || undefined,
      eventTitle: s.souvenirs?.title || undefined,
      eventName: s.souvenirs?.event_name || undefined,
      eventYear: s.souvenirs?.year || undefined,
      adSize: s.ad_size || undefined,
      paymentMode: s.payment_mode || undefined,
      remark: s.notes || undefined,
    })
  }

  function downloadReceipt(p: PaymentWithProfile) {
    generatePaymentReceiptPdf({
      id: p.id,
      amount: p.amount,
      donation_date: p.donation_date,
      purpose: p.purpose,
      payment_method: p.payment_method,
      transaction_id: p.transaction_id,
      memberName: p.profiles?.full_name || '',
      memberId: p.profiles?.member_id || undefined,
      memberEmail: p.profiles?.email || undefined,
    })
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this payment record?')) return
    await supabase.from('donations').delete().eq('id', id)
    toast.success('Payment deleted')
    const { data } = await supabase.from('donations').select('*, profiles!donations_user_id_fkey(full_name, email, member_id)').order('donation_date', { ascending: false })
    if (data) setPayments(data as PaymentWithProfile[])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    const purpose = paymentType === 'membership' ? 'Executive Membership' : (form.purpose || 'General Donation')
    const amount = paymentType === 'membership' ? MEMBERSHIP_FEE : parseFloat(form.amount)

    const payload = {
      user_id: form.user_id,
      amount,
      donation_date: form.donation_date,
      purpose,
      payment_method: form.payment_method || null,
      transaction_id: form.transaction_id || null,
      recorded_by: user?.id,
    }

    if (editingId) {
      const { error } = await supabase.from('donations').update(payload).eq('id', editingId)
      if (error) { toast.error('Failed to update'); setSaving(false); return }
      toast.success('Payment updated')
    } else {
      const { error } = await supabase.from('donations').insert(payload)
      if (error) { toast.error('Failed to record payment'); setSaving(false); return }
      if (paymentType === 'membership') {
        await supabase.from('profiles').update({ is_executive_member: true }).eq('id', form.user_id)
        toast.success('Membership payment recorded & executive status activated')
      } else {
        toast.success('Donation recorded')
      }
    }

    resetForm()
    setSaving(false)
    const { data } = await supabase.from('donations').select('*, profiles!donations_user_id_fkey(full_name, email, member_id)').order('donation_date', { ascending: false })
    if (data) setPayments(data as PaymentWithProfile[])
  }

  const filteredDonations = typeFilter === 'souvenir' ? [] : payments.filter((p) => {
    const matchSearch = !search || p.profiles?.full_name?.toLowerCase().includes(search.toLowerCase())
    const matchType = !typeFilter
      ? true
      : typeFilter === 'membership'
        ? p.purpose === 'Executive Membership'
        : p.purpose !== 'Executive Membership'
    return matchSearch && matchType
  })

  const filteredSouvenirs = typeFilter === 'donation' || typeFilter === 'membership' ? [] :
    souvenirPayments.filter((s) =>
      !search || s.sponsor_name?.toLowerCase().includes(search.toLowerCase()) || s.company_name?.toLowerCase().includes(search.toLowerCase())
    )

  const filtered = filteredDonations
  const totalAmount = [...filteredDonations, ...filteredSouvenirs].reduce((sum, d) => sum + Number(d.amount), 0)
  const membershipTotal = payments.filter((p) => p.purpose === 'Executive Membership').reduce((sum, p) => sum + Number(p.amount), 0)
  const donationTotal = payments.filter((p) => p.purpose !== 'Executive Membership').reduce((sum, p) => sum + Number(p.amount), 0)

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  const inputClass = 'w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30'

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Payment History</h1>
          <p className="text-sm text-text-secondary mt-1">All donations and membership payments</p>
        </div>
        {superAdmin && !showForm && (
          <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark">
            <Plus className="w-4 h-4" /> Add Payment
          </button>
        )}
      </div>

      {/* Add Payment Form */}
      {showForm && superAdmin && (
        <div className="bg-white rounded-xl border border-border p-5 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-semibold text-text-primary">{editingId ? 'Edit Payment' : 'Record Payment'}</h3>
            <button onClick={resetForm}><X className="w-4 h-4 text-text-secondary" /></button>
          </div>

          {/* Payment type toggle */}
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => setPaymentType('donation')}
              className={`flex-1 p-3 rounded-lg border text-center text-sm font-medium transition-colors ${
                paymentType === 'donation' ? 'border-green-300 bg-green-50 text-green-700' : 'border-border text-text-secondary hover:border-green-200'
              }`}
            >
              <IndianRupee className="w-4 h-4 mx-auto mb-1" />
              Donation
            </button>
            <button
              type="button"
              onClick={() => setPaymentType('membership')}
              className={`flex-1 p-3 rounded-lg border text-center text-sm font-medium transition-colors ${
                paymentType === 'membership' ? 'border-amber-300 bg-amber-50 text-amber-700' : 'border-border text-text-secondary hover:border-amber-200'
              }`}
            >
              <Crown className="w-4 h-4 mx-auto mb-1" />
              Membership (₹{MEMBERSHIP_FEE})
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">Select Member *</label>
              <select required value={form.user_id} onChange={(e) => setForm({ ...form, user_id: e.target.value })} className={`${inputClass} bg-white`}>
                <option value="">Choose member...</option>
                {members.map((m) => <option key={m.id} value={m.id}>{m.full_name}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {paymentType === 'donation' ? (
                <div>
                  <label className="block text-xs font-medium text-text-primary mb-1">Amount (₹) *</label>
                  <input type="number" required min="1" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className={inputClass} />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-text-primary mb-1">Amount</label>
                  <div className="px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-sm font-semibold text-amber-700">₹{MEMBERSHIP_FEE} (Fixed)</div>
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-text-primary mb-1">Payment Date *</label>
                <input type="text" required placeholder="YYYY-MM-DD" value={form.donation_date} onChange={(e) => setForm({ ...form, donation_date: e.target.value })} className={inputClass} />
              </div>
            </div>

            {paymentType === 'donation' && (
              <div>
                <label className="block text-xs font-medium text-text-primary mb-1">Purpose</label>
                <input type="text" placeholder="e.g. Annual Fund, Event Sponsorship" value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} className={inputClass} />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
              {saving ? '...' : editingId ? 'Update Payment' : paymentType === 'membership' ? 'Record & Activate Membership' : 'Record Donation'}
            </button>
          </form>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-1">
            <IndianRupee className="w-4 h-4 text-primary" />
            <p className="text-xs text-text-secondary">Total Collections</p>
          </div>
          <p className="text-xl font-bold text-text-primary">₹{totalAmount.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-1">
            <IndianRupee className="w-4 h-4 text-green-600" />
            <p className="text-xs text-text-secondary">Donations</p>
          </div>
          <p className="text-xl font-bold text-green-700">₹{donationTotal.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-1">
            <Crown className="w-4 h-4 text-amber-500" />
            <p className="text-xs text-text-secondary">Membership</p>
          </div>
          <p className="text-xl font-bold text-amber-600">₹{membershipTotal.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="w-4 h-4 text-violet-500" />
            <p className="text-xs text-text-secondary">Souvenir Collected</p>
          </div>
          <p className="text-xl font-bold text-violet-600">₹{souvenirCollected.toLocaleString()}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
          <input type="text" placeholder="Search by member name..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
          className="px-4 py-2 border border-border rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
          <option value="">All Payments</option>
          <option value="donation">Donation</option>
          <option value="membership">Membership</option>
          <option value="souvenir">Souvenir</option>
        </select>
      </div>

      {/* Table */}
      {filtered.length === 0 && filteredSouvenirs.length === 0 ? (
        <div className="bg-white rounded-xl border border-border p-8 text-center text-text-secondary">No payments found.</div>
      ) : (
        <>
          {/* Mobile card list */}
          <div className="sm:hidden space-y-2">
            {filtered.map((p) => (
              <div key={p.id} className="bg-white rounded-xl border border-border p-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-text-primary text-sm truncate">{p.profiles?.full_name}</p>
                  <p className="text-xs text-text-secondary">{formatDate(p.donation_date, 'en')}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-semibold text-sm text-text-primary">₹{Number(p.amount).toLocaleString()}</p>
                  {p.purpose === 'Executive Membership' ? (
                    <span className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded-full">Membership</span>
                  ) : (
                    <span className="text-[10px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded-full">Donation</span>
                  )}
                </div>
                {superAdmin && (
                  <div className="flex gap-2 shrink-0">
                    <a href={`/admin/payments/edit/${p.id}`} className="text-text-secondary hover:text-primary"><Edit2 className="w-4 h-4" /></a>
                    <button onClick={() => handleDelete(p.id)} className="text-text-secondary hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                )}
              </div>
            ))}
            {filteredSouvenirs.map((s: any) => (
              <div key={`sov-${s.id}`} className="bg-white rounded-xl border border-border p-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-text-primary text-sm truncate">{s.sponsor_name}</p>
                  <p className="text-xs text-text-secondary">{s.created_at ? formatDate(s.created_at.split('T')[0], 'en') : '—'}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-semibold text-sm text-text-primary">₹{Number(s.amount).toLocaleString()}</p>
                  <span className="text-[10px] bg-violet-50 text-violet-700 px-1.5 py-0.5 rounded-full">Souvenir</span>
                </div>
                {superAdmin && (
                  <button onClick={() => downloadSouvenirReceipt(s)} className="shrink-0 text-text-secondary hover:text-emerald-600">
                    <FileDown className="w-4 h-4" />
                  </button>
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
                    <th className="px-4 py-3 font-medium text-text-secondary">Member</th>
                    <th className="px-4 py-3 font-medium text-text-secondary">Amount</th>
                    <th className="px-4 py-3 font-medium text-text-secondary">Date</th>
                    <th className="px-4 py-3 font-medium text-text-secondary">Type</th>
                    <th className="px-4 py-3 font-medium text-text-secondary">Payment</th>
                    {superAdmin && <th className="px-4 py-3 font-medium text-text-secondary">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr key={p.id} className="border-b border-border/50 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-text-primary">{p.profiles?.full_name}</td>
                      <td className="px-4 py-3 font-semibold text-text-primary">&#8377;{Number(p.amount).toLocaleString()}</td>
                      <td className="px-4 py-3 text-text-secondary">{formatDate(p.donation_date, 'en')}</td>
                      <td className="px-4 py-3">
                        {p.purpose === 'Souvenir Ad' ? (
                          <span className="text-xs bg-violet-50 text-violet-700 px-2 py-0.5 rounded-full flex items-center gap-1 w-fit">
                            <BookOpen className="w-3 h-3" /> Souvenir
                          </span>
                        ) : p.purpose === 'Executive Membership' ? (
                          <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full flex items-center gap-1 w-fit">
                            <Crown className="w-3 h-3" /> Membership
                          </span>
                        ) : (
                          <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">Donation</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-text-secondary">{p.payment_method || '—'}</td>
                      {superAdmin && (
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button onClick={() => downloadReceipt(p)} className="flex items-center gap-1 text-xs text-text-secondary hover:text-emerald-600">
                              <FileDown className="w-3.5 h-3.5" /> Receipt
                            </button>
                            <a href={`/admin/payments/edit/${p.id}`} className="flex items-center gap-1 text-xs text-text-secondary hover:text-primary">
                              <Edit2 className="w-3.5 h-3.5" /> Edit
                            </a>
                            <button onClick={() => handleDelete(p.id)} className="flex items-center gap-1 text-xs text-text-secondary hover:text-red-500">
                              <Trash2 className="w-3.5 h-3.5" /> Delete
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                  {/* Souvenir rows */}
                  {filteredSouvenirs.map((s: any) => (
                    <tr key={`sov-${s.id}`} className="border-b border-border/50 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-text-primary">
                        {s.sponsor_name}
                        {s.company_name && <p className="text-[10px] text-text-secondary">{s.company_name}</p>}
                      </td>
                      <td className="px-4 py-3 font-semibold text-text-primary">₹{Number(s.amount).toLocaleString()}</td>
                      <td className="px-4 py-3 text-text-secondary">{s.created_at ? formatDate(s.created_at.split('T')[0], 'en') : '—'}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs bg-violet-50 text-violet-700 px-2 py-0.5 rounded-full flex items-center gap-1 w-fit">
                          <BookOpen className="w-3 h-3" /> Souvenir
                        </span>
                        {s.souvenirs?.title && <p className="text-[10px] text-text-secondary mt-0.5">{s.souvenirs.title}</p>}
                      </td>
                      <td className="px-4 py-3 text-xs text-text-secondary">{s.payment_mode || '—'}</td>
                      {superAdmin && (
                        <td className="px-4 py-3">
                          <button onClick={() => downloadSouvenirReceipt(s)} className="flex items-center gap-1 text-xs text-text-secondary hover:text-emerald-600">
                            <FileDown className="w-3.5 h-3.5" /> Receipt
                          </button>
                        </td>
                      )}
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
