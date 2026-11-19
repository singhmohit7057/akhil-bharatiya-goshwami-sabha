import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, User } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { SEO } from '../components/SEO'

interface Article {
  id: string
  title: string
  slug: string | null
  content: string
  cover_image_url: string | null
  created_at: string
  publisher?: { full_name: string } | null
}

export function Articles() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('articles')
      .select('id, title, slug, content, cover_image_url, created_at, publisher:profiles!articles_publisher_id_fkey(full_name)')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setArticles((data as unknown as Article[]) || [])
        setLoading(false)
      })
  }, [])

  return (
    <>
      <SEO
        title="Articles | Akhil Bharatiya Goswami Sabha Paschim Bangal"
        description="Read articles and news from Akhil Bharatiya Goswami Sabha Paschim Bangal community members."
        canonical="/articles"
      />

      {/* Hero */}
      <section className="bg-surface py-12 px-4 text-center border-b border-gray-100">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Articles</h1>
          <p className="text-gray-500">Insights, news, and stories from our community</p>
        </div>
      </section>

      <section className="py-12 px-4">
        <div className="max-w-5xl mx-auto">
          {loading && (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!loading && articles.length === 0 && (
            <div className="text-center py-20 text-gray-400">No articles published yet.</div>
          )}

          {!loading && articles.length > 0 && (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {articles.map(a => (
                <Link
                  key={a.id}
                  to={`/articles/${a.slug || a.id}`}
                  className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col"
                >
                  {a.cover_image_url ? (
                    <img src={a.cover_image_url} alt={a.title} className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-orange-50 to-amber-100 flex items-center justify-center">
                      <span className="text-4xl">📰</span>
                    </div>
                  )}
                  <div className="p-5 flex flex-col flex-1">
                    <h2 className="font-bold text-gray-900 text-lg leading-snug mb-2 group-hover:text-primary transition-colors line-clamp-2">{a.title}</h2>
                    <p className="text-gray-500 text-sm line-clamp-3 flex-1">{a.content}</p>
                    <div className="flex items-center gap-4 mt-4 text-xs text-gray-400">
                      {a.publisher?.full_name && (
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5" />
                          {a.publisher.full_name}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(a.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  )
}
