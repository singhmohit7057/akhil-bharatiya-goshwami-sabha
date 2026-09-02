import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { Camera, User } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { transliterateToHindi } from '../lib/transliterate'
import { Spinner } from '../components/ui/Spinner'
import { DateInput } from '../components/ui/DateInput'

export function EditProfile() {
  const { t } = useTranslation('profile')
  const { profile, refreshProfile, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(false)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const hiManuallyEdited = useRef(false)
  const [form, setForm] = useState({
    full_name: '',
    full_name_hi: '',
    phone: '',
    gender: '',
    date_of_birth: '',
    gotra: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  })

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || '',
        full_name_hi: profile.full_name_hi || (profile.full_name ? transliterateToHindi(profile.full_name) : ''),
        phone: profile.phone || '',
        gender: profile.gender || '',
        date_of_birth: profile.date_of_birth || '',
        gotra: profile.gotra || '',
        address: profile.address || '',
        city: profile.city || '',
        state: profile.state || '',
        pincode: profile.pincode || '',
      })
    }
  }, [profile])

  if (authLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!profile) return
    setLoading(true)

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: form.full_name,
        full_name_hi: form.full_name_hi || null,
        phone: form.phone || null,
        gender: form.gender || null,
        date_of_birth: form.date_of_birth || null,
        gotra: form.gotra || null,
        address: form.address || null,
        city: form.city || null,
        state: form.state || null,
        pincode: form.pincode || null,
      })
      .eq('id', profile.id)

    if (error) {
      toast.error(t('updateError'))
    } else {
      toast.success(t('updateSuccess'))
      refreshProfile()
    }
    setLoading(false)
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !profile) return

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Photo must be under 2MB')
      return
    }

    const previewUrl = URL.createObjectURL(file)
    setPhotoPreview(previewUrl)
    setUploadingPhoto(true)

    const ext = file.name.split('.').pop()
    const path = `${profile.id}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('profile-photos')
      .upload(path, file, { upsert: true })

    if (uploadError) {
      toast.error('Failed to upload photo')
      setPhotoPreview(null)
      setUploadingPhoto(false)
      return
    }

    const { data: urlData } = supabase.storage.from('profile-photos').getPublicUrl(path)

    await supabase.from('profiles').update({ profile_photo_url: urlData.publicUrl }).eq('id', profile.id)
    toast.success('Photo updated!')
    setUploadingPhoto(false)
    refreshProfile()
  }

  const inputClass = 'w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm'

  return (
    <div className="bg-white rounded-xl border border-border p-5">
      <h2 className="text-base font-semibold text-text-primary mb-4">{t('edit')}</h2>

      {/* Profile Photo Upload */}
      <div className="mb-5 flex items-center gap-4">
        <div
          onClick={() => fileInputRef.current?.click()}
          className="relative w-16 h-16 rounded-full cursor-pointer group shrink-0"
        >
          <div className="w-16 h-16 rounded-full bg-primary/10 overflow-hidden flex items-center justify-center">
            {(photoPreview || profile?.profile_photo_url) ? (
              <img src={photoPreview || profile?.profile_photo_url || ''} alt="" className="w-16 h-16 rounded-full object-cover" />
            ) : (
              <User className="w-7 h-7 text-primary" />
            )}
          </div>
          <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Camera className="w-4 h-4 text-white" />
          </div>
          {uploadingPhoto && (
            <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
        <div>
          <p className="text-xs font-medium text-text-primary">Profile Photo <span className="text-text-secondary font-normal">· JPG, PNG · Max 2MB</span></p>
          {photoPreview && <button type="button" onClick={() => setPhotoPreview(null)} className="text-[11px] text-red-500 hover:underline">Remove</button>}
        </div>
        <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoUpload} className="hidden" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-text-primary mb-1">{t('common:labels.name')} (English) *</label>
            <input type="text" required value={form.full_name} onChange={(e) => {
              const val = e.target.value
              updateField('full_name', val)
              if (!hiManuallyEdited.current) {
                updateField('full_name_hi', transliterateToHindi(val))
              }
            }} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-primary mb-1">{t('common:labels.name')} (Hindi)</label>
            <input type="text" value={form.full_name_hi} onChange={(e) => {
              hiManuallyEdited.current = true
              updateField('full_name_hi', e.target.value)
            }} className={inputClass} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-text-primary mb-1">{t('common:labels.phone')}</label>
            <input type="tel" value={form.phone} onChange={(e) => updateField('phone', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-primary mb-1">{t('common:labels.gender')}</label>
            <select value={form.gender} onChange={(e) => updateField('gender', e.target.value)} className={`${inputClass} bg-white`}>
              <option value="">Select</option>
              <option value="male">{t('common:labels.male')}</option>
              <option value="female">{t('common:labels.female')}</option>
              <option value="other">{t('common:labels.other')}</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-text-primary mb-1">{t('common:labels.dateOfBirth')}</label>
            <DateInput value={form.date_of_birth} onChange={(v) => updateField('date_of_birth', v)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-primary mb-1">{t('common:labels.gotra')}</label>
            <input type="text" value={form.gotra} onChange={(e) => updateField('gotra', e.target.value)} className={inputClass} />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-text-primary mb-1">{t('common:labels.address')}</label>
          <textarea value={form.address} onChange={(e) => updateField('address', e.target.value)} rows={2} className={inputClass} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-text-primary mb-1">{t('common:labels.city')}</label>
            <input type="text" value={form.city} onChange={(e) => updateField('city', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-primary mb-1">{t('common:labels.state')}</label>
            <input type="text" value={form.state} onChange={(e) => updateField('state', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-primary mb-1">{t('common:labels.pincode')}</label>
            <input type="text" value={form.pincode} onChange={(e) => updateField('pincode', e.target.value)} className={inputClass} />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
        >
          {loading ? '...' : t('common:buttons.save')}
        </button>
      </form>
    </div>
  )
}
