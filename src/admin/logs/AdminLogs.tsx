import { useEffect, useState } from 'react'
import { Search, RefreshCw, History, Loader2 } from 'lucide-react'
import { supabase, supabaseAdmin } from '../../lib/supabase'
import { Spinner } from '../../components/ui/Spinner'

interface LogEntry {
  id: string
  admin_name: string
  action: string
  entity_type: string
  entity_name: string
  entity_id: string | null
  details: string | null
  created_at: string
}

const ACTION_COLORS: Record<string, string> = {
  create:  'bg-green-50 text-green-700',
  update:  'bg-blue-50 text-blue-700',
  delete:  'bg-red-50 text-red-600',
  approve: 'bg-emerald-50 text-emerald-700',
  reject:  'bg-red-50 text-red-600',
  upload:  'bg-violet-50 text-violet-700',
  import:  'bg-amber-50 text-amber-700',
  login:   'bg-sky-50 text-sky-700',
  logout:  'bg-gray-100 text-gray-600',
}

const ACTION_ICONS: Record<string, string> = {
  create:  '➕',
  update:  '✏️',
  delete:  '🗑️',
  approve: '✅',
  reject:  '❌',
  upload:  '📤',
  import:  '📥',
  login:   '🔐',
  logout:  '🚪',
}

