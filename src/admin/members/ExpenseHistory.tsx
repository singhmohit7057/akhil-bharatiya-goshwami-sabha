import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Plus, Search, Trash2, TrendingDown, IndianRupee, Tag, Pencil, ChevronDown } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { logAction } from '../../lib/adminLog'
import { supabase } from '../../lib/supabase'
import { formatDate } from '../../lib/utils'
import { Spinner } from '../../components/ui/Spinner'

interface Expense {
  id: string
  title: string
  category: string | null
  amount: number
  expense_date: string
  payment_mode: string | null
  paid_to: string | null
  paid_by: string | null
  notes: string | null
  created_at: string
  profiles?: { full_name: string } | null
}

export function ExpenseHistory() {
  const { canWrite } = useAuth()
  const canEdit = canWrite('payments')
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')

  useEffect(() => { fetchExpenses() }, [])

  async function fetchExpenses() {
    const { data } = await supabase.from('expenses').select('*, profiles!expenses_paid_by_fkey(full_name)').order('expense_date', { ascending: false })
    setExpenses((data as Expense[]) || [])
    setLoading(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this expense?')) return
    const exp = expenses.find(e => e.id === id)
    await supabase.from('expenses').delete().eq('id', id)
    logAction('delete', 'expense', exp ? `${exp.title} — ₹${exp.amount}` : id, id)
    toast.success('Deleted')
    fetchExpenses()
  }

  function getFY(dateStr: string): string {
    const d = new Date(dateStr)
    const yr = d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1
    return `${yr}-${String(yr + 1).slice(2)}`
  }

  const [expandedFY, setExpandedFY] = useState<Set<string>>(new Set([getFY(new Date().toISOString())]))
  function toggleFY(fy: string) {
    setExpandedFY(prev => { const next = new Set(prev); next.has(fy) ? next.delete(fy) : next.add(fy); return next })
  }

  const categories = [...new Set(expenses.map((e) => e.category).filter(Boolean))] as string[]

  const filtered = expenses.filter((e) => {
    const matchSearch = !search || e.title.toLowerCase().includes(search.toLowerCase()) || e.paid_to?.toLowerCase().includes(search.toLowerCase())
    const matchCat = !categoryFilter || e.category === categoryFilter
    return matchSearch && matchCat
  })

  const totalAmount = filtered.reduce((sum, e) => sum + Number(e.amount), 0)
  const thisMonth = filtered.filter((e) => {
    const d = new Date(e.expense_date)
    const now = new Date()
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).reduce((sum, e) => sum + Number(e.amount), 0)

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Expense History</h1>
          <p className="text-sm text-text-secondary mt-0.5">All recorded expenses</p>
        </div>
        {canEdit && <Link to="/admin/expenses/add" className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors">
          <Plus className="w-4 h-4" /> Add Expense
        </Link>}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="w-4 h-4 text-red-500" />
            <p className="text-xs text-text-secondary">Total Expenses</p>
          </div>
          <p className="text-xl font-bold text-red-600">₹{totalAmount.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-1">
            <IndianRupee className="w-4 h-4 text-orange-500" />
            <p className="text-xs text-text-secondary">This Month</p>
          </div>
          <p className="text-xl font-bold text-orange-600">₹{thisMonth.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-1">
            <Tag className="w-4 h-4 text-text-secondary" />
            <p className="text-xs text-text-secondary">Total Entries</p>
          </div>
          <p className="text-xl font-bold text-text-primary">{filtered.length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
          <input type="text" placeholder="Search by title or paid to..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2.5 border border-border rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-border p-10 text-center text-text-secondary text-sm">
          No expenses found.
        </div>
      ) : (
        <>
          {/* Mobile card list */}
          <div className="sm:hidden space-y-2">
            {filtered.map((e) => (
              <div key={e.id} className="bg-white rounded-xl border border-border p-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-text-primary text-sm truncate">{e.title}</p>
                  <p className="text-xs text-text-secondary">{formatDate(e.expense_date, 'en')}</p>
                  {e.category && (
                    <span className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded-full">{e.category}</span>
                  )}
                </div>
                <p className="font-semibold text-sm text-red-600 shrink-0">₹{Number(e.amount).toLocaleString()}</p>
                {canEdit && (
                  <div className="flex gap-1 shrink-0">
                    <Link to={`/admin/expenses/edit/${e.id}`} className="p-1.5 text-text-secondary hover:text-primary transition-colors">
                      <Pencil className="w-4 h-4" />
                    </Link>
                    <button onClick={() => handleDelete(e.id)} className="p-1.5 text-text-secondary hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Desktop — FY grouped */}
          <div className="hidden sm:block space-y-3">
            {(() => {
              const fyMap = new Map<string, Expense[]>()
              filtered.forEach(e => {
                const fy = getFY(e.expense_date)
                if (!fyMap.has(fy)) fyMap.set(fy, [])
                fyMap.get(fy)!.push(e)
              })
              const fys = Array.from(fyMap.keys()).sort((a, b) => b.localeCompare(a))
              return fys.map(fy => {
                const rows = fyMap.get(fy)!
                const fyTotal = rows.reduce((s, e) => s + Number(e.amount), 0)
                const isOpen = expandedFY.has(fy)
                return (
                  <div key={fy} className="bg-white rounded-xl border border-border overflow-hidden">
                    <button onClick={() => toggleFY(fy)}
                      className="w-full flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <ChevronDown className={`w-4 h-4 text-text-secondary transition-transform ${isOpen ? '' : '-rotate-90'}`} />
                        <span className="font-semibold text-text-primary">FY {fy}</span>
                        <span className="text-xs text-text-secondary">{rows.length} expense{rows.length !== 1 ? 's' : ''}</span>
                      </div>
                      <span className="text-sm font-bold text-red-600">₹{fyTotal.toLocaleString()}</span>
                    </button>
                    {isOpen && (
                      <div className="overflow-x-auto border-t border-border">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border bg-gray-50 text-left">
                              <th className="px-4 py-2.5 font-medium text-text-secondary">Title</th>
                              <th className="px-4 py-2.5 font-medium text-text-secondary">Category</th>
                              <th className="px-4 py-2.5 font-medium text-text-secondary">Amount</th>
                              <th className="px-4 py-2.5 font-medium text-text-secondary">Date</th>
                              <th className="px-4 py-2.5 font-medium text-text-secondary">Paid To</th>
                              <th className="px-4 py-2.5 font-medium text-text-secondary">Done By</th>
                              <th className="px-4 py-2.5 font-medium text-text-secondary">Mode</th>
                              {canEdit && <th className="px-4 py-2.5 font-medium text-text-secondary">Actions</th>}
                            </tr>
                          </thead>
                          <tbody>
                            {rows.map((e) => (
                              <tr key={e.id} className="border-b border-border hover:bg-gray-50">
                                <td className="px-4 py-3 font-medium text-text-primary">
                                  {e.title}
                                  {e.notes && <p className="text-xs text-text-secondary font-normal mt-0.5 truncate max-w-[200px]">{e.notes}</p>}
                                </td>
                                <td className="px-4 py-3">{e.category ? <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full">{e.category}</span> : '—'}</td>
                                <td className="px-4 py-3 font-semibold text-red-600">₹{Number(e.amount).toLocaleString()}</td>
                                <td className="px-4 py-3 text-text-secondary">{formatDate(e.expense_date, 'en')}</td>
                                <td className="px-4 py-3 text-text-secondary">{e.paid_to || '—'}</td>
                                <td className="px-4 py-3 text-text-secondary">{(e as any).profiles?.full_name || '—'}</td>
                                <td className="px-4 py-3 text-text-secondary">{e.payment_mode || '—'}</td>
                                {canEdit && (
                                  <td className="px-4 py-3">
                                    <div className="flex gap-1">
                                      <Link to={`/admin/expenses/edit/${e.id}`} className="p-1.5 text-text-secondary hover:text-primary transition-colors"><Pencil className="w-4 h-4" /></Link>
                                      <button onClick={() => handleDelete(e.id)} className="p-1.5 text-text-secondary hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
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
