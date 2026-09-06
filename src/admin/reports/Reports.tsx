import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, IndianRupee, Crown, Heart, BookOpen, Download } from 'lucide-react'
import * as XLSX from 'xlsx'
import { useAuth } from '../../hooks/useAuth'
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
  const { isSuperAdmin } = useAuth()
  const superAdmin = isSuperAdmin()
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
      supabase.from('expenses').select('id, amount, expense_date, category, title, payment_mode, paid_to')
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
        description: `Ad sponsorship`,
        amount: Number(s.amount),
        mode: s.payment_mode,
        member: s.sponsor_name,
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
        member: e.paid_to,
      })
    }

    // Sort by date desc
    rows.sort((a, b) => b.date.localeCompare(a.date))
    setTransactions(rows)
    setLoading(false)
  }

  const totalIn  = transactions.filter((t) => t.type === 'in').reduce((s, t) => s + t.amount, 0)
  const totalOut = transactions.filter((t) => t.type === 'out').reduce((s, t) => s + t.amount, 0)
  const offlineIn  = transactions.filter((t) => t.type === 'in'  && t.mode?.toLowerCase() === 'offline').reduce((s, t) => s + t.amount, 0)
  const offlineOut = transactions.filter((t) => t.type === 'out' && t.mode?.toLowerCase() === 'offline').reduce((s, t) => s + t.amount, 0)
  const onlineIn   = transactions.filter((t) => t.type === 'in'  && t.mode?.toLowerCase() === 'online').reduce((s, t) => s + t.amount, 0)
  const onlineOut  = transactions.filter((t) => t.type === 'out' && t.mode?.toLowerCase() === 'online').reduce((s, t) => s + t.amount, 0)
  const netOffline = offlineIn - offlineOut
  const netOnline  = onlineIn  - onlineOut

  const membershipTotal = transactions.filter((t) => t.category === 'Membership').reduce((s, t) => s + t.amount, 0)
  const donationTotal   = transactions.filter((t) => t.category === 'Donation').reduce((s, t) => s + t.amount, 0)
  const souvenirTotal   = transactions.filter((t) => t.category === 'Souvenir').reduce((s, t) => s + t.amount, 0)


  const filtered = transactions.filter((t) => {
    const matchType = typeFilter === 'all' || t.type === typeFilter
    const matchCat  = !categoryFilter || (
      categoryFilter === 'Expense' ? t.type === 'out' : t.category === categoryFilter
    )
    return matchType && matchCat
  })

  async function exportReport() {
    const start = `${year}-01-01`
    const end   = `${year}-12-31`

    // Fetch fresh full data for export
    const [donRes, expRes, suvRes] = await Promise.all([
      supabase.from('donations')
        .select('amount, donation_date, purpose, payment_method, transaction_id, profiles!donations_user_id_fkey(full_name)')
        .gte('donation_date', start).lte('donation_date', end).order('donation_date', { ascending: false }),
      supabase.from('expenses')
        .select('title, category, amount, expense_date, payment_mode, paid_to, notes')
        .gte('expense_date', start).lte('expense_date', end).order('expense_date', { ascending: false }),
      supabase.from('souvenir_sponsors')
        .select('sponsor_name, company_name, phone, created_at, ad_size, amount, payment_mode, notes, souvenirs(title)')
        .eq('is_paid', true)
        .gte('created_at', `${year}-01-01T00:00:00`).lte('created_at', `${year}-12-31T23:59:59`),
    ])

    const wb = XLSX.utils.book_new()
    const col = (w: number) => ({ wch: w })

    // Sheet 1: Dashboard
    const wsDash = XLSX.utils.aoa_to_sheet([
      [`Financial Report — ${year}`],
      [],
      ['Summary', 'Amount (₹)'],
      ['Total Income', totalIn],
      ['Total Expense', totalOut],
      ['Net Balance', totalIn - totalOut],
      [],
      ['By Payment Mode', ''],
      ['Offline Income', offlineIn],
      ['Offline Expense', offlineOut],
      ['Net Offline', netOffline],
      [],
      ['Online Income', onlineIn],
      ['Online Expense', onlineOut],
      ['Net Online', netOnline],
      [],
      ['Income Breakdown', ''],
      ['Total Membership', membershipTotal],
      ['Total Donation', donationTotal],
      ['Total Souvenir', souvenirTotal],
    ])
    wsDash['!cols'] = [col(28), col(16)]
    XLSX.utils.book_append_sheet(wb, wsDash, 'Dashboard')

    // Sheet 2: Membership
    const memberships = ((donRes.data || []) as any[])
      .filter(d => d.purpose === 'Executive Membership')
      .map(d => ({
        'Member':           d.profiles?.full_name || '',
        'Payment Date':     d.donation_date,
        'Membership Date':  d.donation_date,
        'Amount (₹)':       Number(d.amount),
        'Mode':             d.payment_method || '',
        'Remark':           d.transaction_id || '',
      }))
    const wsM = XLSX.utils.json_to_sheet(memberships.length ? memberships : [{ Note: 'No data' }])
    wsM['!cols'] = [col(26), col(16), col(16), col(12), col(12), col(24)]
    XLSX.utils.book_append_sheet(wb, wsM, 'Membership')

    // Sheet 3: Donations
    const donations = ((donRes.data || []) as any[])
      .filter(d => d.purpose !== 'Executive Membership')
      .map(d => ({
        'Member':      d.profiles?.full_name || '',
        'Date':        d.donation_date,
        'Description': d.purpose || 'General Donation',
        'Amount (₹)':  Number(d.amount),
        'Mode':        d.payment_method || '',
        'Remark':      d.transaction_id || '',
      }))
    const wsD = XLSX.utils.json_to_sheet(donations.length ? donations : [{ Note: 'No data' }])
    wsD['!cols'] = [col(26), col(16), col(28), col(12), col(12), col(24)]
    XLSX.utils.book_append_sheet(wb, wsD, 'Donations')

    // Sheet 4: Souvenir
    const souvenirs = ((suvRes.data || []) as any[]).map(s => ({
      'Sponsor':     s.sponsor_name || '',
      'Company':     s.company_name || '',
      'Phone':       s.phone || '',
      'Date':        s.created_at?.split('T')[0] || '',
      'Ad Size':     s.ad_size === 'full_page' ? 'Full Page' : 'Half Page',
      'Amount (₹)':  Number(s.amount),
      'Mode':        s.payment_mode || '',
      'Remark':      s.notes || (s.souvenirs as any)?.title || '',
    }))
    const wsS = XLSX.utils.json_to_sheet(souvenirs.length ? souvenirs : [{ Note: 'No data' }])
    wsS['!cols'] = [col(24), col(22), col(14), col(14), col(12), col(12), col(12), col(24)]
    XLSX.utils.book_append_sheet(wb, wsS, 'Souvenir')

    // Sheet 5: Expenses
    const expenses = ((expRes.data || []) as any[]).map(e => ({
      'Date':        e.expense_date,
      'Title':       e.title,
      'Category':    e.category || '',
      'Paid To':     e.paid_to || '',
      'Amount (₹)':  Number(e.amount),
      'Mode':        e.payment_mode || '',
      'Remark':      e.notes || '',
    }))
    const wsE = XLSX.utils.json_to_sheet(expenses.length ? expenses : [{ Note: 'No data' }])
    wsE['!cols'] = [col(14), col(28), col(18), col(22), col(12), col(12), col(24)]
    XLSX.utils.book_append_sheet(wb, wsE, 'Expenses')

    XLSX.writeFile(wb, `ABGSPB_Financial_Report_${year}.xlsx`)
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Financial Report</h1>
            <p className="text-sm text-text-secondary mt-0.5">All transactions — income & expenses</p>
          </div>
          {superAdmin && !loading && transactions.length > 0 && (
            <button onClick={exportReport}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors shadow-sm shrink-0">
              <Download className="w-4 h-4" /> Export Excel
            </button>
          )}
        </div>
        {/* Year selector — next line on mobile */}
        <div className="flex gap-2 flex-wrap mt-3">
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
          {/* Stats breakdown */}
          <div className="space-y-3 mb-6">
            {/* Row 1: Total Income / Expense / Net */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white rounded-xl border border-border p-4">
                <div className="flex items-center gap-1.5 mb-1"><TrendingUp className="w-3.5 h-3.5 text-green-600" /><p className="text-xs text-text-secondary font-medium">Total Income</p></div>
                <p className="text-xl font-bold text-green-600">₹{totalIn.toLocaleString()}</p>
              </div>
              <div className="bg-white rounded-xl border border-border p-4">
                <div className="flex items-center gap-1.5 mb-1"><TrendingDown className="w-3.5 h-3.5 text-red-500" /><p className="text-xs text-text-secondary font-medium">Total Expense</p></div>
                <p className="text-xl font-bold text-red-500">₹{totalOut.toLocaleString()}</p>
              </div>
              <div className={`rounded-xl border p-4 ${(totalIn - totalOut) >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-center gap-1.5 mb-1"><IndianRupee className={`w-3.5 h-3.5 ${(totalIn - totalOut) >= 0 ? 'text-green-700' : 'text-red-600'}`} /><p className="text-xs text-text-secondary font-medium">Net Balance</p></div>
                <p className={`text-xl font-bold ${(totalIn - totalOut) >= 0 ? 'text-green-700' : 'text-red-600'}`}>{(totalIn - totalOut) >= 0 ? '+' : ''}₹{(totalIn - totalOut).toLocaleString()}</p>
              </div>
            </div>

            {/* Row 2–4: Mode breakdown inside a single card */}
            <div className="bg-white rounded-xl border border-border p-4">
              <p className="text-[10px] font-semibold text-text-secondary uppercase tracking-wide mb-3">By Payment Mode</p>
              <div className="grid grid-cols-3 gap-3">
                {/* Offline row */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-[10px] text-text-secondary mb-1">Offline Income</p>
                  <p className="text-base font-bold text-green-600">₹{offlineIn.toLocaleString()}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-[10px] text-text-secondary mb-1">Offline Expense</p>
                  <p className="text-base font-bold text-red-500">₹{offlineOut.toLocaleString()}</p>
                </div>
                <div className={`rounded-lg p-3 ${netOffline >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                  <p className="text-[10px] text-text-secondary mb-1">Net Offline</p>
                  <p className={`text-base font-bold ${netOffline >= 0 ? 'text-green-700' : 'text-red-600'}`}>{netOffline >= 0 ? '+' : ''}₹{netOffline.toLocaleString()}</p>
                </div>
                {/* Online row */}
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-[10px] text-blue-600 mb-1">Online Income</p>
                  <p className="text-base font-bold text-blue-700">₹{onlineIn.toLocaleString()}</p>
                </div>
                <div className="bg-orange-50 rounded-lg p-3">
                  <p className="text-[10px] text-orange-600 mb-1">Online Expense</p>
                  <p className="text-base font-bold text-orange-600">₹{onlineOut.toLocaleString()}</p>
                </div>
                <div className={`rounded-lg p-3 ${netOnline >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                  <p className="text-[10px] text-text-secondary mb-1">Net Online</p>
                  <p className={`text-base font-bold ${netOnline >= 0 ? 'text-green-700' : 'text-red-600'}`}>{netOnline >= 0 ? '+' : ''}₹{netOnline.toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Row 5: Income categories */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white rounded-xl border border-border p-4">
                <div className="flex items-center gap-1.5 mb-1"><Crown className="w-3.5 h-3.5 text-amber-500" /><p className="text-[10px] text-text-secondary font-medium">Total Membership</p></div>
                <p className="text-base font-bold text-amber-600">₹{membershipTotal.toLocaleString()}</p>
                <p className="text-[9px] text-text-secondary mt-0.5">{transactions.filter(t=>t.category==='Membership').length} payments</p>
              </div>
              <div className="bg-white rounded-xl border border-border p-4">
                <div className="flex items-center gap-1.5 mb-1"><Heart className="w-3.5 h-3.5 text-green-600" /><p className="text-[10px] text-text-secondary font-medium">Total Donation</p></div>
                <p className="text-base font-bold text-green-600">₹{donationTotal.toLocaleString()}</p>
                <p className="text-[9px] text-text-secondary mt-0.5">{transactions.filter(t=>t.category==='Donation').length} donations</p>
              </div>
              <div className="bg-white rounded-xl border border-border p-4">
                <div className="flex items-center gap-1.5 mb-1"><BookOpen className="w-3.5 h-3.5 text-violet-500" /><p className="text-[10px] text-text-secondary font-medium">Total Souvenir</p></div>
                <p className="text-base font-bold text-violet-600">₹{souvenirTotal.toLocaleString()}</p>
                <p className="text-[9px] text-text-secondary mt-0.5">{transactions.filter(t=>t.category==='Souvenir').length} sponsors</p>
              </div>
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
              <option value="Membership">Membership</option>
              <option value="Donation">Donation</option>
              <option value="Souvenir">Souvenir</option>
              <option value="Expense">Expense</option>
            </select>
            <p className="text-xs text-text-secondary self-center ml-auto">{filtered.length} transactions · ₹{filtered.reduce((s,t)=>s+(t.type==='in'?t.amount:0),0).toLocaleString()} in · ₹{filtered.reduce((s,t)=>s+(t.type==='out'?t.amount:0),0).toLocaleString()} out</p>
          </div>

          {/* Transaction table */}
          <div className="bg-white rounded-xl border border-border overflow-hidden">
            {/* Mobile card list */}
            <div className="sm:hidden divide-y divide-border">
              {filtered.length === 0 ? (
                <p className="px-4 py-8 text-center text-text-secondary text-sm">No transactions for {year}</p>
              ) : filtered.map((t) => (
                <div key={t.id + t.date} className="px-4 py-3 flex items-center gap-3">
                  <div className="shrink-0">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${t.type === 'in' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                      {t.type === 'in' ? '↑IN' : '↓OUT'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs bg-gray-100 text-text-secondary px-1.5 py-0.5 rounded-full">{t.category}</span>
                      <span className="text-xs text-text-secondary">{formatDate(t.date, 'en')}</span>
                    </div>
                    <p className="text-xs text-text-primary truncate mt-0.5">{t.description}</p>
                    {t.member && (
                      <p className="text-[10px] text-text-secondary">
                        <span className={`font-medium ${t.type === 'in' ? 'text-green-600' : 'text-red-500'}`}>{t.type === 'in' ? 'By ' : 'To '}</span>
                        {t.member}
                      </p>
                    )}
                  </div>
                  <p className={`text-sm font-semibold shrink-0 ${t.type === 'in' ? 'text-green-600' : 'text-red-500'}`}>
                    {t.type === 'in' ? '+' : '-'}₹{t.amount.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-gray-50 text-left">
                    <th className="px-4 py-3 font-medium text-text-secondary">Date</th>
                    <th className="px-4 py-3 font-medium text-text-secondary">Type</th>
                    <th className="px-4 py-3 font-medium text-text-secondary">Category</th>
                    <th className="px-4 py-3 font-medium text-text-secondary">Description</th>
                    <th className="px-4 py-3 font-medium text-text-secondary">Member / Client</th>
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
                      <td className="px-4 py-3 text-xs">
                        {t.member ? (
                          <span className="text-text-primary">
                            <span className={`text-[10px] font-medium mr-1 ${t.type === 'in' ? 'text-green-600' : 'text-red-500'}`}>
                              {t.type === 'in' ? 'By' : 'To'}
                            </span>
                            {t.member}
                          </span>
                        ) : '—'}
                      </td>
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