export function AdminLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [backfilling, setBackfilling] = useState(false)
  const [backfillDone, setBackfillDone] = useState(false)
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [entityFilter, setEntityFilter] = useState('')

  useEffect(() => { fetchLogs() }, [])

  async function fetchLogs() {
    setLoading(true)
    const { data } = await supabase
      .from('admin_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500)
    setLogs((data as LogEntry[]) || [])
    setLoading(false)
  }

  function formatTime(ts: string) {
    const d = new Date(ts)
    return d.toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const entities = [...new Set(logs.map((l) => l.entity_type))]
  const actions  = [...new Set(logs.map((l) => l.action))]

  const filtered = logs.filter((l) => {
    const matchSearch = !search ||
      l.admin_name?.toLowerCase().includes(search.toLowerCase()) ||
      l.entity_name?.toLowerCase().includes(search.toLowerCase()) ||
      l.entity_type?.toLowerCase().includes(search.toLowerCase())
    const matchAction = !actionFilter || l.action === actionFilter
    const matchEntity = !entityFilter || l.entity_type === entityFilter
    return matchSearch && matchAction && matchEntity
  })

  async function backfillHistory() {
    if (!confirm('This will import all existing records as historical log entries. Run only once. Continue?')) return
    setBackfilling(true)

    const logRows: any[] = []
    const adminName = 'Historical Import'

    // Members
    const { data: members } = await supabaseAdmin.from('profiles').select('id, full_name, role, created_at, approved_at').not('member_id', 'is', null)
    for (const m of members || []) {
      logRows.push({ admin_name: adminName, action: 'create', entity_type: 'member', entity_name: m.full_name, entity_id: m.id, details: `Role: ${m.role}`, created_at: m.created_at })
      if (m.approved_at) logRows.push({ admin_name: adminName, action: 'approve', entity_type: 'member', entity_name: m.full_name, entity_id: m.id, details: 'Account approved', created_at: m.approved_at })
    }

    // Payments/Donations
    const { data: donations } = await supabaseAdmin.from('donations').select('id, amount, donation_date, purpose, created_at, profiles!donations_user_id_fkey(full_name)')
    for (const d of (donations || []) as any[]) {
      logRows.push({ admin_name: adminName, action: 'create', entity_type: 'payment', entity_name: `₹${d.amount} — ${d.purpose || 'Donation'}`, entity_id: d.id, details: d.profiles?.full_name, created_at: d.created_at || d.donation_date })
    }

    // Expenses
    const { data: expenses } = await supabaseAdmin.from('expenses').select('id, title, amount, category, created_at')
    for (const e of expenses || []) {
      logRows.push({ admin_name: adminName, action: 'create', entity_type: 'expense', entity_name: e.title, entity_id: e.id, details: `₹${e.amount} — ${e.category || ''}`, created_at: e.created_at })
    }

    // Events
    const { data: events } = await supabaseAdmin.from('events').select('id, title_en, event_date, created_at')
    for (const ev of events || []) {
      logRows.push({ admin_name: adminName, action: 'create', entity_type: 'event', entity_name: ev.title_en, entity_id: ev.id, details: ev.event_date, created_at: ev.created_at })
    }

    // Gallery albums
    const { data: albums } = await supabaseAdmin.from('gallery_albums').select('id, title_en, created_at')
    for (const a of albums || []) {
      logRows.push({ admin_name: adminName, action: 'create', entity_type: 'gallery', entity_name: a.title_en, entity_id: a.id, created_at: a.created_at })
    }

    // Business listings
    const { data: businesses } = await supabaseAdmin.from('business_directory').select('id, business_name, created_at')
    for (const b of businesses || []) {
      logRows.push({ admin_name: adminName, action: 'create', entity_type: 'business', entity_name: b.business_name, entity_id: b.id, created_at: b.created_at })
    }

    // Matrimonial profiles
    const { data: matrimonial } = await supabaseAdmin.from('matrimonial_profiles').select('id, candidate_name, created_at')
    for (const mp of matrimonial || []) {
      logRows.push({ admin_name: adminName, action: 'create', entity_type: 'matrimonial', entity_name: mp.candidate_name, entity_id: mp.id, created_at: mp.created_at })
    }

    // Souvenir sponsors
    const { data: sponsors } = await supabaseAdmin.from('souvenir_sponsors').select('id, sponsor_name, amount, created_at')
    for (const s of sponsors || []) {
      logRows.push({ admin_name: adminName, action: 'create', entity_type: 'souvenir sponsor', entity_name: s.sponsor_name, entity_id: s.id, details: `₹${s.amount}`, created_at: s.created_at })
    }

    // Insert in batches of 100
    for (let i = 0; i < logRows.length; i += 100) {
      await supabase.from('admin_logs').insert(logRows.slice(i, i + 100))
    }

    setBackfilling(false)
    setBackfillDone(true)
    fetchLogs()
    alert(`✅ Imported ${logRows.length} historical records into logs.`)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Admin Logs</h1>
          <p className="text-sm text-text-secondary mt-0.5">Every action performed by admins</p>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          {!backfillDone && (
            <button onClick={backfillHistory} disabled={backfilling}
              className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-300 text-amber-700 rounded-lg text-sm font-medium hover:bg-amber-100 disabled:opacity-50 transition-colors">
              {backfilling ? <Loader2 className="w-4 h-4 animate-spin" /> : <History className="w-4 h-4" />}
              {backfilling ? 'Importing...' : 'Import Old Activity'}
            </button>
          )}
          <button onClick={fetchLogs} className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg text-sm text-text-secondary hover:bg-gray-50 transition-colors">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {(['create','update','delete','approve','login','logout'] as const).map((a) => (
          <div key={a} className="bg-white rounded-xl border border-border p-3 text-center">
            <p className="text-lg">{ACTION_ICONS[a]}</p>
            <p className="text-lg font-bold text-text-primary">{logs.filter(l=>l.action===a).length}</p>
            <p className="text-[10px] text-text-secondary capitalize">{a}d</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
          <input type="text" placeholder="Search by admin, entity name..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}
          className="px-3 py-2.5 border border-border rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
          <option value="">All Actions</option>
          {actions.map((a) => <option key={a} value={a}>{a.charAt(0).toUpperCase() + a.slice(1)}</option>)}
        </select>
        <select value={entityFilter} onChange={(e) => setEntityFilter(e.target.value)}
          className="px-3 py-2.5 border border-border rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
          <option value="">All Types</option>
          {entities.map((e) => <option key={e} value={e}>{e.charAt(0).toUpperCase() + e.slice(1)}</option>)}
        </select>
      </div>

      {loading ? <div className="flex justify-center py-20"><Spinner size="lg" /></div> : (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-text-secondary text-sm">No logs found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-gray-50 text-left">
                    <th className="px-4 py-3 font-medium text-text-secondary">Time</th>
                    <th className="px-4 py-3 font-medium text-text-secondary">Admin</th>
                    <th className="px-4 py-3 font-medium text-text-secondary">Action</th>
                    <th className="px-4 py-3 font-medium text-text-secondary">Type</th>
                    <th className="px-4 py-3 font-medium text-text-secondary">Name / Details</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((log) => (
                    <tr key={log.id} className="border-b border-border hover:bg-gray-50">
                      <td className="px-4 py-3 text-xs text-text-secondary whitespace-nowrap">{formatTime(log.created_at)}</td>
                      <td className="px-4 py-3 text-xs font-medium text-text-primary">{log.admin_name || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-600'}`}>
                          {ACTION_ICONS[log.action]} {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs bg-gray-100 text-text-secondary px-2 py-0.5 rounded-full capitalize">{log.entity_type}</span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs font-medium text-text-primary">{log.entity_name || '—'}</p>
                        {log.details && <p className="text-[10px] text-text-secondary mt-0.5">{log.details}</p>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
