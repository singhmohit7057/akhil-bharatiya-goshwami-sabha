import { useEffect, useState, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { ArrowLeft, User, Shield, Camera, Plus, Edit2, Trash2, X, Users, Eye, EyeOff, KeyRound } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { getRoleLabel, formatDate } from '../../lib/utils'
import { transliterateToHindi } from '../../lib/transliterate'
import type { Profile, MemberRole, FamilyMember, FamilyRelation, Gender } from '../../types'
import { FAMILY_RELATIONS } from '../../types'
import { useDesignations } from '../../hooks/useDesignations'
import { Spinner } from '../../components/ui/Spinner'
import { DateInput } from '../../components/ui/DateInput'

export function MemberDetail() {
  const { id } = useParams()
  const { t, i18n } = useTranslation('admin')
  const lang = i18n.language
  const { isSuperAdmin } = useAuth()
  const superAdmin = isSuperAdmin()
  const { designations } = useDesignations()
  const [member, setMember] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedRole, setSelectedRole] = useState<MemberRole>('member')

  // Profile edit
  const [saving, setSaving] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const hiManuallyEdited = useRef(false)
  const [form, setForm] = useState({
    full_name: '', full_name_hi: '', phone: '', gender: '', date_of_birth: '',
    gotra: '', caste: '', address: '', village_address: '', city: '', state: '', pincode: '',
    member_since: '',
  })

  // Family members
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])
  const [showFamilyForm, setShowFamilyForm] = useState(false)
  const [editingFamily, setEditingFamily] = useState<FamilyMember | null>(null)
  const [savingFamily, setSavingFamily] = useState(false)
  const [familyForm, setFamilyForm] = useState({
    name: '', name_hi: '', relation: '' as FamilyRelation | '', date_of_birth: '', gender: '' as Gender | '', occupation: '',
  })

  useEffect(() => {
    if (!id) return
    fetchMember()
  }, [id])

  async function fetchMember() {
    const memberId = id!.replace('-', '/')
    let { data } = await supabase.from('profiles').select('*').eq('member_id', memberId).single()
    if (!data) {
      const res = await supabase.from('profiles').select('*').eq('id', id).single()
      data = res.data
    }
    if (data) {
      const m = data as Profile
      setMember(m)
      setSelectedRole(m.role)
      fetchFamilyMembers(m.id)
      setForm({
        full_name: m.full_name || '',
        full_name_hi: m.full_name_hi || (m.full_name ? transliterateToHindi(m.full_name) : ''),
        phone: m.phone || '',
        gender: m.gender || '',
        date_of_birth: m.date_of_birth || '',
        gotra: m.gotra || '',
        caste: (m as any).caste || '',
        address: m.address || '',
        village_address: (m as any).village_address || '',
        city: m.city || '',
        state: m.state || '',
        pincode: m.pincode || '',
        member_since: (m as any).member_since || m.created_at?.split('T')[0] || '',
      })
    }
    setLoading(false)
  }

  async function fetchFamilyMembers(userId?: string) {
    const uid = userId || member?.id
    if (!uid) return
    const { data } = await supabase.from('family_members').select('*').eq('user_id', uid).order('created_at')
    setFamilyMembers((data as FamilyMember[]) || [])
  }

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault()
    if (!member) return
    setSaving(true)
    const { error } = await supabase.from('profiles').update({
      full_name: form.full_name,
      full_name_hi: form.full_name_hi || null,
      phone: form.phone || null,
      gender: form.gender || null,
      date_of_birth: form.date_of_birth || null,
      gotra: form.gotra || null,
      caste: form.caste || null,
      address: form.address || null,
      village_address: form.village_address || null,
      city: form.city || null,
      state: form.state || null,
      pincode: form.pincode || null,
      member_since: form.member_since || null,
      role: selectedRole,
    }).eq('id', member.id)

    if (error) { toast.error('Failed to update profile'); setSaving(false); return }
    toast.success('Profile updated')
    setMember({ ...member, ...form, role: selectedRole } as Profile)
    setSaving(false)
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !member) return
    if (file.size > 2 * 1024 * 1024) { toast.error('Photo must be under 2MB'); return }
    setPhotoPreview(URL.createObjectURL(file))
    setUploadingPhoto(true)
    const ext = file.name.split('.').pop()
    const path = `${member.id}.${ext}`
    const { error: uploadError } = await supabase.storage.from('profile-photos').upload(path, file, { upsert: true })
    if (uploadError) { toast.error('Failed to upload photo'); setPhotoPreview(null); setUploadingPhoto(false); return }
    const { data: urlData } = supabase.storage.from('profile-photos').getPublicUrl(path)
    await supabase.from('profiles').update({ profile_photo_url: urlData.publicUrl }).eq('id', member.id)
    setMember({ ...member, profile_photo_url: urlData.publicUrl })
    toast.success('Photo updated!')
    setUploadingPhoto(false)
  }


  // Family member CRUD
  function resetFamilyForm() {
    setFamilyForm({ name: '', name_hi: '', relation: '', date_of_birth: '', gender: '', occupation: '' })
    setEditingFamily(null)
    setShowFamilyForm(false)
  }

  function startEditFamily(fm: FamilyMember) {
    setFamilyForm({
      name: fm.name, name_hi: fm.name_hi || '', relation: fm.relation,
      date_of_birth: fm.date_of_birth || '', gender: fm.gender || '', occupation: fm.occupation || '',
    })
    setEditingFamily(fm)
    setShowFamilyForm(true)
  }

  async function handleFamilySave(e: React.FormEvent) {
    e.preventDefault()
    if (!member) return
    setSavingFamily(true)

    if (editingFamily) {
      const { error } = await supabase.from('family_members').update({
        name: familyForm.name,
        name_hi: familyForm.name_hi || null,
        relation: familyForm.relation,
        date_of_birth: familyForm.date_of_birth || null,
        gender: familyForm.gender || null,
        occupation: familyForm.occupation || null,
      }).eq('id', editingFamily.id)
      if (error) { toast.error('Failed to update'); setSavingFamily(false); return }
      toast.success('Family member updated')
    } else {
      const { error } = await supabase.from('family_members').insert({
        user_id: member.id,
        name: familyForm.name,
        name_hi: familyForm.name_hi || null,
        relation: familyForm.relation,
        date_of_birth: familyForm.date_of_birth || null,
        gender: familyForm.gender || null,
        occupation: familyForm.occupation || null,
      })
      if (error) { toast.error('Failed to add'); setSavingFamily(false); return }
      toast.success('Family member added')
    }

    resetFamilyForm()
    setSavingFamily(false)
    fetchFamilyMembers()
  }

  async function handleFamilyDelete(fmId: string) {
    if (!confirm('Remove this family member?')) return
    const { error } = await supabase.from('family_members').delete().eq('id', fmId)
    if (error) { toast.error('Failed to delete'); return }
    toast.success('Removed')
    fetchFamilyMembers()
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  if (!member) return <div className="text-center py-20 text-text-secondary">Member not found</div>

  const inputClass = 'w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30'

  return (
    <div>
      <Link to="/admin/members" className="flex items-center gap-1 text-sm text-primary hover:underline mb-6">
        <ArrowLeft className="w-4 h-4" /> {t('common:buttons.back')}
      </Link>

      {/* Header */}
      <div className="bg-white rounded-xl border border-border p-6 mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div
            onClick={() => superAdmin && fileInputRef.current?.click()}
            className={`relative w-16 h-16 rounded-full ${superAdmin ? 'cursor-pointer group' : ''}`}
          >
            <div className="w-16 h-16 rounded-full bg-primary/10 overflow-hidden flex items-center justify-center">
              {(photoPreview || member.profile_photo_url) ? (
                <img src={photoPreview || member.profile_photo_url || ''} alt="" className="w-16 h-16 rounded-full object-cover" />
              ) : (
                <User className="w-8 h-8 text-primary" />
              )}
            </div>
            {superAdmin && (
              <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="w-4 h-4 text-white" />
              </div>
            )}
            {uploadingPhoto && (
              <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoUpload} className="hidden" />
          <div>
            <h1 className="text-xl font-bold text-text-primary">{member.full_name}</h1>
            <p className="text-sm text-text-secondary">{member.email} · {member.member_id || 'No ID'}</p>
            <div className="flex gap-2 mt-1">
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{getRoleLabel(member.role)}</span>
              {member.is_executive_member && (
                <span className="text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Shield className="w-3 h-3" /> Executive
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Form */}
      {superAdmin && (
        <div className="bg-white rounded-xl border border-border p-6 mb-6">
          <h2 className="font-semibold text-text-primary mb-4">Edit Profile</h2>
          {/* Member Since */}
          <div className="mb-4 w-fit">
            <label className="block text-xs font-medium text-text-primary mb-1">Member Since</label>
            <DateInput value={form.member_since} onChange={(v) => updateField('member_since', v)} />
          </div>

          <form onSubmit={handleProfileSave} className="space-y-3">
            {/* Row 1: Name EN | Name Hindi */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-text-primary mb-1">Name (English) *</label>
                <input type="text" required value={form.full_name} onChange={(e) => {
                  updateField('full_name', e.target.value)
                  if (!hiManuallyEdited.current) updateField('full_name_hi', transliterateToHindi(e.target.value))
                }} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-primary mb-1">Name (Hindi)</label>
                <input type="text" value={form.full_name_hi} onChange={(e) => {
                  hiManuallyEdited.current = true
                  updateField('full_name_hi', e.target.value)
                }} className={inputClass} />
              </div>
            </div>
            {/* Row 2: DOB | Gender */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-text-primary mb-1">Date of Birth</label>
                <DateInput value={form.date_of_birth} onChange={(v) => updateField('date_of_birth', v)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-primary mb-1">Gender</label>
                <select value={form.gender} onChange={(e) => updateField('gender', e.target.value)} className={`${inputClass} bg-white`}>
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            {/* Row 3: Phone | Designation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-text-primary mb-1">Phone</label>
                <input type="tel" value={form.phone} onChange={(e) => updateField('phone', e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-primary mb-1">Designation</label>
                <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value as MemberRole)} className={`${inputClass} bg-white`}>
                  {designations.map((d) => <option key={d.slug} value={d.slug}>{d.name_en}</option>)}
                </select>
              </div>
            </div>
            {/* Row 4: Caste | Gotra */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-text-primary mb-1">Caste</label>
                <input type="text" placeholder="e.g. Goswami" value={form.caste} onChange={(e) => updateField('caste', e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-primary mb-1">Gotra</label>
                <input type="text" value={form.gotra} onChange={(e) => updateField('gotra', e.target.value)} className={inputClass} />
              </div>
            </div>
            {/* Row 5: City */}
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">City <span className="text-text-secondary font-normal text-[10px]">(shown on ID card)</span></label>
              <input type="text" value={form.city} onChange={(e) => updateField('city', e.target.value)} className={inputClass} />
            </div>
            {/* Row 6: Local Address */}
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">Local Address</label>
              <textarea value={form.address} onChange={(e) => updateField('address', e.target.value)} rows={2} className={inputClass} />
            </div>
            {/* Row 7: Village Address */}
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">Village Address</label>
              <textarea value={form.village_address} onChange={(e) => updateField('village_address', e.target.value)} rows={2} placeholder="Village, Post Office, District..." className={inputClass} />
            </div>
            <button type="submit" disabled={saving} className="px-5 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark disabled:opacity-50">
              {saving ? '...' : 'Save Profile'}
            </button>
          </form>
        </div>
      )}

      {/* Reset Password */}
      {superAdmin && (
        <div className="bg-white rounded-xl border border-border p-6 mb-6">
          <h2 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-primary" /> Reset Password
          </h2>
          <form onSubmit={async (e) => {
            e.preventDefault()
            if (newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return }
            setSavingPassword(true)
            const { error } = await supabase.rpc('admin_reset_password', { target_user_id: member!.id, new_password: newPassword })
            if (error) { toast.error('Failed: ' + error.message); setSavingPassword(false); return }
            toast.success('Password updated successfully')
            setNewPassword('')
            setSavingPassword(false)
          }} className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-xs font-medium text-text-primary mb-1">New Password</label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className={`${inputClass} pr-10`}
                />
                <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary">
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={savingPassword} className="px-5 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 disabled:opacity-50 shrink-0">
              {savingPassword ? '...' : 'Reset Password'}
            </button>
          </form>
        </div>
      )}


      {/* Family Members */}
      <div className="bg-white rounded-xl border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-text-primary flex items-center gap-2">
            <Users className="w-4 h-4" /> Family Members
          </h2>
          {superAdmin && !showFamilyForm && (
            <button onClick={() => setShowFamilyForm(true)} className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg text-xs font-medium hover:bg-primary-dark">
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          )}
        </div>

        {/* Add/Edit Form */}
        {showFamilyForm && superAdmin && (
          <div className="bg-surface rounded-lg p-4 mb-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-semibold text-text-primary">{editingFamily ? 'Edit Family Member' : 'Add Family Member'}</h3>
              <button onClick={resetFamilyForm}><X className="w-4 h-4 text-text-secondary" /></button>
            </div>
            <form onSubmit={handleFamilySave} className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-text-primary mb-1">Name *</label>
                  <input type="text" required value={familyForm.name} onChange={(e) => setFamilyForm({ ...familyForm, name: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-primary mb-1">Name (Hindi)</label>
                  <input type="text" value={familyForm.name_hi} onChange={(e) => setFamilyForm({ ...familyForm, name_hi: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-primary mb-1">Relation *</label>
                  <select required value={familyForm.relation} onChange={(e) => setFamilyForm({ ...familyForm, relation: e.target.value as FamilyRelation })} className={`${inputClass} bg-white`}>
                    <option value="">Select</option>
                    {FAMILY_RELATIONS.map((r) => (
                      <option key={r.value} value={r.value}>{lang === 'hi' ? r.label_hi : r.label_en}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-text-primary mb-1">Gender</label>
                  <select value={familyForm.gender} onChange={(e) => setFamilyForm({ ...familyForm, gender: e.target.value as Gender })} className={`${inputClass} bg-white`}>
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-primary mb-1">Date of Birth</label>
                  <DateInput value={familyForm.date_of_birth} onChange={(v) => setFamilyForm({ ...familyForm, date_of_birth: v })} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-primary mb-1">Occupation</label>
                  <input type="text" value={familyForm.occupation} onChange={(e) => setFamilyForm({ ...familyForm, occupation: e.target.value })} className={inputClass} />
                </div>
              </div>
              <button type="submit" disabled={savingFamily} className="px-5 py-2 bg-primary text-white rounded-lg text-xs font-medium hover:bg-primary-dark disabled:opacity-50">
                {savingFamily ? '...' : editingFamily ? 'Update' : 'Add Member'}
              </button>
            </form>
          </div>
        )}

        {/* Family List */}
        {familyMembers.length === 0 ? (
          <p className="text-center py-6 text-sm text-text-secondary">No family members added.</p>
        ) : (
          <div className="space-y-2">
            {familyMembers.map((fm) => (
              <div key={fm.id} className="flex items-center justify-between p-3 bg-surface rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                    {fm.photo_url ? (
                      <img src={fm.photo_url} alt="" className="w-9 h-9 rounded-full object-cover" />
                    ) : (
                      <User className="w-4 h-4 text-primary" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">{fm.name}</p>
                    <p className="text-xs text-text-secondary capitalize">
                      {fm.relation}{fm.gender ? ` · ${fm.gender}` : ''}{fm.occupation ? ` · ${fm.occupation}` : ''}
                      {fm.date_of_birth ? ` · ${formatDate(fm.date_of_birth, lang)}` : ''}
                    </p>
                  </div>
                </div>
                {superAdmin && (
                  <div className="flex gap-1">
                    <button onClick={() => startEditFamily(fm)} className="p-1.5 text-text-secondary hover:text-primary"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleFamilyDelete(fm.id)} className="p-1.5 text-text-secondary hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
