import { useEffect, useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { Plus, Edit2, Trash2, Heart, User, X, Camera, ImagePlus, Trash } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'

import type { FamilyMember } from '../types'
import { Spinner } from '../components/ui/Spinner'
import { DateInput } from '../components/ui/DateInput'

interface MatrimonialEntry {
  id: string
  user_id: string
  candidate_name: string
  candidate_relation: string
  candidate_gender: string
  date_of_birth: string
  height: string
  education: string
  occupation: string
  income_range: string
  marital_status: string
  about_en: string
  preferences_en: string
  gotra: string
  city: string
  is_active: boolean
  is_approved: boolean
}

interface MatrimonialPhoto {
  id: string
  matrimonial_id: string
  photo_url: string
  is_primary: boolean
}

const MAX_PHOTOS = 5

export function MyMatrimonial() {
  const { } = useTranslation('profile')
  const { profile, isExecutiveMember } = useAuth()
  const [entries, setEntries] = useState<MatrimonialEntry[]>([])
  const [entryPhotos, setEntryPhotos] = useState<Record<string, MatrimonialPhoto[]>>({})
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<MatrimonialEntry | null>(null)
  const profilePhotoRef = useRef<HTMLInputElement>(null)
  const additionalPhotoRef = useRef<HTMLInputElement>(null)
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null)
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(null)
  const [additionalPhotoFiles, setAdditionalPhotoFiles] = useState<File[]>([])
  const [additionalPhotoPreviews, setAdditionalPhotoPreviews] = useState<string[]>([])
  const [existingPhotos, setExistingPhotos] = useState<MatrimonialPhoto[]>([])
  const [form, setForm] = useState({
    candidate_name: '',
    candidate_relation: '',
    candidate_gender: '',
    date_of_birth: '',
    height: '',
    education: '',
    occupation: '',
    income_range: '',
    marital_status: 'unmarried',
    about_en: '',
    preferences_en: '',
    gotra: '',
    city: '',
  })

  useEffect(() => {
    if (!profile) return
    Promise.all([
      supabase.from('matrimonial_profiles').select('*').eq('user_id', profile.id),
      supabase.from('family_members').select('*').eq('user_id', profile.id),
    ]).then(async ([mpRes, fmRes]) => {
      const profiles = (mpRes.data as MatrimonialEntry[]) || []
      setEntries(profiles)
      if (fmRes.data) setFamilyMembers(fmRes.data as FamilyMember[])

      if (profiles.length > 0) {
        const ids = profiles.map((p) => p.id)
        const { data: photos } = await supabase.from('matrimonial_photos').select('*').in('matrimonial_id', ids)
        if (photos) {
          const grouped: Record<string, MatrimonialPhoto[]> = {}
          for (const photo of photos as MatrimonialPhoto[]) {
            if (!grouped[photo.matrimonial_id]) grouped[photo.matrimonial_id] = []
            grouped[photo.matrimonial_id].push(photo)
          }
          setEntryPhotos(grouped)
        }
      }
      setLoading(false)
    })
  }, [profile])

  function resetForm() {
    setForm({ candidate_name: '', candidate_relation: '', candidate_gender: '', date_of_birth: '', height: '', education: '', occupation: '', income_range: '', marital_status: 'unmarried', about_en: '', preferences_en: '', gotra: '', city: '' })
    setProfilePhotoFile(null)
    setProfilePhotoPreview(null)
    setAdditionalPhotoFiles([])
    setAdditionalPhotoPreviews([])
    setExistingPhotos([])
    setEditing(null)
    setShowForm(false)
  }

  function selectFamilyMember(memberId: string) {
    const fm = familyMembers.find((m) => m.id === memberId)
    if (fm) {
      setForm({
        ...form,
        candidate_name: fm.name,
        candidate_relation: fm.relation,
        candidate_gender: fm.gender || '',
        date_of_birth: fm.date_of_birth || '',
        gotra: profile?.gotra || '',
        city: profile?.city || '',
      })
    }
  }

  function startEdit(entry: MatrimonialEntry) {
    setForm({
      candidate_name: entry.candidate_name || '',
      candidate_relation: entry.candidate_relation || '',
      candidate_gender: entry.candidate_gender || '',
      date_of_birth: entry.date_of_birth || '',
      height: entry.height || '',
      education: entry.education || '',
      occupation: entry.occupation || '',
      income_range: entry.income_range || '',
      marital_status: entry.marital_status || 'unmarried',
      about_en: entry.about_en || '',
      preferences_en: entry.preferences_en || '',
      gotra: entry.gotra || '',
      city: entry.city || '',
    })
    const photos = entryPhotos[entry.id] || []
    const primary = photos.find((p) => p.is_primary)
    setProfilePhotoPreview(primary?.photo_url || null)
    setExistingPhotos(photos.filter((p) => !p.is_primary))
    setEditing(entry)
    setShowForm(true)
  }

  async function uploadPhoto(file: File, path: string): Promise<string | null> {
    const { error } = await supabase.storage.from('matrimonial-photos').upload(path, file, { upsert: true })
    if (error) return null
    const { data } = supabase.storage.from('matrimonial-photos').getPublicUrl(path)
    return data.publicUrl
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!profile) return
    setSaving(true)

    const payload = {
      user_id: profile.id,
      candidate_name: form.candidate_name || null,
      candidate_relation: form.candidate_relation || null,
      candidate_gender: form.candidate_gender || null,
      date_of_birth: form.date_of_birth || null,
      gotra: form.gotra || null,
      city: form.city || null,
      height: form.height || null,
      education: form.education || null,
      occupation: form.occupation || null,
      income_range: form.income_range || null,
      marital_status: form.marital_status,
      about_en: form.about_en || null,
      preferences_en: form.preferences_en || null,
    }

    let entryId: string

    if (editing) {
      const { error } = await supabase.from('matrimonial_profiles').update(payload).eq('id', editing.id)
      if (error) { toast.error('Failed to update'); setSaving(false); return }
      entryId = editing.id
    } else {
      const { data, error } = await supabase.from('matrimonial_profiles').insert({ ...payload, is_active: true, is_approved: true }).select('id').single()
      if (error || !data) { toast.error('Failed to create'); setSaving(false); return }
      entryId = data.id
    }

    if (profilePhotoFile) {
      const ext = profilePhotoFile.name.split('.').pop()
      const path = `${entryId}/primary.${ext}`
      const url = await uploadPhoto(profilePhotoFile, path)
      if (url) {
        if (editing) {
          const existingPrimary = (entryPhotos[editing.id] || []).find((p) => p.is_primary)
          if (existingPrimary) {
            await supabase.from('matrimonial_photos').update({ photo_url: url }).eq('id', existingPrimary.id)
          } else {
            await supabase.from('matrimonial_photos').insert({ matrimonial_id: entryId, photo_url: url, is_primary: true })
          }
        } else {
          await supabase.from('matrimonial_photos').insert({ matrimonial_id: entryId, photo_url: url, is_primary: true })
        }
      }
    }

    for (let i = 0; i < additionalPhotoFiles.length; i++) {
      const file = additionalPhotoFiles[i]
      const ext = file.name.split('.').pop()
      const path = `${entryId}/photo_${Date.now()}_${i}.${ext}`
      const url = await uploadPhoto(file, path)
      if (url) {
        await supabase.from('matrimonial_photos').insert({ matrimonial_id: entryId, photo_url: url, is_primary: false })
      }
    }

    toast.success(editing ? 'Profile updated' : 'Profile added (pending admin approval)')

    const { data: refreshed } = await supabase.from('matrimonial_profiles').select('*').eq('user_id', profile.id)
    setEntries((refreshed as MatrimonialEntry[]) || [])

    const allIds = (refreshed || []).map((p: MatrimonialEntry) => p.id)
    if (allIds.length > 0) {
      const { data: photos } = await supabase.from('matrimonial_photos').select('*').in('matrimonial_id', allIds)
      if (photos) {
        const grouped: Record<string, MatrimonialPhoto[]> = {}
        for (const photo of photos as MatrimonialPhoto[]) {
          if (!grouped[photo.matrimonial_id]) grouped[photo.matrimonial_id] = []
          grouped[photo.matrimonial_id].push(photo)
        }
        setEntryPhotos(grouped)
      }
    }

    setSaving(false)
    resetForm()
  }

  async function handleDelete(id: string) {
    if (!confirm('Remove this matrimonial profile?')) return
    await supabase.from('matrimonial_photos').delete().eq('matrimonial_id', id)
    await supabase.from('matrimonial_profiles').delete().eq('id', id)
    setEntries(entries.filter((e) => e.id !== id))
    const updated = { ...entryPhotos }
    delete updated[id]
    setEntryPhotos(updated)
    toast.success('Removed')
  }

  function handleProfilePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { toast.error('Profile photo must be under 2MB'); return }
    setProfilePhotoFile(file)
    setProfilePhotoPreview(URL.createObjectURL(file))
  }

  function handleAdditionalPhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files) return
    const currentCount = existingPhotos.length + additionalPhotoPreviews.length
    const remaining = MAX_PHOTOS - currentCount
    if (remaining <= 0) { toast.error(`Maximum ${MAX_PHOTOS} photos allowed`); return }
    const newFiles: File[] = []
    const newPreviews: string[] = []
    for (let i = 0; i < Math.min(files.length, remaining); i++) {
      if (files[i].size > 2 * 1024 * 1024) { toast.error(`${files[i].name} is over 2MB, skipped`); continue }
      newFiles.push(files[i])
      newPreviews.push(URL.createObjectURL(files[i]))
    }
    setAdditionalPhotoFiles([...additionalPhotoFiles, ...newFiles])
    setAdditionalPhotoPreviews([...additionalPhotoPreviews, ...newPreviews])
    if (newFiles.length > 0) toast.success(`${newFiles.length} photo(s) added`)
  }

  function removeNewPhoto(index: number) {
    setAdditionalPhotoFiles(additionalPhotoFiles.filter((_, i) => i !== index))
    setAdditionalPhotoPreviews(additionalPhotoPreviews.filter((_, i) => i !== index))
  }

  async function removeExistingPhoto(photo: MatrimonialPhoto) {
    await supabase.from('matrimonial_photos').delete().eq('id', photo.id)
    setExistingPhotos(existingPhotos.filter((p) => p.id !== photo.id))
    toast.success('Photo removed')
  }

  function calculateAge(dob: string): number {
    const today = new Date()
    const birth = new Date(dob)
    let age = today.getFullYear() - birth.getFullYear()
    const m = today.getMonth() - birth.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
    return age
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  if (!isExecutiveMember()) {
    return (
      <div className="bg-white rounded-xl border border-border p-8">
        <div className="text-center max-w-md mx-auto">
          <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8 text-amber-500" />
          </div>
          <h2 className="text-xl font-bold text-text-primary mb-2">Executive Members Only</h2>
          <p className="text-sm text-text-secondary mb-2">
            Creating matrimonial profiles for your family members is an exclusive feature for Executive Members.
          </p>
          <p className="text-sm text-text-secondary mb-6">
            Pay a one-time fee of <strong className="text-text-primary">₹1,100</strong> to become an Executive Member and unlock this feature for 1 year.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="/profile/membership" className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors text-sm">
              View Membership Details
            </a>
            <a href="/matrimonial" className="inline-flex items-center justify-center gap-2 px-6 py-2.5 border border-border text-text-secondary rounded-lg font-medium hover:bg-gray-50 transition-colors text-sm">
              Browse All Profiles
            </a>
          </div>
        </div>
      </div>
    )
  }

  const eligibleMembers = familyMembers.filter((fm) =>
    ['son', 'daughter', 'brother', 'sister'].includes(fm.relation)
  )

  const inputClass = 'w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm'

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-border p-5">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-base font-semibold text-text-primary">My Matrimonial Profiles</h2>
            <p className="text-xs text-text-secondary mt-0.5">Add your family member's details for matrimonial listing</p>
          </div>
          {!showForm && (
            <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark">
              <Plus className="w-4 h-4" /> Add Profile
            </button>
          )}
        </div>

        {showForm && (
          <div className="bg-surface rounded-lg p-5 mt-4 mb-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-semibold text-text-primary">{editing ? 'Edit Profile' : 'Add Matrimonial Profile'}</h3>
              <button onClick={resetForm}><X className="w-4 h-4 text-text-secondary" /></button>
            </div>

            {!editing && eligibleMembers.length > 0 && (
              <div className="mb-4">
                <label className="block text-xs font-medium text-text-primary mb-1">Select from your family members</label>
                <select onChange={(e) => selectFamilyMember(e.target.value)} className={`${inputClass} bg-white`}>
                  <option value="">Choose a family member...</option>
                  {eligibleMembers.map((fm) => (
                    <option key={fm.id} value={fm.id}>{fm.name} ({fm.relation})</option>
                  ))}
                </select>
                <p className="text-[11px] text-text-secondary mt-1">Or fill details manually below</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
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
                  <input ref={profilePhotoRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleProfilePhotoChange} className="hidden" />
                </label>
                <div className="flex-1">
                  <p className="text-xs font-medium text-text-primary">Profile Photo <span className="text-text-secondary font-normal">· JPG, PNG · Max 2MB</span></p>
                  {profilePhotoPreview && <button type="button" onClick={() => { setProfilePhotoFile(null); setProfilePhotoPreview(null) }} className="text-[11px] text-red-500 hover:underline">Remove</button>}
                </div>
              </div>

              {/* Additional Photos */}
              <div>
                <p className="text-xs font-medium text-text-primary mb-1.5">Additional Photos <span className="text-text-secondary font-normal">({existingPhotos.length + additionalPhotoPreviews.length}/{MAX_PHOTOS})</span></p>
                <div className="flex flex-wrap gap-2">
                  {existingPhotos.map((photo) => (
                    <div key={photo.id} className="relative w-16 h-16 rounded-lg overflow-hidden group">
                      <img src={photo.photo_url} alt="" className="w-16 h-16 object-cover rounded-lg" />
                      <button type="button" onClick={() => removeExistingPhoto(photo)} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                        <Trash className="w-3.5 h-3.5 text-white" />
                      </button>
                    </div>
                  ))}
                  {additionalPhotoPreviews.map((photo, index) => (
                    <div key={index} className="relative w-16 h-16 rounded-lg overflow-hidden group">
                      <img src={photo} alt="" className="w-16 h-16 object-cover rounded-lg" />
                      <button type="button" onClick={() => removeNewPhoto(index)} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                        <Trash className="w-3.5 h-3.5 text-white" />
                      </button>
                    </div>
                  ))}
                  {(existingPhotos.length + additionalPhotoPreviews.length) < MAX_PHOTOS && (
                    <label className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-300 hover:border-primary flex flex-col items-center justify-center cursor-pointer transition-colors group">
                      <ImagePlus className="w-4 h-4 text-gray-400 group-hover:text-primary" />
                      <span className="text-[9px] text-gray-400 mt-0.5">Add</span>
                      <input ref={additionalPhotoRef} type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handleAdditionalPhotos} className="hidden" />
                    </label>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-text-primary mb-1">Full Name *</label>
                  <input type="text" required value={form.candidate_name} onChange={(e) => setForm({ ...form, candidate_name: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-primary mb-1">Relation *</label>
                  <select required value={form.candidate_relation} onChange={(e) => setForm({ ...form, candidate_relation: e.target.value })} className={`${inputClass} bg-white`}>
                    <option value="">Select</option>
                    <option value="son">Son</option>
                    <option value="daughter">Daughter</option>
                    <option value="brother">Brother</option>
                    <option value="sister">Sister</option>
                    <option value="self">Self</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-primary mb-1">Gender *</label>
                  <select required value={form.candidate_gender} onChange={(e) => setForm({ ...form, candidate_gender: e.target.value })} className={`${inputClass} bg-white`}>
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-primary mb-1">Gotra</label>
                  <input type="text" value={form.gotra} onChange={(e) => setForm({ ...form, gotra: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-primary mb-1">Height</label>
                  <input type="text" placeholder="e.g. 5'6&quot;" value={form.height} onChange={(e) => setForm({ ...form, height: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-primary mb-1">Marital Status</label>
                  <select value={form.marital_status} onChange={(e) => setForm({ ...form, marital_status: e.target.value })} className={`${inputClass} bg-white`}>
                    <option value="unmarried">Unmarried</option>
                    <option value="divorced">Divorced</option>
                    <option value="widowed">Widowed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-primary mb-1">City</label>
                  <input type="text" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className={inputClass} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-primary mb-1">Date of Birth *</label>
                <DateInput value={form.date_of_birth} onChange={(v) => setForm({ ...form, date_of_birth: v })} required />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-text-primary mb-1">Education *</label>
                  <input type="text" required placeholder="e.g. B.Tech, MBA" value={form.education} onChange={(e) => setForm({ ...form, education: e.target.value })} className={inputClass} />
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

              <button type="submit" disabled={saving} className="px-5 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark disabled:opacity-50">
                {saving ? '...' : editing ? 'Update Profile' : 'Add Profile'}
              </button>
            </form>
          </div>
        )}

        {entries.length === 0 && !showForm ? (
          <div className="text-center py-10">
            <Heart className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-text-secondary">No matrimonial profiles added yet.</p>
            <p className="text-xs text-text-secondary mt-1">Add your son's, daughter's, or family member's profile for matrimonial listing.</p>
          </div>
        ) : (
          <div className="space-y-3 mt-4">
            {entries.map((entry) => {
              const photos = entryPhotos[entry.id] || []
              const primaryPhoto = photos.find((p) => p.is_primary)
              const otherPhotos = photos.filter((p) => !p.is_primary)

              return (
                <div key={entry.id} className="border border-border rounded-xl p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                        {primaryPhoto ? (
                          <img src={primaryPhoto.photo_url} alt="" className="w-12 h-12 rounded-full object-cover" />
                        ) : (
                          <User className="w-6 h-6 text-primary" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-text-primary">{entry.candidate_name}</h3>
                        <p className="text-xs text-text-secondary capitalize">
                          {entry.candidate_relation} · {entry.candidate_gender} · {entry.date_of_birth ? `${calculateAge(entry.date_of_birth)} years` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => startEdit(entry)} className="p-1.5 text-text-secondary hover:text-primary"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(entry.id)} className="p-1.5 text-text-secondary hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-3">
                    {entry.gotra && <div className="bg-surface rounded-lg p-2"><p className="text-text-secondary">Gotra</p><p className="font-medium text-text-primary">{entry.gotra}</p></div>}
                    {entry.date_of_birth && <div className="bg-surface rounded-lg p-2"><p className="text-text-secondary">Date of Birth</p><p className="font-medium text-text-primary">{new Date(entry.date_of_birth).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p></div>}
                    {entry.height && <div className="bg-surface rounded-lg p-2"><p className="text-text-secondary">Height</p><p className="font-medium text-text-primary">{entry.height}</p></div>}
                    <div className="bg-surface rounded-lg p-2"><p className="text-text-secondary">Status</p><p className="font-medium text-text-primary capitalize">{entry.marital_status}</p></div>
                    {entry.education && <div className="bg-surface rounded-lg p-2"><p className="text-text-secondary">Education</p><p className="font-medium text-text-primary">{entry.education}</p></div>}
                    {entry.occupation && <div className="bg-surface rounded-lg p-2"><p className="text-text-secondary">Occupation</p><p className="font-medium text-text-primary">{entry.occupation}</p></div>}
                    {entry.income_range && <div className="bg-surface rounded-lg p-2"><p className="text-text-secondary">Income</p><p className="font-medium text-text-primary">{entry.income_range}</p></div>}
                    {entry.city && <div className="bg-surface rounded-lg p-2"><p className="text-text-secondary">City</p><p className="font-medium text-text-primary">{entry.city}</p></div>}
                  </div>

                  {entry.about_en && (
                    <div className="mb-2">
                      <p className="text-xs font-medium text-text-secondary mb-0.5">About</p>
                      <p className="text-sm text-text-primary">{entry.about_en}</p>
                    </div>
                  )}
                  {entry.preferences_en && (
                    <div>
                      <p className="text-xs font-medium text-text-secondary mb-0.5">Partner Preferences</p>
                      <p className="text-sm text-text-primary">{entry.preferences_en}</p>
                    </div>
                  )}

                  {otherPhotos.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-medium text-text-secondary mb-1.5">Photos ({otherPhotos.length})</p>
                      <div className="flex gap-2 flex-wrap">
                        {otherPhotos.map((photo) => (
                          <img key={photo.id} src={photo.photo_url} alt="" className="w-16 h-16 rounded-lg object-cover border border-border" />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
