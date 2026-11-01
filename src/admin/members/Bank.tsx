import { useEffect, useState } from 'react'
import { Trash2, Landmark, ArrowDownToLine, ArrowUpFromLine, CreditCard, TrendingUp, Pencil, Check, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { logAction } from '../../lib/adminLog'
import { formatDate } from '../../lib/utils'
import { DateInput } from '../../components/ui/DateInput'
import { MemberSelect } from '../../components/ui/MemberSelect'
import { Spinner } from '../../components/ui/Spinner'
import type { Profile } from '../../types'

const nowB = new Date()
const currentFYB = nowB.getMonth() >= 3 ? nowB.getFullYear() : nowB.getFullYear() - 1
const FY_YEARS = Array.from({ length: currentFYB - 2023 + 1 }, (_, i) => String(2023 + i))
function fyLabelB(y: string) { return `${y}-${String(Number(y) + 1).slice(2)}` }
function fyStartB(y: string) { return `${y}-04-01` }
function fyEndB(y: string)   { return `${Number(y) + 1}-03-31` }

interface BankTx {
  id: string
  type: 'deposit' | 'withdraw' | 'charge' | 'interest'
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
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [year, setYear] = useState(String(currentFYB))
  const [openingBalanceBank, setOpeningBalanceBank] = useState(0)
  const [openingBalanceCash, setOpeningBalanceCash] = useState(0)
  const [editingOpening, setEditingOpening] = useState(false)
  const [openingBankInput, setOpeningBankInput] = useState('')
  const [openingCashInput, setOpeningCashInput] = useState('')
  const [savingOpening, setSavingOpening] = useState(false)
  const [activeTab, setActiveTab] = useState<'all' | 'deposit' | 'withdraw' | 'charge' | 'interest'>('all')
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
    const start = fyStartB(year)
    const end   = fyEndB(year)
    setLoading(true)
    setEditingOpening(false)
    Promise.all([
      supabase.from('bank_transactions').select('*, profiles!bank_transactions_by_who_fkey(full_name)')
        .gte('transaction_date', start).lte('transaction_date', end).order('transaction_date', { ascending: false }),
      supabase.from('profiles').select('*').eq('account_status', 'active').order('full_name'),
      supabase.from('donations').select('amount, payment_method').gte('donation_date', start).lte('donation_date', end),
      supabase.from('expenses').select('amount, payment_mode').gte('expense_date', start).lte('expense_date', end),
      supabase.from('bank_fy_balance').select('opening_balance_bank, opening_balance_cash').eq('fy_year', year).maybeSingle(),
    ]).then(([txRes, memRes, donRes, expRes, obRes]) => {
      const obBank = Number((obRes.data as any)?.opening_balance_bank || 0)
      const obCash = Number((obRes.data as any)?.opening_balance_cash || 0)
      setOpeningBalanceBank(obBank)
      setOpeningBalanceCash(obCash)
      setOpeningBankInput(String(obBank))
      setOpeningCashInput(String(obCash))
      setTransactions((txRes.data as BankTx[]) || [])
      setMembers((memRes.data as Profile[]) || [])
      const donations = (donRes.data || []) as any[]
      const expenses = (expRes.data || []) as any[]
      setOnlineIn(donations.filter(d => d.payment_method?.toLowerCase() === 'online').reduce((s, d) => s + Number(d.amount), 0))
      setOnlineOut(expenses.filter(e => e.payment_mode?.toLowerCase() === 'online').reduce((s, e) => s + Number(e.amount), 0))
      setOfflineIn(donations.filter(d => d.payment_method?.toLowerCase() === 'offline').reduce((s, d) => s + Number(d.amount), 0))
      setOfflineOut(expenses.filter(e => e.payment_mode?.toLowerCase() === 'offline').reduce((s, e) => s + Number(e.amount), 0))
      setLoading(false)
    })
  }, [year])

  function resetForm() {
    setForm({ amount: '', transaction_date: new Date().toISOString().split('T')[0], by_who: '', bank_name: '', purpose: '', notes: '' })
    setShowForm(false)
  }

  async function saveOpeningBalance() {
    setSavingOpening(true)
    const bank = parseFloat(openingBankInput) || 0
    const cash = parseFloat(openingCashInput) || 0
    await supabase.from('bank_fy_balance').upsert({
      fy_year: year, opening_balance_bank: bank, opening_balance_cash: cash, recorded_by: user?.id
    }, { onConflict: 'fy_year' })
    setOpeningBalanceBank(bank)
    setOpeningBalanceCash(cash)
    setEditingOpening(false)
    setSavingOpening(false)
    toast.success('Opening balance saved')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (activeTab !== 'charge' && activeTab !== 'interest' && !form.by_who) { toast.error('Please select who made this transaction'); return }
    setSaving(true)
    const { error } = await supabase.from('bank_transactions').insert({
      type: activeTab,
      amount: parseFloat(form.amount),
      transaction_date: form.transaction_date,
      by_who: form.by_who || null,
      bank_name: form.bank_name || null,
      purpose: form.purpose || null,
      notes: form.notes || null,
      recorded_by: user?.id,
    })
    if (error) { toast.error('Failed to record'); setSaving(false); return }
    const typeLabel = activeTab === 'deposit' ? 'Deposit' : activeTab === 'withdraw' ? 'Withdrawal' : activeTab === 'interest' ? 'Bank Interest' : 'Bank Charge'
    logAction('create', 'bank', `${typeLabel} ₹${form.amount}${form.purpose ? ` — ${form.purpose}` : ''}`)
    toast.success(`${typeLabel} recorded`)
    resetForm()
    setSaving(false)
    const { data } = await supabase.from('bank_transactions').select('*, profiles!bank_transactions_by_who_fkey(full_name)')
      .gte('transaction_date', fyStartB(year)).lte('transaction_date', fyEndB(year)).order('transaction_date', { ascending: false })
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
  const totalInterest = transactions.filter(t => t.type === 'interest').reduce((s, t) => s + Number(t.amount), 0)
  const totalCharges = transactions.filter(t => t.type === 'charge').reduce((s, t) => s + Number(t.amount), 0)
  const openingBalance = openingBalanceBank + openingBalanceCash
  const netOnline  = onlineIn  - onlineOut  + totalDeposited - totalWithdrawn + totalInterest - totalCharges
  const netOffline = offlineIn - offlineOut - totalDeposited + totalWithdrawn
  const closingBank = openingBalanceBank + netOnline
  const closingCash = openingBalanceCash + netOffline
  const closingBalance = closingBank + closingCash
  const netBalance = closingBalance
  const filtered = activeTab === 'all' ? transactions : transactions.filter(t => t.type === activeTab)

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Landmark className="w-6 h-6 text-primary" /> Internal Transactions
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">Track deposits, withdrawals, bank charges and interest</p>
        </div>
        {superAdmin && !showForm && (
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => { setActiveTab('deposit'); setShowForm(true) }}
              className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
              <ArrowDownToLine className="w-4 h-4" /> Cash Deposit
            </button>
            <button onClick={() => { setActiveTab('withdraw'); setShowForm(true) }}
              className="flex items-center gap-1.5 px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600">
              <ArrowUpFromLine className="w-4 h-4" /> Cash Withdraw
            </button>
            <button onClick={() => { setActiveTab('charge'); setShowForm(true) }}
              className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700">
              <CreditCard className="w-4 h-4" /> Bank Charges
            </button>
            <button onClick={() => { setActiveTab('interest'); setShowForm(true) }}
              className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700">
              <TrendingUp className="w-4 h-4" /> Bank Interest
            </button>
          </div>
        )}
      </div>

      {/* Fiscal year selector — moved above opening/closing */}
      <div className="flex gap-2 flex-wrap mb-4">
        {FY_YEARS.map((y) => (
          <button key={y} onClick={() => setYear(y)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold border-2 transition-colors ${year === y ? 'bg-primary text-white border-primary' : 'border-border text-text-secondary hover:border-primary/40'}`}>
            {fyLabelB(y)}
          </button>
        ))}
      </div>

      {/* Opening / Closing Balance */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <div className="bg-white border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Opening Balance <span className="font-normal text-[9px]">(FY {fyLabelB(year)})</span></p>
            {superAdmin && !editingOpening && (
              <button onClick={() => setEditingOpening(true)} className="p-1.5 text-text-secondary hover:text-primary transition-colors" title="Edit opening balance">
                <Pencil className="w-4 h-4" />
              </button>
            )}
          </div>
          {editingOpening ? (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-text-secondary mb-1">In Bank (₹)</label>
                  <input type="number" step="0.01" placeholder="0" value={openingBankInput} onChange={e => setOpeningBankInput(e.target.value)}
                    className="w-full px-2 py-1.5 border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" autoFocus />
                </div>
                <div>
                  <label className="block text-[10px] text-text-secondary mb-1">In Cash (₹)</label>
                  <input type="number" step="0.01" placeholder="0" value={openingCashInput} onChange={e => setOpeningCashInput(e.target.value)}
                    className="w-full px-2 py-1.5 border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={saveOpeningBalance} disabled={savingOpening} className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white rounded text-xs font-medium hover:bg-primary-dark disabled:opacity-50"><Check className="w-3.5 h-3.5" /> Save</button>
                <button onClick={() => { setEditingOpening(false); setOpeningBankInput(String(openingBalanceBank)); setOpeningCashInput(String(openingBalanceCash)) }} className="px-3 py-1.5 border border-border rounded text-xs text-text-secondary hover:bg-gray-50"><X className="w-3.5 h-3.5 inline mr-1" />Cancel</button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 mt-1">
              <div>
                <p className="text-[10px] text-text-secondary">In Bank</p>
                <p className="text-lg font-bold text-blue-700">₹{openingBalanceBank.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[10px] text-text-secondary">In Cash</p>
                <p className="text-lg font-bold text-amber-700">₹{openingBalanceCash.toLocaleString()}</p>
              </div>
              <div className="col-span-2 border-t border-border pt-2">
                <p className="text-[10px] text-text-secondary">Total Opening</p>
                <p className="text-base font-bold text-text-primary">₹{openingBalance.toLocaleString()}</p>
              </div>
            </div>
          )}
        </div>
        <div className={`rounded-xl p-4 border ${closingBalance >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-200'}`}>
          <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-2">Closing Balance <span className="font-normal text-[9px]">(carry forward)</span></p>
          <div className="grid grid-cols-2 gap-3 mb-2">
            <div>
              <p className="text-[10px] text-text-secondary">In Bank</p>
              <p className={`text-lg font-bold ${closingBank >= 0 ? 'text-blue-700' : 'text-red-600'}`}>{closingBank >= 0 ? '+' : ''}₹{closingBank.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-[10px] text-text-secondary">In Cash</p>
              <p className={`text-lg font-bold ${closingCash >= 0 ? 'text-amber-700' : 'text-red-600'}`}>{closingCash >= 0 ? '+' : ''}₹{closingCash.toLocaleString()}</p>
            </div>
          </div>
          <div className="border-t border-blue-200 pt-2">
            <p className="text-[10px] text-text-secondary">Total Closing</p>
            <p className={`text-base font-bold ${closingBalance >= 0 ? 'text-blue-700' : 'text-red-600'}`}>{closingBalance >= 0 ? '+' : ''}₹{closingBalance.toLocaleString()}</p>
          </div>
        </div>
      </div>


      {/* Stats — 5 cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
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
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
          <div className="flex items-center gap-1.5 mb-1"><CreditCard className="w-3.5 h-3.5 text-purple-600" /><p className="text-[10px] text-purple-700 font-medium">Bank Charges</p></div>
          <p className="text-lg font-bold text-purple-700">₹{totalCharges.toLocaleString()}</p>
          <p className="text-[9px] text-purple-600 mt-0.5">{transactions.filter(t => t.type === 'charge').length} records</p>
        </div>
        <div className="bg-teal-50 border border-teal-200 rounded-xl p-4">
          <div className="flex items-center gap-1.5 mb-1"><TrendingUp className="w-3.5 h-3.5 text-teal-600" /><p className="text-[10px] text-teal-700 font-medium">Bank Interest</p></div>
          <p className="text-lg font-bold text-teal-700">₹{totalInterest.toLocaleString()}</p>
          <p className="text-[9px] text-teal-600 mt-0.5">{transactions.filter(t => t.type === 'interest').length} records</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
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
          <p className="text-[8px] text-text-secondary mt-0.5 opacity-70">OB + Inc − Exp + Int − Chg</p>
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
        <button onClick={() => { setActiveTab('charge'); setShowForm(false) }}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'charge' ? 'bg-purple-600 text-white' : 'bg-white border border-border text-text-secondary hover:bg-purple-50'}`}>
          <CreditCard className="w-4 h-4" /> Bank Charges
        </button>
        <button onClick={() => { setActiveTab('interest'); setShowForm(false) }}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'interest' ? 'bg-teal-600 text-white' : 'bg-white border border-border text-text-secondary hover:bg-teal-50'}`}>
          <TrendingUp className="w-4 h-4" /> Bank Interest
        </button>
      </div>

      {/* Add Form */}
      {showForm && superAdmin && (
        <div className="bg-white rounded-xl border border-border p-5 mb-6">
          <h3 className="text-sm font-semibold text-text-primary mb-4">
            {activeTab === 'deposit' ? '📥 Record Cash Deposit' : activeTab === 'withdraw' ? '📤 Record Cash Withdrawal' : activeTab === 'interest' ? '📈 Record Bank Interest' : '💳 Record Bank Charge'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-text-primary mb-1">Date *</label>
                <DateInput value={form.transaction_date} onChange={(v) => setForm({ ...form, transaction_date: v })} required />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-primary mb-1">Amount (₹) *</label>
                <input type="number" required min="0.01" step="0.01" placeholder="0.00" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className={inputClass} />
              </div>
            </div>
            {activeTab !== 'charge' && activeTab !== 'interest' && (
              <div>
                <label className="block text-xs font-medium text-text-primary mb-1">By Who *</label>
                <MemberSelect
                  members={members.map(m => ({ id: m.id, full_name: m.full_name, role: m.role, email: (m as any).email, phone: (m as any).phone }))}
                  value={form.by_who}
                  onChange={(id) => setForm({ ...form, by_who: id })}
                  placeholder="Select member..."
                />
              </div>
            )}
            {activeTab !== 'charge' && activeTab !== 'interest' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-text-primary mb-1">Bank Name</label>
                  <input type="text" placeholder="e.g. Bank of Baroda" value={form.bank_name} onChange={(e) => setForm({ ...form, bank_name: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-primary mb-1">Purpose</label>
                  <input type="text" placeholder="e.g. Event collection, Office fund" value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} className={inputClass} />
                </div>
              </div>
            )}
            {(activeTab === 'charge' || activeTab === 'interest') && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-text-primary mb-1">
                    {activeTab === 'charge' ? 'Charge Type *' : 'Interest Type *'}
                  </label>
                  <input type="text" required
                    placeholder={activeTab === 'charge' ? 'e.g. Maintenance fee, Transaction charge' : 'e.g. Savings interest, FD interest'}
                    value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-primary mb-1">Remark</label>
                  <input type="text" placeholder="Optional" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={inputClass} />
                </div>
              </div>
            )}
            {activeTab !== 'charge' && activeTab !== 'interest' && (
              <div>
                <label className="block text-xs font-medium text-text-primary mb-1">Remark</label>
                <input type="text" placeholder="Optional" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={inputClass} />
              </div>
            )}
            <div className="flex gap-2">
              <button type="submit" disabled={saving}
                className={`px-5 py-2 text-white rounded-lg text-sm font-medium disabled:opacity-50 ${activeTab === 'deposit' ? 'bg-green-600 hover:bg-green-700' : activeTab === 'charge' ? 'bg-purple-600 hover:bg-purple-700' : activeTab === 'interest' ? 'bg-teal-600 hover:bg-teal-700' : 'bg-red-500 hover:bg-red-600'}`}>
                {saving ? '...' : activeTab === 'deposit' ? 'Record Deposit' : activeTab === 'charge' ? 'Record Charge' : activeTab === 'interest' ? 'Record Interest' : 'Record Withdrawal'}
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
          No {activeTab === 'all' ? 'transactions' : activeTab === 'deposit' ? 'cash deposits' : activeTab === 'charge' ? 'bank charges' : activeTab === 'interest' ? 'bank interest entries' : 'cash withdrawals'} recorded yet.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-gray-50 text-left">
                <th className="px-4 py-3 font-medium text-text-secondary">Date</th>
                <th className="px-4 py-3 font-medium text-text-secondary">Amount</th>
                <th className="px-4 py-3 font-medium text-text-secondary">By Who</th>
                <th className="px-4 py-3 font-medium text-text-secondary">Purpose</th>
                <th className="px-4 py-3 font-medium text-text-secondary">Remark</th>
                {superAdmin && <th className="px-4 py-3 font-medium text-text-secondary">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id} className="border-b border-border/50 hover:bg-gray-50">
                  <td className="px-4 py-3 text-text-secondary whitespace-nowrap">{formatDate(t.transaction_date, 'en')}</td>
                  <td className={`px-4 py-3 font-semibold ${t.type === 'deposit' || t.type === 'interest' ? 'text-green-600' : t.type === 'charge' ? 'text-purple-600' : 'text-red-500'}`}>
                    {t.type === 'deposit' || t.type === 'interest' ? '+' : '-'}₹{Number(t.amount).toLocaleString()}
                    {t.type === 'deposit' && <span className="ml-1.5 text-[10px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded-full font-medium">Deposit</span>}
                    {t.type === 'withdraw' && <span className="ml-1.5 text-[10px] bg-red-50 text-red-500 px-1.5 py-0.5 rounded-full font-medium">Withdraw</span>}
                    {t.type === 'charge' && <span className="ml-1.5 text-[10px] bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded-full font-medium">Charge</span>}
                    {t.type === 'interest' && <span className="ml-1.5 text-[10px] bg-teal-50 text-teal-600 px-1.5 py-0.5 rounded-full font-medium">Interest</span>}
                  </td>
                  <td className="px-4 py-3 text-text-primary">{t.profiles?.full_name || '—'}</td>
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
                    ? `₹${filtered.reduce((s, t) => s + (t.type === 'deposit' || t.type === 'interest' ? Number(t.amount) : -Number(t.amount)), 0).toLocaleString()}`
                    : `${activeTab === 'deposit' || activeTab === 'interest' ? '+' : '-'}₹${filtered.reduce((s, t) => s + Number(t.amount), 0).toLocaleString()}`}
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
