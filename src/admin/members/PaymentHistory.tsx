import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IndianRupee, Crown, Search, Plus, Edit2, Trash2, BookOpen, FileDown, ChevronDown } from 'lucide-react'
import { generatePaymentReceiptPdf, generateSouvenirReceiptPdf } from '../../lib/receiptPdf'
import { logAction } from '../../lib/adminLog'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'

import { formatDate } from '../../lib/utils'
import type { Donation, Profile } from '../../types'
import { Spinner } from '../../components/ui/Spinner'

interface PaymentWithProfile extends Donation {
  profiles: Pick<Profile, 'full_name' | 'email'> & { member_id?: string; membership_start_date?: string; membership_end_date?: string }
  donor_name?: string | null
  reference_member?: { full_name: string } | null
}

export function PaymentHistory() {
  const { isSuperAdmin } = useAuth()
  const superAdmin = isSuperAdmin()
  const navigate = useNavigate()
  const [payments, setPayments] = useState<PaymentWithProfile[]>([])
  const [souvenirPayments, setSouvenirPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [souvenirCollected, setSouvenirCollected] = useState(0)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [modeFilter, setModeFilter] = useState('')

  useEffect(() => {
    Promise.all([
      supabase.from('donations').select('*, profiles!donations_user_id_fkey(full_name, email, member_id, membership_start_date, membership_end_date), donor_name, reference_member:profiles!donations_reference_member_id_fkey(full_name)').order('donation_date', { ascending: false }),
      supabase.from('souvenir_sponsors').select('*, souvenirs(title, event_name, year)').eq('is_paid', true).order('created_at', { ascending: false }),
    ]).then(([payRes, souvenirRes]) => {
      setPayments((payRes.data as PaymentWithProfile[]) || [])
      const sData = (souvenirRes.data || []) as any[]
      setSouvenirPayments(sData)
      setSouvenirCollected(sData.reduce((sum, s) => sum + Number(s.amount), 0))
      setLoading(false)
    })
  }, [])

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
    const isOutsider = !!(p as any).donor_name
    generatePaymentReceiptPdf({
      id: p.id,
      amount: p.amount,
      donation_date: p.donation_date,
      purpose: p.purpose,
      payment_method: p.payment_method,
      transaction_id: p.transaction_id,
      memberName: isOutsider ? ((p as any).donor_name || '') : (p.profiles?.full_name || ''),
      nameLabel: isOutsider ? 'Name' : undefined,
      memberId: isOutsider ? undefined : (p.profiles?.member_id || undefined),
      memberEmail: isOutsider ? undefined : (p.profiles?.email || undefined),
      referenceName: isOutsider ? (p.profiles?.full_name || (p as any).reference_member?.full_name || undefined) : undefined,
      membershipStartDate: p.purpose === 'Executive Membership' ? ((p as any).membership_start_date || undefined) : undefined,
      membershipEndDate: undefined, // always calculated as start + 1 year
    })
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this payment record?')) return
    const deletingPayment = payments.find(p => p.id === id)
    const isMemPayment = deletingPayment?.purpose === 'Executive Membership'
    const memberId = deletingPayment?.user_id

    await supabase.from('donations').delete().eq('id', id)
    logAction('delete', 'payment', `₹${deletingPayment?.amount} — ${deletingPayment?.purpose || 'Donation'}`, id)

    if (isMemPayment && memberId) {
      const { data: remaining } = await supabase.from('donations').select('id').eq('user_id', memberId).eq('purpose', 'Executive Membership')
      if (!remaining || remaining.length === 0) {
        const { data: mProf } = await supabase.from('profiles').select('role').eq('id', memberId).single()
        const roleRevert = mProf?.role === 'executive_member' ? { role: 'member' } : {}
        await supabase.from('profiles').update({
          is_executive_member: false,
          membership_start_date: null,
          membership_end_date: null,
          ...roleRevert,
        }).eq('id', memberId)
        toast.success('Payment deleted — Executive status revoked (no remaining membership payments)')
      } else {
        toast.success('Payment deleted')
      }
    } else {
      toast.success('Payment deleted')
    }

    const { data } = await supabase.from('donations').select('*, profiles!donations_user_id_fkey(full_name, email, member_id, membership_start_date, membership_end_date), donor_name, reference_member:profiles!donations_reference_member_id_fkey(full_name)').order('donation_date', { ascending: false })
    if (data) setPayments(data as PaymentWithProfile[])
  }

  // FY helpers (Apr–Mar)
  function getFY(dateStr: string): string {
    const d = new Date(dateStr)
    const yr = d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1
    return `${yr}-${String(yr + 1).slice(2)}`
  }
  function fyLabel(fy: string) { return `FY ${fy}` }

  const [expandedFY, setExpandedFY] = useState<Set<string>>(new Set([getFY(new Date().toISOString())]))
  function toggleFY(fy: string) {
    setExpandedFY(prev => {
      const next = new Set(prev)
      next.has(fy) ? next.delete(fy) : next.add(fy)
      return next
    })
  }

  const filteredDonations = typeFilter === 'souvenir' ? [] : payments.filter((p) => {
    const matchSearch = !search || p.profiles?.full_name?.toLowerCase().includes(search.toLowerCase()) || (p as any).donor_name?.toLowerCase().includes(search.toLowerCase())
    const matchType = !typeFilter
      ? true
      : typeFilter === 'membership'
        ? p.purpose === 'Executive Membership'
        : p.purpose !== 'Executive Membership'
    const matchMode = !modeFilter || p.payment_method?.toLowerCase() === modeFilter.toLowerCase()
    return matchSearch && matchType && matchMode
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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Payment History</h1>
          <p className="text-sm text-text-secondary mt-1">All donations and membership payments</p>
        </div>
        {superAdmin && (
          <button onClick={() => navigate('/admin/payments/add')} className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark">
            <Plus className="w-4 h-4" /> Add Payment
          </button>
        )}
      </div>

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
        <select value={modeFilter} onChange={(e) => setModeFilter(e.target.value)}
          className="px-4 py-2 border border-border rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
          <option value="">All Modes</option>
          <option value="Online">Online</option>
          <option value="Offline">Offline</option>
        </select>
      </div>

      {/* FY-grouped table */}
      {filtered.length === 0 && filteredSouvenirs.length === 0 ? (
        <div className="bg-white rounded-xl border border-border p-8 text-center text-text-secondary">No payments found.</div>
      ) : (
        <>
          {/* Mobile card list */}
          <div className="sm:hidden space-y-2">
            {filtered.map((p) => (
              <div key={p.id} className="bg-white rounded-xl border border-border p-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-text-primary text-sm truncate">
                    {(p as any).donor_name
                      ? <>{(p as any).donor_name}{(p as any).reference_member?.full_name && <span className="text-text-secondary font-normal"> ({(p as any).reference_member.full_name})</span>}</>
                      : p.profiles?.full_name}
                  </p>
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

          {/* Desktop — FY grouped */}
          <div className="hidden sm:block space-y-3">
            {(() => {
              // Group all rows by FY
              const allRows = [
                ...filtered.map(p => ({ ...p, _date: p.donation_date, _type: 'payment' as const })),
                ...filteredSouvenirs.map((s: any) => ({ ...s, _date: s.created_at?.split('T')[0] || '', _type: 'souvenir' as const })),
              ]
              const fyMap = new Map<string, typeof allRows>()
              allRows.forEach(r => {
                const fy = getFY(r._date)
                if (!fyMap.has(fy)) fyMap.set(fy, [])
                fyMap.get(fy)!.push(r)
              })
              const fys = Array.from(fyMap.keys()).sort((a, b) => b.localeCompare(a))

              return fys.map(fy => {
                const rows = fyMap.get(fy)!
                const fyTotal = rows.reduce((s, r) => s + Number(r.amount), 0)
                const isOpen = expandedFY.has(fy)
                return (
                  <div key={fy} className="bg-white rounded-xl border border-border overflow-hidden">
                    {/* FY Header */}
                    <button onClick={() => toggleFY(fy)}
                      className="w-full flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-2 flex-wrap">
                        <ChevronDown className={`w-4 h-4 text-text-secondary transition-transform shrink-0 ${isOpen ? '' : '-rotate-90'}`} />
                        <span className="font-semibold text-text-primary">{fyLabel(fy)}</span>
                        <span className="text-xs text-text-secondary">{rows.length} payment{rows.length !== 1 ? 's' : ''}</span>
                        {(() => {
                          const mem = rows.filter((r: any) => r._type === 'payment' && r.purpose === 'Executive Membership').length
                          const don = rows.filter((r: any) => r._type === 'payment' && r.purpose !== 'Executive Membership').length
                          const sov = rows.filter((r: any) => r._type === 'souvenir').length
                          return <>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${mem > 0 ? 'bg-amber-50 text-amber-700' : 'bg-gray-50 text-text-secondary'}`}>{mem} membership</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${don > 0 ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-text-secondary'}`}>{don} donation</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${sov > 0 ? 'bg-violet-50 text-violet-700' : 'bg-gray-50 text-text-secondary'}`}>{sov} souvenir</span>
                          </>
                        })()}
                      </div>
                      <span className="text-sm font-bold text-primary shrink-0">₹{fyTotal.toLocaleString()}</span>
                    </button>

                    {/* Rows */}
                    {isOpen && (
                      <div className="overflow-x-auto border-t border-border">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border bg-gray-50 text-left">
                              <th className="px-4 py-2.5 font-medium text-text-secondary">Member</th>
                              <th className="px-4 py-2.5 font-medium text-text-secondary">Amount</th>
                              <th className="px-4 py-2.5 font-medium text-text-secondary">Date</th>
                              <th className="px-4 py-2.5 font-medium text-text-secondary">Type</th>
                              <th className="px-4 py-2.5 font-medium text-text-secondary">Payment</th>
                              {superAdmin && <th className="px-4 py-2.5 font-medium text-text-secondary">Actions</th>}
                            </tr>
                          </thead>
                          <tbody>
                            {rows.map((r: any) => r._type === 'souvenir' ? (
                              <tr key={`sov-${r.id}`} className="border-b border-border/50 hover:bg-gray-50">
                                <td className="px-4 py-3 font-medium text-text-primary">{r.sponsor_name}{r.company_name && <p className="text-[10px] text-text-secondary">{r.company_name}</p>}</td>
                                <td className="px-4 py-3 font-semibold text-text-primary">₹{Number(r.amount).toLocaleString()}</td>
                                <td className="px-4 py-3 text-text-secondary">{r.created_at ? formatDate(r.created_at.split('T')[0], 'en') : '—'}</td>
                                <td className="px-4 py-3"><span className="text-xs bg-violet-50 text-violet-700 px-2 py-0.5 rounded-full flex items-center gap-1 w-fit"><BookOpen className="w-3 h-3" /> Souvenir</span>{r.souvenirs?.title && <p className="text-[10px] text-text-secondary mt-0.5">{r.souvenirs.title}</p>}</td>
                                <td className="px-4 py-3 text-xs text-text-secondary">{r.payment_mode || '—'}</td>
                                {superAdmin && <td className="px-4 py-3"><button onClick={() => downloadSouvenirReceipt(r)} className="flex items-center gap-1 text-xs text-text-secondary hover:text-emerald-600"><FileDown className="w-3.5 h-3.5" /> Receipt</button></td>}
                              </tr>
                            ) : (
                              <tr key={r.id} className="border-b border-border/50 hover:bg-gray-50">
                                <td className="px-4 py-3 font-medium text-text-primary">
                                  {r.donor_name ? <>{r.donor_name}{r.reference_member?.full_name && <span className="text-xs text-text-secondary font-normal ml-1">({r.reference_member.full_name})</span>}</> : r.profiles?.full_name}
                                </td>
                                <td className="px-4 py-3 font-semibold text-text-primary">₹{Number(r.amount).toLocaleString()}</td>
                                <td className="px-4 py-3 text-text-secondary">{formatDate(r.donation_date, 'en')}</td>
                                <td className="px-4 py-3">
                                  {r.purpose === 'Executive Membership'
                                    ? <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full flex items-center gap-1 w-fit"><Crown className="w-3 h-3" /> Membership</span>
                                    : <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">Donation</span>}
                                </td>
                                <td className="px-4 py-3 text-xs text-text-secondary">{r.payment_method || '—'}</td>
                                {superAdmin && (
                                  <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                      <button onClick={() => downloadReceipt(r)} className="flex items-center gap-1 text-xs text-text-secondary hover:text-emerald-600"><FileDown className="w-3.5 h-3.5" /> Receipt</button>
                                      <a href={`/admin/payments/edit/${r.id}`} className="flex items-center gap-1 text-xs text-text-secondary hover:text-primary"><Edit2 className="w-3.5 h-3.5" /> Edit</a>
                                      <button onClick={() => handleDelete(r.id)} className="flex items-center gap-1 text-xs text-text-secondary hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /> Delete</button>
                                    </div>
                                  </td>
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )
              })
            })()}
          </div>
        </>
      )}
    </div>
  )
}
