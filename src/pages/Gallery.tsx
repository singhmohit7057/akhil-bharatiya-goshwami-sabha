import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Images, Camera } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { localized } from '../lib/utils'
import { Spinner } from '../components/ui/Spinner'

interface Album {
  id: string
  title_en: string
  title_hi: string | null
  cover_url: string | null
  created_at: string
  photo_count: number
}

export function Gallery() {
  const { i18n } = useTranslation()
  const lang = i18n.language
  const [albums, setAlbums] = useState<Album[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('gallery_albums')
      .select('*, gallery_photos(id)')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        const items = (data || []).map((a: any) => ({
          ...a,
          photo_count: a.gallery_photos?.length || 0,
        }))
        setAlbums(items)
        setLoading(false)
      })
  }, [])

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  return (
    <div>
      <section className="bg-surface py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm font-semibold text-primary tracking-widest uppercase mb-2">Memories</p>
          <h1 className="text-5xl font-extrabold text-text-primary">Photo Gallery</h1>
        </div>
      </section>
      <div className="max-w-3xl mx-auto"><hr className="border-border" /></div>

      <section className="max-w-6xl mx-auto px-4 py-10">
        {albums.length === 0 ? (
          <div className="text-center py-16">
            <Images className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-text-secondary">No albums yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {albums.map((album) => (
              <Link
                key={album.id}
                to={`/gallery/${(album as any).slug || album.id}`}
                className="bg-white rounded-xl border border-border overflow-hidden hover:shadow-lg transition-all group"
              >
                <div className="h-44 w-full overflow-hidden bg-gray-100">
                  {album.cover_url ? (
                    <img src={album.cover_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Camera className="w-10 h-10 text-gray-300" />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-sm font-semibold text-text-primary group-hover:text-primary transition-colors">
                    {localized(album.title_en, album.title_hi, lang)}
                  </h3>
                  <p className="text-xs text-text-secondary mt-1">{album.photo_count} photos</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
