import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { localized } from '../lib/utils'
import { Spinner } from '../components/ui/Spinner'

interface Album {
  id: string
  title_en: string
  title_hi: string | null
  description: string | null
}

interface Photo {
  id: string
  photo_url: string
  caption: string | null
  created_at: string
}

export function GalleryAlbum() {
  const { id } = useParams()
  const { i18n } = useTranslation()
  const lang = i18n.language
  const [album, setAlbum] = useState<Album | null>(null)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [lightbox, setLightbox] = useState<number | null>(null)

  useEffect(() => {
    if (!id) return
    Promise.all([
      supabase.from('gallery_albums').select('*').eq('id', id).single(),
      supabase.from('gallery_photos').select('*').eq('album_id', id).order('created_at', { ascending: false }),
    ]).then(([albumRes, photosRes]) => {
      if (albumRes.data) setAlbum(albumRes.data as Album)
      setPhotos((photosRes.data as Photo[]) || [])
      setLoading(false)
    })
  }, [id])

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  if (!album) return <div className="text-center py-20 text-text-secondary">Album not found</div>

  return (
    <div>
      <section className="bg-surface py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <Link to="/gallery" className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-primary mb-4">
            <ArrowLeft className="w-4 h-4" /> Back to Gallery
          </Link>
          <h1 className="text-5xl font-extrabold text-text-primary mb-2">{localized(album.title_en, album.title_hi, lang)}</h1>
          {album.description && (
            <p className="text-sm text-text-secondary mb-2">{album.description}</p>
          )}
          <p className="text-xs text-text-secondary">{photos.length} photos</p>
        </div>
      </section>
      <div className="max-w-3xl mx-auto"><hr className="border-border" /></div>

      <section className="max-w-6xl mx-auto px-4 py-10">
        {photos.length === 0 ? (
          <p className="text-center py-16 text-sm text-text-secondary">No photos in this album yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {photos.map((photo, i) => (
              <div
                key={photo.id}
                onClick={() => setLightbox(i)}
                className="aspect-square rounded-xl overflow-hidden cursor-pointer group"
              >
                <img src={photo.photo_url} alt={photo.caption || ''} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              </div>
            ))}
          </div>
        )}
      </section>

      {lightbox !== null && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <button className="absolute top-4 right-4 text-white/80 hover:text-white">
            <X className="w-6 h-6" />
          </button>
          <div className="max-w-4xl max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
            <img src={photos[lightbox].photo_url} alt="" className="max-w-full max-h-[80vh] object-contain rounded-lg" />
            {photos[lightbox].caption && (
              <p className="text-center text-white/80 text-sm mt-3">{photos[lightbox].caption}</p>
            )}
            <div className="flex justify-center gap-4 mt-4">
              <button
                onClick={() => setLightbox(lightbox > 0 ? lightbox - 1 : photos.length - 1)}
                className="px-4 py-2 bg-white/10 text-white rounded-lg text-sm hover:bg-white/20"
              >
                ← Prev
              </button>
              <span className="text-white/60 text-sm py-2">{lightbox + 1} / {photos.length}</span>
              <button
                onClick={() => setLightbox(lightbox < photos.length - 1 ? lightbox + 1 : 0)}
                className="px-4 py-2 bg-white/10 text-white rounded-lg text-sm hover:bg-white/20"
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
