import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Globe, GlobeOff, Plus, Trash2, X, Upload, Image } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { BusinessListing } from '../../types'
import { Spinner } from '../../components/ui/Spinner'

interface Branch {
  id: string
  name: string
  address: string
  city: string
  phone: string
}

export function EditBusiness() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [listing, setListing] = useState<BusinessListing | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [branches, setBranches] = useState<Branch[]>([])
  const [showBranch, setShowBranch] = useState(false)
  const [branchForm, setBranchForm] = useState({ name: '', address: '', city: '', phone: '' })
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [vcFrontUrl, setVcFrontUrl] = useState<string | null>(null)
  const [vcBackUrl, setVcBackUrl] = useState<string | null>(null)
  const [uploadingField, setUploadingField] = useState('')
  const [form, setForm] = useState({
    business_name: '', sector: '', designation: '', gst_number: '',
    description: '', address: '', city: '', state: '', phone: '', email: '',
    has_website: false, website: '',
  })

  useEffect(() => {
    if (!id) return
    supabase.from('business_directory').select('*').eq('id', id).single().then(({ data }) => {
      if (data) {
        const b = data as any
        setListing(data as BusinessListing)
        setForm({
          business_name: b.business_name || '',
          sector: b.category || '',
          designation: b.designation || '',
          gst_number: b.gst_number || '',
          description: b.description_en || '',
          address: b.address || '',
          city: b.city || '',
          state: b.state || '',
          phone: b.phone || '',
          email: b.email || '',
          has_website: !!b.website,
          website: b.website || '',
        })
        setBranches(b.branches || [])
        setLogoUrl(b.logo_url || null)
        setVcFrontUrl(b.visiting_card_front || null)
        setVcBackUrl(b.visiting_card_back || null)
      }
      setLoading(false)
    })
  }, [id])

  function addBranch(e: React.FormEvent) {
    e.preventDefault()
    if (!branchForm.name || !branchForm.address) return
    setBranches([...branches, { id: crypto.randomUUID(), ...branchForm }])
    setBranchForm({ name: '', address: '', city: '', phone: '' })
    setShowBranch(false)
  }

  async function handleUpload(file: File, type: 'logo' | 'vc_front' | 'vc_back') {
    if (!listing) return
    if (file.size > 2 * 1024 * 1024) { toast.error('File must be under 2MB'); return }
    setUploadingField(type)
    const ext = file.name.split('.').pop()
    const path = `business/${listing.user_id}/${type}.${ext}`
    const { error } = await supabase.storage.from('profile-photos').upload(path, file, { upsert: true })
    if (error) { toast.error('Upload failed'); setUploadingField(''); return }
    const { data } = supabase.storage.from('profile-photos').getPublicUrl(path)
    if (type === 'logo') setLogoUrl(data.publicUrl)
    else if (type === 'vc_front') setVcFrontUrl(data.publicUrl)
    else setVcBackUrl(data.publicUrl)
    toast.success('Uploaded!')
    setUploadingField('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!listing) return
    setSaving(true)

    const { error } = await supabase.from('business_directory').update({
      business_name: form.business_name,
      category: form.sector,
      designation: form.designation || null,
      gst_number: form.gst_number || null,
      description_en: form.description || null,
      address: form.address || null,
      city: form.city || null,
      state: form.state || null,
      phone: form.phone || null,
      email: form.email || null,
      website: form.has_website ? (form.website || null) : null,
      branches,
      logo_url: logoUrl,
    }).eq('id', id!)

    if (error) { toast.error('Failed'); setSaving(false); return }

    const { data: existingDetail } = await supabase.from('business_details').select('id').eq('user_id', listing.user_id).maybeSingle()
    const detailPayload = {
      user_id: listing.user_id,
      is_employed: false,
      business_name: form.business_name,
      sector: form.sector || null,
      designation: form.designation || null,
      location: form.address || null,
      description: form.description || null,
      website: form.has_website ? (form.website || null) : null,
      has_website: form.has_website,
      phone: form.phone || null,
      gst_number: form.gst_number || null,
      branches,
      logo_url: logoUrl,
      visiting_card_front: vcFrontUrl,
      visiting_card_back: vcBackUrl,
    }
    if (existingDetail) {
      await supabase.from('business_details').update(detailPayload).eq('id', existingDetail.id)
    } else {
      await supabase.from('business_details').insert(detailPayload)
    }

    toast.success('Business updated')
    navigate('/admin/business')
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  const inputClass = 'w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30'

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary mb-1">Edit Business</h1>
      <p className="text-sm text-text-secondary mb-6">Update business details</p>

      <div className="space-y-4">
        <div className="bg-white rounded-xl border border-border p-5">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-text-primary mb-1">Business Name *</label>
                <input type="text" required value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-primary mb-1">Industry / Sector *</label>
                <input type="text" required value={form.sector} onChange={(e) => setForm({ ...form, sector: e.target.value })} className={inputClass} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-text-primary mb-1">Designation / Role</label>
                <input type="text" placeholder="e.g. Owner, MD, Partner" value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-primary mb-1">GST Number</label>
                <input type="text" placeholder="e.g. 19AABCG1234A1Z5" maxLength={15} value={form.gst_number} onChange={(e) => setForm({ ...form, gst_number: e.target.value.toUpperCase() })} className={inputClass} />
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
                <label className="block text-xs font-medium text-text-primary mb-1">Phone</label>
                <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-primary mb-1">Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-text-primary mb-2">Website Available?</label>
              <div className="flex gap-3 mb-2">
                <button type="button" onClick={() => setForm({ ...form, has_website: true })}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${form.has_website ? 'bg-green-50 text-green-700 border-green-300' : 'border-border text-text-secondary'}`}>
                  <Globe className="w-4 h-4" /> Yes
                </button>
                <button type="button" onClick={() => setForm({ ...form, has_website: false, website: '' })}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${!form.has_website ? 'bg-gray-50 text-text-primary border-gray-300' : 'border-border text-text-secondary'}`}>
                  <GlobeOff className="w-4 h-4" /> No
                </button>
              </div>
              {form.has_website && (
                <input type="url" placeholder="https://www.business.com" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} className={inputClass} />
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className={inputClass} />
            </div>

            {/* Logo & Visiting Card */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-text-primary mb-2">Business Logo</label>
                <label className="block border-2 border-dashed border-border rounded-xl p-3 text-center cursor-pointer hover:border-primary/30 transition-colors">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo" className="w-16 h-16 mx-auto rounded-lg object-contain" />
                  ) : (
                    <><Upload className="w-5 h-5 text-gray-400 mx-auto mb-1" /><p className="text-[10px] text-text-secondary">Upload Logo</p></>
                  )}
                  <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], 'logo')} className="hidden" />
                  {uploadingField === 'logo' && <p className="text-[10px] text-primary mt-1">Uploading...</p>}
                </label>
              </div>
              <div>
                <label className="block text-xs font-medium text-text-primary mb-2">Visiting Card (Front)</label>
                <label className="block border-2 border-dashed border-border rounded-xl p-3 text-center cursor-pointer hover:border-primary/30 transition-colors">
                  {vcFrontUrl ? (
                    <img src={vcFrontUrl} alt="VC Front" className="w-full h-16 mx-auto rounded-lg object-contain" />
                  ) : (
                    <><Image className="w-5 h-5 text-gray-400 mx-auto mb-1" /><p className="text-[10px] text-text-secondary">Upload Front</p></>
                  )}
                  <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], 'vc_front')} className="hidden" />
                  {uploadingField === 'vc_front' && <p className="text-[10px] text-primary mt-1">Uploading...</p>}
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
                  <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], 'vc_back')} className="hidden" />
                  {uploadingField === 'vc_back' && <p className="text-[10px] text-primary mt-1">Uploading...</p>}
                </label>
              </div>
            </div>

            <button type="submit" disabled={saving} className="px-5 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark disabled:opacity-50">
              {saving ? '...' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Branches */}
        <div className="bg-white rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-text-primary">Branches</h3>
              <p className="text-xs text-text-secondary">Manage branch locations</p>
            </div>
            {!showBranch && (
              <button type="button" onClick={() => setShowBranch(true)} className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-medium hover:bg-primary-dark">
                <Plus className="w-3.5 h-3.5" /> Add Branch
              </button>
            )}
          </div>

          {showBranch && (
            <form onSubmit={addBranch} className="bg-surface rounded-lg p-3 mb-3 space-y-2">
              <div className="flex justify-between items-center">
                <p className="text-xs font-medium text-text-primary">New Branch</p>
                <button type="button" onClick={() => setShowBranch(false)}><X className="w-3.5 h-3.5 text-text-secondary" /></button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input type="text" required placeholder="Branch Name *" value={branchForm.name} onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })} className={inputClass} />
                <input type="text" placeholder="City" value={branchForm.city} onChange={(e) => setBranchForm({ ...branchForm, city: e.target.value })} className={inputClass} />
              </div>
              <input type="text" required placeholder="Address *" value={branchForm.address} onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })} className={inputClass} />
              <input type="tel" placeholder="Phone" value={branchForm.phone} onChange={(e) => setBranchForm({ ...branchForm, phone: e.target.value })} className={inputClass} />
              <button type="submit" className="px-4 py-1.5 bg-primary text-white rounded-lg text-xs font-medium hover:bg-primary-dark">Add</button>
            </form>
          )}

          {branches.length === 0 ? (
            <p className="text-xs text-text-secondary text-center py-4">No branches added.</p>
          ) : (
            <div className="space-y-2">
              {branches.map((b, i) => (
                <div key={b.id} className="flex items-start justify-between p-3 bg-surface rounded-lg">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">#{i + 1}</span>
                      <p className="text-sm font-medium text-text-primary">{b.name}</p>
                    </div>
                    <p className="text-xs text-text-secondary mt-0.5">{b.address}{b.city ? `, ${b.city}` : ''}{b.phone ? ` · ${b.phone}` : ''}</p>
                  </div>
                  <button type="button" onClick={() => setBranches(branches.filter((x) => x.id !== b.id))} className="p-1 text-text-secondary hover:text-red-500">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
