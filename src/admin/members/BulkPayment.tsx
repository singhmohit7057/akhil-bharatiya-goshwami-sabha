import { useState, useRef } from 'react'
import toast from 'react-hot-toast'
import { Download, Upload, CheckCircle, XCircle, Loader2, FileSpreadsheet, Receipt } from 'lucide-react'
import * as XLSX from 'xlsx'
import ExcelJS from 'exceljs'
import { supabase, supabaseAdmin } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'

interface PaymentRow {
  member_id: string
  name: string
  email: string
  phone: string
  amount: number
  payment_date: string
  membership_date: string
  payment_mode: string
  remark: string
}

interface DonationRow {
  member_id: string
  name: string
  email: string
  phone: string
  amount: number
  payment_date: string
  purpose: string
  payment_mode: string
  remark: string
}

interface PaymentResult {
  identifier: string
  memberName: string
  status: 'success' | 'error'
  message: string
}

const COLUMNS = [
  { key: 'member_id',       label: 'Member ID',                    required: false },
  { key: 'name',            label: 'Name',                         required: false },
  { key: 'email',           label: 'Email',                        required: true  },
  { key: 'phone',           label: 'Phone',                        required: false },
  { key: 'amount',          label: 'Amount (₹)',                   required: true  },
  { key: 'payment_date',    label: 'Payment Date (DD-MM-YYYY)',    required: true  },
  { key: 'membership_date', label: 'Membership Date (DD-MM-YYYY)', required: true  },
  { key: 'payment_mode',    label: 'Payment Mode',                 required: true  },
  { key: 'remark',          label: 'Remark',                       required: true  },
]

const DONATION_COLUMNS = [
  { key: 'member_id',    label: 'Member ID',           required: false },
  { key: 'name',         label: 'Name',                required: false },
  { key: 'email',        label: 'Email',               required: true  },
  { key: 'phone',        label: 'Phone',               required: false },
  { key: 'amount',       label: 'Amount (₹)',          required: true  },
  { key: 'payment_date', label: 'Payment Date (DD-MM-YYYY)', required: true },
  { key: 'purpose',      label: 'Purpose',             required: true  },
  { key: 'payment_mode', label: 'Payment Mode',        required: true  },
  { key: 'remark',       label: 'Remark',              required: true  },
]
const DONATION_SAMPLE = (year: string) => ['ABGSPB/0001', 'Shashi Kumar Giri', 'shashi@gmail.com', '9331038940', '500', `27-10-${year}`, 'Annual Fund', 'Cash', 'Donation for event']

const EXPENSE_COLUMNS = [
  { key: 'title',        label: 'Title',               required: true  },
  { key: 'category',     label: 'Category',            required: false },
  { key: 'amount',       label: 'Amount (₹)',          required: true  },
  { key: 'date',         label: 'Date (DD-MM-YYYY)',   required: true  },
  { key: 'mode',         label: 'Payment Mode',        required: true  },
  { key: 'paid_to',      label: 'Paid To',             required: false },
  { key: 'notes',        label: 'Notes',               required: false },
]
const EXPENSE_SAMPLE = ['Stage Decoration', 'Event Expense', '5000', '15-11-2025', 'Cash', 'Ramu Decorator', 'Annual Meet decoration']

const getSample = (year: string) => [
  'ABGSPB/0001',
  'Shashi Kumar Giri',
  'shashi@gmail.com',
  '9331038940',
  '1100',
  `27-10-${year}`,
  `01-11-${year}`,
  'Cash',
  `Executive Membership ${year}`,
]

