import { useEffect, useState } from 'react'
import { Search, IndianRupee, Users, TrendingUp } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { formatDate } from '../../lib/utils'
import { Spinner } from '../../components/ui/Spinner'

interface OutsiderPayment {
  id: string
  donor_name: string
  amount: number
  donation_date: string
  purpose: string | null
  payment_method: string | null
  transaction_id: string | null
  reference_member: { full_name: string; member_id?: string } | null
}

export function OutsiderDonors() {
  const [payments, setPayments] = useState<OutsiderPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [refFilter, setRefFilter] = useState('')
  const [referenceMembers, setReferenceMembers] = useState<{ id: string; full_name: string }[]>([])

  useEffect(() => {
    supabase
      .from('donations')
      .select('id, donor_name, amount, donation_date, purpose, payment_method, transaction_id, reference_member:profiles!donations_reference_member_id_fkey(full_name, member_id)')
      .not('donor_name', 'is', null)
      .order('donation_date', { ascending: false })
      .then(({ data }) => {
        const rows = (data as any[]) || []
        setPayments(rows)
        // Build unique reference members list
        const seen = new Map<string, { id: string; full_name: string }>()
        rows.forEach((p) => {
          if (p.reference_member?.full_name) {
            seen.set(p.reference_member.full_name, { id: p.reference_member.full_name, full_name: p.reference_member.full_name })
          }
        })
        setReferenceMembers(Array.from(seen.values()).sort((a, b) => a.full_name.localeCompare(b.full_name)))
        setLoading(false)
      })
  }, [])

  const filtered = payments.filter((p) => {
    const matchSearch = !search ||
      p.donor_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.reference_member?.full_name?.toLowerCase().includes(search.toLowerCase())
    const matchRef = !refFilter || p.reference_member?.full_name === refFilter
    return matchSearch && matchRef
  })

  const totalAmount = filtered.reduce((s, p) => s + Number(p.amount), 0)

  // Top referrers
  const refTotals = payments.reduce((acc, p) => {
    const name = p.reference_member?.full_name || 'Unknown'
    acc[name] = (acc[name] || 0) + Number(p.amount)
    return acc
  }, {} as Record<string, number>)
  const topReferrers = Object.entries(refTotals).sort((a, b) => b[1] - a[1]).slice(0, 3)

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary mb-1">Outsider Donors</h1>
      <p className="text-sm text-text-secondary mb-6">Non-member donations brought through member references</p>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-1">
            <IndianRupee className="w-4 h-4 text-primary" />
            <p className="text-xs text-text-secondary">Total Collected</p>
          </div>
          <p className="text-xl font-bold text-text-primary">₹{payments.reduce((s, p) => s + Number(p.amount), 0).toLocaleString()}</p>
          <p className="text-[10px] text-text-secondary mt-0.5">{payments.length} payment{payments.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-blue-500" />
            <p className="text-xs text-text-secondary">Unique Donors</p>
          </div>
          <p className="text-xl font-bold text-text-primary">
            {new Set(payments.map(p => p.donor_name)).size}
          </p>
          <p className="text-[10px] text-text-secondary mt-0.5">individual donors</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <p className="text-xs text-text-secondary">Top Referrers</p>
          </div>
          {topReferrers.length > 0 ? (
            <div className="space-y-0.5 mt-1">
              {topReferrers.map(([name, amt]) => (
                <div key={name} className="flex justify-between text-xs">
                  <span className="text-text-primary font-medium truncate max-w-[120px]">{name}</span>
                  <span className="text-green-600 font-semibold shrink-0">₹{amt.toLocaleString()}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-secondary">—</p>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
          <input
            type="text"
            placeholder="Search by donor or reference member..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <select
          value={refFilter}
          onChange={(e) => setRefFilter(e.target.value)}
          className="px-4 py-2 border border-border rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="">All References</option>
          {referenceMembers.map((m) => (
            <option key={m.id} value={m.full_name}>{m.full_name}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-border p-10 text-center text-text-secondary">
          No outsider donations found.
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="sm:hidden space-y-2">
            {filtered.map((p) => (
              <div key={p.id} className="bg-white rounded-xl border border-border p-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-semibold text-text-primary">{p.donor_name}</p>
                  <p className="text-sm font-bold text-green-600">₹{Number(p.amount).toLocaleString()}</p>
                </div>
                <p className="text-xs text-text-secondary">{formatDate(p.donation_date, 'en')} · {p.payment_method || '—'}</p>
                {p.reference_member?.full_name && (
                  <p className="text-xs text-blue-600 mt-0.5">ref: {p.reference_member.full_name}</p>
                )}
                {(p.purpose || p.transaction_id) && (
                  <p className="text-xs text-text-secondary mt-0.5">{[p.purpose, p.transaction_id].filter(Boolean).join(' · ')}</p>
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
                    <th className="px-4 py-3 font-medium text-text-secondary">Donor Name</th>
                    <th className="px-4 py-3 font-medium text-text-secondary">Reference Member</th>
                    <th className="px-4 py-3 font-medium text-text-secondary">Date</th>
                    <th className="px-4 py-3 font-medium text-text-secondary">Purpose / Remark</th>
                    <th className="px-4 py-3 font-medium text-text-secondary">Mode</th>
                    <th className="px-4 py-3 font-medium text-text-secondary text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr key={p.id} className="border-b border-border/50 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-text-primary">{p.donor_name}</td>
                      <td className="px-4 py-3">
                        {p.reference_member?.full_name
                          ? <span className="text-blue-600 text-xs font-medium">{p.reference_member.full_name}</span>
                          : <span className="text-text-secondary text-xs">—</span>}
                      </td>
                      <td className="px-4 py-3 text-text-secondary">{formatDate(p.donation_date, 'en')}</td>
                      <td className="px-4 py-3 text-xs text-text-secondary">
                        {[p.purpose, p.transaction_id].filter(Boolean).join(' · ') || '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-text-secondary">{p.payment_method || '—'}</td>
                      <td className="px-4 py-3 text-right font-semibold text-green-600">₹{Number(p.amount).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-border bg-gray-50">
                    <td colSpan={5} className="px-4 py-3 text-xs text-text-secondary font-medium">{filtered.length} record{filtered.length !== 1 ? 's' : ''}</td>
                    <td className="px-4 py-3 text-right font-bold text-text-primary">₹{totalAmount.toLocaleString()}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
