import { useEffect, useState } from 'react'
import { BookOpen, FileText, Download } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Spinner } from '../components/ui/Spinner'

interface SouvenirItem {
  id: string
  title: string
  event_name: string | null
  year: number
  pdf_url: string
  cover_url: string | null
}

export function Souvenirs() {
  const [items, setItems] = useState<SouvenirItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('souvenirs')
      .select('*')
      .neq('pdf_url', '')
      .order('year', { ascending: false })
      .then(({ data }) => {
        setItems((data as SouvenirItem[]) || [])
        setLoading(false)
      })
  }, [])

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  return (
    <div>
      <section className="bg-surface py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm font-semibold text-primary tracking-widest uppercase mb-2">Publications</p>
          <h1 className="text-5xl font-extrabold text-text-primary">Souvenirs</h1>
          <p className="text-sm text-text-secondary mt-2">Browse our event magazines and booklets</p>
        </div>
      </section>
      <div className="max-w-3xl mx-auto"><hr className="border-border" /></div>

      <section className="max-w-6xl mx-auto px-4 py-10">
        {items.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-text-secondary">No souvenirs available yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <div key={item.id} className="bg-white rounded-xl border border-border overflow-hidden hover:shadow-lg transition-shadow">
                <div className="h-48 bg-gray-100 flex items-center justify-center overflow-hidden">
                  {item.cover_url ? (
                    <img src={item.cover_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <FileText className="w-14 h-14 text-gray-300" />
                  )}
                </div>
                <div className="p-5">
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">{item.year}</span>
                  <h3 className="text-sm font-semibold text-text-primary mt-2">{item.title}</h3>
                  {item.event_name && <p className="text-xs text-text-secondary mt-1">{item.event_name}</p>}
                  <a
                    href={item.pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
                  >
                    <Download className="w-4 h-4" /> View / Download
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