export function BulkPayment() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'membership' | 'donation'>('membership')

  // Membership
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())
  const [rows, setRows] = useState<PaymentRow[]>([])
  const [results, setResults] = useState<PaymentResult[]>([])
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const years = ['2023', '2024', '2025', '2026', '2027']

  // Donation
  const donFileRef = useRef<HTMLInputElement>(null)
  const [donRows, setDonRows] = useState<DonationRow[]>([])
  const [donResults, setDonResults] = useState<PaymentResult[]>([])
  const [donLoading, setDonLoading] = useState(false)
  const [donDone, setDonDone] = useState(false)

  // Expense
  const expFileRef = useRef<HTMLInputElement>(null)
  const [expRows, setExpRows] = useState<{title:string;category:string;amount:number;date:string;mode:string;paid_to:string;notes:string}[]>([])
  const [expResults, setExpResults] = useState<{idx:number;title:string;status:'success'|'error';message:string}[]>([])
  const [expLoading, setExpLoading] = useState(false)
  const [expDone, setExpDone] = useState(false)

  async function downloadTemplate() {
    const wb = new ExcelJS.Workbook()
    const ws = wb.addWorksheet('Payments')
    ws.columns = COLUMNS.map((c) => ({ header: c.label, key: c.key, width: 26 }))
    ws.getRow(1).eachCell((cell, col) => {
      const c = COLUMNS[col - 1]
      cell.font = { bold: true, size: 11 }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: c?.required ? 'FFFFFF00' : 'FFD6E4F0' } }
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
      cell.alignment = { horizontal: 'center' }
    })
    const noteRow = ws.addRow(COLUMNS.map((c) => c.required ? '★ REQUIRED' : 'optional'))
    noteRow.eachCell((cell, col) => {
      cell.font = { italic: true, size: 9, color: { argb: COLUMNS[col - 1]?.required ? 'FFC00000' : 'FF888888' } }
    })
    const sampleRow = ws.addRow(getSample(selectedYear))
    sampleRow.eachCell((cell) => { cell.font = { size: 10 }; cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F0F0' } } })
    ws.views = [{ state: 'frozen', ySplit: 1 }]
    const buffer = await wb.xlsx.writeBuffer()
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'membership_payment_template.xlsx'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const wb = XLSX.read(ev.target?.result, { type: 'binary' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const raw = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: '' })
        function toISO(raw: string): string {
          const s = String(raw).trim()
          if (/^\d{2}-\d{2}-\d{4}$/.test(s)) {
            const [dd, mm, yyyy] = s.split('-')
            return `${yyyy}-${mm}-${dd}`
          }
          if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
          // Excel date serial
          if (!isNaN(Number(s)) && Number(s) > 0) {
            const d = new Date((Number(s) - 25569) * 86400 * 1000)
            return d.toISOString().split('T')[0]
          }
          return s
        }

        const parsed: PaymentRow[] = raw
          .filter((r) => !String(Object.values(r)[0]).includes('REQUIRED') && !String(Object.values(r)[0]).includes('optional'))
          .map((r) => ({
            member_id: String(r['Member ID'] || r['member_id'] || '').trim(),
            name: String(r['Name'] || r['name'] || '').trim(),
            email: String(r['Email'] || r['email'] || '').trim().toLowerCase(),
            phone: String(r['Phone'] || r['phone'] || '').trim().replace(/\D/g, ''),
            amount: parseFloat(String(r['Amount (₹)'] || r['amount'] || '0').replace(/[₹,]/g, '')) || 0,
            payment_date: toISO(r['Payment Date (DD-MM-YYYY)'] || r['payment_date'] || ''),
            membership_date: toISO(r['Membership Date (DD-MM-YYYY)'] || r['membership_date'] || ''),
            payment_mode: String(r['Payment Mode'] || r['payment_mode'] || 'Cash').trim(),
            remark: String(r['Remark'] || r['remark'] || `Executive Membership ${selectedYear}`).trim(),
          }))
          .filter((r) => (r.email || r.phone || r.member_id) && r.amount > 0 && r.payment_date)
        setRows(parsed)
        setResults([])
        setDone(false)
        if (parsed.length === 0) toast.error('No valid rows found')
        else toast.success(`${parsed.length} payments ready to import`)
      } catch { toast.error('Failed to read file') }
    }
    reader.readAsBinaryString(file)
    e.target.value = ''
  }

  async function handleImport() {
    if (!rows.length) return
    setLoading(true)
    const results: PaymentResult[] = []

    for (const row of rows) {
      const identifier = row.email || row.phone
      try {
        // Find member: member_id first, then email, then phone
        let member: any = null
        if (row.member_id) {
          const { data } = await supabaseAdmin.from('profiles').select('id, full_name, membership_start_date, membership_end_date').eq('member_id', row.member_id).limit(1)
          member = data?.[0]
        }
        if (!member && row.email) {
          const { data } = await supabaseAdmin.from('profiles').select('id, full_name, membership_start_date, membership_end_date').eq('email', row.email).limit(1)
          member = data?.[0]
        }
        if (!member && row.phone) {
          const { data } = await supabaseAdmin.from('profiles').select('id, full_name, membership_start_date, membership_end_date').eq('phone', row.phone).limit(1)
          member = data?.[0]
        }

        if (!member) {
          results.push({ identifier, memberName: '?', status: 'error', message: 'Member not found' })
          continue
        }

        // Insert donation record
        const { error: donationErr } = await supabase.from('donations').insert({
          user_id: member.id,
          amount: row.amount,
          donation_date: row.payment_date,
          purpose: 'Executive Membership',
          payment_method: row.payment_mode || null,
          transaction_id: row.remark || null,
          recorded_by: user?.id,
        })

        if (donationErr) { results.push({ identifier, memberName: member.full_name, status: 'error', message: donationErr.message }); continue }

        // Use membership_date for start; compute end = start + 1 year
        const membershipStart = row.membership_date || row.payment_date
        const existingEnd = member.membership_end_date ? new Date(member.membership_end_date) : null
        const newStart = new Date(membershipStart)
        let newEnd: Date
        if (existingEnd && existingEnd > newStart) {
          newEnd = new Date(existingEnd)
          newEnd.setFullYear(newEnd.getFullYear() + 1)
        } else {
          newEnd = new Date(newStart)
          newEnd.setFullYear(newEnd.getFullYear() + 1)
        }

        const memberSince = member.membership_start_date
          ? (new Date(member.membership_start_date) < newStart ? member.membership_start_date : membershipStart)
          : membershipStart

        await supabase.from('profiles').update({
          is_executive_member: true,
          membership_start_date: memberSince,
          membership_end_date: newEnd.toISOString().split('T')[0],
        }).eq('id', member.id)

        results.push({ identifier, memberName: member.full_name, status: 'success', message: `Active until ${newEnd.toISOString().split('T')[0]}` })
      } catch (err: any) {
        results.push({ identifier, memberName: '?', status: 'error', message: err?.message || 'Unexpected error' })
      }
    }

    setResults(results)
    setLoading(false)
    setDone(true)
    const success = results.filter((r) => r.status === 'success').length
    const failed = results.filter((r) => r.status === 'error').length
    toast.success(`${success} payments recorded${failed ? ` · ${failed} failed` : ''}`)
  }

  const success = results.filter((r) => r.status === 'success').length
  const failed = results.filter((r) => r.status === 'error').length

  async function downloadDonationTemplate() {
    const wb = new ExcelJS.Workbook()
    const ws = wb.addWorksheet('Donations')
    ws.columns = DONATION_COLUMNS.map((c) => ({ header: c.label, key: c.key, width: 26 }))
    ws.getRow(1).eachCell((cell, col) => {
      const c = DONATION_COLUMNS[col - 1]
      cell.font = { bold: true, size: 11 }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: c?.required ? 'FFFFFF00' : 'FFD6E4F0' } }
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
      cell.alignment = { horizontal: 'center' }
    })
    const noteRow = ws.addRow(DONATION_COLUMNS.map((c) => c.required ? '★ REQUIRED' : 'optional'))
    noteRow.eachCell((cell, col) => {
      cell.font = { italic: true, size: 9, color: { argb: DONATION_COLUMNS[col - 1]?.required ? 'FFC00000' : 'FF888888' } }
    })
    const sampleRow = ws.addRow(DONATION_SAMPLE(new Date().getFullYear().toString()))
    sampleRow.eachCell((cell) => { cell.font = { size: 10 }; cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F0F0' } } })
    ws.views = [{ state: 'frozen', ySplit: 1 }]
    const buffer = await wb.xlsx.writeBuffer()
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'bulk_donation_template.xlsx'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  function handleDonFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const wb = XLSX.read(ev.target?.result, { type: 'binary' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const raw = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: '' })
        function toISO(raw: string): string {
          const s = String(raw).trim()
          if (/^\d{2}-\d{2}-\d{4}$/.test(s)) { const [dd, mm, yyyy] = s.split('-'); return `${yyyy}-${mm}-${dd}` }
          if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
          if (!isNaN(Number(s)) && Number(s) > 0) return new Date((Number(s) - 25569) * 86400 * 1000).toISOString().split('T')[0]
          return s
        }
        const parsed: DonationRow[] = raw
          .filter((r) => !String(Object.values(r)[0]).includes('REQUIRED') && !String(Object.values(r)[0]).includes('optional'))
          .map((r) => ({
            member_id: String(r['Member ID'] || '').trim(),
            name: String(r['Name'] || '').trim(),
            email: String(r['Email'] || '').trim().toLowerCase(),
            phone: String(r['Phone'] || '').trim().replace(/\D/g, ''),
            amount: parseFloat(String(r['Amount (₹)'] || '0').replace(/[₹,]/g, '')) || 0,
            payment_date: toISO(r['Payment Date (DD-MM-YYYY)'] || ''),
            purpose: String(r['Purpose'] || 'General Donation').trim(),
            payment_mode: String(r['Payment Mode'] || 'Cash').trim(),
            remark: String(r['Remark'] || '').trim(),
          }))
          .filter((r) => (r.email || r.phone || r.member_id) && r.amount > 0 && r.payment_date)
        setDonRows(parsed)
        setDonResults([])
        setDonDone(false)
        if (parsed.length === 0) toast.error('No valid rows found')
        else toast.success(`${parsed.length} donations ready to import`)
      } catch { toast.error('Failed to read file') }
    }
    reader.readAsBinaryString(file)
    e.target.value = ''
  }

  async function handleDonImport() {
    if (!donRows.length) return
    setDonLoading(true)
    const res: PaymentResult[] = []
    for (const row of donRows) {
      const identifier = row.member_id || row.email || row.phone
      try {
        let member: any = null
        if (row.member_id) { const { data } = await supabaseAdmin.from('profiles').select('id, full_name').eq('member_id', row.member_id).limit(1); member = data?.[0] }
        if (!member && row.email) { const { data } = await supabaseAdmin.from('profiles').select('id, full_name').eq('email', row.email).limit(1); member = data?.[0] }
        if (!member && row.phone) { const { data } = await supabaseAdmin.from('profiles').select('id, full_name').eq('phone', row.phone).limit(1); member = data?.[0] }
        if (!member) { res.push({ identifier, memberName: '?', status: 'error', message: 'Member not found' }); continue }
        const { error } = await supabase.from('donations').insert({
          user_id: member.id,
          amount: row.amount,
          donation_date: row.payment_date,
          purpose: row.purpose || 'General Donation',
          payment_method: row.payment_mode || null,
          transaction_id: row.remark || null,
          recorded_by: user?.id,
        })
        if (error) { res.push({ identifier, memberName: member.full_name, status: 'error', message: error.message }); continue }
        res.push({ identifier, memberName: member.full_name, status: 'success', message: `₹${row.amount} recorded` })
      } catch (err: any) {
        res.push({ identifier, memberName: '?', status: 'error', message: err?.message || 'Unexpected error' })
      }
    }
    setDonResults(res)
    setDonLoading(false)
    setDonDone(true)
    const s = res.filter((r) => r.status === 'success').length
    const f = res.filter((r) => r.status === 'error').length
    toast.success(`${s} donations recorded${f ? ` · ${f} failed` : ''}`)
  }

  const donSuccess = donResults.filter((r) => r.status === 'success').length
  const donFailed = donResults.filter((r) => r.status === 'error').length

  async function downloadExpenseTemplate() {
    const wb = new ExcelJS.Workbook()
    const ws = wb.addWorksheet('Expenses')
    ws.columns = EXPENSE_COLUMNS.map((c) => ({ header: c.label, key: c.key, width: 24 }))
    ws.getRow(1).eachCell((cell, col) => {
      const c = EXPENSE_COLUMNS[col - 1]
      cell.font = { bold: true, size: 11 }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: c?.required ? 'FFFFFF00' : 'FFD6E4F0' } }
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
      cell.alignment = { horizontal: 'center' }
    })
    const noteRow = ws.addRow(EXPENSE_COLUMNS.map((c) => c.required ? '★ REQUIRED' : 'optional'))
    noteRow.eachCell((cell, col) => {
      cell.font = { italic: true, size: 9, color: { argb: EXPENSE_COLUMNS[col - 1]?.required ? 'FFC00000' : 'FF888888' } }
    })
    const sampleRow = ws.addRow(EXPENSE_SAMPLE)
    sampleRow.eachCell((cell) => { cell.font = { size: 10 }; cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F0F0' } } })
    ws.views = [{ state: 'frozen', ySplit: 1 }]
    const buffer = await wb.xlsx.writeBuffer()
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'bulk_expense_template.xlsx'; a.click(); URL.revokeObjectURL(a.href)
  }

  function handleExpFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const wb = XLSX.read(ev.target?.result, { type: 'binary' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const raw = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: '' })
        function toISO(s: string) {
          const v = String(s).trim()
          if (/^\d{2}-\d{2}-\d{4}$/.test(v)) { const [dd,mm,yyyy]=v.split('-'); return `${yyyy}-${mm}-${dd}` }
          if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v
          if (!isNaN(Number(v)) && Number(v)>0) return new Date((Number(v)-25569)*86400*1000).toISOString().split('T')[0]
          return v
        }
        const parsed = raw
          .filter((r) => !String(Object.values(r)[0]).includes('REQUIRED') && !String(Object.values(r)[0]).includes('optional'))
          .map((r) => ({
            title:    String(r['Title']    || r['title']    || '').trim(),
            category: String(r['Category'] || r['category'] || '').trim(),
            amount:   parseFloat(String(r['Amount (₹)'] || r['amount'] || '0').replace(/[₹,]/g,'')) || 0,
            date:     toISO(r['Date (DD-MM-YYYY)'] || r['date'] || ''),
            mode:     String(r['Payment Mode'] || r['mode'] || 'Cash').trim(),
            paid_to:  String(r['Paid To']  || r['paid_to'] || '').trim(),
            notes:    String(r['Notes']    || r['notes']   || '').trim(),
          }))
          .filter((r) => r.title && r.amount > 0 && r.date)
        setExpRows(parsed); setExpResults([]); setExpDone(false)
        if (parsed.length === 0) toast.error('No valid rows found')
        else toast.success(`${parsed.length} expenses ready to import`)
      } catch { toast.error('Failed to read file') }
    }
    reader.readAsBinaryString(file); e.target.value = ''
  }

  async function handleExpImport() {
    if (!expRows.length) return
    setExpLoading(true)
    const res: {idx:number;title:string;status:'success'|'error';message:string}[] = []
    for (let i = 0; i < expRows.length; i++) {
      const r = expRows[i]
      const { error } = await supabase.from('expenses').insert({
        title: r.title, category: r.category || null, amount: r.amount,
        expense_date: r.date, payment_mode: r.mode || null,
        paid_to: r.paid_to || null, notes: r.notes || null, recorded_by: user?.id,
      })
      res.push({ idx: i, title: r.title, status: error ? 'error' : 'success', message: error ? error.message : `₹${r.amount.toLocaleString()} recorded` })
    }
    setExpResults(res); setExpLoading(false); setExpDone(true)
    const s = res.filter((r) => r.status === 'success').length
    const f = res.filter((r) => r.status === 'error').length
    toast.success(`${s} expenses recorded${f ? ` · ${f} failed` : ''}`)
  }

  const expSuccess = expResults.filter((r) => r.status === 'success').length
  const expFailed = expResults.filter((r) => r.status === 'error').length

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary mb-1">Bulk Payment Upload</h1>
      <p className="text-sm text-text-secondary mb-6">Upload Excel to record multiple payments at once</p>

      {/* Tab switcher */}
      <div className="flex gap-2 mb-5 flex-wrap">
        <button onClick={() => setActiveTab('membership')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'membership' ? 'bg-primary text-white' : 'bg-white border border-border text-text-secondary hover:bg-gray-50'}`}>
          <CheckCircle className="w-4 h-4" /> Membership Payment
        </button>
        <button onClick={() => setActiveTab('donation')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'donation' ? 'bg-green-600 text-white' : 'bg-white border border-border text-text-secondary hover:bg-gray-50'}`}>
          <Upload className="w-4 h-4" /> Donation
        </button>
        <button onClick={() => setActiveTab('expense' as any)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === ('expense' as any) ? 'bg-red-600 text-white' : 'bg-white border border-border text-text-secondary hover:bg-gray-50'}`}>
          <Receipt className="w-4 h-4" /> Expense
        </button>
      </div>

      {activeTab === 'membership' && <div className="space-y-4">
        {/* Year Selector */}
        <div className="bg-white rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-3">Select Membership Year</h3>
          <div className="flex gap-3 flex-wrap">
            {years.map((y) => (
              <button key={y} onClick={() => { setSelectedYear(y); setRows([]); setResults([]); setDone(false) }}
                className={`px-6 py-2.5 rounded-lg text-sm font-semibold border-2 transition-colors ${selectedYear === y ? 'bg-primary text-white border-primary' : 'border-border text-text-secondary hover:border-primary/40'}`}>
                {y}
              </button>
            ))}
          </div>
          <p className="text-xs text-text-secondary mt-3">
            Uploading membership payments for <strong className="text-primary">{selectedYear}</strong>. All payments in this Excel will be tagged to this year.
          </p>
        </div>

        {/* Step 1 */}
        <div className="bg-white rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-text-primary">Step 1 — Download Template</h3>
              <p className="text-xs text-text-secondary mt-0.5">Fill with payment details from your sheet — one row per payment</p>
            </div>
            <button onClick={downloadTemplate} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700">
              <Download className="w-4 h-4" /> Download Template
            </button>
          </div>
          <div className="bg-surface rounded-lg p-3 overflow-x-auto text-xs">
            <table className="w-full">
              <thead>
                <tr>
                  {COLUMNS.map((c) => (
                    <th key={c.key} className={`px-2 py-1.5 text-left font-semibold whitespace-nowrap ${c.required ? 'text-yellow-700 bg-yellow-50' : 'text-text-secondary'}`}>
                      {c.label}{c.required && ' ★'}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="text-text-secondary">
                  {getSample(selectedYear).map((v, i) => <td key={i} className="px-2 py-1">{v}</td>)}
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1.5 mt-2">
            ⚠ This file is for <strong>{selectedYear}</strong> payments only. Upload a separate file for each year. Membership end date stacks automatically.
          </p>
        </div>

        {/* Step 2 */}
        <div className="bg-white rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-1">Step 2 — Upload Filled Excel</h3>
          <p className="text-xs text-text-secondary mb-4">Members matched by Email or Phone</p>
          <div onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors">
            <FileSpreadsheet className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-medium text-text-primary">Click to select Excel file</p>
            <p className="text-xs text-text-secondary mt-1">.xlsx or .xls</p>
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleFile} className="hidden" />
          </div>

          {rows.length > 0 && !done && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-text-primary">{rows.length} payments ready to import</p>
                <button onClick={handleImport} disabled={loading}
                  className="flex items-center gap-2 px-5 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark disabled:opacity-50">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {loading ? 'Importing...' : 'Import All Payments'}
                </button>
              </div>
              <div className="max-h-48 overflow-y-auto rounded-lg border border-border text-xs">
                <table className="w-full">
                  <thead className="bg-surface sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-text-secondary">Member</th>
                      <th className="px-3 py-2 text-left font-medium text-text-secondary">Amount</th>
                      <th className="px-3 py-2 text-left font-medium text-text-secondary">Payment Date</th>
                      <th className="px-3 py-2 text-left font-medium text-text-secondary">Membership Date</th>
                      <th className="px-3 py-2 text-left font-medium text-text-secondary">Mode</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={i} className="border-t border-border">
                        <td className="px-3 py-1.5 text-text-secondary">{r.member_id || r.email || r.phone}</td>
                        <td className="px-3 py-1.5 font-medium text-text-primary">₹{r.amount.toLocaleString()}</td>
                        <td className="px-3 py-1.5 text-text-secondary">{r.payment_date}</td>
                        <td className="px-3 py-1.5 text-text-secondary">{r.membership_date}</td>
                        <td className="px-3 py-1.5 text-text-secondary">{r.payment_mode}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        {done && results.length > 0 && (
          <div className="bg-white rounded-xl border border-border overflow-hidden">
            <div className={`px-6 py-5 flex items-center gap-4 ${failed === 0 ? 'bg-green-50 border-b border-green-200' : 'bg-amber-50 border-b border-amber-200'}`}>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${failed === 0 ? 'bg-green-100' : 'bg-amber-100'}`}>
                <CheckCircle className={`w-7 h-7 ${failed === 0 ? 'text-green-600' : 'text-amber-600'}`} />
              </div>
              <div className="flex-1">
                <p className="font-bold text-text-primary">{success} payment{success !== 1 ? 's' : ''} recorded successfully</p>
                <p className="text-sm text-text-secondary mt-0.5">Membership activated & dates updated automatically.{failed > 0 && ` · ${failed} failed`}</p>
              </div>
              <button onClick={() => { setRows([]); setResults([]); setDone(false) }}
                className="px-4 py-2 border border-border text-text-secondary text-sm font-medium rounded-lg hover:bg-gray-50">
                Upload More
              </button>
            </div>
            {failed > 0 && (
              <div className="p-4 space-y-2">
                <p className="text-xs font-semibold text-red-600">Failed:</p>
                {results.filter((r) => r.status === 'error').map((r, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 bg-red-50 rounded-lg text-xs">
                    <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <span className="text-text-secondary">{r.identifier}</span>
                    <span className="text-red-500 ml-auto">{r.message}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>}

      {activeTab === 'donation' && <div className="space-y-4">
        {/* Donation Step 1 */}
        <div className="bg-white rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-text-primary">Step 1 — Download Template</h3>
              <p className="text-xs text-text-secondary mt-0.5">Fill with donation details — one row per donation</p>
            </div>
            <button onClick={downloadDonationTemplate} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700">
              <Download className="w-4 h-4" /> Download Template
            </button>
          </div>
          <div className="bg-surface rounded-lg p-3 overflow-x-auto text-xs">
            <table className="w-full">
              <thead>
                <tr>
                  {DONATION_COLUMNS.map((c) => (
                    <th key={c.key} className={`px-2 py-1.5 text-left font-semibold whitespace-nowrap ${c.required ? 'text-yellow-700 bg-yellow-50' : 'text-text-secondary'}`}>
                      {c.label}{c.required && ' ★'}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="text-text-secondary">
                  {DONATION_SAMPLE(new Date().getFullYear().toString()).map((v, i) => <td key={i} className="px-2 py-1">{v}</td>)}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Donation Step 2 */}
        <div className="bg-white rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-1">Step 2 — Upload Filled Excel</h3>
          <p className="text-xs text-text-secondary mb-4">Members matched by Member ID → Email → Phone</p>
          <div onClick={() => donFileRef.current?.click()}
            className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-green-500/50 hover:bg-green-50/30 transition-colors">
            <FileSpreadsheet className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-medium text-text-primary">Click to select Excel file</p>
            <p className="text-xs text-text-secondary mt-1">.xlsx or .xls</p>
            <input ref={donFileRef} type="file" accept=".xlsx,.xls" onChange={handleDonFile} className="hidden" />
          </div>

          {donRows.length > 0 && !donDone && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-text-primary">{donRows.length} donations ready to import</p>
                <button onClick={handleDonImport} disabled={donLoading}
                  className="flex items-center gap-2 px-5 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50">
                  {donLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {donLoading ? 'Importing...' : 'Import All Donations'}
                </button>
              </div>
              <div className="max-h-48 overflow-y-auto rounded-lg border border-border text-xs">
                <table className="w-full">
                  <thead className="bg-surface sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-text-secondary">Member</th>
                      <th className="px-3 py-2 text-left font-medium text-text-secondary">Amount</th>
                      <th className="px-3 py-2 text-left font-medium text-text-secondary">Date</th>
                      <th className="px-3 py-2 text-left font-medium text-text-secondary">Purpose</th>
                      <th className="px-3 py-2 text-left font-medium text-text-secondary">Mode</th>
                    </tr>
                  </thead>
                  <tbody>
                    {donRows.map((r, i) => (
                      <tr key={i} className="border-t border-border">
                        <td className="px-3 py-1.5 text-text-secondary">{r.member_id || r.email || r.phone}</td>
                        <td className="px-3 py-1.5 font-medium text-text-primary">₹{r.amount.toLocaleString()}</td>
                        <td className="px-3 py-1.5 text-text-secondary">{r.payment_date}</td>
                        <td className="px-3 py-1.5 text-text-secondary">{r.purpose}</td>
                        <td className="px-3 py-1.5 text-text-secondary">{r.payment_mode}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Donation Results */}
        {donDone && donResults.length > 0 && (
          <div className="bg-white rounded-xl border border-border overflow-hidden">
            <div className={`px-6 py-5 flex items-center gap-4 ${donFailed === 0 ? 'bg-green-50 border-b border-green-200' : 'bg-amber-50 border-b border-amber-200'}`}>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${donFailed === 0 ? 'bg-green-100' : 'bg-amber-100'}`}>
                <CheckCircle className={`w-7 h-7 ${donFailed === 0 ? 'text-green-600' : 'text-amber-600'}`} />
              </div>
              <div className="flex-1">
                <p className="font-bold text-text-primary">{donSuccess} donation{donSuccess !== 1 ? 's' : ''} recorded</p>
                <p className="text-sm text-text-secondary mt-0.5">{donFailed > 0 && `${donFailed} failed`}</p>
              </div>
              <button onClick={() => { setDonRows([]); setDonResults([]); setDonDone(false) }}
                className="px-4 py-2 border border-border text-text-secondary text-sm font-medium rounded-lg hover:bg-gray-50">
                Upload More
              </button>
            </div>
            {donFailed > 0 && (
              <div className="p-4 space-y-2">
                {donResults.filter((r) => r.status === 'error').map((r, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 bg-red-50 rounded-lg text-xs">
                    <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <span className="text-text-secondary">{r.identifier}</span>
                    <span className="text-red-500 ml-auto">{r.message}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>}

      {activeTab === ('expense' as any) && <div className="space-y-4">
        {/* Expense Step 1 */}
        <div className="bg-white rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-text-primary">Step 1 — Download Template</h3>
              <p className="text-xs text-text-secondary mt-0.5">Fill with expense details — one row per expense</p>
            </div>
            <button onClick={downloadExpenseTemplate} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700">
              <Download className="w-4 h-4" /> Download Template
            </button>
          </div>
          <div className="bg-surface rounded-lg p-3 overflow-x-auto text-xs">
            <table className="w-full">
              <thead>
                <tr>
                  {EXPENSE_COLUMNS.map((c) => (
                    <th key={c.key} className={`px-2 py-1.5 text-left font-semibold whitespace-nowrap ${c.required ? 'text-yellow-700 bg-yellow-50' : 'text-text-secondary'}`}>
                      {c.label}{c.required && ' ★'}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="text-text-secondary">
                  {EXPENSE_SAMPLE.map((v, i) => <td key={i} className="px-2 py-1">{v}</td>)}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Expense Step 2 */}
        <div className="bg-white rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-1">Step 2 — Upload Filled Excel</h3>
          <p className="text-xs text-text-secondary mb-4">Each row creates one expense record</p>
          <div onClick={() => expFileRef.current?.click()}
            className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-red-400/50 hover:bg-red-50/20 transition-colors">
            <FileSpreadsheet className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-medium text-text-primary">Click to select Excel file</p>
            <p className="text-xs text-text-secondary mt-1">.xlsx or .xls</p>
            <input ref={expFileRef} type="file" accept=".xlsx,.xls" onChange={handleExpFile} className="hidden" />
          </div>

          {expRows.length > 0 && !expDone && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-text-primary">{expRows.length} expenses ready to import</p>
                <button onClick={handleExpImport} disabled={expLoading}
                  className="flex items-center gap-2 px-5 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50">
                  {expLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {expLoading ? 'Importing...' : 'Import All Expenses'}
                </button>
              </div>
              <div className="max-h-48 overflow-y-auto rounded-lg border border-border text-xs">
                <table className="w-full">
                  <thead className="bg-surface sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-text-secondary">Title</th>
                      <th className="px-3 py-2 text-left font-medium text-text-secondary">Category</th>
                      <th className="px-3 py-2 text-left font-medium text-text-secondary">Amount</th>
                      <th className="px-3 py-2 text-left font-medium text-text-secondary">Date</th>
                      <th className="px-3 py-2 text-left font-medium text-text-secondary">Mode</th>
                      <th className="px-3 py-2 text-left font-medium text-text-secondary">Paid To</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expRows.map((r, i) => (
                      <tr key={i} className="border-t border-border">
                        <td className="px-3 py-1.5 font-medium text-text-primary">{r.title}</td>
                        <td className="px-3 py-1.5 text-text-secondary">{r.category || '—'}</td>
                        <td className="px-3 py-1.5 text-red-600 font-medium">₹{r.amount.toLocaleString()}</td>
                        <td className="px-3 py-1.5 text-text-secondary">{r.date}</td>
                        <td className="px-3 py-1.5 text-text-secondary">{r.mode}</td>
                        <td className="px-3 py-1.5 text-text-secondary">{r.paid_to || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Expense Results */}
        {expDone && expResults.length > 0 && (
          <div className="bg-white rounded-xl border border-border overflow-hidden">
            <div className={`px-6 py-5 flex items-center gap-4 ${expFailed === 0 ? 'bg-green-50 border-b border-green-200' : 'bg-amber-50 border-b border-amber-200'}`}>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${expFailed === 0 ? 'bg-green-100' : 'bg-amber-100'}`}>
                <CheckCircle className={`w-7 h-7 ${expFailed === 0 ? 'text-green-600' : 'text-amber-600'}`} />
              </div>
              <div className="flex-1">
                <p className="font-bold text-text-primary">{expSuccess} expense{expSuccess !== 1 ? 's' : ''} recorded</p>
                <p className="text-sm text-text-secondary mt-0.5">{expFailed > 0 && `${expFailed} failed`}</p>
              </div>
              <button onClick={() => { setExpRows([]); setExpResults([]); setExpDone(false) }}
                className="px-4 py-2 border border-border text-text-secondary text-sm font-medium rounded-lg hover:bg-gray-50">
                Upload More
              </button>
            </div>
            {expFailed > 0 && (
              <div className="p-4 space-y-2">
                {expResults.filter((r) => r.status === 'error').map((r, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 bg-red-50 rounded-lg text-xs">
                    <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <span className="font-medium text-text-primary">{r.title}</span>
                    <span className="text-red-500 ml-auto">{r.message}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>}
    </div>
  )
}
