import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Calendar, User, ArrowLeft } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { SEO } from '../components/SEO'

interface Article {
  id: string
  title: string
  content: string
  cover_image_url: string | null
  created_at: string
  publisher?: { full_name: string; profile_photo_url?: string | null } | null
}

export function ArticleDetail() {
  const { id } = useParams<{ id: string }>()
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!id) return
    // Try slug first, fall back to UUID
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
    const query = supabase
      .from('articles')
      .select('*, publisher:profiles!articles_publisher_id_fkey(full_name, profile_photo_url)')
      .eq('is_published', true)
    const q = isUuid ? query.eq('id', id) : query.eq('slug', id)
    q.single().then(({ data, error }) => {
      if (error || !data) setNotFound(true)
      else setArticle(data as Article)
      setLoading(false)
    })
  }, [id])

  if (loading) return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (notFound || !article) return (
    <div className="text-center py-24 text-gray-400">
      <p className="text-lg mb-4">Article not found.</p>
      <Link to="/articles" className="text-primary hover:underline text-sm">← Back to Articles</Link>
    </div>
  )

  return (
    <>
      <SEO
        title={`${article.title} | Akhil Bharatiya Goswami Sabha`}
        description={article.content.slice(0, 160)}
        canonical={`/articles/${article.id}`}
      />

      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Back */}
        <Link to="/articles" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary mb-6 group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to Articles
        </Link>

        {/* Cover */}
        {article.cover_image_url && (
          <img
            src={article.cover_image_url}
            alt={article.title}
            className="w-full h-72 object-cover rounded-2xl mb-8 shadow-sm"
          />
        )}

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 leading-tight mb-4">{article.title}</h1>

        {/* Meta */}
        <div className="flex items-center gap-5 text-sm text-gray-400 mb-8 pb-6 border-b border-gray-100">
          {article.publisher && (
            <span className="flex items-center gap-1.5">
              {article.publisher.profile_photo_url ? (
                <img src={article.publisher.profile_photo_url} alt="" className="w-6 h-6 rounded-full object-cover" />
              ) : (
                <User className="w-4 h-4" />
              )}
              <span className="text-gray-600 font-medium">{article.publisher.full_name}</span>
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            {new Date(article.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
        </div>

        {/* Content — preserve line breaks */}
        <div className="text-gray-700 leading-relaxed text-base whitespace-pre-wrap">
          {article.content}
        </div>
      </div>
    </>
  )
}
