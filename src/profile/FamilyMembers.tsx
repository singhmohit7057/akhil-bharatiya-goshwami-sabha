import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { Plus, Edit2, Trash2, X, Camera, User } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'

import { FAMILY_RELATIONS } from '../types'
import type { FamilyMember, FamilyRelation, Gender } from '../types'
import { Spinner } from '../components/ui/Spinner'
import { DateInput } from '../components/ui/DateInput'

export function FamilyMembers() {
  const { t, i18n } = useTranslation('profile')
  const lang = i18n.language
  const { profile } = useAuth()
  const [members, setMembers] = useState<FamilyMember[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<FamilyMember | null>(null)
  const [form, setForm] = useState({ name: '', name_hi: '', relation: '' as FamilyRelation, date_of_birth: '', gender: '' as Gender | '', occupation: '' })
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

  useEffect(() => {
    if (!profile) return
    fetchMembers()
  }, [profile])

  async function fetchMembers() {
    const { data } = await supabase.from('family_members').select('*').eq('user_id', profile!.id).order('created_at')
    setMembers((data as FamilyMember[]) || [])
    setLoading(false)
  }

  function resetForm() {
    setForm({ name: '', name_hi: '', relation: '' as FamilyRelation, date_of_birth: '', gender: '', occupation: '' })
    setPhotoPreview(null)
    setEditing(null)
    setShowForm(false)
  }

  function startEdit(member: FamilyMember) {
    setForm({
      name: member.name,
      name_hi: member.name_hi || '',
      relation: member.relation,
      date_of_birth: member.date_of_birth || '',
      gender: member.gender || '',
      occupation: member.occupation || '',
    })
    setPhotoPreview(member.photo_url)
    setEditing(member)
    setShowForm(true)
  }

  const [photoFile, setPhotoFile] = useState<File | null>(null)

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { toast.error('Photo must be under 2MB'); return }
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  async function uploadFamilyPhoto(memberId: string): Promise<string | null> {
    if (!photoFile) return photoPreview
    const ext = photoFile.name.split('.').pop()
    const path = `family/${memberId}.${ext}`
    const { error } = await supabase.storage.from('profile-photos').upload(path, photoFile, { upsert: true })
    if (error) return null
    const { data } = supabase.storage.from('profile-photos').getPublicUrl(path)
    return data.publicUrl
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!profile) return

    const payload = {
      user_id: profile.id,
      name: form.name,
      name_hi: form.name_hi || null,
      relation: form.relation,
      date_of_birth: form.date_of_birth || null,
      gender: form.gender || null,
      occupation: form.occupation || null,
    }

    if (editing) {
      const photoUrl = await uploadFamilyPhoto(editing.id)
      const { error } = await supabase.from('family_members').update({ ...payload, photo_url: photoUrl }).eq('id', editing.id)
      if (error) { toast.error('Failed to update'); return }
      toast.success('Updated!')
    } else {
      const { data: inserted, error } = await supabase.from('family_members').insert(payload).select().single()
      if (error || !inserted) { toast.error('Failed to add'); return }
      if (photoFile) {
        const photoUrl = await uploadFamilyPhoto(inserted.id)
        if (photoUrl) await supabase.from('family_members').update({ photo_url: photoUrl }).eq('id', inserted.id)
      }
      toast.success('Added!')
    }
    setPhotoFile(null)
    resetForm()
    fetchMembers()
  }

  async function handleDelete(id: string) {
    if (!confirm(t('familyMembers.confirmDelete'))) return
    await supabase.from('family_members').delete().eq('id', id)
    toast.success('Deleted')
    fetchMembers()
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  const inputClass = 'w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm'

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-border p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-text-primary">{t('familyMembers.title')}</h2>
          {!showForm && (
            <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors">
              <Plus className="w-4 h-4" /> {t('familyMembers.addNew')}
            </button>
          )}
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-surface rounded-lg p-4 mb-4 space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium">{editing ? t('familyMembers.editMember') : t('familyMembers.addNew')}</h3>
              <button type="button" onClick={resetForm}><X className="w-4 h-4" /></button>
            </div>
            {/* Photo upload - optional, on top */}
            <div className="flex items-center gap-3">
              <label className="relative w-12 h-12 rounded-full cursor-pointer group shrink-0">
                <div className="w-12 h-12 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center border-2 border-dashed border-gray-300 group-hover:border-primary transition-colors">
                  {photoPreview ? (
                    <img src={photoPreview} alt="" className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <Camera className="w-5 h-5 text-gray-400 group-hover:text-primary" />
                  )}
                </div>
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoChange} className="hidden" />
              </label>
              <div>
                <p className="text-xs font-medium text-text-primary">Photo <span className="text-text-secondary font-normal">(optional)</span></p>
                <p className="text-[11px] text-text-secondary">JPG, PNG · Max 2MB</p>
                {photoPreview && <button type="button" onClick={() => setPhotoPreview(null)} className="text-[11px] text-red-500 hover:underline">Remove</button>}
              </div>
            </div>
            {/* Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input type="text" required placeholder={`${t('familyMembers.name')} *`} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} />
              <select required value={form.relation} onChange={(e) => setForm({ ...form, relation: e.target.value as FamilyRelation })} className={`${inputClass} bg-white`}>
                <option value="">{t('familyMembers.relation')} *</option>
                {FAMILY_RELATIONS.map((r) => (
                  <option key={r.value} value={r.value}>{lang === 'hi' ? r.label_hi : r.label_en}</option>
                ))}
              </select>
              <DateInput value={form.date_of_birth} onChange={(v) => setForm({ ...form, date_of_birth: v })} />
              <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value as Gender })} className={`${inputClass} bg-white`}>
                <option value="">{t('familyMembers.gender')}</option>
                <option value="male">{t('common:labels.male')}</option>
                <option value="female">{t('common:labels.female')}</option>
              </select>
              <input type="text" placeholder={t('familyMembers.occupation')} value={form.occupation} onChange={(e) => setForm({ ...form, occupation: e.target.value })} className={inputClass} />
            </div>
            <button type="submit" className="px-5 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors">
              {editing ? t('common:buttons.save') : t('common:buttons.add')}
            </button>
          </form>
        )}

        {members.length === 0 ? (
          <p className="text-text-secondary text-center py-8">{t('familyMembers.noMembers')}</p>
        ) : (
          <div className="space-y-2">
            {members.map((fm) => (
              <div key={fm.id} className="flex items-center justify-between p-3 bg-surface rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
                    {fm.photo_url ? (
                      <img src={fm.photo_url} alt="" className="w-9 h-9 rounded-full object-cover" />
                    ) : (
                      <User className="w-4 h-4 text-primary" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">{fm.name}</p>
                    <p className="text-xs text-text-secondary capitalize">{fm.relation}{fm.occupation ? ` — ${fm.occupation}` : ''}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => startEdit(fm)} className="p-1.5 text-text-secondary hover:text-primary"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(fm.id)} className="p-1.5 text-text-secondary hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
