import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { User, Users } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { DateInput } from '../../components/ui/DateInput'
import { getRoleLabel } from '../../lib/utils'
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
  const [form, setForm] = useState({
    user_id: '',
    candidate_name: '',
    candidate_relation: '',
    candidate_gender: '',
    date_of_birth: '',
    gotra: '',
    city: '',
    height: '',
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
    if (userId) fetchFamily(userId)
  }

  function handleFamilySelect(fm: FamilyMember) {
    setSelectedFamily(fm)
    setForm({
      ...form,
      candidate_name: fm.name,
      candidate_relation: fm.relation,
      candidate_gender: fm.gender || '',
    })
  }

  const selected = members.find((m) => m.id === form.user_id)
  const eligibleFamily = familyMembers.filter((fm) => ['son', 'daughter', 'brother', 'sister'].includes(fm.relation))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    const candidateName = profileFor === 'family' && selectedFamily ? selectedFamily.name : selected?.full_name || ''
    const candidateGender = profileFor === 'family' && selectedFamily ? (selectedFamily.gender || '') : (selected?.gender || '')

    const { error } = await supabase.from('matrimonial_profiles').insert({
      user_id: form.user_id,
      candidate_name: candidateName || null,
      candidate_relation: profileFor === 'family' ? (form.candidate_relation || null) : 'self',
      candidate_gender: candidateGender || null,
      date_of_birth: form.date_of_birth || null,
      gotra: form.gotra || null,
      city: form.city || null,
      height: form.height || null,
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
    })

    if (error) { toast.error('Failed to create'); setSaving(false); return }
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
            <select required value={form.user_id} onChange={(e) => handleMemberSelect(e.target.value)} className={`${inputClass} bg-white`}>
              <option value="">Choose member...</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>{m.full_name} — {getRoleLabel(m.role)} ({m.city || 'No city'})</option>
              ))}
            </select>
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
                <button type="button" onClick={() => { setProfileFor('self'); setSelectedFamily(null) }}
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

          {/* Step 4: Profile details */}
          {(profileFor === 'self' || selectedFamily) && selected && (
            <>
              <hr className="border-border" />
              <p className="text-xs font-semibold text-text-primary">
                Profile details for: <span className="text-primary">{profileFor === 'family' && selectedFamily ? selectedFamily.name : selected.full_name}</span>
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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

              <button type="submit" disabled={saving} className="px-5 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark disabled:opacity-50">
                {saving ? '...' : 'Create Profile'}
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  )
}
