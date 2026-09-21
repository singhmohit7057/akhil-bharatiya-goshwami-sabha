import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { User, Users, Camera, ImagePlus, Trash } from 'lucide-react'
import { MemberSelect } from '../../components/ui/MemberSelect'
import { supabase } from '../../lib/supabase'
import { logAction } from '../../lib/adminLog'
import { DateInput } from '../../components/ui/DateInput'
import type { Profile, FamilyMember } from '../../types'
import { Spinner } from '../../components/ui/Spinner'

export function AddMatrimonial() {
  const navigate = useNavigate()
  const [members, setMembers] = useState<Profile[]>([])
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profileFor, setProfileFor] = useState<'self' | 'family'>('self')
  const [selectedFamily, setSelectedFamily] = useState<FamilyMember | null>(null)
  const [existingProfiles, setExistingProfiles] = useState<string[]>([]) // candidate_names already created
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null)
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(null)
  const [existingProfilePhotoUrl, setExistingProfilePhotoUrl] = useState<string | null>(null)
  const [additionalPhotoFiles, setAdditionalPhotoFiles] = useState<File[]>([])
  const [additionalPhotoPreviews, setAdditionalPhotoPreviews] = useState<string[]>([])
  const photoRef = useRef<HTMLInputElement>(null)
  const additionalPhotoRef = useRef<HTMLInputElement>(null)
  const MAX_PHOTOS = 5
  const [form, setForm] = useState({
    user_id: '',
    candidate_name: '',
    candidate_relation: '',
    candidate_gender: '',
    date_of_birth: '',
    gotra: '',
    caste: '',
    city: '',
    height: '',
    manglik: '',
    education: '',
    occupation: '',
    income_range: '',
    marital_status: 'unmarried',
    about_en: '',
    about_hi: '',
    preferences_en: '',
    preferences_hi: '',
  })

  useEffect(() => {
    supabase.from('profiles').select('*').eq('account_status', 'active').order('full_name')
      .then(({ data }) => { setMembers((data as Profile[]) || []); setLoading(false) })
  }, [])

  async function fetchFamily(userId: string) {
    const { data } = await supabase.from('family_members').select('*').eq('user_id', userId)
    setFamilyMembers((data as FamilyMember[]) || [])
  }

  function handleMemberSelect(userId: string) {
    setForm({ ...form, user_id: userId, candidate_name: '', candidate_relation: '', candidate_gender: '' })
    setFamilyMembers([])
    setSelectedFamily(null)
    setProfileFor('self')
    setExistingProfiles([])
    if (userId) {
      fetchFamily(userId)
      // Fetch existing matrimonial profiles for this member
      supabase.from('matrimonial_profiles').select('candidate_name').eq('user_id', userId)
        .then(({ data }) => setExistingProfiles((data || []).map((p: any) => p.candidate_name?.toLowerCase().trim() || '')))
    }
  }

  async function handleSelfSelect(member: Profile) {
    // Fetch business details for occupation
    const { data: biz } = await supabase
      .from('business_details')
      .select('is_employed, designation, employer_name, business_name, sector')
      .eq('user_id', member.id)
      .maybeSingle()
    const occupation = biz
      ? biz.is_employed
        ? [biz.designation, biz.sector].filter(Boolean).join(', ')
        : [biz.business_name, biz.designation].filter(Boolean).join(' · ')
      : ''
    setForm(f => ({
      ...f,
      candidate_name: member.full_name || '',
      candidate_relation: 'self',
      candidate_gender: member.gender || '',
      date_of_birth: member.date_of_birth || '',
      gotra: member.gotra || '',
      city: member.city || '',
      caste: (member as any).caste || '',
      occupation: occupation || '',
    }))
    setProfilePhotoPreview(member.profile_photo_url || null)
    setExistingProfilePhotoUrl(member.profile_photo_url || null)
  }

  function handleFamilySelect(fm: FamilyMember) {
    setSelectedFamily(fm)
    setForm(f => ({
      ...f,
      candidate_name: fm.name,
      candidate_relation: fm.relation,
      candidate_gender: fm.gender || '',
      date_of_birth: fm.date_of_birth || '',
      gotra: selected?.gotra || '',
      city: selected?.city || '',
      caste: (selected as any)?.caste || '',
      occupation: fm.occupation || '',
    }))
    // Use family member photo if available
    if (fm.photo_url) {
      setProfilePhotoPreview(fm.photo_url)
      setExistingProfilePhotoUrl(fm.photo_url)
    }
  }

  const selected = members.find((m) => m.id === form.user_id)
  const eligibleFamily = familyMembers.filter((fm) => ['son', 'daughter', 'brother', 'sister'].includes(fm.relation))
  const candidateName = profileFor === 'family' && selectedFamily ? selectedFamily.name : selected?.full_name || ''
  const isDuplicate = !!candidateName && existingProfiles.includes(candidateName.toLowerCase().trim())

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    const candidateName = profileFor === 'family' && selectedFamily ? selectedFamily.name : selected?.full_name || ''
    const candidateGender = profileFor === 'family' && selectedFamily ? (selectedFamily.gender || '') : (selected?.gender || '')

    const { data: inserted, error } = await supabase.from('matrimonial_profiles').insert({
      user_id: form.user_id,
      candidate_name: candidateName || null,
      candidate_relation: profileFor === 'family' ? (form.candidate_relation || null) : 'self',
      candidate_gender: candidateGender || null,
      date_of_birth: form.date_of_birth || null,
      gotra: form.gotra || null,
      caste: form.caste || null,
      city: form.city || null,
      height: form.height || null,
      manglik: form.manglik || null,
      education: form.education || null,
      occupation: form.occupation || null,
      income_range: form.income_range || null,
      marital_status: form.marital_status,
      about_en: form.about_en || null,
      about_hi: form.about_hi || null,
      preferences_en: form.preferences_en || null,
      preferences_hi: form.preferences_hi || null,
      is_approved: true,
      is_active: true,
    }).select('id').single()

    if (error || !inserted) { toast.error('Failed to create'); setSaving(false); return }

    // If no new file but existing URL (auto-filled), save directly
    if (!profilePhotoFile && existingProfilePhotoUrl) {
      await supabase.from('matrimonial_photos').insert({ matrimonial_id: inserted.id, photo_url: existingProfilePhotoUrl, is_primary: true })
    }

    // Upload profile photo if provided
    if (profilePhotoFile) {
      const ext = profilePhotoFile.name.split('.').pop()
      const path = `${inserted.id}/primary.${ext}`
      const { error: upErr } = await supabase.storage.from('matrimonial-photos').upload(path, profilePhotoFile, { upsert: true })
      if (!upErr) {
        const { data: urlData } = supabase.storage.from('matrimonial-photos').getPublicUrl(path)
        await supabase.from('matrimonial_photos').insert({ matrimonial_id: inserted.id, photo_url: urlData.publicUrl, is_primary: true })
      }
    }

    // Upload additional photos
    for (let i = 0; i < additionalPhotoFiles.length; i++) {
      const file = additionalPhotoFiles[i]
      const ext = file.name.split('.').pop()
      const path = `${inserted.id}/photo_${Date.now()}_${i}.${ext}`
      const { error: upErr } = await supabase.storage.from('matrimonial-photos').upload(path, file)
      if (!upErr) {
        const { data: urlData } = supabase.storage.from('matrimonial-photos').getPublicUrl(path)
        await supabase.from('matrimonial_photos').insert({ matrimonial_id: inserted.id, photo_url: urlData.publicUrl, is_primary: false })
      }
    }

    logAction('create', 'matrimonial', candidateName || '')
    toast.success('Matrimonial profile created')
    navigate('/admin/matrimonial')
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  const inputClass = 'w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30'

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary mb-1">Add Matrimonial Profile</h1>
      <p className="text-sm text-text-secondary mb-6">Create a matrimonial profile for a member or their family</p>

      <div className="bg-white rounded-xl border border-border p-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Step 1: Select Member */}
          <div>
            <label className="block text-xs font-medium text-text-primary mb-1">Select Member *</label>
            <MemberSelect
              members={members.map(m => ({ id: m.id, full_name: m.full_name, role: m.role, email: (m as any).email, phone: (m as any).phone }))}
              value={form.user_id}
              onChange={(id) => handleMemberSelect(id)}
              required
            />
          </div>

          {selected && (
            <div className="flex items-center gap-3 p-3 bg-surface rounded-lg">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                {selected.profile_photo_url ? (
                  <img src={selected.profile_photo_url} alt="" className="w-9 h-9 rounded-full object-cover" />
                ) : (
                  <User className="w-4 h-4 text-primary" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">{selected.full_name}</p>
                <p className="text-xs text-text-secondary">{selected.email} · {selected.gender} · {selected.city}</p>
              </div>
            </div>
          )}

          {/* Step 2: Profile for whom */}
          {selected && (
            <div>
              <label className="block text-xs font-medium text-text-primary mb-2">Profile For *</label>
              <div className="flex gap-3">
                <button type="button" onClick={() => { setProfileFor('self'); setSelectedFamily(null); if (selected) handleSelfSelect(selected) }}
                  className={`flex-1 p-3 rounded-lg border text-center text-sm font-medium transition-colors ${
                    profileFor === 'self' ? 'border-primary bg-primary/5 text-primary' : 'border-border text-text-secondary hover:border-primary/30'
                  }`}>
                  <User className="w-4 h-4 mx-auto mb-1" />
                  Self ({selected.full_name})
                </button>
                <button type="button" onClick={() => setProfileFor('family')}
                  className={`flex-1 p-3 rounded-lg border text-center text-sm font-medium transition-colors ${
                    profileFor === 'family' ? 'border-primary bg-primary/5 text-primary' : 'border-border text-text-secondary hover:border-primary/30'
                  }`}>
                  <Users className="w-4 h-4 mx-auto mb-1" />
                  Family Member
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Select family member */}
          {profileFor === 'family' && selected && (
            <div>
              <label className="block text-xs font-medium text-text-primary mb-2">Select Family Member *</label>
              {eligibleFamily.length === 0 ? (
                <p className="text-xs text-text-secondary p-3 bg-surface rounded-lg">No eligible family members (son/daughter/brother/sister) found for this member. Add family members from the member's profile first.</p>
              ) : (
                <div className="space-y-2">
                  {eligibleFamily.map((fm) => (
                    <button
                      key={fm.id}
                      type="button"
                      onClick={() => handleFamilySelect(fm)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
                        selectedFamily?.id === fm.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        {fm.photo_url ? (
                          <img src={fm.photo_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <User className="w-4 h-4 text-primary" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-text-primary">{fm.name}</p>
                        <p className="text-xs text-text-secondary capitalize">{fm.relation}{fm.gender ? ` · ${fm.gender}` : ''}{fm.occupation ? ` · ${fm.occupation}` : ''}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Duplicate warning */}
          {isDuplicate && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <span>⚠️</span>
              <span><strong>{candidateName}</strong> already has a matrimonial profile. Please edit the existing one.</span>
            </div>
          )}

          {/* Step 4: Profile details */}
          {(profileFor === 'self' || selectedFamily) && selected && (
            <>
              <hr className="border-border" />
              <p className="text-xs font-semibold text-text-primary">
                Profile details for: <span className="text-primary">{profileFor === 'family' && selectedFamily ? selectedFamily.name : selected.full_name}</span>
              </p>

              {/* Profile Photo */}
              <div className="flex items-center gap-4">
                <label className="relative w-16 h-16 rounded-full cursor-pointer group shrink-0">
                  <div className="w-16 h-16 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center border-2 border-dashed border-gray-300 group-hover:border-primary transition-colors">
                    {profilePhotoPreview ? (
                      <img src={profilePhotoPreview} alt="" className="w-16 h-16 rounded-full object-cover" />
                    ) : (
                      <Camera className="w-5 h-5 text-gray-400 group-hover:text-primary" />
                    )}
                  </div>
                  <input ref={photoRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (!f) return
                    if (f.size > 2 * 1024 * 1024) { toast.error('Photo must be under 2MB'); return }
                    setProfilePhotoFile(f)
                    setProfilePhotoPreview(URL.createObjectURL(f))
                  }} className="hidden" />
                </label>
                <div>
                  <p className="text-xs font-medium text-text-primary">Profile Photo <span className="text-text-secondary font-normal">· JPG, PNG · Max 2MB</span></p>
                  {profilePhotoPreview && <button type="button" onClick={() => { setProfilePhotoFile(null); setProfilePhotoPreview(null) }} className="text-[11px] text-red-500 hover:underline">Remove</button>}
                </div>
              </div>

              {/* Additional Photos */}
              <div>
                <p className="text-xs font-medium text-text-primary mb-1.5">Additional Photos <span className="text-text-secondary font-normal">({additionalPhotoPreviews.length}/{MAX_PHOTOS})</span></p>
                <div className="flex flex-wrap gap-2">
                  {additionalPhotoPreviews.map((photo, index) => (
                    <div key={index} className="relative w-16 h-16 rounded-lg overflow-hidden group">
                      <img src={photo} alt="" className="w-16 h-16 object-cover rounded-lg" />
                      <button type="button" onClick={() => {
                        setAdditionalPhotoFiles(additionalPhotoFiles.filter((_, i) => i !== index))
                        setAdditionalPhotoPreviews(additionalPhotoPreviews.filter((_, i) => i !== index))
                      }} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                        <Trash className="w-3.5 h-3.5 text-white" />
                      </button>
                    </div>
                  ))}
                  {additionalPhotoPreviews.length < MAX_PHOTOS && (
                    <label className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-300 hover:border-primary flex flex-col items-center justify-center cursor-pointer transition-colors group">
                      <ImagePlus className="w-4 h-4 text-gray-400 group-hover:text-primary" />
                      <span className="text-[9px] text-gray-400 mt-0.5">Add</span>
                      <input ref={additionalPhotoRef} type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(e) => {
                        const files = e.target.files
                        if (!files) return
                        const remaining = MAX_PHOTOS - additionalPhotoPreviews.length
                        const newFiles: File[] = []
                        const newPreviews: string[] = []
                        for (let i = 0; i < Math.min(files.length, remaining); i++) {
                          if (files[i].size > 2 * 1024 * 1024) { toast.error(`${files[i].name} is over 2MB, skipped`); continue }
                          newFiles.push(files[i])
                          newPreviews.push(URL.createObjectURL(files[i]))
                        }
                        setAdditionalPhotoFiles([...additionalPhotoFiles, ...newFiles])
                        setAdditionalPhotoPreviews([...additionalPhotoPreviews, ...newPreviews])
                      }} className="hidden" />
                    </label>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-text-primary mb-1">Caste</label>
                  <input type="text" placeholder="e.g. Goswami" value={form.caste} onChange={(e) => setForm({ ...form, caste: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-primary mb-1">Gotra</label>
                  <input type="text" value={form.gotra} onChange={(e) => setForm({ ...form, gotra: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-primary mb-1">Manglik</label>
                  <select value={form.manglik} onChange={(e) => setForm({ ...form, manglik: e.target.value })} className={`${inputClass} bg-white`}>
                    <option value="">Select</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                    <option value="partial">Partial</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-primary mb-1">Marital Status</label>
                  <select value={form.marital_status} onChange={(e) => setForm({ ...form, marital_status: e.target.value })} className={`${inputClass} bg-white`}>
                    <option value="unmarried">Unmarried</option>
                    <option value="divorced">Divorced</option>
                    <option value="widowed">Widowed</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-text-primary mb-1">Height</label>
                  <input type="text" placeholder="e.g. 5'6&quot;" value={form.height} onChange={(e) => setForm({ ...form, height: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-primary mb-1">City</label>
                  <input type="text" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className={inputClass} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-primary mb-1">Date of Birth</label>
                <DateInput value={form.date_of_birth} onChange={(v) => setForm({ ...form, date_of_birth: v })} />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-text-primary mb-1">Education</label>
                  <input type="text" placeholder="e.g. B.Tech, MBA" value={form.education} onChange={(e) => setForm({ ...form, education: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-primary mb-1">Occupation</label>
                  <input type="text" placeholder="e.g. Engineer" value={form.occupation} onChange={(e) => setForm({ ...form, occupation: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-primary mb-1">Income Range</label>
                  <input type="text" placeholder="e.g. 6-10 LPA" value={form.income_range} onChange={(e) => setForm({ ...form, income_range: e.target.value })} className={inputClass} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-primary mb-1">About</label>
                <textarea placeholder="Brief description about the person..." value={form.about_en} onChange={(e) => setForm({ ...form, about_en: e.target.value })} rows={3} className={inputClass} />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-primary mb-1">Partner Preferences</label>
                <textarea placeholder="What kind of match are you looking for..." value={form.preferences_en} onChange={(e) => setForm({ ...form, preferences_en: e.target.value })} rows={3} className={inputClass} />
              </div>

              <button type="submit" disabled={saving || isDuplicate} className="px-5 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed">
                {saving ? '...' : 'Create Profile'}
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  )
}
