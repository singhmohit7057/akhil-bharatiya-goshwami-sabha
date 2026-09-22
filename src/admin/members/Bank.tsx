import { useEffect, useState } from 'react'
import { Trash2, Landmark, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { formatDate } from '../../lib/utils'
import { DateInput } from '../../components/ui/DateInput'
import { MemberSelect } from '../../components/ui/MemberSelect'
import { Spinner } from '../../components/ui/Spinner'
import type { Profile } from '../../types'

interface BankTx {
  id: string
  type: 'deposit' | 'withdraw'
  amount: number
  transaction_date: string
  by_who: string | null
  bank_name: string | null
  purpose: string | null
  notes: string | null
  created_at: string
  profiles?: { full_name: string } | null
}

export function Bank() {
  const { user, isSuperAdmin } = useAuth()
  const superAdmin = isSuperAdmin()
  const [transactions, setTransactions] = useState<BankTx[]>([])
  const [members, setMembers] = useState<Profile[]>([])
  const [onlineIn, setOnlineIn] = useState(0)
  const [onlineOut, setOnlineOut] = useState(0)
  const [offlineIn, setOfflineIn] = useState(0)
  const [offlineOut, setOfflineOut] = useState(0)
  const [totalIn, setTotalIn] = useState(0)
  const [totalOut, setTotalOut] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'all' | 'deposit' | 'withdraw'>('all')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    amount: '',
    transaction_date: new Date().toISOString().split('T')[0],
    by_who: '',
    bank_name: '',
    purpose: '',
    notes: '',
  })

  const inputClass = 'w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30'

  useEffect(() => {
    Promise.all([
      supabase.from('bank_transactions').select('*, profiles!bank_transactions_by_who_fkey(full_name)').order('transaction_date', { ascending: false }),
      supabase.from('profiles').select('*').eq('account_status', 'active').order('full_name'),
      supabase.from('donations').select('amount, payment_method'),
      supabase.from('expenses').select('amount, payment_mode'),
    ]).then(([txRes, memRes, donRes, expRes]) => {
      setTransactions((txRes.data as BankTx[]) || [])
      setMembers((memRes.data as Profile[]) || [])
      const donations = (donRes.data || []) as any[]
      const expenses = (expRes.data || []) as any[]
      setOnlineIn(donations.filter(d => d.payment_method?.toLowerCase() === 'online').reduce((s, d) => s + Number(d.amount), 0))
      setOnlineOut(expenses.filter(e => e.payment_mode?.toLowerCase() === 'online').reduce((s, e) => s + Number(e.amount), 0))
      setOfflineIn(donations.filter(d => d.payment_method?.toLowerCase() === 'offline').reduce((s, d) => s + Number(d.amount), 0))
      setOfflineOut(expenses.filter(e => e.payment_mode?.toLowerCase() === 'offline').reduce((s, e) => s + Number(e.amount), 0))
      setTotalIn(donations.reduce((s, d) => s + Number(d.amount), 0))
      setTotalOut(expenses.reduce((s, e) => s + Number(e.amount), 0))
      setLoading(false)
    })
  }, [])

  function resetForm() {
    setForm({ amount: '', transaction_date: new Date().toISOString().split('T')[0], by_who: '', bank_name: '', purpose: '', notes: '' })
    setShowForm(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.by_who) { toast.error('Please select who made this transaction'); return }
    setSaving(true)
    const { error } = await supabase.from('bank_transactions').insert({
      type: activeTab,
      amount: parseFloat(form.amount),
      transaction_date: form.transaction_date,
      by_who: form.by_who,
      bank_name: form.bank_name || null,
      purpose: form.purpose || null,
      notes: form.notes || null,
      recorded_by: user?.id,
    })
    if (error) { toast.error('Failed to record'); setSaving(false); return }
    toast.success(`${activeTab === 'deposit' ? 'Cash deposit' : 'Cash withdrawal'} recorded`)
    resetForm()
    setSaving(false)
    const { data } = await supabase.from('bank_transactions').select('*, profiles!bank_transactions_by_who_fkey(full_name)').order('transaction_date', { ascending: false })
    if (data) setTransactions(data as BankTx[])
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this record?')) return
    await supabase.from('bank_transactions').delete().eq('id', id)
    toast.success('Deleted')
    setTransactions(transactions.filter(t => t.id !== id))
  }

  const deposits = transactions.filter(t => t.type === 'deposit')
  const withdrawals = transactions.filter(t => t.type === 'withdraw')
  const totalDeposited = deposits.reduce((s, t) => s + Number(t.amount), 0)
  const totalWithdrawn = withdrawals.reduce((s, t) => s + Number(t.amount), 0)
  const netOnline  = onlineIn  - onlineOut  + totalDeposited - totalWithdrawn
  const netOffline = offlineIn - offlineOut - totalDeposited + totalWithdrawn
  const netBalance = totalIn - totalOut
  const filtered = activeTab === 'all' ? transactions : transactions.filter(t => t.type === activeTab)

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Landmark className="w-6 h-6 text-primary" /> Bank
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">Track cash deposits and withdrawals</p>
        </div>
        {superAdmin && !showForm && (
          <div className="flex gap-2">
            <button onClick={() => { setActiveTab('deposit'); setShowForm(true) }}
              className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
              <ArrowDownToLine className="w-4 h-4" /> Cash Deposit
            </button>
            <button onClick={() => { setActiveTab('withdraw'); setShowForm(true) }}
              className="flex items-center gap-1.5 px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600">
              <ArrowUpFromLine className="w-4 h-4" /> Cash Withdraw
            </button>
          </div>
        )}
      </div>

      {/* Stats — 5 cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center gap-1.5 mb-1"><ArrowDownToLine className="w-3.5 h-3.5 text-green-600" /><p className="text-[10px] text-green-700 font-medium">Total Deposited</p></div>
          <p className="text-lg font-bold text-green-700">₹{totalDeposited.toLocaleString()}</p>
          <p className="text-[9px] text-green-600 mt-0.5">{deposits.length} records</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-1.5 mb-1"><ArrowUpFromLine className="w-3.5 h-3.5 text-red-500" /><p className="text-[10px] text-red-600 font-medium">Total Withdrawn</p></div>
          <p className="text-lg font-bold text-red-600">₹{totalWithdrawn.toLocaleString()}</p>
          <p className="text-[9px] text-red-500 mt-0.5">{withdrawals.length} records</p>
        </div>
        <div className={`rounded-xl p-4 border ${netOffline >= 0 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'}`}>
          <p className="text-[10px] text-text-secondary font-medium mb-1">Net Offline <span className="opacity-60">(Cash in Hand)</span></p>
          <p className={`text-lg font-bold ${netOffline >= 0 ? 'text-amber-700' : 'text-red-600'}`}>{netOffline >= 0 ? '+' : ''}₹{netOffline.toLocaleString()}</p>
        </div>
        <div className={`rounded-xl p-4 border ${netOnline >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-center gap-1.5 mb-1"><Landmark className="w-3.5 h-3.5 text-blue-600" /><p className="text-[10px] text-text-secondary font-medium">Net Online <span className="opacity-60">(Bank)</span></p></div>
          <p className={`text-lg font-bold ${netOnline >= 0 ? 'text-blue-700' : 'text-red-600'}`}>{netOnline >= 0 ? '+' : ''}₹{netOnline.toLocaleString()}</p>
        </div>
        <div className={`rounded-xl p-4 border ${netBalance >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <p className="text-[10px] text-text-secondary font-medium mb-1">Net Balance</p>
          <p className={`text-lg font-bold ${netBalance >= 0 ? 'text-green-700' : 'text-red-600'}`}>{netBalance >= 0 ? '+' : ''}₹{netBalance.toLocaleString()}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button onClick={() => { setActiveTab('all'); setShowForm(false) }}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'all' ? 'bg-primary text-white' : 'bg-white border border-border text-text-secondary hover:bg-primary/5'}`}>
          All
        </button>
        <button onClick={() => { setActiveTab('deposit'); setShowForm(false) }}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'deposit' ? 'bg-green-600 text-white' : 'bg-white border border-border text-text-secondary hover:bg-green-50'}`}>
          <ArrowDownToLine className="w-4 h-4" /> Cash Deposit
        </button>
        <button onClick={() => { setActiveTab('withdraw'); setShowForm(false) }}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'withdraw' ? 'bg-red-500 text-white' : 'bg-white border border-border text-text-secondary hover:bg-red-50'}`}>
          <ArrowUpFromLine className="w-4 h-4" /> Cash Withdraw
        </button>
      </div>

      {/* Add Form */}
      {showForm && superAdmin && (
        <div className="bg-white rounded-xl border border-border p-5 mb-6">
          <h3 className="text-sm font-semibold text-text-primary mb-4">
            {activeTab === 'deposit' ? '📥 Record Cash Deposit' : '📤 Record Cash Withdrawal'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-text-primary mb-1">Date *</label>
                <DateInput value={form.transaction_date} onChange={(v) => setForm({ ...form, transaction_date: v })} required />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-primary mb-1">Amount (₹) *</label>
                <input type="number" required min="1" step="0.01" placeholder="0.00" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className={inputClass} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">By Who *</label>
              <MemberSelect
                members={members.map(m => ({ id: m.id, full_name: m.full_name, role: m.role, email: (m as any).email, phone: (m as any).phone }))}
                value={form.by_who}
                onChange={(id) => setForm({ ...form, by_who: id })}
                placeholder="Select member..."
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-text-primary mb-1">Bank</label>
                <input type="text" placeholder="e.g. Bank of Baroda" value={form.bank_name} onChange={(e) => setForm({ ...form, bank_name: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-primary mb-1">Purpose</label>
                <input type="text" placeholder="e.g. Event collection, Office fund" value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} className={inputClass} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">Remark</label>
              <input type="text" placeholder="Optional" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={inputClass} />
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={saving}
                className={`px-5 py-2 text-white rounded-lg text-sm font-medium disabled:opacity-50 ${activeTab === 'deposit' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-500 hover:bg-red-600'}`}>
                {saving ? '...' : activeTab === 'deposit' ? 'Record Deposit' : 'Record Withdrawal'}
              </button>
              <button type="button" onClick={resetForm} className="px-4 py-2 border border-border rounded-lg text-sm text-text-secondary hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-border p-8 text-center text-text-secondary">
          No {activeTab === 'all' ? 'transactions' : activeTab === 'deposit' ? 'cash deposits' : 'cash withdrawals'} recorded yet.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-gray-50 text-left">
                <th className="px-4 py-3 font-medium text-text-secondary">Date</th>
                <th className="px-4 py-3 font-medium text-text-secondary">Amount</th>
                <th className="px-4 py-3 font-medium text-text-secondary">By Who</th>
                <th className="px-4 py-3 font-medium text-text-secondary">Bank</th>
                <th className="px-4 py-3 font-medium text-text-secondary">Purpose</th>
                <th className="px-4 py-3 font-medium text-text-secondary">Remark</th>
                {superAdmin && <th className="px-4 py-3 font-medium text-text-secondary">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id} className="border-b border-border/50 hover:bg-gray-50">
                  <td className="px-4 py-3 text-text-secondary whitespace-nowrap">{formatDate(t.transaction_date, 'en')}</td>
                  <td className={`px-4 py-3 font-semibold ${t.type === 'deposit' ? 'text-green-600' : 'text-red-500'}`}>
                    {t.type === 'deposit' ? '+' : '-'}₹{Number(t.amount).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-text-primary">{t.profiles?.full_name || '—'}</td>
                  <td className="px-4 py-3 text-text-secondary">{t.bank_name || '—'}</td>
                  <td className="px-4 py-3 text-text-secondary">{t.purpose || '—'}</td>
                  <td className="px-4 py-3 text-text-secondary">{t.notes || '—'}</td>
                  {superAdmin && (
                    <td className="px-4 py-3">
                      <button onClick={() => handleDelete(t.id)} className="text-text-secondary hover:text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border bg-gray-50">
                <td className="px-4 py-3 font-semibold">Total</td>
                <td className="px-4 py-3 font-bold text-text-primary">
                  {activeTab === 'all'
                    ? `₹${filtered.reduce((s, t) => s + (t.type === 'deposit' ? Number(t.amount) : -Number(t.amount)), 0).toLocaleString()}`
                    : `${activeTab === 'deposit' ? '+' : '-'}₹${filtered.reduce((s, t) => s + Number(t.amount), 0).toLocaleString()}`}
                </td>
                <td colSpan={superAdmin ? 5 : 4} />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}
