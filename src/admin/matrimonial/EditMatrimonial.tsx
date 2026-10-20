import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Upload, Trash2, Camera, User } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { logAction } from '../../lib/adminLog'
import { DateInput } from '../../components/ui/DateInput'
import { Spinner } from '../../components/ui/Spinner'

interface Photo {
  id: string
  photo_url: string
  is_primary?: boolean
}

export function EditMatrimonial() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [uploadingPrimary, setUploadingPrimary] = useState(false)
  const primaryRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState({
    candidate_name: '', candidate_gender: '', candidate_relation: '',
    date_of_birth: '', gotra: '', caste: '', city: '', height: '',
    education: '', occupation: '', income_range: '',
    marital_status: 'unmarried', manglik: '',
    about_en: '', preferences_en: '',
  })

  const [realId, setRealId] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    const code = id.replace('-', '/')
    const isCode = code.startsWith('MAT/')
    const profileQuery = isCode
      ? supabase.from('matrimonial_profiles').select('*').eq('profile_code', code).single()
      : supabase.from('matrimonial_profiles').select('*').eq('id', id).single()

    profileQuery.then(async ({ data: mpData }) => {
      if (!mpData) { setLoading(false); return }
      const rid = mpData.id
      setRealId(rid)
      const [{ data: photoData }, { data: memberData }] = await Promise.all([
        supabase.from('matrimonial_photos').select('*').eq('matrimonial_id', rid).order('created_at'),
        (mpData as any).user_id
          ? supabase.from('profiles').select('city, gotra, caste').eq('id', (mpData as any).user_id).single()
          : Promise.resolve({ data: null }),
      ])
      const photoRes = { data: photoData };
      if (mpData) {
        const d = mpData as any
        const m = (memberData as any) || {}
        setForm({
          candidate_name: d.candidate_name || '',
          candidate_gender: d.candidate_gender || '',
          candidate_relation: d.candidate_relation || '',
          date_of_birth: d.date_of_birth || '',
          gotra: d.gotra || m.gotra || '',
          caste: d.caste || m.caste || '',
          city: d.city || m.city || '',
          height: d.height || '',
          education: d.education || '',
          occupation: d.occupation || '',
          income_range: d.income_range || '',
          marital_status: d.marital_status || 'unmarried',
          manglik: d.manglik || '',
          about_en: d.about_en || '',
          preferences_en: d.preferences_en || '',
        })
      }
      setPhotos((photoRes.data as Photo[]) || [])
      setLoading(false)
    })
  }, [id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase.from('matrimonial_profiles').update({
      candidate_name: form.candidate_name || null,
      candidate_gender: form.candidate_gender || null,
      candidate_relation: form.candidate_relation || null,
      date_of_birth: form.date_of_birth || null,
      gotra: form.gotra || null,
      caste: form.caste || null,
      city: form.city || null,
      height: form.height || null,
      education: form.education || null,
      occupation: form.occupation || null,
      income_range: form.income_range || null,
      marital_status: form.marital_status,
      manglik: form.manglik || null,
      about_en: form.about_en || null,
      preferences_en: form.preferences_en || null,
    }).eq('id', realId!)
    if (error) { toast.error('Failed to update'); setSaving(false); return }
    logAction('update', 'matrimonial', form.candidate_name, realId!)
    toast.success('Profile updated')
    setSaving(false)
    navigate('/admin/matrimonial')
  }

  function storagePathFromUrl(url: string) {
    const marker = '/matrimonial-photos/'
    const idx = url.indexOf(marker)
    return idx !== -1 ? url.slice(idx + marker.length) : null
  }

  async function handlePrimaryUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !realId) return
    if (file.size > 2 * 1024 * 1024) { toast.error('File over 2MB'); return }
    setUploadingPrimary(true)
    const ext = file.name.split('.').pop()
    const path = `matrimonial/${realId}/primary_${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('matrimonial-photos').upload(path, file)
    if (error) { toast.error('Upload failed'); setUploadingPrimary(false); return }
    const { data } = supabase.storage.from('matrimonial-photos').getPublicUrl(path)
    // Remove existing primary from storage + DB
    const existing = photos.find(p => p.is_primary)
    if (existing) {
      const oldPath = storagePathFromUrl(existing.photo_url)
      if (oldPath) await supabase.storage.from('matrimonial-photos').remove([oldPath])
      await supabase.from('matrimonial_photos').delete().eq('id', existing.id)
    }
    await supabase.from('matrimonial_photos').insert({ matrimonial_id: realId, photo_url: data.publicUrl, is_primary: true })
    const { data: updated } = await supabase.from('matrimonial_photos').select('*').eq('matrimonial_id', realId).order('created_at')
    setPhotos((updated as Photo[]) || [])
    setUploadingPrimary(false)
    toast.success('Profile photo updated')
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || !realId) return
    setUploading(true)
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (file.size > 2 * 1024 * 1024) { toast.error(`${file.name} over 2MB`); continue }
      const ext = file.name.split('.').pop()
      const path = `matrimonial/${realId}/${crypto.randomUUID()}.${ext}`
      const { error } = await supabase.storage.from('matrimonial-photos').upload(path, file)
      if (error) continue
      const { data } = supabase.storage.from('matrimonial-photos').getPublicUrl(path)
      await supabase.from('matrimonial_photos').insert({ matrimonial_id: realId, photo_url: data.publicUrl })
    }
    const { data: updated } = await supabase.from('matrimonial_photos').select('*').eq('matrimonial_id', realId).order('created_at')
    setPhotos((updated as Photo[]) || [])
    setUploading(false)
    logAction('upload', 'matrimonial-photo', form.candidate_name, realId!)
    toast.success('Photos uploaded')
  }

  async function handleDeletePhoto(photoId: string) {
    if (!confirm('Delete this photo?')) return
    const photo = photos.find(p => p.id === photoId)
    if (photo) {
      const storagePath = storagePathFromUrl(photo.photo_url)
      if (storagePath) await supabase.storage.from('matrimonial-photos').remove([storagePath])
    }
    await supabase.from('matrimonial_photos').delete().eq('id', photoId)
    setPhotos(photos.filter((p) => p.id !== photoId))
    logAction('delete', 'matrimonial-photo', form.candidate_name, photoId)
    toast.success('Photo deleted')
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  const inputClass = 'w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30'

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary mb-1">Edit Matrimonial Profile</h1>
      <p className="text-sm text-text-secondary mb-6">Update matrimonial profile details</p>

      <div className="bg-white rounded-xl border border-border p-5">
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Profile Photo */}
          <div className="flex items-center gap-4 pb-4 border-b border-border">
            <div onClick={() => primaryRef.current?.click()}
              className="relative w-16 h-16 rounded-full cursor-pointer group shrink-0">
              <div className="w-16 h-16 rounded-full bg-primary/10 overflow-hidden flex items-center justify-center">
                {photos.find(p => p.is_primary)?.photo_url
                  ? <img src={photos.find(p => p.is_primary)!.photo_url} alt="" className="w-16 h-16 rounded-full object-cover" />
                  : <User className="w-7 h-7 text-primary" />}
              </div>
              <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="w-4 h-4 text-white" />
              </div>
              <input ref={primaryRef} type="file" accept="image/*" onChange={handlePrimaryUpload} className="hidden" disabled={uploadingPrimary} />
            </div>
            <div>
              <p className="text-xs font-medium text-text-primary">Profile Photo <span className="text-text-secondary font-normal">· JPG, PNG · Max 2MB</span></p>
              <p className="text-xs text-text-secondary mt-0.5">{uploadingPrimary ? 'Uploading...' : 'Click photo to change'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">Candidate Name *</label>
              <input type="text" required value={form.candidate_name} onChange={(e) => setForm({ ...form, candidate_name: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">Gender</label>
              <select value={form.candidate_gender} onChange={(e) => setForm({ ...form, candidate_gender: e.target.value })} className={`${inputClass} bg-white`}>
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">Relation</label>
              <select value={form.candidate_relation} onChange={(e) => setForm({ ...form, candidate_relation: e.target.value })} className={`${inputClass} bg-white`}>
                <option value="">Select</option>
                <option value="self">Self</option>
                <option value="son">Son</option>
                <option value="daughter">Daughter</option>
                <option value="brother">Brother</option>
                <option value="sister">Sister</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">Caste</label>
              <input type="text" value={form.caste} onChange={(e) => setForm({ ...form, caste: e.target.value })} placeholder="e.g. Goswami" className={inputClass} />
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
          <div className="grid grid-cols-2 gap-3">
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
              <input type="text" value={form.occupation} onChange={(e) => setForm({ ...form, occupation: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">Income Range</label>
              <input type="text" placeholder="e.g. 6-10 LPA" value={form.income_range} onChange={(e) => setForm({ ...form, income_range: e.target.value })} className={inputClass} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-primary mb-1">About</label>
            <textarea value={form.about_en} onChange={(e) => setForm({ ...form, about_en: e.target.value })} rows={3} className={inputClass} />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-primary mb-1">Partner Preferences</label>
            <textarea value={form.preferences_en} onChange={(e) => setForm({ ...form, preferences_en: e.target.value })} rows={3} className={inputClass} />
          </div>

          {/* Additional Photos */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-medium text-text-primary">Additional Photos ({photos.filter(p => !p.is_primary).length}/5)</label>
              <label className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-medium hover:bg-primary-dark cursor-pointer">
                <Upload className="w-3.5 h-3.5" /> {uploading ? 'Uploading...' : 'Upload'}
                <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" disabled={uploading} />
              </label>
            </div>
            {photos.filter(p => !p.is_primary).length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {photos.filter(p => !p.is_primary).map((photo) => (
                  <div key={photo.id} className="relative w-20 h-20 rounded-lg overflow-hidden group">
                    <img src={photo.photo_url} alt="" className="w-20 h-20 object-cover" />
                    <button type="button" onClick={() => handleDeletePhoto(photo.id)} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Trash2 className="w-4 h-4 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-text-secondary">No additional photos uploaded</p>
            )}
          </div>

          <button type="submit" disabled={saving} className="px-5 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark disabled:opacity-50">
            {saving ? '...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  )
}
