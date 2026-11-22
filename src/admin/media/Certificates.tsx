import { useEffect, useRef, useState } from 'react'
import { Award, Plus, Download, Eye, EyeOff, Trash2, Users, CheckCircle, Pencil, X, Upload } from 'lucide-react'
import { CertificateHtmlPreview } from '../../components/shared/CertificateHtmlPreview'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { MemberSelect } from '../../components/ui/MemberSelect'
import { generateCertificateHtml } from '../../lib/generateCertificateHtml'
import { Spinner } from '../../components/ui/Spinner'
import type { Profile } from '../../types'

interface Signatory { designationSlug: string; label: string; signUrl?: string }
interface CertType { id: string; name: string; title_en: string; description_en: string | null; issued_by: string | null; is_active: boolean; is_honorary: boolean; orientation: 'landscape' | 'portrait'; template: 'classic' | 'modern' | 'royal' | 'tricolor'; signatories?: Signatory[] }
interface IssuedCert { id: string; certificate_type_id: string; user_id: string; issued_date: string; show_on_profile: boolean; notes: string | null; profiles: { full_name: string; member_id?: string; email?: string } | null; certificate_types: { title_en: string; name: string } | null }

// Each template has a fixed orientation — selecting it auto-sets orientation
const TEMPLATES = [
  { id: 'classic',  label: 'Classic',  orientation: 'landscape' as const },
  { id: 'modern',   label: 'Modern',   orientation: 'landscape' as const },
  { id: 'royal',    label: 'Royal',    orientation: 'portrait'  as const },
  { id: 'tricolor', label: 'Tricolor', orientation: 'portrait'  as const },
]

