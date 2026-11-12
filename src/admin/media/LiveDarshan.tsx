import { useEffect, useState } from 'react'
import { Tv, Save, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'
import { Spinner } from '../../components/ui/Spinner'

interface DarshanSlot {
  id: string
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

export function LiveDarshanAdmin() {
  const [slots, setSlots] = useState<DarshanSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<number | null>(null)
  const [edits, setEdits] = useState<Record<number, { title: string; youtube_url: string }>>({})

  useEffect(() => {
    supabase.from('live_darshan').select('*').order('slot').then(({ data }) => {
      const rows = (data as DarshanSlot[]) || []
      setSlots(rows)
      const e: typeof edits = {}
      rows.forEach(r => { e[r.slot] = { title: r.title || '', youtube_url: r.youtube_url || '' } })
      setEdits(e)
      setLoading(false)
    })
  }, [])

  async function saveSlot(slot: number) {
    setSaving(slot)
    const edit = edits[slot]
    const { error } = await supabase.from('live_darshan').update({
      title: edit.title || null,
      youtube_url: edit.youtube_url || null,
      updated_at: new Date().toISOString(),
    }).eq('slot', slot)
    if (error) { toast.error('Failed to save'); setSaving(null); return }
    setSlots(prev => prev.map(s => s.slot === slot ? { ...s, title: edit.title || null, youtube_url: edit.youtube_url || null } : s))
    setSaving(null)
    toast.success(`Slot ${slot} saved`)
  }

  async function toggleSlot(slot: number, current: boolean) {
    await supabase.from('live_darshan').update({ is_active: !current }).eq('slot', slot)
    setSlots(prev => prev.map(s => s.slot === slot ? { ...s, is_active: !current } : s))
    toast.success(`Slot ${slot} ${!current ? 'activated' : 'deactivated'}`)
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Tv className="w-6 h-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Live Darshan</h1>
          <p className="text-sm text-text-secondary mt-0.5">Manage up to 12 live YouTube streams</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {slots.map((slot) => {
          const edit = edits[slot.slot] || { title: '', youtube_url: '' }
          const videoId = extractYouTubeId(edit.youtube_url)
          return (
            <div key={slot.slot} className={`bg-white rounded-xl border p-3 ${slot.is_active ? 'border-border' : 'border-dashed border-gray-300 opacity-60'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Slot {slot.slot}</span>
                <button onClick={() => toggleSlot(slot.slot, slot.is_active)}
                  className={`p-1 rounded transition-colors ${slot.is_active ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-50'}`}>
                  {slot.is_active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Preview */}
              {videoId ? (
                <div className="aspect-video rounded-lg overflow-hidden bg-gray-100 mb-2">
                  <iframe src={`https://www.youtube.com/embed/${videoId}`} className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen title={`Slot ${slot.slot}`} />
                </div>
              ) : (
                <div className="aspect-video rounded-lg bg-gray-100 flex items-center justify-center mb-2">
                  <p className="text-[10px] text-gray-400">No video</p>
                </div>
              )}

              <div className="space-y-1.5">
                <input type="text" placeholder="Title" value={edit.title}
                  onChange={e => setEdits(prev => ({ ...prev, [slot.slot]: { ...prev[slot.slot], title: e.target.value } }))}
                  className="w-full px-2 py-1.5 border border-border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/30" />
                <input type="url" placeholder="YouTube URL" value={edit.youtube_url}
                  onChange={e => setEdits(prev => ({ ...prev, [slot.slot]: { ...prev[slot.slot], youtube_url: e.target.value } }))}
                  className="w-full px-2 py-1.5 border border-border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/30" />
                <button onClick={() => saveSlot(slot.slot)} disabled={saving === slot.slot}
                  className="w-full flex items-center justify-center gap-1 py-1.5 bg-primary text-white rounded-lg text-xs font-medium hover:bg-primary-dark disabled:opacity-50 transition-colors">
                  <Save className="w-3 h-3" />
                  {saving === slot.slot ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
