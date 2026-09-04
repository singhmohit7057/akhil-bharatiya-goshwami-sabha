import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Receipt } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { DateInput } from '../../components/ui/DateInput'

const CATEGORIES = [
  'Event Expense',
  'Office Expense',
  'Travel',
  'Printing & Stationery',
  'Catering',
  'Decoration',
  'Marketing',
  'Donation Given',
  'Miscellaneous',
]

export function AddExpense() {
  const navigate = useNavigate()
  const { id: editId } = useParams()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title: '',
    category: '',
    amount: '',
    expense_date: new Date().toISOString().split('T')[0],
    payment_mode: '',
    paid_to: '',
    notes: '',
  })

  const inputClass = 'w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30'

  useEffect(() => {
    if (!editId) return
    supabase.from('expenses').select('*').eq('id', editId).single().then(({ data }) => {
      if (data) setForm({
        title: data.title,
        category: data.category || '',
        amount: data.amount.toString(),
        expense_date: data.expense_date,
        payment_mode: data.payment_mode || '',
        paid_to: data.paid_to || '',
        notes: data.notes || '',
      })
    })
  }, [editId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const payload = {
      title: form.title,
      category: form.category || null,
      amount: parseFloat(form.amount),
      expense_date: form.expense_date,
      payment_mode: form.payment_mode || null,
      paid_to: form.paid_to || null,
      notes: form.notes || null,
    }
    let error
    if (editId) {
      ({ error } = await supabase.from('expenses').update(payload).eq('id', editId))
      if (!error) toast.success('Expense updated')
    } else {
      ({ error } = await supabase.from('expenses').insert({ ...payload, recorded_by: user?.id }))
      if (!error) toast.success('Expense recorded')
    }
    if (error) { toast.error('Failed'); setLoading(false); return }
    navigate('/admin/expenses')
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary mb-1">{editId ? 'Edit Expense' : 'Add Expense'}</h1>
      <p className="text-sm text-text-secondary mb-6">Record a new expense entry</p>

      <div className="bg-white rounded-xl border border-border p-5 max-w-2xl">
        <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg mb-5 text-xs text-red-700">
          <Receipt className="w-4 h-4 shrink-0" />
          Expenses are recorded for internal tracking and financial reports.
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-text-primary mb-1">Expense Title *</label>
            <input type="text" required placeholder="e.g. Stage decoration for Annual Meet" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputClass} />
          </div>

          {/* Category | Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">Category</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={`${inputClass} bg-white`}>
                <option value="">Select Category</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">Amount (₹) *</label>
              <input type="number" required min="1" step="0.01" placeholder="0.00" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className={inputClass} />
            </div>
          </div>

          {/* Date | Payment Mode */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">Expense Date *</label>
              <DateInput value={form.expense_date} onChange={(v) => setForm({ ...form, expense_date: v })} required />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">Payment Mode</label>
              <select value={form.payment_mode} onChange={(e) => setForm({ ...form, payment_mode: e.target.value })} className={`${inputClass} bg-white`}>
                <option value="">Select</option>
                <option value="Online">Online</option>
                <option value="Offline">Offline</option>
              </select>
            </div>
          </div>

          {/* Paid To | Notes */}
          <div>
            <label className="block text-xs font-medium text-text-primary mb-1">Paid To</label>
            <input type="text" placeholder="Vendor / Person name" value={form.paid_to} onChange={(e) => setForm({ ...form, paid_to: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-primary mb-1">Notes</label>
            <textarea rows={2} placeholder="Additional details..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={inputClass} />
          </div>

          <button type="submit" disabled={loading} className="px-5 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors">
            {loading ? '...' : editId ? 'Update Expense' : 'Record Expense'}
          </button>
        </form>
      </div>
    </div>
  )
}
