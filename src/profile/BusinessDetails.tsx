import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { Plus, Trash2, X, Globe, GlobeOff, Upload, Image, Crown } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'

import type { BusinessDetail, BusinessBranch } from '../types'
import { Spinner } from '../components/ui/Spinner'

export function BusinessDetails() {
  const { t } = useTranslation('profile')
  const { profile, isExecutiveMember } = useAuth()
  const [detail, setDetail] = useState<BusinessDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    is_employed: true,
    business_name: '',
    employer_name: '',
    sector: '',
    designation: '',
    address: '',
    city: '',
    state: '',
    description: '',
    website: '',
    has_website: false,
    phone: '',
    email: '',
    gst_number: '',
  })
  const [branches, setBranches] = useState<BusinessBranch[]>([])
  const [showBranchForm, setShowBranchForm] = useState(false)
  const [branchForm, setBranchForm] = useState({ name: '', address: '', city: '', phone: '' })
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [vcFrontUrl, setVcFrontUrl] = useState<string | null>(null)
  const [vcBackUrl, setVcBackUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState('')

  useEffect(() => {
    if (!profile) return
    supabase
      .from('business_details')
      .select('*')
      .eq('user_id', profile.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          const d = data as BusinessDetail
          setDetail(d)
          setForm({
            is_employed: d.is_employed,
            business_name: d.business_name || '',
            employer_name: d.employer_name || '',
            sector: d.sector || '',
            designation: d.designation || '',
            address: d.location || '',
            city: (d as any).city || '',
            state: (d as any).state || '',
            description: d.description || '',
            website: d.website || '',
            has_website: d.has_website ?? false,
            phone: d.phone || '',
            email: (d as any).email || '',
            gst_number: d.gst_number || '',
          })
          setBranches(d.branches || [])
          setLogoUrl((d as any).logo_url || null)
          setVcFrontUrl((d as any).visiting_card_front || null)
          setVcBackUrl((d as any).visiting_card_back || null)
        }
        setLoading(false)
      })
  }, [profile])

  async function saveBranches(updated: BusinessBranch[]) {
    if (!detail) return
    await supabase.from('business_details').update({ branches: updated }).eq('id', detail.id)
    const { data: existing } = await supabase.from('business_directory').select('id').eq('user_id', profile!.id).maybeSingle()
    if (existing) await supabase.from('business_directory').update({ branches: updated }).eq('id', existing.id)
  }

  async function addBranch(e: React.FormEvent) {
    e.preventDefault()
    if (!branchForm.name || !branchForm.address) return
    const newBranch: BusinessBranch = {
      id: crypto.randomUUID(),
      name: branchForm.name,
      address: branchForm.address,
      city: branchForm.city,
      phone: branchForm.phone,
    }
    const updated = [...branches, newBranch]
    setBranches(updated)
    setBranchForm({ name: '', address: '', city: '', phone: '' })
    setShowBranchForm(false)
    await saveBranches(updated)
    toast.success('Branch added')
  }

  async function removeBranch(id: string) {
    const updated = branches.filter((b) => b.id !== id)
    setBranches(updated)
    await saveBranches(updated)
    toast.success('Branch removed')
  }

  async function handleFileUpload(file: File, type: 'logo' | 'vc_front' | 'vc_back') {
    if (!profile) return
    if (file.size > 2 * 1024 * 1024) { toast.error('File must be under 2MB'); return }
    setUploading(type)
    const ext = file.name.split('.').pop()
    const path = `business/${profile.id}/${type}.${ext}`
    const { error } = await supabase.storage.from('profile-photos').upload(path, file, { upsert: true })
    if (error) { toast.error('Upload failed'); setUploading(''); return }
    const { data } = supabase.storage.from('profile-photos').getPublicUrl(path)
    const url = data.publicUrl
    if (type === 'logo') setLogoUrl(url)
    else if (type === 'vc_front') setVcFrontUrl(url)
    else setVcBackUrl(url)
    if (detail) {
      const field = type === 'logo' ? 'logo_url' : type === 'vc_front' ? 'visiting_card_front' : 'visiting_card_back'
      await supabase.from('business_details').update({ [field]: url }).eq('id', detail.id)
    }
    toast.success('Uploaded!')
    setUploading('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!profile) return
    setSaving(true)

    const payload = {
      user_id: profile.id,
      is_employed: form.is_employed,
      business_name: form.business_name || null,
      employer_name: form.employer_name || null,
      sector: form.sector || null,
      designation: form.designation || null,
      location: form.address || null,
      city: form.city || null,
      state: form.state || null,
      description: form.description || null,
      website: form.has_website ? (form.website || null) : null,
      has_website: form.has_website,
      phone: form.phone || null,
      email: form.email || null,
      gst_number: !form.is_employed ? (form.gst_number || null) : null,
      branches,
      logo_url: logoUrl,
      visiting_card_front: vcFrontUrl,
      visiting_card_back: vcBackUrl,
    }

    if (detail) {
      const { error } = await supabase.from('business_details').update(payload).eq('id', detail.id)
      if (error) { console.error('Update error:', error); toast.error('Failed: ' + error.message); setSaving(false); return }
    } else {
      const { data: inserted, error } = await supabase.from('business_details').insert(payload).select().single()
      if (error) { console.error('Insert error:', error); toast.error('Failed: ' + error.message); setSaving(false); return }
      if (inserted) setDetail(inserted as BusinessDetail)
    }

    if (!form.is_employed && form.business_name) {
      const dirPayload = {
        user_id: profile.id,
        business_name: form.business_name,
        category: form.sector || 'General',
        description_en: form.description || null,
        designation: form.designation || null,
        gst_number: form.gst_number || null,
        address: form.address || null,
        city: form.city || profile.city || null,
        state: form.state || profile.state || null,
        phone: form.phone || null,
        email: form.email || null,
        website: form.has_website ? (form.website || null) : null,
        logo_url: logoUrl,
        visiting_card_front: vcFrontUrl,
        visiting_card_back: vcBackUrl,
        branches,
        is_approved: true,
        is_active: true,
      }
      const { data: existing } = await supabase.from('business_directory').select('id').eq('user_id', profile.id).maybeSingle()
      if (existing) {
        await supabase.from('business_directory').update(dirPayload).eq('id', existing.id)
      } else {
        await supabase.from('business_directory').insert(dirPayload)
      }
    } else {
      await supabase.from('business_directory').delete().eq('user_id', profile.id)
    }

    toast.success(t('updateSuccess'))
    setSaving(false)
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  if (!isExecutiveMember()) {
    return (
      <div className="bg-white rounded-xl border border-border p-8">
        <div className="text-center max-w-md mx-auto">
          <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Crown className="w-8 h-8 text-amber-500" />
          </div>
          <h2 className="text-xl font-bold text-text-primary mb-2">Executive Members Only</h2>
          <p className="text-sm text-text-secondary mb-2">
            Adding business details to the community directory is an exclusive feature for Executive Members.
          </p>
          <p className="text-sm text-text-secondary mb-6">
            Pay a one-time fee of <strong className="text-text-primary">₹1,100</strong> to become an Executive Member and unlock this feature.
          </p>
          <a href="/profile/membership" className="inline-flex items-center justify-center px-6 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors text-sm">
            View Membership Details
          </a>
        </div>
      </div>
    )
  }

  const inputClass = 'w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm'

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-border p-5">
        <h2 className="text-base font-semibold text-text-primary mb-6">{t('businessDetails.title')}</h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Employment Type Toggle */}
          <div>
            <label className="block text-xs font-medium text-text-primary mb-2">{t('businessDetails.isEmployed')}</label>
            <div className="flex gap-3">
              <button type="button" onClick={() => setForm({ ...form, is_employed: true })}
                className={`px-5 py-2 rounded-lg text-sm font-medium border transition-colors ${form.is_employed ? 'bg-primary text-white border-primary' : 'border-border text-text-secondary hover:border-primary/30'}`}>
                {t('businessDetails.employed')}
              </button>
              <button type="button" onClick={() => setForm({ ...form, is_employed: false })}
                className={`px-5 py-2 rounded-lg text-sm font-medium border transition-colors ${!form.is_employed ? 'bg-primary text-white border-primary' : 'border-border text-text-secondary hover:border-primary/30'}`}>
                {t('businessDetails.businessOwner')}
              </button>
            </div>
          </div>

          {/* Employed Fields */}
          {form.is_employed ? (
            <>
              {/* Pre-filled user info */}
              <div className="bg-surface rounded-lg p-4">
                <p className="text-xs text-text-secondary mb-1">Employee Name (from your profile)</p>
                <p className="text-sm font-medium text-text-primary">{profile?.full_name}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-text-primary mb-1">Company / Organization</label>
                  <input type="text" value={form.employer_name} onChange={(e) => setForm({ ...form, employer_name: e.target.value })} placeholder="Where do you work?" className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-primary mb-1">{t('businessDetails.designation')}</label>
                  <input type="text" value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} placeholder="e.g. Manager, Engineer, Teacher" className={inputClass} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-text-primary mb-1">{t('businessDetails.sector')}</label>
                  <input type="text" value={form.sector} onChange={(e) => setForm({ ...form, sector: e.target.value })} placeholder="e.g. IT, Banking, Education" className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-primary mb-1">{t('businessDetails.location')}</label>
                  <input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Office location" className={inputClass} />
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Business Owner Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-text-primary mb-1">{t('businessDetails.businessName')}</label>
                  <input type="text" value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-primary mb-1">{t('businessDetails.sector')}</label>
                  <input type="text" value={form.sector} onChange={(e) => setForm({ ...form, sector: e.target.value })} className={inputClass} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-text-primary mb-1">{t('businessDetails.designation')}</label>
                  <input type="text" value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} placeholder="e.g. Owner, MD, Partner" className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-primary mb-1">GST Number</label>
                  <input
                    type="text"
                    value={form.gst_number}
                    onChange={(e) => setForm({ ...form, gst_number: e.target.value.toUpperCase() })}
                    placeholder="e.g. 19AABCG1234A1Z5"
                    maxLength={15}
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-primary mb-1">Address</label>
                <input type="text" placeholder="e.g. 12, MG Road" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={inputClass} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-text-primary mb-1">City</label>
                  <input type="text" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-primary mb-1">State</label>
                  <input type="text" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className={inputClass} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-text-primary mb-1">{t('businessDetails.phone')}</label>
                  <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-primary mb-1">Email</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} />
                </div>
              </div>

              {/* Website Toggle */}
              <div>
                <label className="block text-xs font-medium text-text-primary mb-2">Website Available?</label>
                <div className="flex gap-3 mb-3">
                  <button type="button" onClick={() => setForm({ ...form, has_website: true })}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${form.has_website ? 'bg-green-50 text-green-700 border-green-300' : 'border-border text-text-secondary hover:border-green-200'}`}>
                    <Globe className="w-4 h-4" /> Yes
                  </button>
                  <button type="button" onClick={() => setForm({ ...form, has_website: false, website: '' })}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${!form.has_website ? 'bg-gray-50 text-text-primary border-gray-300' : 'border-border text-text-secondary hover:border-gray-200'}`}>
                    <GlobeOff className="w-4 h-4" /> No
                  </button>
                </div>
                {form.has_website && (
                  <input
                    type="url"
                    value={form.website}
                    onChange={(e) => setForm({ ...form, website: e.target.value })}
                    placeholder="https://www.yourbusiness.com"
                    className={inputClass}
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-text-primary mb-1">{t('businessDetails.description')}</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className={inputClass} />
              </div>

              {/* Logo & Visiting Card */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-medium text-text-primary mb-2">Business Logo</label>
                  <label className="block border-2 border-dashed border-border rounded-xl p-3 text-center cursor-pointer hover:border-primary/30 transition-colors">
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo" className="w-16 h-16 mx-auto rounded-lg object-contain" />
                    ) : (
                      <><Upload className="w-5 h-5 text-gray-400 mx-auto mb-1" /><p className="text-[10px] text-text-secondary">Upload Logo</p></>
                    )}
                    <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'logo')} className="hidden" />
                    {uploading === 'logo' && <p className="text-[10px] text-primary mt-1">Uploading...</p>}
                  </label>
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-primary mb-2">Visiting Card (Front) *</label>
                  <label className="block border-2 border-dashed border-border rounded-xl p-3 text-center cursor-pointer hover:border-primary/30 transition-colors">
                    {vcFrontUrl ? (
                      <img src={vcFrontUrl} alt="VC Front" className="w-full h-16 mx-auto rounded-lg object-contain" />
                    ) : (
                      <><Image className="w-5 h-5 text-gray-400 mx-auto mb-1" /><p className="text-[10px] text-text-secondary">Upload Front</p></>
                    )}
                    <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'vc_front')} className="hidden" />
                    {uploading === 'vc_front' && <p className="text-[10px] text-primary mt-1">Uploading...</p>}
                  </label>
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-primary mb-2">Visiting Card (Back) <span className="text-text-secondary font-normal">optional</span></label>
                  <label className="block border-2 border-dashed border-border rounded-xl p-3 text-center cursor-pointer hover:border-primary/30 transition-colors">
                    {vcBackUrl ? (
                      <img src={vcBackUrl} alt="VC Back" className="w-full h-16 mx-auto rounded-lg object-contain" />
                    ) : (
                      <><Image className="w-5 h-5 text-gray-400 mx-auto mb-1" /><p className="text-[10px] text-text-secondary">Upload Back</p></>
                    )}
                    <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'vc_back')} className="hidden" />
                    {uploading === 'vc_back' && <p className="text-[10px] text-primary mt-1">Uploading...</p>}
                  </label>
                </div>
              </div>
            </>
          )}

          {/* Common: Description for employed */}
          {form.is_employed && (
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">{t('businessDetails.description')}</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className={inputClass} />
            </div>
          )}

          <button type="submit" disabled={saving}
            className="px-6 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-50">
            {saving ? '...' : t('common:buttons.save')}
          </button>
        </form>
      </div>

      {/* Branches Section — only for business owners */}
      {!form.is_employed && (
        <div className="bg-white rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-text-primary">Branches</h3>
              <p className="text-xs text-text-secondary mt-0.5">Add multiple branch locations of your business</p>
            </div>
            {!showBranchForm && (
              <button type="button" onClick={() => setShowBranchForm(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark">
                <Plus className="w-4 h-4" /> Add Branch
              </button>
            )}
          </div>

          {showBranchForm && (
            <form onSubmit={addBranch} className="bg-surface rounded-lg p-4 mb-4 space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-medium text-text-primary">New Branch</h4>
                <button type="button" onClick={() => setShowBranchForm(false)}><X className="w-4 h-4 text-text-secondary" /></button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input type="text" required placeholder="Branch Name *" value={branchForm.name} onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })} className={inputClass} />
                <input type="text" placeholder="City" value={branchForm.city} onChange={(e) => setBranchForm({ ...branchForm, city: e.target.value })} className={inputClass} />
              </div>
              <input type="text" required placeholder="Address *" value={branchForm.address} onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })} className={inputClass} />
              <input type="tel" placeholder="Phone" value={branchForm.phone} onChange={(e) => setBranchForm({ ...branchForm, phone: e.target.value })} className={inputClass} />
              <button type="submit" className="px-5 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark">
                Add Branch
              </button>
            </form>
          )}

          {branches.length === 0 ? (
            <p className="text-sm text-text-secondary text-center py-6">No branches added yet.</p>
          ) : (
            <div className="space-y-2">
              {branches.map((branch, index) => (
                <div key={branch.id} className="flex items-start justify-between p-4 bg-surface rounded-lg">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">#{index + 1}</span>
                      <p className="text-sm font-medium text-text-primary">{branch.name}</p>
                    </div>
                    <p className="text-xs text-text-secondary mt-1">{branch.address}{branch.city ? `, ${branch.city}` : ''}</p>
                    {branch.phone && <p className="text-xs text-text-secondary">{branch.phone}</p>}
                  </div>
                  <button type="button" onClick={() => removeBranch(branch.id)} className="p-1.5 text-text-secondary hover:text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
