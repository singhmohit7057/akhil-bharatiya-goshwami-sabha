import { useEffect, useState } from 'react'
import { Tv } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { SEO } from '../components/SEO'
import { Spinner } from '../components/ui/Spinner'

interface DarshanSlot {
  slot: number
  title: string | null
  youtube_url: string | null
  is_active: boolean
}

function extractYouTubeId(url: string): string | null {
  if (!url) return null
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/live\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
  ]
  for (const p of patterns) {
    const m = url.match(p)
    if (m) return m[1]
  }
  return null
}

export function LiveDarshan() {
  const [slots, setSlots] = useState<DarshanSlot[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('live_darshan')
      .select('slot, title, youtube_url, is_active')
      .eq('is_active', true)
      .not('youtube_url', 'is', null)
      .order('slot')
      .then(({ data }) => { setSlots((data as DarshanSlot[]) || []); setLoading(false) })
  }, [])

  const active = slots.filter(s => s.youtube_url)

  return (
    <>
      <SEO
        title="Live Darshan | Akhil Bharatiya Goswami Sabha Paschim Bangal"
        description="Watch live darshan from sacred temples and events organized by Akhil Bharatiya Goswami Sabha Paschim Bangal."
        canonical="/live-darshan"
      />
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Tv className="w-6 h-6 text-primary" />
            <span className="text-sm font-semibold text-primary tracking-widest uppercase">Live Streaming</span>
          </div>
          <h1 className="text-3xl font-extrabold text-text-primary">Live Darshan</h1>
          <p className="text-text-secondary mt-2 max-w-xl mx-auto">Watch live darshan from sacred temples and community events</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : active.length === 0 ? (
          <div className="text-center py-20">
            <Tv className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-text-secondary">No live streams available at the moment.</p>
            <p className="text-xs text-text-secondary mt-1">Please check back later.</p>
          </div>
        ) : (
          <div className={`grid gap-5 ${active.length === 1 ? 'grid-cols-1 max-w-2xl mx-auto' : active.length <= 4 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
            {active.map((slot) => {
              const videoId = extractYouTubeId(slot.youtube_url!)
              if (!videoId) return null
              return (
                <div key={slot.slot} className="bg-white rounded-xl border border-border overflow-hidden shadow-sm">
                  <div className="aspect-video">
                    <iframe
                      src={`https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0`}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title={slot.title || `Live Darshan ${slot.slot}`}
                      loading="lazy"
                    />
                  </div>
                  {slot.title && (
                    <div className="px-4 py-2.5 border-t border-border">
                      <p className="text-sm font-semibold text-text-primary">{slot.title}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
