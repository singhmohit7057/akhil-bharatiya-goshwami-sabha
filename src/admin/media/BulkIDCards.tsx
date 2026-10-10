import { useEffect, useState } from 'react'
import { toPng } from 'html-to-image'
import JSZip from 'jszip'
import { Download, Loader2, CheckSquare, Square, Users, Check } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'
import { getRoleLabel, formatDate } from '../../lib/utils'
import { Spinner } from '../../components/ui/Spinner'
import type { Profile } from '../../types'

// ── Design 1: PVC ID Card (landscape, credit-card size) ──────────────────────
function PVCCard({ member, id }: { member: any; id: string }) {
  return (
    <div id={id} className="w-[420px] rounded-2xl overflow-hidden shrink-0 bg-white" style={{ aspectRatio: '85.6/54' }}>
      <div className="h-full flex flex-col">
        <div className="h-[56px] bg-gradient-to-r from-[#FF9933] to-[#e8702a] shrink-0 relative flex items-center">
          <img src="/logo.png" alt="" className="w-11 h-11 object-contain absolute left-3" />
          <div className="w-full flex flex-col items-center justify-center">
            <p className="text-[12px] font-bold text-white tracking-wide leading-tight">AKHIL BHARATIYA GOSWAMI SABHA</p>
            <p className="text-[9px] text-white/80 tracking-wider">PASCHIM BANGAL</p>
          </div>
          <img src="/preserver-tilak.png" alt="" className="w-11 h-11 object-contain absolute right-3" />
        </div>
        <div className="flex-1 px-5 py-3 flex gap-4">
          <div className="flex flex-col items-center gap-1 shrink-0">
            <div className="w-[76px] h-[86px] rounded-lg border-2 border-[#FF9933] flex items-center justify-center overflow-hidden bg-gray-50">
              {member.profile_photo_url
                ? <img src={member.profile_photo_url} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
                : <div className="w-full h-full flex items-center justify-center bg-gray-100 text-2xl font-bold text-gray-400">{member.full_name?.charAt(0)}</div>}
            </div>
            {member.city && <p className="text-[9px] font-semibold text-gray-600 text-center leading-tight max-w-[76px] truncate">{member.city}</p>}
          </div>
          <div className="flex-1 min-w-0 flex flex-col justify-between">
            <div>
              <p className="text-[16px] font-bold text-gray-900 leading-tight truncate">{member.full_name}</p>
              <p className="text-[11px] font-semibold text-[#FF9933] mt-0.5">{getRoleLabel(member.role)}</p>
              <div className="mt-1 space-y-0.5 text-[11px]">
                <div className="flex items-center gap-1">
                  <span className="text-gray-500 font-semibold uppercase tracking-wide">ID:</span>
                  <span className="font-mono font-bold text-gray-800">{member.member_id || 'PENDING'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-gray-500 font-semibold uppercase tracking-wide">Since:</span>
                  <span className="font-semibold text-gray-800">{member.member_since || member.created_at ? formatDate(member.member_since || member.created_at, 'en') : ''}</span>
                </div>
                {member.membership_end_date && (
                  <div className="flex items-center gap-1">
                    <span className="text-gray-500 font-semibold uppercase tracking-wide">Valid Till:</span>
                    <span className="font-semibold text-gray-800">{formatDate(member.membership_end_date, 'en')}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 mt-1">
              {member.gotra && <div><p className="text-[8px] text-gray-400 uppercase">Gotra</p><p className="text-[10px] font-semibold text-gray-700">{member.gotra}</p></div>}
              {member.caste && <div><p className="text-[8px] text-gray-400 uppercase">Caste</p><p className="text-[10px] font-semibold text-gray-700">{member.caste}</p></div>}
              {member.phone && <div><p className="text-[8px] text-gray-400 uppercase">Phone</p><p className="text-[10px] font-semibold text-gray-700">{member.phone}</p></div>}
              {member.date_of_birth && <div><p className="text-[8px] text-gray-400 uppercase">DOB</p><p className="text-[10px] font-semibold text-gray-700">{formatDate(member.date_of_birth, 'en')}</p></div>}
            </div>
          </div>
          <div className="flex flex-col items-center justify-center shrink-0">
            <div className="rounded border border-gray-200 p-1 bg-white">
              <QRCodeSVG value={`https://akhilbharatiyagoswami.com/verify/${encodeURIComponent(member.member_id || member.id)}`} size={52} level="M" fgColor="#1a6b3c" />
            </div>
            <p className="text-[6px] text-gray-400 mt-0.5">Scan to verify</p>
          </div>
        </div>
        <div className="h-[28px] bg-gradient-to-r from-[#1a6b3c] to-[#138808] px-5 flex items-center justify-between shrink-0">
          {member.is_executive_member
            ? <span className="text-[7px] bg-white/20 text-white px-2.5 py-0.5 rounded-full font-bold tracking-widest uppercase">★ Executive Member ★</span>
            : <span className="text-[7px] text-white/70">Member Since {member.member_since || member.created_at ? formatDate(member.member_since || member.created_at, 'en').split(' ').slice(0,3).join(' ') : ''}</span>}
          <p className="text-[7px] text-white/70 font-medium">akhilbharatiyagoswami.com</p>
        </div>
      </div>
    </div>
  )
}

// ── Design 2: Event Badge (portrait, lanyard/exhibition) ──────────────────────
function EventBadge({ member, id }: { member: any; id: string }) {
  return (
    <div id={id} className="w-[320px] overflow-hidden shrink-0 flex flex-col" style={{ background: '#fffaf5' }}>
      {/* Saffron top stripe */}
      <div className="h-[10px] bg-gradient-to-r from-[#FF9933] to-[#e8702a] shrink-0" />

      {/* Header */}
      <div className="bg-white px-5 pt-4 pb-3 flex items-center gap-3 border-b border-gray-100">
        <img src="/logo.png" alt="" className="w-10 h-10 object-contain shrink-0" />
        <div className="flex-1 text-center">
          <p className="text-[8px] font-extrabold text-gray-800 tracking-widest uppercase leading-tight whitespace-nowrap">Akhil Bharatiya Goswami Sabha</p>
          <p className="text-[8px] text-[#FF9933] font-semibold tracking-widest uppercase">Paschim Bangal</p>
        </div>
        <img src="/preserver-tilak.png" alt="" className="w-10 h-10 object-contain shrink-0" />
      </div>

      {/* Photo + name section */}
      <div className="bg-gradient-to-b from-[#FF9933]/10 to-transparent px-5 pt-5 pb-4 flex gap-4 items-center">
        <div className="w-[88px] h-[88px] rounded-2xl border-3 border-[#FF9933] overflow-hidden bg-gray-100 flex items-center justify-center shadow-md shrink-0" style={{ border: '3px solid #FF9933' }}>
          {member.profile_photo_url
            ? <img src={member.profile_photo_url} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
            : <div className="w-full h-full flex items-center justify-center bg-orange-50 text-4xl font-extrabold text-[#FF9933]">{member.full_name?.charAt(0)}</div>}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[17px] font-extrabold text-gray-900 leading-tight">{member.full_name}</p>
          <p className="text-[10px] font-bold text-[#FF9933] mt-0.5 uppercase tracking-wide">{getRoleLabel(member.role)}</p>
          {member.is_executive_member && member.role !== 'executive_member' && (
            <span className="inline-block mt-1.5 text-[7px] bg-amber-500 text-white px-2 py-0.5 rounded-full font-bold tracking-widest uppercase">★ Executive Member ★</span>
          )}
          <div className="mt-2 inline-block bg-gray-900 text-white px-2 py-0.5 rounded text-[9px] font-mono font-bold">{member.member_id || 'PENDING'}</div>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-5 border-t border-dashed border-gray-200 my-1" />

      {/* Details grid */}
      <div className="px-5 py-3 grid grid-cols-2 gap-x-4 gap-y-2.5">
        {member.city && (
          <div><p className="text-[7px] font-bold text-gray-400 uppercase tracking-widest">City</p><p className="text-[11px] font-semibold text-gray-800">{member.city}</p></div>
        )}
        {member.phone && (
          <div><p className="text-[7px] font-bold text-gray-400 uppercase tracking-widest">Phone</p><p className="text-[11px] font-semibold text-gray-800">{member.phone}</p></div>
        )}
        {member.member_since && (
          <div><p className="text-[7px] font-bold text-gray-400 uppercase tracking-widest">Member Since</p><p className="text-[11px] font-semibold text-gray-800">{formatDate(member.member_since, 'en')}</p></div>
        )}
        {member.membership_end_date && (
          <div><p className="text-[7px] font-bold text-gray-400 uppercase tracking-widest">Valid Till</p><p className="text-[11px] font-semibold text-gray-800">{formatDate(member.membership_end_date, 'en')}</p></div>
        )}
      </div>

      {/* Bottom band */}
      <div className="mt-auto bg-gradient-to-r from-[#1a6b3c] to-[#138808] mx-0 px-5 py-3 flex items-center justify-between">
        <div>
          <p className="text-[8px] font-bold text-white/90 uppercase tracking-widest">Scan to Verify</p>
          <p className="text-[7px] text-white/60 mt-0.5">akhilbharatiyagoswami.com</p>
        </div>
        <div className="bg-white rounded-lg p-1.5">
          <QRCodeSVG value={`https://akhilbharatiyagoswami.com/verify/${encodeURIComponent(member.member_id || member.id)}`} size={44} level="M" fgColor="#1a6b3c" />
        </div>
      </div>
      {/* Green bottom stripe */}
      <div className="h-[8px] bg-gradient-to-r from-[#FF9933] to-[#e8702a]" />
    </div>
  )
}

// ── Design 3: Centered Portrait Card ─────────────────────────────────────────
function EliteCard({ member, id }: { member: any; id: string }) {
  return (
    <div id={id} className="w-[320px] overflow-hidden shrink-0 flex flex-col bg-white" style={{ height: '490px' }}>
      {/* Saffron top header */}
      <div className="bg-gradient-to-r from-[#FF9933] to-[#e8702a] px-5 py-5 flex items-center justify-between shrink-0">
        <img src="/logo.png" alt="" className="w-8 h-8 object-contain" />
        <div className="text-center">
          <p className="text-[9px] font-extrabold text-white tracking-widest uppercase">Akhil Bharatiya Goswami Sabha</p>
          <p className="text-[7px] text-white/70 tracking-widest">Paschim Bangal</p>
        </div>
        <img src="/preserver-tilak.png" alt="" className="w-8 h-8 object-contain" />
      </div>

      {/* Centered photo + name */}
      <div className="flex flex-col items-center px-5 pt-6 pb-4">
        <div className="w-[96px] h-[96px] rounded-full overflow-hidden border-[4px] border-[#FF9933] shadow-md flex items-center justify-center bg-gray-50">
          {member.profile_photo_url
            ? <img src={member.profile_photo_url} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
            : <div className="text-4xl font-extrabold text-[#FF9933]">{member.full_name?.charAt(0)}</div>}
        </div>
        <p className="text-[18px] font-extrabold text-gray-900 text-center leading-tight mt-3">{member.full_name}</p>
        <p className="text-[10px] font-bold text-[#FF9933] uppercase tracking-widest mt-0.5">{getRoleLabel(member.role)}</p>
        {member.is_executive_member && member.role !== 'executive_member' && (
          <span className="mt-1.5 text-[7px] bg-amber-50 border border-amber-300 text-amber-700 px-2 py-0.5 rounded-full font-bold tracking-widest uppercase">★ Executive Member ★</span>
        )}
        <div className="mt-2 bg-gray-900 text-white px-3 py-0.5 rounded-full text-[9px] font-mono font-bold">{member.member_id || 'PENDING'}</div>
      </div>

      {/* Divider */}
      <div className="mx-6 border-t border-dashed border-gray-200" />

      {/* Two-column details */}
      <div className="px-6 py-4 flex-1">
        <div className="grid grid-cols-2 gap-x-4 gap-y-4">
          <div className="text-center">
            <p className="text-[7px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">City</p>
            <p className="text-[12px] font-bold text-gray-800">{member.city || '—'}</p>
          </div>
          <div className="text-center">
            <p className="text-[7px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Phone</p>
            <p className="text-[12px] font-bold text-gray-800">{member.phone || '—'}</p>
          </div>
          <div className="text-center">
            <p className="text-[7px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Member Since</p>
            <p className="text-[11px] font-bold text-gray-800">{member.member_since ? formatDate(member.member_since, 'en') : '—'}</p>
          </div>
          <div className="text-center">
            <p className="text-[7px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Valid Till</p>
            <p className="text-[11px] font-bold text-gray-800">{member.membership_end_date ? formatDate(member.membership_end_date, 'en') : '—'}</p>
          </div>
        </div>
      </div>

      {/* Green footer with QR */}
      <div className="bg-gradient-to-r from-[#1a6b3c] to-[#138808] px-5 py-2.5 flex items-center justify-between shrink-0">
        <div>
          <p className="text-[7px] font-bold text-white/80 uppercase tracking-widest">Scan to Verify</p>
          <p className="text-[6px] text-white/50">akhilbharatiyagoswami.com</p>
        </div>
        <div className="bg-white rounded-lg p-1">
          <QRCodeSVG value={`https://akhilbharatiyagoswami.com/verify/${encodeURIComponent(member.member_id || member.id)}`} size={40} level="M" fgColor="#1a6b3c" />
        </div>
      </div>
    </div>
  )
}


// ── Preview (scaled down) ─────────────────────────────────────────────────────
const SAMPLE = {
  id: 'preview', full_name: 'Shashi Kumar Giri', member_id: 'ABGSPB/0001',
  role: 'executive_member', is_executive_member: true, city: 'Kolkata',
  gotra: 'Vatsa', phone: '9331038940', profile_photo_url: null,
  member_since: '2024-09-01', created_at: '2024-09-01', caste: 'Goswami',
  date_of_birth: '1976-11-14', membership_end_date: '2025-11-01',
}

export function BulkIDCards() {
  const [members, setMembers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [design, setDesign] = useState<'pvc' | 'badge' | 'elite'>('pvc')
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    supabase.from('profiles').select('*').eq('account_status', 'active').order('member_id', { ascending: true, nullsFirst: false })
      .then(({ data }) => { setMembers((data as Profile[]) || []); setLoading(false) })
  }, [])

  function toggleAll() {
    if (selected.size === members.length) setSelected(new Set())
    else setSelected(new Set(members.map(m => m.id)))
  }

  function toggleOne(id: string) {
    const next = new Set(selected)
    next.has(id) ? next.delete(id) : next.add(id)
    setSelected(next)
  }

  async function downloadSelected() {
    const targets = members.filter(m => selected.has(m.id))
    if (!targets.length) { toast.error('Select at least one member'); return }
    setGenerating(true); setProgress(0)
    const zip = new JSZip()
    for (let i = 0; i < targets.length; i++) {
      const m = targets[i]
      const elId = design === 'pvc' ? `bulk-pvc-${m.id}` : design === 'badge' ? `bulk-badge-${m.id}` : `bulk-elite-${m.id}`
      const el = document.getElementById(elId)
      if (!el) continue
      try {
        const dataUrl = await toPng(el, { pixelRatio: 4, quality: 1 })
        const base64 = dataUrl.split(',')[1]
        const suffix = design === 'pvc' ? 'ID_Card' : design === 'badge' ? 'Event_Badge' : 'Elite_Card'
        zip.file(`ABGSPB_${suffix}_${(m.member_id || m.id).replace(/\//g, '-')}_${(m.full_name || '').replace(/\s+/g, '_')}.png`, base64, { base64: true })
      } catch { /* skip */ }
      setProgress(Math.round(((i + 1) / targets.length) * 100))
    }
    const blob = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ABGSPB_${design === 'pvc' ? 'ID_Cards' : design === 'badge' ? 'Event_Badges' : 'Elite_Cards'}_${targets.length}.zip`
    a.click()
    URL.revokeObjectURL(url)
    setGenerating(false)
    toast.success(`${targets.length} cards downloaded`)
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Bulk ID Cards</h1>
          <p className="text-sm text-text-secondary mt-1">Download ID cards for multiple members as a ZIP</p>
        </div>
        <button onClick={downloadSelected} disabled={generating}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark disabled:opacity-50 transition-colors">
          {generating
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating {progress}%</>
            : <><Download className="w-4 h-4" /> Download {selected.size > 0 ? `${selected.size} Selected` : `All ${members.length}`}</>}
        </button>
      </div>

      {/* Design Picker */}
      <div className="bg-white rounded-xl border border-border p-5 mb-6">
        <p className="text-sm font-semibold text-text-primary mb-4">Choose Design</p>
        <div className="flex gap-6 flex-wrap">
          {/* PVC Card preview */}
          <div onClick={() => setDesign('pvc')}
            className={`cursor-pointer rounded-xl border-2 p-3 transition-all ${design === 'pvc' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}>
            <div className="flex items-start gap-2 mb-2">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${design === 'pvc' ? 'border-primary bg-primary' : 'border-gray-300'}`}>
                {design === 'pvc' && <Check className="w-3 h-3 text-white" />}
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">PVC ID Card</p>
                <p className="text-xs text-text-secondary">Landscape · Credit card size · Wallet-friendly</p>
              </div>
            </div>
            <div style={{ transform: 'scale(0.5)', transformOrigin: 'top left', width: '210px', height: '134px', pointerEvents: 'none' }}>
              <PVCCard member={SAMPLE} id="preview-pvc" />
            </div>
          </div>

          {/* Event Badge preview */}
          <div onClick={() => setDesign('badge')}
            className={`cursor-pointer rounded-xl border-2 p-3 transition-all ${design === 'badge' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}>
            <div className="flex items-start gap-2 mb-2">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${design === 'badge' ? 'border-primary bg-primary' : 'border-gray-300'}`}>
                {design === 'badge' && <Check className="w-3 h-3 text-white" />}
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">Event Badge</p>
                <p className="text-xs text-text-secondary">Portrait · Lanyard size · Print & display</p>
              </div>
            </div>
            <div style={{ transform: 'scale(0.45)', transformOrigin: 'top left', width: '144px', height: '202px', pointerEvents: 'none' }}>
              <EventBadge member={SAMPLE} id="preview-badge" />
            </div>
          </div>

          {/* Elite Card preview */}
          <div onClick={() => setDesign('elite')}
            className={`cursor-pointer rounded-xl border-2 p-3 transition-all ${design === 'elite' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}>
            <div className="flex items-start gap-2 mb-2">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${design === 'elite' ? 'border-primary bg-primary' : 'border-gray-300'}`}>
                {design === 'elite' && <Check className="w-3 h-3 text-white" />}
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">Centered Portrait</p>
                <p className="text-xs text-text-secondary">Portrait · Centered photo & name · Clean grid</p>
              </div>
            </div>
            <div style={{ transform: 'scale(0.45)', transformOrigin: 'top left', width: '144px', height: '221px', pointerEvents: 'none' }}>
              <EliteCard member={SAMPLE} id="preview-elite" />
            </div>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      {generating && (
        <div className="w-full bg-gray-100 rounded-full h-2 mb-5">
          <div className="h-2 bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}

      {/* Select all */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={toggleAll} className="flex items-center gap-2 text-sm text-text-secondary hover:text-primary transition-colors">
          {selected.size === members.length ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4" />}
          {selected.size === members.length ? 'Deselect All' : 'Select All'}
        </button>
        <span className="text-xs text-text-secondary">
          <Users className="w-3.5 h-3.5 inline mr-1" />{members.length} members · {selected.size > 0 ? `${selected.size} selected` : 'all will download'}
        </span>
      </div>

      {/* Member list */}
      <div className="bg-white rounded-xl border border-border overflow-hidden mb-8">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-gray-50 text-left">
              <th className="px-4 py-3 w-10"></th>
              <th className="px-4 py-3 font-medium text-text-secondary">Member</th>
              <th className="px-4 py-3 font-medium text-text-secondary">Member ID</th>
              <th className="px-4 py-3 font-medium text-text-secondary">Role</th>
            </tr>
          </thead>
          <tbody>
            {members.map(m => (
              <tr key={m.id} onClick={() => toggleOne(m.id)}
                className={`border-b border-border/50 cursor-pointer transition-colors ${selected.has(m.id) ? 'bg-primary/5' : 'hover:bg-gray-50'}`}>
                <td className="px-4 py-3">
                  {selected.has(m.id) ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4 text-gray-300" />}
                </td>
                <td className="px-4 py-3 font-medium text-text-primary">{m.full_name}</td>
                <td className="px-4 py-3 text-text-secondary font-mono text-xs">{m.member_id || '—'}</td>
                <td className="px-4 py-3">
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{getRoleLabel(m.role)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Hidden render containers */}
      <div className="fixed -left-[9999px] top-0 pointer-events-none" aria-hidden="true">
        {members.map(m => (
          <div key={m.id}>
            <PVCCard member={m} id={`bulk-pvc-${m.id}`} />
            <EventBadge member={m} id={`bulk-badge-${m.id}`} />
            <EliteCard member={m} id={`bulk-elite-${m.id}`} />
          </div>
        ))}
      </div>
    </div>
  )
}
