import { useEffect, useState, useRef } from 'react'
import toast from 'react-hot-toast'
import { Plus, Trash2, X, BookOpen, Upload, FileText, Check, Edit2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { Spinner } from '../../components/ui/Spinner'

interface SouvenirItem {
  id: string
  title: string
  event_name: string | null
  year: number
  pdf_url: string
  cover_url: string | null
  half_page_rate: number
  full_page_rate: number
  created_at: string
}

interface Sponsor {
  id: string
  souvenir_id: string
  sponsor_name: string
  company_name: string | null
  phone: string | null
  ad_size: 'half_page' | 'full_page'
  amount: number
  is_paid: boolean
  notes: string | null
}


export function Souvenir() {
  const { user } = useAuth()
  const [items, setItems] = useState<SouvenirItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ title: '', event_name: '', year: new Date().getFullYear().toString(), half_page_rate: '700', full_page_rate: '1100' })
  const pdfRef = useRef<HTMLInputElement>(null)
  const coverRef = useRef<HTMLInputElement>(null)

  const [selectedSouvenir, setSelectedSouvenir] = useState<SouvenirItem | null>(null)
  const [sponsors, setSponsors] = useState<Sponsor[]>([])
  const [showSponsorForm, setShowSponsorForm] = useState(false)
  const [savingSponsor, setSavingSponsor] = useState(false)
  const [sponsorForm, setSponsorForm] = useState({ sponsor_name: '', company_name: '', phone: '', ad_size: 'half_page' as 'half_page' | 'full_page', amount: '700', is_paid: false, notes: '' })

  useEffect(() => { fetchItems() }, [])

  async function fetchItems() {
    const { data } = await supabase.from('souvenirs').select('*').order('year', { ascending: false })
    setItems((data as SouvenirItem[]) || [])
    setLoading(false)
  }

  function resetForm() {
    setForm({ title: '', event_name: '', year: new Date().getFullYear().toString(), half_page_rate: '700', full_page_rate: '1100' })
    setShowForm(false); setEditingId(null)
  }

  function startEditSouvenir(item: SouvenirItem) {
    setForm({ title: item.title, event_name: item.event_name || '', year: item.year.toString(), half_page_rate: item.half_page_rate.toString(), full_page_rate: item.full_page_rate.toString() })
    setEditingId(item.id)
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const payload = {
      title: form.title, event_name: form.event_name || null, year: parseInt(form.year),
      half_page_rate: parseFloat(form.half_page_rate), full_page_rate: parseFloat(form.full_page_rate),
    }
    if (editingId) {
      const { error } = await supabase.from('souvenirs').update(payload).eq('id', editingId)
      if (error) { toast.error('Failed to update'); setSaving(false); return }
      toast.success('Souvenir updated')
    } else {
      const { error } = await supabase.from('souvenirs').insert({ ...payload, pdf_url: '', created_by: user?.id })
      if (error) { toast.error('Failed to save'); setSaving(false); return }
      toast.success('Souvenir created')
    }
    resetForm(); setSaving(false); fetchItems()
  }

  async function handleUploadPdf(item: SouvenirItem) {
    pdfRef.current?.click()
    pdfRef.current!.onchange = async (e: any) => {
      const file = e.target.files?.[0]
      if (!file) return
      const pdfPath = `${item.id}.pdf`
      const { error: uploadError } = await supabase.storage.from('souvenirs').upload(pdfPath, file, { upsert: true })
      if (uploadError) { toast.error('Failed to upload PDF'); return }
      const { data: pdfUrl } = supabase.storage.from('souvenirs').getPublicUrl(pdfPath)
      await supabase.from('souvenirs').update({ pdf_url: pdfUrl.publicUrl }).eq('id', item.id)
      toast.success('PDF uploaded')
      fetchItems()
      if (selectedSouvenir?.id === item.id) setSelectedSouvenir({ ...item, pdf_url: pdfUrl.publicUrl })
    }
  }

  async function handleUploadCover(item: SouvenirItem) {
    coverRef.current?.click()
    coverRef.current!.onchange = async (e: any) => {
      const file = e.target.files?.[0]
      if (!file) return
      const ext = file.name.split('.').pop()
      const coverPath = `covers/${item.id}.${ext}`
      const { error: uploadError } = await supabase.storage.from('souvenirs').upload(coverPath, file, { upsert: true })
      if (uploadError) { toast.error('Failed to upload cover'); return }
      const { data: coverUrl } = supabase.storage.from('souvenirs').getPublicUrl(coverPath)
      await supabase.from('souvenirs').update({ cover_url: coverUrl.publicUrl }).eq('id', item.id)
      toast.success('Cover uploaded')
      fetchItems()
    }
  }

  async function handleDelete(item: SouvenirItem) {
    if (!confirm(`Delete "${item.title}"?`)) return
    await supabase.from('souvenirs').delete().eq('id', item.id)
    toast.success('Deleted')
    if (selectedSouvenir?.id === item.id) { setSelectedSouvenir(null); setSponsors([]) }
    fetchItems()
  }

  async function openSponsors(item: SouvenirItem) {
    setSelectedSouvenir(item)
    const { data } = await supabase.from('souvenir_sponsors').select('*').eq('souvenir_id', item.id).order('created_at')
    setSponsors((data as Sponsor[]) || [])
  }

  function resetSponsorForm() {
    setSponsorForm({ sponsor_name: '', company_name: '', phone: '', ad_size: 'half_page', amount: '700', is_paid: false, notes: '' })
    setShowSponsorForm(false)
  }

  async function handleAddSponsor(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedSouvenir) return
    setSavingSponsor(true)
    const { error } = await supabase.from('souvenir_sponsors').insert({
      souvenir_id: selectedSouvenir.id,
      sponsor_name: sponsorForm.sponsor_name,
      company_name: sponsorForm.company_name || null,
      phone: sponsorForm.phone || null,
      ad_size: sponsorForm.ad_size,
      amount: parseFloat(sponsorForm.amount),
      is_paid: sponsorForm.is_paid,
      notes: sponsorForm.notes || null,
    })
    if (error) { toast.error('Failed'); setSavingSponsor(false); return }
    toast.success('Sponsor added')
    resetSponsorForm(); setSavingSponsor(false); openSponsors(selectedSouvenir)
  }

  async function togglePaid(sponsor: Sponsor) {
    await supabase.from('souvenir_sponsors').update({ is_paid: !sponsor.is_paid }).eq('id', sponsor.id)
    if (selectedSouvenir) openSponsors(selectedSouvenir)
  }

  async function deleteSponsor(id: string) {
    if (!confirm('Remove this sponsor?')) return
    await supabase.from('souvenir_sponsors').delete().eq('id', id)
    toast.success('Removed')
    if (selectedSouvenir) openSponsors(selectedSouvenir)
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  const totalCollected = sponsors.filter((s) => s.is_paid).reduce((sum, s) => sum + Number(s.amount), 0)
  const totalPending = sponsors.filter((s) => !s.is_paid).reduce((sum, s) => sum + Number(s.amount), 0)
  const inputClass = 'w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30'

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Souvenir</h1>
          <p className="text-sm text-text-secondary mt-1">Upload event magazines and manage sponsors</p>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark">
            <Plus className="w-4 h-4" /> Add Souvenir
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-border p-5 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-semibold text-text-primary">{editingId ? 'Edit Souvenir' : 'Create Souvenir'}</h3>
            <button onClick={resetForm}><X className="w-4 h-4 text-text-secondary" /></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-text-primary mb-1">Title *</label>
                <input type="text" required placeholder="e.g. Annual Meet 2026" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-primary mb-1">Event Name</label>
                <input type="text" placeholder="e.g. Durga Puja" value={form.event_name} onChange={(e) => setForm({ ...form, event_name: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-primary mb-1">Year *</label>
                <input type="number" required min="2000" max="2100" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} className={inputClass} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-text-primary mb-1">Half Page Rate (₹) *</label>
                <input type="number" required min="1" value={form.half_page_rate} onChange={(e) => setForm({ ...form, half_page_rate: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-primary mb-1">Full Page Rate (₹) *</label>
                <input type="number" required min="1" value={form.full_page_rate} onChange={(e) => setForm({ ...form, full_page_rate: e.target.value })} className={inputClass} />
              </div>
            </div>
            <button type="submit" disabled={saving} className="px-5 py-2 bg-primary text-white rounded-lg text-xs font-medium hover:bg-primary-dark disabled:opacity-50">
              {saving ? '...' : editingId ? 'Update Souvenir' : 'Create Souvenir'}
            </button>
          </form>
          <input ref={pdfRef} type="file" accept=".pdf" className="hidden" />
          <input ref={coverRef} type="file" accept="image/*" className="hidden" />
        </div>
      )}

      {/* Souvenir cards */}
      {items.length === 0 ? (
        <div className="bg-white rounded-xl border border-border p-8 text-center text-text-secondary">
          <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-40" />
          No souvenirs uploaded yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {items.map((item) => (
            <div key={item.id} className={`bg-white rounded-xl border overflow-hidden cursor-pointer transition-colors ${selectedSouvenir?.id === item.id ? 'border-primary' : 'border-border hover:border-primary/30'}`} onClick={() => openSponsors(item)}>
              <div className="h-32 bg-gray-100 flex items-center justify-center overflow-hidden relative">
                {item.cover_url ? <img src={item.cover_url} alt="" className="w-full h-full object-cover" /> : <FileText className="w-10 h-10 text-gray-300" />}
                <button onClick={(e) => { e.stopPropagation(); handleUploadCover(item) }} className="absolute top-2 right-2 px-2 py-1 bg-black/50 text-white rounded text-[10px] hover:bg-black/70">
                  {item.cover_url ? 'Change Cover' : 'Add Cover'}
                </button>
              </div>
              <div className="p-3">
                <h3 className="text-sm font-semibold text-text-primary">{item.title}</h3>
                {item.event_name && <p className="text-xs text-text-secondary">{item.event_name}</p>}
                <span className="text-xs text-primary font-medium">{item.year}</span>
                <div className="flex items-center gap-1.5 mt-2">
                  {item.pdf_url ? (
                    <a href={item.pdf_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="flex-1 text-center px-2 py-1.5 bg-primary/10 text-primary rounded-lg text-[10px] font-medium hover:bg-primary/20">View PDF</a>
                  ) : null}
                  <button onClick={(e) => { e.stopPropagation(); handleUploadPdf(item) }} className="flex-1 text-center px-2 py-1.5 bg-primary text-white rounded-lg text-[10px] font-medium hover:bg-primary-dark flex items-center justify-center gap-1">
                    <Upload className="w-3 h-3" /> {item.pdf_url ? 'Replace PDF' : 'Upload PDF'}
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); startEditSouvenir(item) }} className="p-1.5 text-text-secondary hover:text-primary"><Edit2 className="w-3.5 h-3.5" /></button>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(item) }} className="p-1.5 text-text-secondary hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sponsors Panel */}
      {selectedSouvenir && (
        <div className="bg-white rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-text-primary">Sponsors — {selectedSouvenir.title}</h3>
              <p className="text-xs text-text-secondary mt-0.5">Half Page: ₹{selectedSouvenir.half_page_rate} · Full Page: ₹{selectedSouvenir.full_page_rate}</p>
            </div>
            {!showSponsorForm && (
              <button onClick={() => setShowSponsorForm(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-medium hover:bg-primary-dark">
                <Plus className="w-3.5 h-3.5" /> Add Sponsor
              </button>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-surface rounded-lg p-3 text-center">
              <p className="text-xs text-text-secondary">Sponsors</p>
              <p className="text-lg font-bold text-text-primary">{sponsors.length}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <p className="text-xs text-green-600">Collected</p>
              <p className="text-lg font-bold text-green-700">₹{totalCollected.toLocaleString()}</p>
            </div>
            <div className="bg-amber-50 rounded-lg p-3 text-center">
              <p className="text-xs text-amber-600">Pending</p>
              <p className="text-lg font-bold text-amber-700">₹{totalPending.toLocaleString()}</p>
            </div>
          </div>

          {/* Add Sponsor Form */}
          {showSponsorForm && (
            <div className="bg-surface rounded-lg p-4 mb-4">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-xs font-semibold text-text-primary">Add Sponsor</h4>
                <button onClick={resetSponsorForm}><X className="w-3.5 h-3.5 text-text-secondary" /></button>
              </div>
              <form onSubmit={handleAddSponsor} className="space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-text-primary mb-1">Sponsor Name *</label>
                    <input type="text" required value={sponsorForm.sponsor_name} onChange={(e) => setSponsorForm({ ...sponsorForm, sponsor_name: e.target.value })} className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-primary mb-1">Company Name</label>
                    <input type="text" placeholder="e.g. ABC Traders" value={sponsorForm.company_name} onChange={(e) => setSponsorForm({ ...sponsorForm, company_name: e.target.value })} className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-primary mb-1">Phone</label>
                    <input type="tel" maxLength={10} value={sponsorForm.phone} onChange={(e) => setSponsorForm({ ...sponsorForm, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })} className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-primary mb-1">Ad Size *</label>
                    <select value={sponsorForm.ad_size} onChange={(e) => {
                      const size = e.target.value as 'half_page' | 'full_page'
                      const rate = size === 'half_page' ? selectedSouvenir!.half_page_rate : selectedSouvenir!.full_page_rate
                      setSponsorForm({ ...sponsorForm, ad_size: size, amount: rate.toString() })
                    }} className={`${inputClass} bg-white`}>
                      <option value="half_page">Half Page — ₹{selectedSouvenir?.half_page_rate}</option>
                      <option value="full_page">Full Page — ₹{selectedSouvenir?.full_page_rate}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-primary mb-1">Amount (₹)</label>
                    <input type="number" required min="1" value={sponsorForm.amount} onChange={(e) => setSponsorForm({ ...sponsorForm, amount: e.target.value })} className={inputClass} />
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                    <input type="checkbox" checked={sponsorForm.is_paid} onChange={(e) => setSponsorForm({ ...sponsorForm, is_paid: e.target.checked })} className="rounded border-border" />
                    <span className="text-text-primary">Paid</span>
                  </label>
                  <input type="text" placeholder="Notes (optional)" value={sponsorForm.notes} onChange={(e) => setSponsorForm({ ...sponsorForm, notes: e.target.value })} className={`${inputClass} flex-1`} />
                </div>
                <button type="submit" disabled={savingSponsor} className="px-4 py-1.5 bg-primary text-white rounded-lg text-xs font-medium hover:bg-primary-dark disabled:opacity-50">
                  {savingSponsor ? '...' : 'Add Sponsor'}
                </button>
              </form>
            </div>
          )}

          {/* Sponsors List */}
          {sponsors.length === 0 ? (
            <p className="text-center py-6 text-xs text-text-secondary">No sponsors yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-text-secondary border-b border-border">
                    <th className="pb-2 font-medium">Sponsor</th>
                    <th className="pb-2 font-medium">Company</th>
                    <th className="pb-2 font-medium">Phone</th>
                    <th className="pb-2 font-medium">Ad Size</th>
                    <th className="pb-2 font-medium">Amount</th>
                    <th className="pb-2 font-medium">Mark Paid</th>
                    <th className="pb-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sponsors.map((s) => (
                    <tr key={s.id} className="border-b border-border/50">
                      <td className="py-2.5 font-medium text-text-primary">{s.sponsor_name}</td>
                      <td className="py-2.5 text-text-secondary">{s.company_name || '—'}</td>
                      <td className="py-2.5 text-text-secondary">{s.phone || '—'}</td>
                      <td className="py-2.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${s.ad_size === 'full_page' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'}`}>
                          {s.ad_size === 'full_page' ? 'Full Page' : 'Half Page'}
                        </span>
                      </td>
                      <td className="py-2.5 font-semibold text-text-primary">₹{Number(s.amount).toLocaleString()}</td>
                      <td className="py-2.5">
                        {s.is_paid ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-50 text-green-700 flex items-center gap-0.5 w-fit">
                            <Check className="w-2.5 h-2.5" /> Paid
                          </span>
                        ) : (
                          <button onClick={() => { if (confirm(`Mark ${s.sponsor_name} as paid?`)) togglePaid(s) }} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700 hover:bg-amber-100">
                            Mark Paid
                          </button>
                        )}
                      </td>
                      <td className="py-2.5">
                        <button onClick={() => deleteSponsor(s.id)} className="p-1 text-text-secondary hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
