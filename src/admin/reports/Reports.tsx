import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, IndianRupee, Crown, Heart, BookOpen } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { formatDate } from '../../lib/utils'
import { Spinner } from '../../components/ui/Spinner'

interface TxRow {
  id: string
  date: string
  type: 'in' | 'out'
  category: string
  description: string
  amount: number
  mode: string | null
  member?: string
}

const YEARS = ['2023', '2024', '2025', '2026']

export function Reports() {
  const [year, setYear] = useState(new Date().getFullYear().toString())
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState<TxRow[]>([])
  const [categoryFilter, setCategoryFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'in' | 'out'>('all')

  useEffect(() => { fetchAll() }, [year])

  async function fetchAll() {
    setLoading(true)
    const start = `${year}-01-01`
    const end   = `${year}-12-31`

    const [donRes, expRes, suvRes] = await Promise.all([
      supabase.from('donations').select('id, amount, donation_date, purpose, payment_method, profiles!donations_user_id_fkey(full_name)')
        .gte('donation_date', start).lte('donation_date', end).order('donation_date', { ascending: false }),
      supabase.from('expenses').select('id, amount, expense_date, category, title, payment_mode')
        .gte('expense_date', start).lte('expense_date', end).order('expense_date', { ascending: false }),
      supabase.from('souvenir_sponsors').select('id, amount, created_at, sponsor_name, payment_mode')
        .eq('is_paid', true)
        .gte('created_at', `${year}-01-01T00:00:00`).lte('created_at', `${year}-12-31T23:59:59`),
    ])

    const rows: TxRow[] = []

    // Donations (IN)
    for (const d of (donRes.data || []) as any[]) {
      rows.push({
        id: d.id, date: d.donation_date, type: 'in',
        category: d.purpose === 'Executive Membership' ? 'Membership' : 'Donation',
        description: d.purpose || 'General Donation',
        amount: Number(d.amount),
        mode: d.payment_method,
        member: d.profiles?.full_name,
      })
    }

    // Souvenir sponsors (IN)
    for (const s of (suvRes.data || []) as any[]) {
      rows.push({
        id: s.id, date: s.created_at?.split('T')[0], type: 'in',
        category: 'Souvenir',
        description: `Ad sponsorship — ${s.sponsor_name || ''}`,
        amount: Number(s.amount),
        mode: s.payment_mode,
      })
    }

    // Expenses (OUT)
    for (const e of (expRes.data || []) as any[]) {
      rows.push({
        id: e.id, date: e.expense_date, type: 'out',
        category: e.category || 'Expense',
        description: e.title,
        amount: Number(e.amount),
        mode: e.payment_mode,
      })
    }

    // Sort by date desc
    rows.sort((a, b) => b.date.localeCompare(a.date))
    setTransactions(rows)
    setLoading(false)
  }

  const totalIn  = transactions.filter((t) => t.type === 'in').reduce((s, t) => s + t.amount, 0)
  const totalOut = transactions.filter((t) => t.type === 'out').reduce((s, t) => s + t.amount, 0)
  const net      = totalIn - totalOut

  const membershipTotal = transactions.filter((t) => t.category === 'Membership').reduce((s, t) => s + t.amount, 0)
  const donationTotal   = transactions.filter((t) => t.category === 'Donation').reduce((s, t) => s + t.amount, 0)
  const souvenirTotal   = transactions.filter((t) => t.category === 'Souvenir').reduce((s, t) => s + t.amount, 0)

  const categories = [...new Set(transactions.map((t) => t.category))]

  const filtered = transactions.filter((t) => {
    const matchType = typeFilter === 'all' || t.type === typeFilter
    const matchCat  = !categoryFilter || t.category === categoryFilter
    return matchType && matchCat
  })

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Financial Report</h1>
          <p className="text-sm text-text-secondary mt-0.5">All transactions — income & expenses</p>
        </div>
        {/* Year selector */}
        <div className="flex gap-2">
          {YEARS.map((y) => (
            <button key={y} onClick={() => setYear(y)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold border-2 transition-colors ${year === y ? 'bg-primary text-white border-primary' : 'border-border text-text-secondary hover:border-primary/40'}`}>
              {y}
            </button>
          ))}
        </div>
      </div>

      {loading ? <div className="flex justify-center py-20"><Spinner size="lg" /></div> : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            <div className="col-span-2 sm:col-span-1 lg:col-span-2 bg-white rounded-xl border border-border p-4">
              <div className="flex items-center gap-2 mb-1"><TrendingUp className="w-4 h-4 text-green-600" /><p className="text-xs text-text-secondary">Total Income</p></div>
              <p className="text-2xl font-bold text-green-600">₹{totalIn.toLocaleString()}</p>
            </div>
            <div className="col-span-2 sm:col-span-1 lg:col-span-2 bg-white rounded-xl border border-border p-4">
              <div className="flex items-center gap-2 mb-1"><TrendingDown className="w-4 h-4 text-red-500" /><p className="text-xs text-text-secondary">Total Expenses</p></div>
              <p className="text-2xl font-bold text-red-500">₹{totalOut.toLocaleString()}</p>
            </div>
            <div className={`col-span-2 sm:col-span-1 lg:col-span-2 rounded-xl border p-4 ${net >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-center gap-2 mb-1"><IndianRupee className={`w-4 h-4 ${net >= 0 ? 'text-green-700' : 'text-red-600'}`} /><p className="text-xs text-text-secondary">Net Balance</p></div>
              <p className={`text-2xl font-bold ${net >= 0 ? 'text-green-700' : 'text-red-600'}`}>{net >= 0 ? '+' : ''}₹{net.toLocaleString()}</p>
            </div>
          </div>

          {/* Income breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            <div className="bg-white rounded-xl border border-border p-4">
              <div className="flex items-center gap-2 mb-1"><Crown className="w-4 h-4 text-amber-500" /><p className="text-xs text-text-secondary">Membership</p></div>
              <p className="text-xl font-bold text-amber-600">₹{membershipTotal.toLocaleString()}</p>
              <p className="text-[10px] text-text-secondary mt-0.5">{transactions.filter(t=>t.category==='Membership').length} payments</p>
            </div>
            <div className="bg-white rounded-xl border border-border p-4">
              <div className="flex items-center gap-2 mb-1"><Heart className="w-4 h-4 text-green-600" /><p className="text-xs text-text-secondary">Donations</p></div>
              <p className="text-xl font-bold text-green-600">₹{donationTotal.toLocaleString()}</p>
              <p className="text-[10px] text-text-secondary mt-0.5">{transactions.filter(t=>t.category==='Donation').length} donations</p>
            </div>
            <div className="bg-white rounded-xl border border-border p-4">
              <div className="flex items-center gap-2 mb-1"><BookOpen className="w-4 h-4 text-violet-500" /><p className="text-xs text-text-secondary">Souvenir</p></div>
              <p className="text-xl font-bold text-violet-600">₹{souvenirTotal.toLocaleString()}</p>
              <p className="text-[10px] text-text-secondary mt-0.5">{transactions.filter(t=>t.category==='Souvenir').length} sponsors</p>
            </div>
          </div>

          {/* Expense by category */}
          {transactions.filter(t=>t.type==='out').length > 0 && (
            <div className="bg-white rounded-xl border border-border p-4 mb-6">
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-3">Expense Breakdown</p>
              <div className="flex flex-wrap gap-3">
                {[...new Set(transactions.filter(t=>t.type==='out').map(t=>t.category))].map((cat) => {
                  const total = transactions.filter(t=>t.type==='out' && t.category===cat).reduce((s,t)=>s+t.amount,0)
                  return (
                    <div key={cat} className="bg-red-50 rounded-lg px-3 py-2 text-center">
                      <p className="text-[10px] text-red-600 font-medium">{cat}</p>
                      <p className="text-sm font-bold text-red-700">₹{total.toLocaleString()}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="flex gap-1.5">
              {(['all','in','out'] as const).map((t) => (
                <button key={t} onClick={() => setTypeFilter(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${typeFilter===t ? (t==='in'?'bg-green-600 text-white':t==='out'?'bg-red-600 text-white':'bg-primary text-white') : 'bg-white border border-border text-text-secondary hover:bg-gray-50'}`}>
                  {t==='all'?'All':t==='in'?'↑ Income':'↓ Expense'}
                </button>
              ))}
            </div>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 border border-border rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
              <option value="">All Categories</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <p className="text-xs text-text-secondary self-center ml-auto">{filtered.length} transactions · ₹{filtered.reduce((s,t)=>s+(t.type==='in'?t.amount:0),0).toLocaleString()} in · ₹{filtered.reduce((s,t)=>s+(t.type==='out'?t.amount:0),0).toLocaleString()} out</p>
          </div>

          {/* Transaction table */}
          <div className="bg-white rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-gray-50 text-left">
                    <th className="px-4 py-3 font-medium text-text-secondary">Date</th>
                    <th className="px-4 py-3 font-medium text-text-secondary">Type</th>
                    <th className="px-4 py-3 font-medium text-text-secondary">Category</th>
                    <th className="px-4 py-3 font-medium text-text-secondary">Description</th>
                    <th className="px-4 py-3 font-medium text-text-secondary">Member</th>
                    <th className="px-4 py-3 font-medium text-text-secondary">Mode</th>
                    <th className="px-4 py-3 font-medium text-text-secondary text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={7} className="px-4 py-10 text-center text-text-secondary text-sm">No transactions for {year}</td></tr>
                  ) : filtered.map((t) => (
                    <tr key={t.id + t.date} className="border-b border-border hover:bg-gray-50">
                      <td className="px-4 py-3 text-text-secondary whitespace-nowrap">{formatDate(t.date, 'en')}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${t.type === 'in' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                          {t.type === 'in' ? '↑ IN' : '↓ OUT'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs bg-gray-100 text-text-secondary px-2 py-0.5 rounded-full">{t.category}</span>
                      </td>
                      <td className="px-4 py-3 text-text-primary">{t.description}</td>
                      <td className="px-4 py-3 text-text-secondary text-xs">{t.member || '—'}</td>
                      <td className="px-4 py-3 text-text-secondary text-xs">{t.mode || '—'}</td>
                      <td className={`px-4 py-3 font-semibold text-right ${t.type === 'in' ? 'text-green-600' : 'text-red-500'}`}>
                        {t.type === 'in' ? '+' : '-'}₹{t.amount.toLocaleString()}
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