// Scaled thumbnail wrapper for the template picker
function TemplateThumbnail({ id, orientation }: { id: string; orientation: 'landscape' | 'portrait' }) {
  const isPortrait = orientation === 'portrait'
  const certW = isPortrait ? 595 : 794
  const certH = isPortrait ? 842 : 530
  const scale = isPortrait ? 0.19 : 0.19
  const thumbH = Math.round(certH * scale)
  return (
    <div style={{ width: '100%', height: thumbH, overflow: 'hidden', borderRadius: 6, display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
      <div style={{ transform: `scale(${scale})`, transformOrigin: 'top center', width: certW, height: certH, flexShrink: 0, pointerEvents: 'none' }}>
        <CertificateHtmlPreview template={id} orientation={orientation} title="Certificate Title" memberName="Member Name" />
      </div>
    </div>
  )
}


const SIGN_BUCKET = 'certificate-signs'
const DEFAULT_SIGNATORIES: Signatory[] = [
  { designationSlug: '', label: 'Founder' },
  { designationSlug: '', label: 'President' },
  { designationSlug: '', label: 'Secretary' },
  { designationSlug: '', label: 'Treasurer' },
]

export function Certificates() {
  const { user } = useAuth()
  const [tab, setTab] = useState<'types' | 'issue' | 'issued'>('types')
  const [certTypes, setCertTypes] = useState<CertType[]>([])
  const [issued, setIssued] = useState<IssuedCert[]>([])
  const [members, setMembers] = useState<Profile[]>([])
  const [designations, setDesignations] = useState<{id:string; name_en:string; slug:string}[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  // Separate refs for create form and edit form (both can be in DOM simultaneously)
  const signRefsCreate = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)]
  const signRefsEdit   = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)]

  const [typeForm, setTypeForm] = useState({ name: '', title_en: '', description_en: '', issued_by: 'Akhil Bharatiya Goswami Sabha, Paschim Bangal', is_honorary: false, orientation: 'landscape' as 'landscape' | 'portrait', template: 'classic' as 'classic' | 'modern' | 'royal' | 'tricolor', signatories: DEFAULT_SIGNATORIES as Signatory[] })
  const [issueForm, setIssueForm] = useState({ cert_type_id: '', user_id: '', issued_date: new Date().toISOString().split('T')[0], notes: '', show_on_profile: true })
  const [editingType, setEditingType] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ name: '', title_en: '', description_en: '', issued_by: '', is_honorary: false, orientation: 'landscape' as 'landscape' | 'portrait', template: 'classic' as 'classic' | 'modern' | 'royal' | 'tricolor', signatories: DEFAULT_SIGNATORIES as Signatory[] })

  useEffect(() => {
    Promise.all([
      supabase.from('certificate_types').select('*').order('created_at'),
      supabase.from('member_certificates').select('*, profiles!member_certificates_user_id_fkey(full_name, member_id, email), certificate_types!member_certificates_certificate_type_id_fkey(title_en, name)').order('created_at', { ascending: false }),
      supabase.from('profiles').select('*').eq('account_status', 'active').order('full_name'),
      supabase.from('designations').select('id, name_en, slug').order('sort_order'),
    ]).then(([ct, mc, mem, des]) => {
      setCertTypes((ct.data as CertType[]) || [])
      setIssued((mc.data as IssuedCert[]) || [])
      setMembers((mem.data as Profile[]) || [])
      setDesignations((des.data as any[]) || [])
      setLoading(false)
    })
  }, [])

  async function uploadSign(file: File, slot: number): Promise<string> {
    const path = `signs/${Date.now()}_${slot}.png`
    const { error } = await supabase.storage.from(SIGN_BUCKET).upload(path, file, { upsert: true })
    if (error) throw error
    return supabase.storage.from(SIGN_BUCKET).getPublicUrl(path).data.publicUrl
  }

  function updateSignatory(list: Signatory[], idx: number, patch: Partial<Signatory>): Signatory[] {
    return list.map((s, i) => i === idx ? { ...s, ...patch } : s)
  }

  async function handleSignUpload(file: File, idx: number, formKey: 'typeForm' | 'editForm') {
    try {
      const url = await uploadSign(file, idx)
      if (formKey === 'typeForm') setTypeForm(f => ({ ...f, signatories: updateSignatory(f.signatories, idx, { signUrl: url }) }))
      else setEditForm(f => ({ ...f, signatories: updateSignatory(f.signatories, idx, { signUrl: url }) }))
      toast.success('Signature uploaded')
    } catch { toast.error('Upload failed') }
  }

  async function saveType(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    const { error } = await supabase.from('certificate_types').insert({ name: typeForm.name, title_en: typeForm.title_en, description_en: typeForm.description_en || null, issued_by: typeForm.issued_by, is_honorary: typeForm.is_honorary, orientation: typeForm.orientation, template: typeForm.template, signatories: typeForm.signatories })
    if (error) { toast.error('Failed'); setSaving(false); return }
    const { data } = await supabase.from('certificate_types').select('*').order('created_at')
    setCertTypes((data as CertType[]) || [])
    setTypeForm({ name: '', title_en: '', description_en: '', issued_by: 'Akhil Bharatiya Goswami Sabha, Paschim Bangal', is_honorary: false, orientation: 'landscape', template: 'classic', signatories: DEFAULT_SIGNATORIES })
    setSaving(false); setShowCreateForm(false); toast.success('Certificate type created')
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
    setEditForm({ name: ct.name, title_en: ct.title_en, description_en: ct.description_en || '', issued_by: ct.issued_by || '', is_honorary: ct.is_honorary, orientation: ct.orientation, template: ct.template, signatories: ct.signatories?.length ? ct.signatories : DEFAULT_SIGNATORIES })
  }

  async function saveEdit(id: string) {
    setSaving(true)
    let { error } = await supabase.from('certificate_types').update({ name: editForm.name, title_en: editForm.title_en, description_en: editForm.description_en || null, issued_by: editForm.issued_by, is_honorary: editForm.is_honorary, orientation: editForm.orientation, template: editForm.template, signatories: editForm.signatories }).eq('id', id)
    // If signatories column doesn't exist yet, save without it
    if (error?.message?.includes('signatories')) {
      const res = await supabase.from('certificate_types').update({ name: editForm.name, title_en: editForm.title_en, description_en: editForm.description_en || null, issued_by: editForm.issued_by, is_honorary: editForm.is_honorary, orientation: editForm.orientation, template: editForm.template }).eq('id', id)
      error = res.error
    }
    if (error) { toast.error('Failed to save: ' + error.message); setSaving(false); return }
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

  async function downloadCert(cert: IssuedCert) {
    const ct = certTypes.find(c => c.id === cert.certificate_type_id)
    // Resolve signatory member names by designation slug
    let resolvedSignatories = ct?.signatories || []
    const slugs = resolvedSignatories.map(s => s.designationSlug).filter(Boolean)
    if (slugs.length > 0) {
      const { data: sigMembers } = await supabase.from('profiles').select('full_name, role').eq('account_status', 'active').in('role', slugs)
      resolvedSignatories = resolvedSignatories.map(s => ({
        ...s,
        memberName: (sigMembers as any[])?.find(m => m.role === s.designationSlug)?.full_name || '',
      }))
    }
    await generateCertificateHtml({
      memberName: cert.profiles?.full_name || 'Member',
      memberId: cert.profiles?.member_id ?? undefined,
      certificateTitle: ct?.title_en || cert.certificate_types?.title_en || 'Certificate',
      description: ct?.description_en ?? undefined,
      issuedDate: cert.issued_date,
      issuedBy: ct?.issued_by ?? undefined,
      notes: cert.notes ?? undefined,
      certificateNumber: cert.id.slice(0, 8).toUpperCase(),
      orientation: ct?.orientation || 'landscape',
      template: ct?.template || 'classic',
      signatories: resolvedSignatories,
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
          {/* Create button / form toggle */}
          {!showCreateForm ? (
            <button onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90">
              <Plus className="w-4 h-4" /> Create New Certificate Type
            </button>
          ) : (
          <form onSubmit={saveType} className="bg-white rounded-xl border border-border p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-text-primary">Create New Certificate Type</h3>
              <button type="button" onClick={() => setShowCreateForm(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><label className="block text-xs font-medium mb-1">Type Name *</label>
                <input required value={typeForm.name} onChange={e => setTypeForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Honorary Membership" className={inputClass} /></div>
              <div><label className="block text-xs font-medium mb-1">Certificate Title *</label>
                <input required value={typeForm.title_en} onChange={e => setTypeForm(f => ({ ...f, title_en: e.target.value }))} placeholder="e.g. Certificate of Honorary Membership" className={inputClass} /></div>
            </div>
            <div><label className="block text-xs font-medium mb-1">Description</label>
              <textarea value={typeForm.description_en} onChange={e => setTypeForm(f => ({ ...f, description_en: e.target.value }))} rows={2} placeholder="Text shown on the certificate body..." className={inputClass} /></div>
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
            {/* Template picker — orientation is auto-set by template */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-xs font-medium">Design Template</label>
                <span className="text-[10px] text-text-secondary bg-gray-100 px-2 py-0.5 rounded-full">
                  {TEMPLATES.find(t => t.id === typeForm.template)?.orientation === 'portrait' ? '▬ Portrait' : '⬛ Landscape'} (auto)
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-text-secondary mb-2 font-medium">⬛ Landscape</p>
                  <div className="flex flex-col gap-2">
                    {TEMPLATES.filter(t => t.orientation === 'landscape').map(t => (
                      <button key={t.id} type="button" onClick={() => setTypeForm(f => ({ ...f, template: t.id as any, orientation: 'landscape' }))}
                        className={`rounded-xl border-2 p-2 transition-all text-left ${typeForm.template === t.id ? 'border-primary ring-2 ring-primary/20 bg-primary/5' : 'border-border hover:border-primary/40'}`}>
                        <TemplateThumbnail id={t.id} orientation="landscape" />
                        <p className={`text-[11px] font-semibold text-center mt-1.5 ${typeForm.template === t.id ? 'text-primary' : 'text-text-secondary'}`}>{t.label}</p>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-text-secondary mb-2 font-medium">▬ Portrait</p>
                  <div className="flex flex-col gap-2">
                    {TEMPLATES.filter(t => t.orientation === 'portrait').map(t => (
                      <button key={t.id} type="button" onClick={() => setTypeForm(f => ({ ...f, template: t.id as any, orientation: 'portrait' }))}
                        className={`rounded-xl border-2 p-2 transition-all text-left ${typeForm.template === t.id ? 'border-primary ring-2 ring-primary/20 bg-primary/5' : 'border-border hover:border-primary/40'}`}>
                        <TemplateThumbnail id={t.id} orientation="portrait" />
                        <p className={`text-[11px] font-semibold text-center mt-1.5 ${typeForm.template === t.id ? 'text-primary' : 'text-text-secondary'}`}>{t.label}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div><label className="block text-xs font-medium mb-1">Issued By</label>
              <input value={typeForm.issued_by} onChange={e => setTypeForm(f => ({ ...f, issued_by: e.target.value }))} className={inputClass} /></div>
            {/* Signatories */}
            <SignatoriesEditor signatories={typeForm.signatories} designations={designations} members={members} signRefs={signRefsCreate}
              onChange={s => setTypeForm(f => ({ ...f, signatories: s }))}
              onSignUpload={(file, idx) => handleSignUpload(file, idx, 'typeForm')} />
            <button type="submit" disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark disabled:opacity-50">
              <Plus className="w-4 h-4" />{saving ? 'Creating...' : 'Create Type'}
            </button>
          </form>
          )}

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
                    <div><label className="block text-xs font-medium mb-1">Type</label>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => setEditForm(f => ({ ...f, is_honorary: false }))} className={`flex-1 py-1.5 rounded-lg border text-xs font-medium transition-colors ${!editForm.is_honorary ? 'border-primary bg-primary/5 text-primary' : 'border-border text-text-secondary'}`}>Custom</button>
                        <button type="button" onClick={() => setEditForm(f => ({ ...f, is_honorary: true }))} className={`flex-1 py-1.5 rounded-lg border text-xs font-medium transition-colors ${editForm.is_honorary ? 'border-amber-400 bg-amber-50 text-amber-700' : 'border-border text-text-secondary'}`}>For All</button>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <label className="block text-xs font-medium">Design Template</label>
                        <span className="text-[10px] text-text-secondary bg-gray-100 px-2 py-0.5 rounded-full">
                          {TEMPLATES.find(t => t.id === editForm.template)?.orientation === 'portrait' ? '▬ Portrait' : '⬛ Landscape'} (auto)
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[10px] text-text-secondary mb-2 font-medium">⬛ Landscape</p>
                          <div className="flex flex-col gap-2">
                            {TEMPLATES.filter(t => t.orientation === 'landscape').map(t => (
                              <button key={t.id} type="button" onClick={() => setEditForm(f => ({ ...f, template: t.id as any, orientation: 'landscape' }))}
                                className={`rounded-xl border-2 p-2 transition-all text-left ${editForm.template === t.id ? 'border-primary ring-2 ring-primary/20 bg-primary/5' : 'border-border hover:border-primary/40'}`}>
                                <TemplateThumbnail id={t.id} orientation="landscape" />
                                <p className={`text-[11px] font-semibold text-center mt-1.5 ${editForm.template === t.id ? 'text-primary' : 'text-text-secondary'}`}>{t.label}</p>
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] text-text-secondary mb-2 font-medium">▬ Portrait</p>
                          <div className="flex flex-col gap-2">
                            {TEMPLATES.filter(t => t.orientation === 'portrait').map(t => (
                              <button key={t.id} type="button" onClick={() => setEditForm(f => ({ ...f, template: t.id as any, orientation: 'portrait' }))}
                                className={`rounded-xl border-2 p-2 transition-all text-left ${editForm.template === t.id ? 'border-primary ring-2 ring-primary/20 bg-primary/5' : 'border-border hover:border-primary/40'}`}>
                                <TemplateThumbnail id={t.id} orientation="portrait" />
                                <p className={`text-[11px] font-semibold text-center mt-1.5 ${editForm.template === t.id ? 'text-primary' : 'text-text-secondary'}`}>{t.label}</p>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div><label className="block text-xs font-medium mb-1">Issued By</label>
                      <input value={editForm.issued_by} onChange={e => setEditForm(f => ({ ...f, issued_by: e.target.value }))} className={inputClass} /></div>
                    <SignatoriesEditor signatories={editForm.signatories} designations={designations} members={members} signRefs={signRefsEdit}
                      onChange={s => setEditForm(f => ({ ...f, signatories: s }))}
                      onSignUpload={(file, idx) => handleSignUpload(file, idx, 'editForm')} />
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
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-700 capitalize">{ct.template || 'classic'}</span>
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

function SignatoriesEditor({ signatories, designations, members, signRefs, onChange, onSignUpload }: {
  signatories: Signatory[]
  designations: { id: string; name_en: string; slug: string }[]
  members: Profile[]
  signRefs: React.RefObject<HTMLInputElement | null>[]
  onChange: (s: Signatory[]) => void
  onSignUpload: (file: File, idx: number) => void
}) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5">Signatories</label>
      <div className="border border-border rounded-lg divide-y divide-border overflow-hidden">
        {signatories.map((sig, idx) => {
          const memberName = sig.designationSlug
            ? (members as any[]).find(m => m.role === sig.designationSlug)?.full_name
            : null
          return (
            <div key={idx} className="flex items-center gap-2 px-3 py-2 bg-white">
              <span className="text-[10px] text-text-secondary w-16 shrink-0">#{idx + 1}</span>
              {/* Designation */}
              <select value={sig.designationSlug}
                onChange={e => onChange(signatories.map((s, i) => i === idx ? { ...s, designationSlug: e.target.value, label: designations.find(d => d.slug === e.target.value)?.name_en || s.label } : s))}
                className="border border-border rounded px-2 py-1 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-primary/30 w-36 shrink-0">
                <option value="">— Designation —</option>
                {designations.map(d => <option key={d.id} value={d.slug}>{d.name_en}</option>)}
              </select>
              {/* Member name auto-fetched */}
              <span className="text-xs text-primary font-medium w-32 truncate shrink-0">
                {memberName || <span className="text-gray-400 font-normal">No member</span>}
              </span>
              {/* Label */}
              <input value={sig.label} onChange={e => onChange(signatories.map((s, i) => i === idx ? { ...s, label: e.target.value } : s))}
                placeholder="Label" className="border border-border rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary/30 w-28 shrink-0" />
              {/* Signature */}
              <div className="flex items-center gap-1.5 flex-1">
                {sig.signUrl
                  ? <img src={sig.signUrl} alt="sign" className="h-7 max-w-[60px] object-contain border border-border rounded bg-white" />
                  : <span className="text-[10px] text-gray-400">No sign</span>
                }
                <button type="button" onClick={() => signRefs[idx]?.current?.click()}
                  className="flex items-center gap-1 px-2 py-1 text-[10px] border border-border rounded bg-gray-50 hover:bg-gray-100 text-text-secondary shrink-0">
                  <Upload className="w-3 h-3" /> {sig.signUrl ? 'Replace' : 'Upload'}
                </button>
                <input ref={signRefs[idx]} type="file" accept="image/*" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) onSignUpload(f, idx); e.target.value = '' }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
