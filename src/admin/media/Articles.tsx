import { useEffect, useRef, useState } from 'react'
import { Plus, Edit2, Trash2, Eye, EyeOff, Upload, X, Link2, ChevronDown, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'
import { Spinner } from '../../components/ui/Spinner'
import { useAuth } from '../../hooks/useAuth'

interface Member {
  id: string
  full_name: string
  member_id: string | null
  profile_photo_url: string | null
}

interface Article {
  id: string
  title: string
  slug: string
  content: string
  cover_image_url: string | null
  publisher_id: string | null
  is_published: boolean
  created_at: string
  publisher?: { full_name: string } | null
}

const BUCKET = 'articles'

function MemberAvatar({ m }: { m: Member }) {
  return m.profile_photo_url ? (
    <img src={m.profile_photo_url} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0 ring-1 ring-gray-200" />
  ) : (
    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 ring-1 ring-gray-200">
      <span className="text-xs font-semibold text-primary">{m.full_name.charAt(0)}</span>
    </div>
  )
}

function MemberPicker({ members, value, onChange }: { members: Member[]; value: string; onChange: (id: string) => void }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const selected = members.find(m => m.id === value) ?? null

  useEffect(() => {
    function outside(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', outside)
    return () => document.removeEventListener('mousedown', outside)
  }, [])

  const filtered = members.filter(m =>
    m.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (m.member_id ?? '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div ref={ref} className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">Publisher / Author</label>
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-left">
        {selected ? (
          <>
            <MemberAvatar m={selected} />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">{selected.full_name}</p>
              {selected.member_id && <p className="text-xs text-gray-400">{selected.member_id}</p>}
            </div>
          </>
        ) : (
          <span className="text-gray-400 flex-1">— Select Member —</span>
        )}
        <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          {/* Search */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100">
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input autoFocus value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or ID…"
              className="flex-1 text-sm outline-none placeholder-gray-400" />
          </div>
          {/* Clear option */}
          <div className="max-h-60 overflow-y-auto">
            <button type="button" onClick={() => { onChange(''); setOpen(false); setSearch('') }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:bg-gray-50">
              — None —
            </button>
            {filtered.length === 0 && <p className="px-3 py-4 text-sm text-gray-400 text-center">No members found</p>}
            {filtered.map(m => (
              <button type="button" key={m.id}
                onClick={() => { onChange(m.id); setOpen(false); setSearch('') }}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-50 ${m.id === value ? 'bg-primary/5' : ''}`}>
                <MemberAvatar m={m} />
                <div className="flex-1 min-w-0 text-left">
                  <p className="font-medium text-gray-900 truncate">{m.full_name}</p>
                  {m.member_id && <p className="text-xs text-gray-400">{m.member_id}</p>}
                </div>
                {m.id === value && <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80)
}

export function Articles() {
  const { user } = useAuth()
  const [articles, setArticles] = useState<Article[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Article | null>(null)

  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [slugManual, setSlugManual] = useState(false)
  const [content, setContent] = useState('')
  const [publisherId, setPublisherId] = useState('')
  const [isPublished, setIsPublished] = useState(true)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function fetchArticles() {
    const { data } = await supabase
      .from('articles')
      .select('*, publisher:profiles!articles_publisher_id_fkey(full_name)')
      .order('created_at', { ascending: false })
    setArticles((data as Article[]) || [])
    setLoading(false)
  }

  async function fetchMembers() {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, member_id, profile_photo_url')
      .eq('account_status', 'active')
      .order('full_name')
    setMembers((data as Member[]) || [])
  }

  useEffect(() => {
    fetchArticles()
    fetchMembers()
  }, [])

  function openCreate() {
    setEditing(null)
    setTitle('')
    setSlug('')
    setSlugManual(false)
    setContent('')
    setPublisherId('')
    setIsPublished(true)
    setImageFile(null)
    setImagePreview(null)
    setShowForm(true)
  }

  function openEdit(a: Article) {
    setEditing(a)
    setTitle(a.title)
    setSlug(a.slug || toSlug(a.title))
    setSlugManual(true)
    setContent(a.content)
    setPublisherId(a.publisher_id || '')
    setIsPublished(a.is_published)
    setImageFile(null)
    setImagePreview(a.cover_image_url)
    setShowForm(true)
  }

  function handleTitleChange(val: string) {
    setTitle(val)
    if (!slugManual) setSlug(toSlug(val))
  }

  function handleSlugChange(val: string) {
    setSlug(toSlug(val))
    setSlugManual(true)
  }

  async function compressImage(file: File, maxSizeMB = 1.5, maxDim = 1200): Promise<File> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        let { width, height } = img
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height)
          width = Math.round(width * ratio)
          height = Math.round(height * ratio)
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
        let quality = 0.85
        const tryEncode = () => {
          canvas.toBlob(blob => {
            if (!blob) return reject(new Error('Compression failed'))
            if (blob.size > maxSizeMB * 1024 * 1024 && quality > 0.4) {
              quality -= 0.1
              tryEncode()
            } else {
              resolve(new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' }))
            }
          }, 'image/jpeg', quality)
        }
        tryEncode()
      }
      img.onerror = reject
      img.src = URL.createObjectURL(file)
    })
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    if (f.size > 2 * 1024 * 1024) {
      toast.error('Image must be under 2 MB')
      e.target.value = ''
      return
    }
    setImagePreview(URL.createObjectURL(f))
    compressImage(f).then(compressed => setImageFile(compressed))
  }

  function extractStoragePath(url: string): string | null {
    // Extract path after /public/articles/ from the public URL
    const match = url.match(/\/public\/articles\/(.+)$/)
    return match ? match[1] : null
  }

  async function deleteOldImage(url: string) {
    const path = extractStoragePath(url)
    if (!path) return
    await supabase.storage.from(BUCKET).remove([path])
  }

  async function uploadImage(file: File): Promise<string> {
    const path = `covers/${Date.now()}.jpg`
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true, contentType: 'image/jpeg' })
    if (error) throw error
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
    return data.publicUrl
  }

  async function handleSave() {
    if (!title.trim()) return toast.error('Title is required')
    if (!content.trim()) return toast.error('Article content is required')
    const finalSlug = slug || toSlug(title)
    setSaving(true)
    try {
      let coverUrl: string | null = editing?.cover_image_url ?? null
      if (imageFile) {
        // Delete old image from storage before uploading replacement
        if (editing?.cover_image_url) await deleteOldImage(editing.cover_image_url)
        coverUrl = await uploadImage(imageFile)
      }

      const payload = {
        title: title.trim(),
        slug: finalSlug,
        content: content.trim(),
        cover_image_url: coverUrl,
        publisher_id: publisherId || null,
        is_published: isPublished,
        updated_by: user?.id,
      }

      if (editing) {
        const { error } = await supabase.from('articles').update(payload).eq('id', editing.id)
        if (error) throw error
        toast.success('Article updated')
      } else {
        const { error } = await supabase.from('articles').insert({ ...payload, created_by: user?.id })
        if (error) throw error
        toast.success('Article created')
      }

      setShowForm(false)
      fetchArticles()
    } catch (e: any) {
      toast.error(e.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  async function togglePublish(a: Article) {
    const { error } = await supabase.from('articles').update({ is_published: !a.is_published }).eq('id', a.id)
    if (error) return toast.error(error.message)
    toast.success(a.is_published ? 'Unpublished' : 'Published')
    fetchArticles()
  }

  async function handleDelete(a: Article) {
    if (!confirm(`Delete "${a.title}"? This cannot be undone.`)) return
    const { error } = await supabase.from('articles').delete().eq('id', a.id)
    if (error) return toast.error(error.message)
    if (a.cover_image_url) await deleteOldImage(a.cover_image_url)
    toast.success('Deleted')
    fetchArticles()
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Articles</h1>
          <p className="text-sm text-gray-500 mt-1">Write and publish articles visible on the public Articles page</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90">
          <Plus className="w-4 h-4" /> New Article
        </button>
      </div>

      {/* Article list */}
      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        {articles.length === 0 && (
          <div className="text-center py-16 text-gray-400">No articles yet. Create your first one.</div>
        )}
        {articles.map(a => (
          <div key={a.id} className="flex items-start gap-4 p-4">
            {a.cover_image_url ? (
              <img src={a.cover_image_url} alt="" className="w-20 h-14 object-cover rounded-lg flex-shrink-0" />
            ) : (
              <div className="w-20 h-14 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center text-gray-300 text-xs">No Image</div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-gray-900 truncate">{a.title}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${a.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {a.is_published ? 'Published' : 'Draft'}
                </span>
              </div>
              {a.slug && (
                <div className="flex items-center gap-1 mt-0.5">
                  <Link2 className="w-3 h-3 text-gray-400" />
                  <span className="text-xs text-gray-400 font-mono">/articles/{a.slug}</span>
                </div>
              )}
              <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{a.content}</p>
              <div className="text-xs text-gray-400 mt-1">
                {a.publisher?.full_name && <span>By {a.publisher.full_name} · </span>}
                {new Date(a.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button onClick={() => togglePublish(a)} title={a.is_published ? 'Unpublish' : 'Publish'}
                className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50">
                {a.is_published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <button onClick={() => openEdit(a)} className="p-2 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50">
                <Edit2 className="w-4 h-4" />
              </button>
              <button onClick={() => handleDelete(a)} className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl my-8 shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">{editing ? 'Edit Article' : 'New Article'}</h2>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Cover Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cover Image</label>
                <div
                  onClick={() => fileRef.current?.click()}
                  className="relative cursor-pointer border-2 border-dashed border-gray-300 rounded-xl overflow-hidden hover:border-primary transition-colors"
                >
                  {imagePreview ? (
                    <>
                      <img src={imagePreview} alt="" className="w-full object-contain max-h-44 bg-gray-50" />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <Upload className="w-6 h-6 text-white" />
                        <span className="text-white text-sm ml-2">Change Image</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-36 text-gray-400">
                      <Upload className="w-8 h-8 mb-2" />
                      <span className="text-sm">Click to upload cover image</span>
                    </div>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                <p className="text-xs text-gray-400 mt-1.5">Max file size: 2 MB · Will be compressed automatically</p>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title <span className="text-red-500">*</span></label>
                <input
                  value={title}
                  onChange={e => handleTitleChange(e.target.value)}
                  placeholder="Article title"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL Slug
                  <span className="ml-2 text-xs font-normal text-gray-400">Auto-generated from title · editable</span>
                </label>
                <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary">
                  <span className="px-3 py-2 bg-gray-50 text-xs text-gray-400 border-r border-gray-300 select-none whitespace-nowrap">/articles/</span>
                  <input
                    value={slug}
                    onChange={e => handleSlugChange(e.target.value)}
                    placeholder="article-url-slug"
                    className="flex-1 px-3 py-2 text-sm font-mono focus:outline-none bg-white"
                  />
                </div>
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Article Content <span className="text-red-500">*</span></label>
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="Write your article here..."
                  rows={10}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-y"
                />
              </div>

              {/* Publisher */}
              <MemberPicker members={members} value={publisherId} onChange={setPublisherId} />

              {/* Publish toggle */}
              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  onClick={() => setIsPublished(!isPublished)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${isPublished ? 'bg-primary' : 'bg-gray-300'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isPublished ? 'translate-x-5' : ''}`} />
                </div>
                <span className="text-sm font-medium text-gray-700">{isPublished ? 'Published (visible publicly)' : 'Draft (hidden)'}</span>
              </label>
            </div>

            <div className="flex justify-end gap-3 px-6 pb-6">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="px-5 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-60 flex items-center gap-2">
                {saving && <Spinner className="w-4 h-4" />}
                {editing ? 'Update Article' : 'Create Article'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
