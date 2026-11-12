import { useEffect, useState } from 'react'
import { Award, Plus, Download, Eye, EyeOff, Trash2, Users, CheckCircle, Pencil, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { MemberSelect } from '../../components/ui/MemberSelect'
import { generateCertificate } from '../../lib/certificatePdf'
import { Spinner } from '../../components/ui/Spinner'
import type { Profile } from '../../types'

interface CertType { id: string; name: string; title_en: string; description_en: string | null; issued_by: string | null; is_active: boolean; is_honorary: boolean; orientation: 'landscape' | 'portrait'; template: 'classic' | 'modern' | 'royal' | 'tricolor' }
interface IssuedCert { id: string; certificate_type_id: string; user_id: string; issued_date: string; show_on_profile: boolean; notes: string | null; profiles: { full_name: string; member_id?: string; email?: string } | null; certificate_types: { title_en: string; name: string } | null }

export function Certificates() {
  const { user } = useAuth()
  const [tab, setTab] = useState<'types' | 'issue' | 'issued'>('types')
  const [certTypes, setCertTypes] = useState<CertType[]>([])
  const [issued, setIssued] = useState<IssuedCert[]>([])
  const [members, setMembers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [typeForm, setTypeForm] = useState({ name: '', title_en: '', description_en: '', issued_by: 'Akhil Bharatiya Goswami Sabha, Paschim Bangal', is_honorary: false, orientation: 'landscape' as 'landscape' | 'portrait', template: 'classic' as 'classic' | 'modern' | 'royal' | 'tricolor' })
  const [issueForm, setIssueForm] = useState({ cert_type_id: '', user_id: '', issued_date: new Date().toISOString().split('T')[0], notes: '', show_on_profile: true })
  const [editingType, setEditingType] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ name: '', title_en: '', description_en: '', issued_by: '', is_honorary: false, orientation: 'landscape' as 'landscape' | 'portrait', template: 'classic' as 'classic' | 'modern' | 'royal' | 'tricolor' })

  useEffect(() => {
    Promise.all([
      supabase.from('certificate_types').select('*').order('created_at'),
      supabase.from('member_certificates').select('*, profiles!member_certificates_user_id_fkey(full_name, member_id, email), certificate_types!member_certificates_certificate_type_id_fkey(title_en, name)').order('created_at', { ascending: false }),
      supabase.from('profiles').select('*').eq('account_status', 'active').order('full_name'),
    ]).then(([ct, mc, mem]) => {
      setCertTypes((ct.data as CertType[]) || [])
      setIssued((mc.data as IssuedCert[]) || [])
      setMembers((mem.data as Profile[]) || [])
      setLoading(false)
    })
  }, [])

  async function saveType(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    const { error } = await supabase.from('certificate_types').insert({ name: typeForm.name, title_en: typeForm.title_en, description_en: typeForm.description_en || null, issued_by: typeForm.issued_by, is_honorary: typeForm.is_honorary, orientation: typeForm.orientation, template: typeForm.template })
    if (error) { toast.error('Failed'); setSaving(false); return }
    const { data } = await supabase.from('certificate_types').select('*').order('created_at')
    setCertTypes((data as CertType[]) || [])
    setTypeForm({ name: '', title_en: '', description_en: '', issued_by: 'Akhil Bharatiya Goswami Sabha, Paschim Bangal', is_honorary: false, orientation: 'landscape', template: 'classic' })
    setSaving(false); toast.success('Certificate type created')
  }

  async function deleteType(id: string) {
    if (!confirm('Delete this certificate type? All issued certificates of this type will also be deleted.')) return
    await supabase.from('certificate_types').delete().eq('id', id)
    setCertTypes(prev => prev.filter(c => c.id !== id))
    setIssued(prev => prev.filter(c => c.certificate_type_id !== id))
    toast.success('Deleted')
  }

  function startEdit(ct: CertType) {
    setEditingType(ct.id)
    setEditForm({ name: ct.name, title_en: ct.title_en, description_en: ct.description_en || '', issued_by: ct.issued_by || '', is_honorary: ct.is_honorary, orientation: ct.orientation, template: ct.template })
  }

  async function saveEdit(id: string) {
    setSaving(true)
    const { error } = await supabase.from('certificate_types').update({ name: editForm.name, title_en: editForm.title_en, description_en: editForm.description_en || null, issued_by: editForm.issued_by, is_honorary: editForm.is_honorary, orientation: editForm.orientation, template: editForm.template }).eq('id', id)
    if (error) { toast.error('Failed to save'); setSaving(false); return }
    setCertTypes(prev => prev.map(c => c.id === id ? { ...c, ...editForm } : c))
    setEditingType(null)
    setSaving(false)
    toast.success('Certificate type updated')
  }

  async function issueToAll(typeId: string) {
    if (!confirm(`Issue this certificate to all ${members.length} active members?`)) return
    setSaving(true)
    const ct = certTypes.find(c => c.id === typeId)
    const rows = members.map(m => ({ certificate_type_id: typeId, user_id: m.id, issued_date: issueForm.issued_date, show_on_profile: true, issued_by_admin: user?.id }))
    const { error } = await supabase.from('member_certificates').upsert(rows, { onConflict: 'certificate_type_id,user_id' })
    if (error) { toast.error('Failed'); setSaving(false); return }
    const { data } = await supabase.from('member_certificates').select('*, profiles!member_certificates_user_id_fkey(full_name, member_id, email), certificate_types!member_certificates_certificate_type_id_fkey(title_en, name)').order('created_at', { ascending: false })
    setIssued((data as IssuedCert[]) || [])
    setSaving(false); toast.success(`Certificate issued to all members`)
    if (ct) toast.success(`"${ct.name}" issued to ${members.length} members`)
  }

  async function issueSingle(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    const { error } = await supabase.from('member_certificates').upsert({
      certificate_type_id: issueForm.cert_type_id, user_id: issueForm.user_id,
      issued_date: issueForm.issued_date, notes: issueForm.notes || null,
      show_on_profile: issueForm.show_on_profile, issued_by_admin: user?.id,
    }, { onConflict: 'certificate_type_id,user_id' })
    if (error) { toast.error('Failed'); setSaving(false); return }
    const { data } = await supabase.from('member_certificates').select('*, profiles!member_certificates_user_id_fkey(full_name, member_id, email), certificate_types!member_certificates_certificate_type_id_fkey(title_en, name)').order('created_at', { ascending: false })
    setIssued((data as IssuedCert[]) || [])
    setIssueForm(f => ({ ...f, user_id: '', notes: '' }))
    setSaving(false); toast.success('Certificate issued')
  }

  async function toggleShow(id: string, current: boolean) {
    await supabase.from('member_certificates').update({ show_on_profile: !current }).eq('id', id)
    setIssued(prev => prev.map(c => c.id === id ? { ...c, show_on_profile: !current } : c))
  }

  async function deleteCert(id: string) {
    if (!confirm('Revoke this certificate?')) return
    await supabase.from('member_certificates').delete().eq('id', id)
    setIssued(prev => prev.filter(c => c.id !== id))
    toast.success('Certificate revoked')
  }

  function downloadCert(cert: IssuedCert) {
    const ct = certTypes.find(c => c.id === cert.certificate_type_id)
    generateCertificate({
      memberName: cert.profiles?.full_name || 'Member',
      memberId: cert.profiles?.member_id || undefined,
      certificateTitle: ct?.title_en || cert.certificate_types?.title_en || 'Certificate',
      description: ct?.description_en || undefined,
      issuedDate: cert.issued_date,
      issuedBy: ct?.issued_by || undefined,
      notes: cert.notes || undefined,
      certificateNumber: cert.id.slice(0, 8).toUpperCase(),
      orientation: ct?.orientation || 'landscape',
      template: ct?.template || 'classic',
    })
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  const inputClass = 'w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30'

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Award className="w-6 h-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Certificates</h1>
          <p className="text-sm text-text-secondary mt-0.5">Create and issue certificates to members</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(['types', 'issue', 'issued'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${tab === t ? 'bg-primary text-white' : 'bg-white border border-border text-text-secondary hover:border-primary/40'}`}>
            {t === 'types' ? `Certificate Types (${certTypes.length})` : t === 'issue' ? 'Issue Certificate' : `Issued (${issued.length})`}
          </button>
        ))}
      </div>

      {/* TYPES TAB */}
      {tab === 'types' && (
        <div className="space-y-4">
          <form onSubmit={saveType} className="bg-white rounded-xl border border-border p-5 space-y-3">
            <h3 className="text-sm font-semibold text-text-primary">Create New Certificate Type</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><label className="block text-xs font-medium mb-1">Type Name *</label>
                <input required value={typeForm.name} onChange={e => setTypeForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Honorary Membership" className={inputClass} /></div>
              <div><label className="block text-xs font-medium mb-1">Certificate Title *</label>
                <input required value={typeForm.title_en} onChange={e => setTypeForm(f => ({ ...f, title_en: e.target.value }))} placeholder="e.g. Certificate of Honorary Membership" className={inputClass} /></div>
            </div>
            <div><label className="block text-xs font-medium mb-1">Description</label>
              <textarea value={typeForm.description_en} onChange={e => setTypeForm(f => ({ ...f, description_en: e.target.value }))} rows={2} placeholder="Text shown on the certificate body..." className={inputClass} /></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><label className="block text-xs font-medium mb-1">Type</label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setTypeForm(f => ({ ...f, is_honorary: false }))}
                    className={`flex-1 py-2 rounded-lg border text-xs font-medium transition-colors ${!typeForm.is_honorary ? 'border-primary bg-primary/5 text-primary' : 'border-border text-text-secondary hover:border-primary/30'}`}>
                    Custom
                  </button>
                  <button type="button" onClick={() => setTypeForm(f => ({ ...f, is_honorary: true }))}
                    className={`flex-1 py-2 rounded-lg border text-xs font-medium transition-colors ${typeForm.is_honorary ? 'border-amber-400 bg-amber-50 text-amber-700' : 'border-border text-text-secondary hover:border-amber-300'}`}>
                    For All Members
                  </button>
                </div>
                {typeForm.is_honorary && <p className="text-[10px] text-amber-600 mt-1">Issue to all members at once with one click</p>}
              </div>
              <div><label className="block text-xs font-medium mb-1">Orientation</label>
                <div className="flex gap-2">
                  {(['landscape', 'portrait'] as const).map(o => (
                    <button key={o} type="button" onClick={() => setTypeForm(f => ({ ...f, orientation: o }))}
                      className={`flex-1 py-2 rounded-lg border text-xs font-medium capitalize transition-colors ${typeForm.orientation === o ? 'border-primary bg-primary/5 text-primary' : 'border-border text-text-secondary hover:border-primary/30'}`}>
                      {o === 'landscape' ? '⬛ Landscape' : '▬ Portrait'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {/* Template picker */}
            <div><label className="block text-xs font-medium mb-2">Design Template</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {([
                  { id: 'classic', label: 'Classic', bg: '#fffcf5', accent: '#ff9933', text: '#b4823c', footer: '#1a6b3c' },
                  { id: 'modern', label: 'Modern', bg: '#ffffff', accent: '#ff9933', text: '#333', footer: '#f97316' },
                  { id: 'royal', label: 'Royal', bg: '#0f1432', accent: '#d4af37', text: '#d4af37', footer: '#d4af37' },
                  { id: 'tricolor', label: 'Tricolor', bg: '#ffffff', accent: '#ff9933', text: '#333', footer: '#138808' },
                ] as const).map(t => (
                  <button key={t.id} type="button" onClick={() => setTypeForm(f => ({ ...f, template: t.id }))}
                    className={`rounded-lg border-2 overflow-hidden transition-all ${typeForm.template === t.id ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/40'}`}>
                    {/* Mini preview */}
                    <div style={{ background: t.bg, height: '52px', position: 'relative', overflow: 'hidden' }}>
                      <div style={{ background: t.accent, height: '14px', width: '100%' }} />
                      <div style={{ padding: '3px 5px' }}>
                        <div style={{ background: t.text, height: '4px', borderRadius: '2px', width: '60%', margin: '3px 0' }} />
                        <div style={{ background: t.text, height: '3px', borderRadius: '2px', width: '40%', opacity: 0.5 }} />
                        <div style={{ background: t.text, height: '2px', borderRadius: '2px', width: '80%', marginTop: '3px', opacity: 0.3 }} />
                      </div>
                      <div style={{ background: t.footer, height: '8px', width: '100%', position: 'absolute', bottom: 0 }} />
                    </div>
                    <p className={`text-[10px] font-medium py-1 text-center ${typeForm.template === t.id ? 'text-primary' : 'text-text-secondary'}`}>{t.label}</p>
                  </button>
                ))}
              </div>
            </div>
            <div><label className="block text-xs font-medium mb-1">Issued By</label>
              <input value={typeForm.issued_by} onChange={e => setTypeForm(f => ({ ...f, issued_by: e.target.value }))} className={inputClass} /></div>
            <button type="submit" disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark disabled:opacity-50">
              <Plus className="w-4 h-4" />{saving ? 'Creating...' : 'Create Type'}
            </button>
          </form>

          <div className="space-y-2">
            {certTypes.map(ct => (
              <div key={ct.id} className="bg-white rounded-xl border border-border p-4">
                {editingType === ct.id ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div><label className="block text-xs font-medium mb-1">Type Name</label>
                        <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} className={inputClass} /></div>
                      <div><label className="block text-xs font-medium mb-1">Certificate Title</label>
                        <input value={editForm.title_en} onChange={e => setEditForm(f => ({ ...f, title_en: e.target.value }))} className={inputClass} /></div>
                    </div>
                    <div><label className="block text-xs font-medium mb-1">Description</label>
                      <textarea rows={2} value={editForm.description_en} onChange={e => setEditForm(f => ({ ...f, description_en: e.target.value }))} className={inputClass} /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className="block text-xs font-medium mb-1">Orientation</label>
                        <div className="flex gap-2">
                          {(['landscape', 'portrait'] as const).map(o => (
                            <button key={o} type="button" onClick={() => setEditForm(f => ({ ...f, orientation: o }))}
                              className={`flex-1 py-1.5 rounded-lg border text-xs font-medium transition-colors ${editForm.orientation === o ? 'border-primary bg-primary/5 text-primary' : 'border-border text-text-secondary'}`}>
                              {o === 'landscape' ? '⬛ Landscape' : '▬ Portrait'}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div><label className="block text-xs font-medium mb-1">Type</label>
                        <div className="flex gap-2">
                          <button type="button" onClick={() => setEditForm(f => ({ ...f, is_honorary: false }))} className={`flex-1 py-1.5 rounded-lg border text-xs font-medium transition-colors ${!editForm.is_honorary ? 'border-primary bg-primary/5 text-primary' : 'border-border text-text-secondary'}`}>Custom</button>
                          <button type="button" onClick={() => setEditForm(f => ({ ...f, is_honorary: true }))} className={`flex-1 py-1.5 rounded-lg border text-xs font-medium transition-colors ${editForm.is_honorary ? 'border-amber-400 bg-amber-50 text-amber-700' : 'border-border text-text-secondary'}`}>For All</button>
                        </div>
                      </div>
                    </div>
                    {/* Template picker */}
                    <div><label className="block text-xs font-medium mb-2">Design Template</label>
                      <div className="grid grid-cols-4 gap-2">
                        {([
                          { id: 'classic', label: 'Classic', bg: '#fffcf5', accent: '#ff9933', footer: '#1a6b3c' },
                          { id: 'modern', label: 'Modern', bg: '#ffffff', accent: '#ff9933', footer: '#f97316' },
                          { id: 'royal', label: 'Royal', bg: '#0f1432', accent: '#d4af37', footer: '#d4af37' },
                          { id: 'tricolor', label: 'Tricolor', bg: '#ffffff', accent: '#ff9933', footer: '#138808' },
                        ] as const).map(t => (
                          <button key={t.id} type="button" onClick={() => setEditForm(f => ({ ...f, template: t.id }))}
                            className={`rounded-lg border-2 overflow-hidden transition-all ${editForm.template === t.id ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/40'}`}>
                            <div style={{ background: t.bg, height: '40px', position: 'relative', overflow: 'hidden' }}>
                              <div style={{ background: t.accent, height: '11px', width: '100%' }} />
                              <div style={{ padding: '2px 4px' }}>
                                <div style={{ background: t.accent, height: '3px', borderRadius: '2px', width: '60%', margin: '2px 0', opacity: 0.7 }} />
                                <div style={{ background: '#888', height: '2px', borderRadius: '2px', width: '80%', opacity: 0.3 }} />
                              </div>
                              <div style={{ background: t.footer, height: '6px', width: '100%', position: 'absolute', bottom: 0 }} />
                            </div>
                            <p className={`text-[10px] font-medium py-0.5 text-center ${editForm.template === t.id ? 'text-primary' : 'text-text-secondary'}`}>{t.label}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div><label className="block text-xs font-medium mb-1">Issued By</label>
                      <input value={editForm.issued_by} onChange={e => setEditForm(f => ({ ...f, issued_by: e.target.value }))} className={inputClass} /></div>
                    <div className="flex gap-2">
                      <button onClick={() => saveEdit(ct.id)} disabled={saving} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-medium hover:bg-primary-dark disabled:opacity-50"><CheckCircle className="w-3.5 h-3.5" />{saving ? 'Saving...' : 'Save'}</button>
                      <button onClick={() => setEditingType(null)} className="flex items-center gap-1.5 px-3 py-1.5 border border-border text-text-secondary rounded-lg text-xs hover:bg-gray-50"><X className="w-3.5 h-3.5" /> Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-text-primary">{ct.name}</p>
                        {ct.is_honorary && <span className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded-full">For All Members</span>}
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${ct.orientation === 'portrait' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-text-secondary'}`}>
                          {ct.orientation === 'portrait' ? '▬ Portrait' : '⬛ Landscape'}
                        </span>
                      </div>
                      <p className="text-xs text-text-secondary mt-0.5">{ct.title_en}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {ct.is_honorary && (
                        <button onClick={() => issueToAll(ct.id)} disabled={saving}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 disabled:opacity-50">
                          <Users className="w-3.5 h-3.5" /> Issue to All
                        </button>
                      )}
                      <button onClick={() => startEdit(ct)} className="p-1.5 text-text-secondary hover:text-primary"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => deleteType(ct.id)} className="p-1.5 text-text-secondary hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {certTypes.length === 0 && <div className="text-center py-8 text-text-secondary text-sm">No certificate types created yet.</div>}
          </div>
        </div>
      )}

      {/* ISSUE TAB */}
      {tab === 'issue' && (
        <form onSubmit={issueSingle} className="bg-white rounded-xl border border-border p-5 space-y-3 max-w-lg">
          <h3 className="text-sm font-semibold text-text-primary">Issue to Specific Member</h3>
          <div>
            <label className="block text-xs font-medium mb-1">Certificate Type *</label>
            <select required value={issueForm.cert_type_id} onChange={e => setIssueForm(f => ({ ...f, cert_type_id: e.target.value }))} className={`${inputClass} bg-white`}>
              <option value="">Select type...</option>
              {certTypes.map(ct => <option key={ct.id} value={ct.id}>{ct.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Member *</label>
            <MemberSelect members={members.map(m => ({ id: m.id, full_name: m.full_name, role: m.role, email: (m as any).email, phone: (m as any).phone }))}
              value={issueForm.user_id} onChange={id => setIssueForm(f => ({ ...f, user_id: id }))} required />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Issue Date *</label>
            <input type="date" required value={issueForm.issued_date} onChange={e => setIssueForm(f => ({ ...f, issued_date: e.target.value }))} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Notes (shown on certificate)</label>
            <input value={issueForm.notes} onChange={e => setIssueForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional note..." className={inputClass} />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="showProfile" checked={issueForm.show_on_profile} onChange={e => setIssueForm(f => ({ ...f, show_on_profile: e.target.checked }))} className="w-4 h-4" />
            <label htmlFor="showProfile" className="text-sm text-text-secondary">Show on member's profile</label>
          </div>
          <button type="submit" disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark disabled:opacity-50">
            <CheckCircle className="w-4 h-4" />{saving ? 'Issuing...' : 'Issue Certificate'}
          </button>
        </form>
      )}

      {/* ISSUED TAB */}
      {tab === 'issued' && (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-gray-50 text-left">
                <th className="px-4 py-3 font-medium text-text-secondary">Member</th>
                <th className="px-4 py-3 font-medium text-text-secondary">Certificate</th>
                <th className="px-4 py-3 font-medium text-text-secondary">Date</th>
                <th className="px-4 py-3 font-medium text-text-secondary">Profile</th>
                <th className="px-4 py-3 font-medium text-text-secondary">Actions</th>
              </tr>
            </thead>
            <tbody>
              {issued.map(c => (
                <tr key={c.id} className="border-b border-border/50 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-text-primary">{c.profiles?.full_name || '—'}</p>
                    <p className="text-xs text-text-secondary">{c.profiles?.member_id || ''}</p>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{c.certificate_types?.name || '—'}</td>
                  <td className="px-4 py-3 text-text-secondary">{c.issued_date}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleShow(c.id, c.show_on_profile)} className={c.show_on_profile ? 'text-green-600' : 'text-gray-400'}>
                      {c.show_on_profile ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => downloadCert(c)} className="flex items-center gap-1 text-xs text-text-secondary hover:text-primary">
                        <Download className="w-3.5 h-3.5" /> Download
                      </button>
                      <button onClick={() => deleteCert(c.id)} className="flex items-center gap-1 text-xs text-text-secondary hover:text-red-500">
                        <Trash2 className="w-3.5 h-3.5" /> Revoke
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {issued.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-text-secondary">No certificates issued yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
