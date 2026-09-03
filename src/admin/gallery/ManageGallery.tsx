import { useEffect, useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { Plus, Trash2, X, Images, Upload, Camera } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { localized } from '../../lib/utils'
import { Spinner } from '../../components/ui/Spinner'

interface Album {
  id: string
  title_en: string
  title_hi: string | null
  cover_url: string | null
  created_at: string
  photo_count: number
}

interface Photo {
  id: string
  photo_url: string
  caption: string | null
}

export function ManageGallery() {
  const { i18n } = useTranslation()
  const lang = i18n.language
  const { user } = useAuth()
  const [albums, setAlbums] = useState<Album[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ title_en: '', title_hi: '', description: '' })

  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchAlbums()
  }, [])

  async function fetchAlbums() {
    const { data } = await supabase
      .from('gallery_albums')
      .select('*, gallery_photos(id)')
      .order('created_at', { ascending: false })
    const items = (data || []).map((a: any) => ({
      ...a,
      photo_count: a.gallery_photos?.length || 0,
    }))
    setAlbums(items)
    setLoading(false)
  }

  async function handleCreateAlbum(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase.from('gallery_albums').insert({
      title_en: form.title_en,
      title_hi: form.title_hi || null,
      description: form.description || null,
      created_by: user?.id,
    })
    if (error) { toast.error('Failed to create album'); setSaving(false); return }
    toast.success('Album created')
    setForm({ title_en: '', title_hi: '', description: '' })
    setShowForm(false)
    setSaving(false)
    fetchAlbums()
  }

  async function handleDeleteAlbum(albumId: string) {
    if (!confirm('Delete this album and all its photos?')) return
    await supabase.from('gallery_albums').delete().eq('id', albumId)
    toast.success('Album deleted')
    if (selectedAlbum?.id === albumId) { setSelectedAlbum(null); setPhotos([]) }
    fetchAlbums()
  }

  async function openAlbum(album: Album) {
    setSelectedAlbum(album)
    const { data } = await supabase.from('gallery_photos').select('*').eq('album_id', album.id).order('created_at', { ascending: false })
    setPhotos((data as Photo[]) || [])
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || !selectedAlbum) return
    setUploading(true)

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (file.size > 5 * 1024 * 1024) { toast.error(`${file.name} is over 5MB, skipped`); continue }
      const ext = file.name.split('.').pop()
      const path = `${selectedAlbum.id}/${crypto.randomUUID()}.${ext}`
      const { error: uploadError } = await supabase.storage.from('gallery').upload(path, file)
      if (uploadError) { toast.error(`Failed to upload ${file.name}`); continue }
      const { data: urlData } = supabase.storage.from('gallery').getPublicUrl(path)

      await supabase.from('gallery_photos').insert({
        album_id: selectedAlbum.id,
        photo_url: urlData.publicUrl,
      })

      if (i === 0 && !selectedAlbum.cover_url) {
        await supabase.from('gallery_albums').update({ cover_url: urlData.publicUrl }).eq('id', selectedAlbum.id)
      }
    }

    toast.success(`${files.length} photo(s) uploaded`)
    setUploading(false)
    openAlbum(selectedAlbum)
    fetchAlbums()
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleDeletePhoto(photoId: string) {
    if (!confirm('Delete this photo?')) return
    await supabase.from('gallery_photos').delete().eq('id', photoId)
    toast.success('Photo deleted')
    if (selectedAlbum) openAlbum(selectedAlbum)
    fetchAlbums()
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  const inputClass = 'w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30'

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Gallery</h1>
          <p className="text-sm text-text-secondary mt-1">Manage photo albums</p>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark">
            <Plus className="w-4 h-4" /> New Album
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-border p-5 mb-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-semibold text-text-primary">Create Album</h3>
            <button onClick={() => setShowForm(false)}><X className="w-4 h-4 text-text-secondary" /></button>
          </div>
          <form onSubmit={handleCreateAlbum} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">Title *</label>
              <input type="text" required value={form.title_en} onChange={(e) => setForm({ ...form, title_en: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} placeholder="Brief description about this album..." className={inputClass} />
            </div>
            <button type="submit" disabled={saving} className="px-5 py-2 bg-primary text-white rounded-lg text-xs font-medium hover:bg-primary-dark disabled:opacity-50">
              {saving ? '...' : 'Create Album'}
            </button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Albums list */}
        <div className="lg:col-span-1 space-y-2">
          {albums.length === 0 ? (
            <div className="bg-white rounded-xl border border-border p-6 text-center">
              <Images className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-xs text-text-secondary">No albums yet</p>
            </div>
          ) : (
            albums.map((album) => (
              <div
                key={album.id}
                onClick={() => openAlbum(album)}
                className={`bg-white rounded-xl border p-3 flex items-center gap-3 cursor-pointer transition-colors ${
                  selectedAlbum?.id === album.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'
                }`}
              >
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                  {album.cover_url ? (
                    <img src={album.cover_url} alt="" className="w-12 h-12 object-cover" />
                  ) : (
                    <div className="w-12 h-12 flex items-center justify-center"><Camera className="w-5 h-5 text-gray-300" /></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{localized(album.title_en, album.title_hi, lang)}</p>
                  <p className="text-xs text-text-secondary">{album.photo_count} photos</p>
                </div>
                <button onClick={(e) => { e.stopPropagation(); handleDeleteAlbum(album.id) }} className="p-1.5 text-text-secondary hover:text-red-500 shrink-0">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Photos panel */}
        <div className="lg:col-span-2">
          {selectedAlbum ? (
            <div className="bg-white rounded-xl border border-border p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-text-primary">{localized(selectedAlbum.title_en, selectedAlbum.title_hi, lang)}</h3>
                <label className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg text-xs font-medium hover:bg-primary-dark cursor-pointer">
                  <Upload className="w-3.5 h-3.5" /> {uploading ? 'Uploading...' : 'Upload Photos'}
                  <input ref={fileRef} type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" disabled={uploading} />
                </label>
              </div>
              {photos.length === 0 ? (
                <p className="text-center py-10 text-xs text-text-secondary">No photos yet. Upload some!</p>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {photos.map((photo) => (
                    <div key={photo.id} className="relative aspect-square rounded-lg overflow-hidden group">
                      <img src={photo.photo_url} alt="" className="w-full h-full object-cover" />
                      <button
                        onClick={() => handleDeletePhoto(photo.id)}
                        className="absolute top-1 right-1 p-1 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-border p-10 text-center">
              <Images className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-text-secondary">Select an album to manage photos</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
