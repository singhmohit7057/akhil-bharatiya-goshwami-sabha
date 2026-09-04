import { useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { UserPlus, Eye, EyeOff, Download, Upload, CheckCircle, XCircle, Loader2, FileSpreadsheet } from 'lucide-react'
import * as XLSX from 'xlsx'
import ExcelJS from 'exceljs'
import { supabaseAdmin } from '../../lib/supabase'
import { transliterateToHindi } from '../../lib/transliterate'
import { useAuth } from '../../hooks/useAuth'
import { useDesignations } from '../../hooks/useDesignations'
import type { MemberRole } from '../../types'
import { DateInput } from '../../components/ui/DateInput'

interface BulkRow {
  full_name: string
  email: string
  password: string
  phone?: string
  gender?: string
  gotra?: string
  city?: string
  state?: string
  role?: string
  caste?: string
  date_of_birth?: string
  address?: string
  village_address?: string
}

interface BulkResult {
  name: string
  email: string
  status: 'success' | 'error'
  message: string
}

function toTitleCase(str: string): string {
  return str.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
}

const COLUMNS: { key: string; label: string; required: boolean }[] = [
  { key: 'name',            label: 'Name',          required: true  },
  { key: 'email',           label: 'Email',          required: true  },
  { key: 'phone_number',    label: 'Phone Number',   required: true  },
  { key: 'password',        label: 'Password',       required: true  },
  { key: 'designation',     label: 'Designation',    required: true  },
  { key: 'gender',          label: 'Gender',         required: false },
  { key: 'date_of_birth',   label: 'Date of Birth',  required: false },
  { key: 'caste',           label: 'Caste',          required: false },
  { key: 'gotra',           label: 'Gotra',          required: false },
  { key: 'city',            label: 'City',           required: false },
  { key: 'local_address',   label: 'Local Address',  required: false },
  { key: 'village_address', label: 'Village Address',required: false },
]
const SAMPLE_ROW = ['Rajesh Giri', 'rajesh@example.com', '9876543210', 'Pass@1234', 'member', 'male', '14-11-1990', 'Goswami', 'Giri', 'Kolkata', '123 Main St, Kolkata-700001', 'Varanasi, UP']

export function AddMember() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { designations } = useDesignations()
  const [tab, setTab] = useState<'single' | 'bulk'>('single')

  // Single form
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [hiManuallyEdited, setHiManuallyEdited] = useState(false)
  const [form, setForm] = useState({
    full_name: '', full_name_hi: '', email: '', password: '',
    phone: '', gender: '', gotra: '', city: '', state: '',
    role: 'member' as MemberRole,
    date_of_birth: '', caste: '', address: '', village_address: '',
  })

  // Bulk upload
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [bulkRows, setBulkRows] = useState<BulkRow[]>([])
  const [bulkResults, setBulkResults] = useState<BulkResult[]>([])
  const [bulkLoading, setBulkLoading] = useState(false)
  const [bulkDone, setBulkDone] = useState(false)

  async function downloadTemplate() {
    const wb = new ExcelJS.Workbook()
    const ws = wb.addWorksheet('Members')

    ws.columns = COLUMNS.map((col) => ({ header: col.label, key: col.key, width: 22 }))

    // Style header row — yellow for required, light blue for optional
    ws.getRow(1).eachCell((cell, colNumber) => {
      const col = COLUMNS[colNumber - 1]
      cell.font = { bold: true, size: 11, color: { argb: 'FF000000' } }
      cell.fill = {
        type: 'pattern', pattern: 'solid',
        fgColor: { argb: col?.required ? 'FFFFFF00' : 'FFD6E4F0' },
      }
      cell.border = {
        top: { style: 'thin' }, left: { style: 'thin' },
        bottom: { style: 'thin' }, right: { style: 'thin' },
      }
      cell.alignment = { vertical: 'middle', horizontal: 'center' }
    })
    ws.getRow(1).height = 22

    // Required note row
    const noteRow = ws.addRow(COLUMNS.map((col) => col.required ? '★ REQUIRED' : 'optional'))
    noteRow.eachCell((cell, colNumber) => {
      const col = COLUMNS[colNumber - 1]
      cell.font = { italic: true, size: 9, color: { argb: col?.required ? 'FFC00000' : 'FF888888' } }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFAFAFA' } }
      cell.alignment = { horizontal: 'center' }
    })

    // Sample data row
    const dataRow = ws.addRow(SAMPLE_ROW)
    dataRow.eachCell((cell) => {
      cell.font = { size: 10, color: { argb: 'FF444444' } }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F0F0' } }
    })

    // Freeze header
    ws.views = [{ state: 'frozen', ySplit: 1 }]

    const buffer = await wb.xlsx.writeBuffer()
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'member_bulk_template.xlsx'
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const wb = XLSX.read(ev.target?.result, { type: 'binary' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        // Skip the "★ REQUIRED / optional" note row if present
        const raw = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: '' })
        const data = raw.filter((row) => {
          const first = Object.values(row)[0] || ''
          return !String(first).includes('REQUIRED') && !String(first).includes('optional')
        })
        const rows: BulkRow[] = data.map((row) => {
          // Convert DD-MM-YYYY → YYYY-MM-DD for Supabase
          const rawDob = String(row['Date of Birth'] || row['date_of_birth'] || '').trim()
          let dob: string | undefined
          if (rawDob) {
            // Handle Excel serial number date
            if (!isNaN(Number(rawDob))) {
              const d = new Date((Number(rawDob) - 25569) * 86400 * 1000)
              dob = d.toISOString().split('T')[0]
            } else if (/^\d{2}-\d{2}-\d{4}$/.test(rawDob)) {
              const [dd, mm, yyyy] = rawDob.split('-')
              dob = `${yyyy}-${mm}-${dd}`
            } else if (/^\d{4}-\d{2}-\d{2}$/.test(rawDob)) {
              dob = rawDob
            }
          }
          return {
            full_name: toTitleCase(String(row['Name'] || row['full_name'] || '').trim()),
            email: String(row['Email'] || row['email'] || '').trim(),
            password: String(row['Password'] || row['password'] || '').trim(),
            phone: String(row['Phone Number'] || row['phone_number'] || row['phone'] || '').trim() || undefined,
            gender: String(row['Gender'] || row['gender'] || '').trim() || undefined,
            gotra: String(row['Gotra'] || row['gotra'] || '').trim() || undefined,
            city: String(row['City'] || row['city'] || '').trim() || undefined,
            role: String(row['Designation'] || row['designation'] || row['role'] || '').trim().toLowerCase() || undefined,
            caste: String(row['Caste'] || row['caste'] || '').trim() || undefined,
            date_of_birth: dob,
            address: String(row['Local Address'] || row['local_address'] || row['address'] || '').trim() || undefined,
            village_address: String(row['Village Address'] || row['village_address'] || '').trim() || undefined,
          }
        }).filter((r) => r.full_name && r.email && r.password && !r.email.includes('example.com'))
        setBulkRows(rows)
        setBulkResults([])
        setBulkDone(false)
        if (rows.length === 0) toast.error('No valid rows found. Check the file format.')
        else toast.success(`${rows.length} members ready to import`)
      } catch {
        toast.error('Failed to read file. Please use the provided template.')
      }
    }
    reader.readAsBinaryString(file)
    e.target.value = ''
  }

  async function createUserViaAdminApi(email: string, password: string, fullName: string): Promise<{ userId: string | null; error: string | null }> {
    const serviceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    if (!serviceKey) return { userId: null, error: 'Service role key not configured' }
    const res = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      }),
    })
    const json = await res.json()

    // If email already exists, look up the existing user's ID from profiles table
    if (!res.ok) {
      const msg: string = json.message || json.msg || ''
      if (msg.toLowerCase().includes('already') || msg.toLowerCase().includes('exists') || res.status === 422) {
        const { data: existingProfile } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('email', email)
          .maybeSingle()
        if (existingProfile?.id) return { userId: existingProfile.id, error: null }
      }
      return { userId: null, error: msg || 'Failed to create user' }
    }

    // Wait for the DB trigger to create the profile row (up to 3s, polling every 300ms)
    const userId = json.id
    for (let i = 0; i < 10; i++) {
      await new Promise((r) => setTimeout(r, 300))
      const { data } = await supabaseAdmin.from('profiles').select('id').eq('id', userId).maybeSingle()
      if (data?.id) break
    }
    return { userId, error: null }
  }

  async function generateMemberId(): Promise<string> {
    const { count } = await supabaseAdmin
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .not('member_id', 'is', null)
    const nextNum = (count || 0) + 1
    return `ABGSPB/${String(nextNum).padStart(4, '0')}`
  }

  async function handleBulkUpload() {
    if (!bulkRows.length) return
    setBulkLoading(true)
    setBulkResults([])

    const results: BulkResult[] = []
    for (const row of bulkRows) {
      try {
        const { userId, error: createError } = await createUserViaAdminApi(row.email, row.password, row.full_name)
        if (createError || !userId) { results.push({ name: row.full_name, email: row.email, status: 'error', message: createError || 'Unknown error' }); continue }
        if (userId) {
          // Only assign member_id if not already set
          const { data: existing } = await supabaseAdmin.from('profiles').select('member_id').eq('id', userId).maybeSingle()
          const memberId = existing?.member_id || await generateMemberId()
          const { error: updateErr } = await supabaseAdmin.from('profiles').update({
            member_id: memberId,
            full_name: row.full_name,
            full_name_hi: transliterateToHindi(row.full_name),
            phone: row.phone || null,
            gender: row.gender || null,
            date_of_birth: row.date_of_birth || null,
            gotra: row.gotra || null,
            caste: row.caste || null,
            city: row.city || null,
            state: row.state || null,
            address: row.address || null,
            village_address: row.village_address || null,
            role: ((row.role?.toLowerCase() || 'member') as MemberRole),
            account_status: 'active',
            approved_by: user?.id,
            approved_at: new Date().toISOString(),
          }).eq('id', userId)
          if (updateErr) { results.push({ name: row.full_name, email: row.email, status: 'error', message: `Profile update failed: ${updateErr.message}` }); continue }
          results.push({ name: row.full_name, email: row.email, status: 'success', message: 'Saved & approved' })
        }
      } catch {
        results.push({ name: row.full_name, email: row.email, status: 'error', message: 'Unexpected error' })
      }
    }
    setBulkResults(results)
    setBulkLoading(false)
    setBulkDone(true)
    const success = results.filter((r) => r.status === 'success').length
    const failed = results.filter((r) => r.status === 'error').length
    toast.success(`Imported ${success} members${failed ? `, ${failed} failed` : ''}`)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { userId, error: createError } = await createUserViaAdminApi(form.email, form.password, form.full_name)
    if (createError || !userId) { toast.error(createError || 'Failed to create account'); setLoading(false); return }
    if (userId) {
      const memberId = await generateMemberId()
      await supabaseAdmin.from('profiles').update({
        full_name: form.full_name, full_name_hi: form.full_name_hi || null,
        phone: form.phone || null, gender: form.gender || null,
        date_of_birth: form.date_of_birth || null,
        gotra: form.gotra || null, caste: form.caste || null,
        city: form.city || null, state: form.state || null,
        address: form.address || null,
        village_address: form.village_address || null,
        role: form.role,
        member_id: memberId,
        account_status: 'active', approved_by: user?.id,
        approved_at: new Date().toISOString(),
      }).eq('id', userId)
    }
    toast.success(`Member "${form.full_name}" created and auto-approved`)
    navigate('/admin/members')
  }

  const inputClass = 'w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30'

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary mb-1">Add Member</h1>
      <p className="text-sm text-text-secondary mb-6">Create a new member account (auto-approved by admin)</p>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        <button
          onClick={() => setTab('single')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${tab === 'single' ? 'bg-primary text-white' : 'bg-white border border-border text-text-secondary hover:bg-gray-50'}`}
        >
          <UserPlus className="w-4 h-4" /> Single Member
        </button>
        <button
          onClick={() => setTab('bulk')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${tab === 'bulk' ? 'bg-primary text-white' : 'bg-white border border-border text-text-secondary hover:bg-gray-50'}`}
        >
          <FileSpreadsheet className="w-4 h-4" /> Bulk Upload
        </button>
      </div>

      {/* Single Member Form */}
      {tab === 'single' && (
        <div className="bg-white rounded-xl border border-border p-5">
          <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg mb-5 text-xs text-green-700">
            <UserPlus className="w-4 h-4 shrink-0" />
            Members created by admin are auto-approved and can login immediately. No verification needed.
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Row 1: Name EN | Name Hindi */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-text-primary mb-1">Name (English) *</label>
                <input type="text" required value={form.full_name} onChange={(e) => {
                  const val = e.target.value
                  setForm((prev) => ({ ...prev, full_name: val, ...(hiManuallyEdited ? {} : { full_name_hi: transliterateToHindi(val) }) }))
                }} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-primary mb-1">Name (Hindi)</label>
                <input type="text" value={form.full_name_hi} onChange={(e) => { setHiManuallyEdited(true); setForm({ ...form, full_name_hi: e.target.value }) }} className={inputClass} />
              </div>
            </div>

            {/* Row 2: DOB | Gender */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-text-primary mb-1">Date of Birth</label>
                <DateInput value={form.date_of_birth} onChange={(v) => setForm({ ...form, date_of_birth: v })} />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-primary mb-1">Gender</label>
                <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className={`${inputClass} bg-white`}>
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {/* Row 3: Email | Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-text-primary mb-1">Email *</label>
                <input type="email" required autoComplete="new-email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-primary mb-1">Phone</label>
                <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputClass} />
              </div>
            </div>

            {/* Row 4: Password | Designation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-text-primary mb-1">Password *</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} required minLength={6} autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={`${inputClass} pr-10`} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-text-primary mb-1">Designation</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as MemberRole })} className={`${inputClass} bg-white`}>
                  {designations.map((d) => <option key={d.slug} value={d.slug}>{d.name_en}</option>)}
                </select>
              </div>
            </div>

            {/* Row 5: Caste | Gotra */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-text-primary mb-1">Caste</label>
                <input type="text" placeholder="e.g. Goswami" value={form.caste} onChange={(e) => setForm({ ...form, caste: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-primary mb-1">Gotra</label>
                <input type="text" value={form.gotra} onChange={(e) => setForm({ ...form, gotra: e.target.value })} className={inputClass} />
              </div>
            </div>

            {/* Row 6: City (shown on ID card) */}
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">City <span className="text-text-secondary font-normal text-[10px]">(shown on ID card)</span></label>
              <input type="text" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className={inputClass} />
            </div>

            {/* Row 7: Local Address */}
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">Local Address</label>
              <textarea rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={inputClass} />
            </div>

            {/* Row 8: Village Address */}
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">Village Address</label>
              <textarea rows={2} placeholder="Village, Post Office, District..." value={form.village_address} onChange={(e) => setForm({ ...form, village_address: e.target.value })} className={inputClass} />
            </div>

            <button type="submit" disabled={loading} className="px-5 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark disabled:opacity-50">
              {loading ? '...' : 'Create Member'}
            </button>
          </form>
        </div>
      )}

      {/* Bulk Upload */}
      {tab === 'bulk' && (
        <div className="space-y-4">
          {/* Step 1: Download template */}
          <div className="bg-white rounded-xl border border-border p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-text-primary">Step 1 — Download Template</h3>
                <p className="text-xs text-text-secondary mt-0.5">Fill in member details using the Excel template</p>
              </div>
              <button
                onClick={downloadTemplate}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="w-4 h-4" /> Download Template
              </button>
            </div>
            <div className="bg-surface rounded-lg p-3 overflow-x-auto">
              <table className="text-xs w-full">
                <thead>
                  <tr>
                    {COLUMNS.map((col) => (
                      <th key={col.key} className={`px-2 py-1.5 text-left font-semibold whitespace-nowrap rounded ${col.required ? 'bg-yellow-100 text-yellow-800' : 'text-text-secondary'}`}>
                        {col.label}{col.required && ' ★'}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="text-text-secondary">
                    {SAMPLE_ROW.map((val, i) => <td key={i} className="px-2 py-1">{val}</td>)}
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-[10px] text-text-secondary mt-2">
              <span className="inline-block bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded font-medium mr-1">★ Yellow</span> = required &nbsp;·&nbsp; designation values: member, president, secretary, treasurer, coordinator, etc.
            </p>
            <p className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1.5 mt-2">
              ⚠ Delete the sample row (row 3) from the template before uploading. Keep only your real member data.
            </p>
          </div>

          {/* Step 2: Upload file */}
          <div className="bg-white rounded-xl border border-border p-5">
            <h3 className="text-sm font-semibold text-text-primary mb-1">Step 2 — Upload Filled Excel</h3>
            <p className="text-xs text-text-secondary mb-4">Upload the filled template (.xlsx or .xls)</p>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
            >
              <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-text-primary">Click to select Excel file</p>
              <p className="text-xs text-text-secondary mt-1">.xlsx or .xls</p>
              <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleFileChange} className="hidden" />
            </div>

            {bulkRows.length > 0 && !bulkDone && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-text-primary">{bulkRows.length} members ready to import</p>
                  <button
                    onClick={handleBulkUpload}
                    disabled={bulkLoading}
                    className="flex items-center gap-2 px-5 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark disabled:opacity-50 transition-colors"
                  >
                    {bulkLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {bulkLoading ? 'Importing...' : 'Import All Members'}
                  </button>
                </div>
                <div className="max-h-48 overflow-y-auto rounded-lg border border-border">
                  <table className="w-full text-xs">
                    {(() => {
                      const allCols: { key: keyof BulkRow; label: string }[] = [
                        { key: 'full_name', label: 'Name' },
                        { key: 'email', label: 'Email' },
                        { key: 'phone', label: 'Phone' },
                        { key: 'gender', label: 'Gender' },
                        { key: 'date_of_birth', label: 'DOB' },
                        { key: 'caste', label: 'Caste' },
                        { key: 'gotra', label: 'Gotra' },
                        { key: 'city', label: 'City' },
                        { key: 'address', label: 'Local Address' },
                        { key: 'village_address', label: 'Village' },
                        { key: 'role', label: 'Role' },
                      ]
                      const visibleCols = allCols.filter((col) =>
                        bulkRows.some((row) => row[col.key])
                      )
                      return (
                        <>
                          <thead className="bg-surface sticky top-0">
                            <tr>
                              <th className="px-3 py-2 text-left font-medium text-text-secondary">#</th>
                              {visibleCols.map((col) => (
                                <th key={col.key} className="px-3 py-2 text-left font-medium text-text-secondary whitespace-nowrap">{col.label}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {bulkRows.map((row, i) => (
                              <tr key={i} className="border-t border-border">
                                <td className="px-3 py-1.5 text-text-secondary">{i + 1}</td>
                                {visibleCols.map((col) => (
                                  <td key={col.key} className={`px-3 py-1.5 ${col.key === 'full_name' ? 'font-medium text-text-primary' : 'text-text-secondary'}`}>
                                    {row[col.key] || (col.key === 'role' ? 'member' : '—')}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </>
                      )
                    })()}
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Results */}
          {bulkDone && bulkResults.length > 0 && (() => {
            const success = bulkResults.filter((r) => r.status === 'success').length
            const failed = bulkResults.filter((r) => r.status === 'error').length
            return (
              <div className="bg-white rounded-xl border border-border overflow-hidden">
                {/* Success banner */}
                <div className="bg-green-50 border-b border-green-200 px-6 py-5 flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                    <CheckCircle className="w-7 h-7 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-base font-bold text-green-800">
                      {success} profile{success !== 1 ? 's' : ''} created & auto-approved
                    </p>
                    <p className="text-sm text-green-700 mt-0.5">
                      All members are now active and can login immediately.
                      {failed > 0 && <span className="text-red-600 ml-2">· {failed} failed</span>}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => { setBulkRows([]); setBulkResults([]); setBulkDone(false) }}
                      className="px-4 py-2 border border-green-300 text-green-700 text-sm font-medium rounded-lg hover:bg-green-100 transition-colors"
                    >
                      Import More
                    </button>
                    <Link
                      to="/admin/members"
                      className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition-colors"
                    >
                      View All Members →
                    </Link>
                  </div>
                </div>
                {/* Failed rows only */}
                {failed > 0 && (
                  <div className="p-4 space-y-2">
                    <p className="text-xs font-semibold text-red-600 mb-2">Failed imports:</p>
                    {bulkResults.filter((r) => r.status === 'error').map((res, i) => (
                      <div key={i} className="flex items-center gap-3 p-2.5 bg-red-50 rounded-lg text-xs">
                        <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                        <span className="font-medium text-text-primary">{res.name}</span>
                        <span className="text-text-secondary">{res.email}</span>
                        <span className="text-red-500 ml-auto">{res.message}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })()}
        </div>
      )}
    </div>
  )
}
