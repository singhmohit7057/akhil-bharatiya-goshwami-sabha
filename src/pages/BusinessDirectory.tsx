import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, MapPin, Phone, Globe, Mail, Building2, CreditCard, LogIn } from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { localized } from '../lib/utils'
import type { BusinessListing } from '../types'

export function BusinessDirectory() {
  const { t, i18n } = useTranslation('directory')
  const lang = i18n.language
  const { user, loading: authLoading } = useAuth()
  const [listings, setListings] = useState<BusinessListing[]>([])
  const [ownerNames, setOwnerNames] = useState<Record<string, string>>({})
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [viewBranches, setViewBranches] = useState<string | null>(null)
  const [viewCard, setViewCard] = useState<string | null>(null)

  useEffect(() => {
    supabase
      .from('business_directory')
      .select('*, profiles(full_name)')
      .eq('is_approved', true)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        const items = (data || []) as (BusinessListing & { profiles?: { full_name: string } })[]
        setListings(items)
        const cats = [...new Set(items.map((i) => i.category).filter(Boolean))]
        setCategories(cats)
        const names: Record<string, string> = {}
        items.forEach((item) => {
          if (item.profiles?.full_name) names[item.id] = item.profiles.full_name
        })
        setOwnerNames(names)
        setLoading(false)
      })
  }, [])

  const filtered = listings.filter((item) => {
    const matchSearch =
      !search ||
      item.business_name.toLowerCase().includes(search.toLowerCase()) ||
      item.description_en?.toLowerCase().includes(search.toLowerCase())
    const matchCategory = !category || item.category === category
    return matchSearch && matchCategory
  })

  return (
    <div>
      <section className="bg-surface py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm font-semibold text-primary tracking-widest uppercase mb-3">{t('tagline')}</p>
          <h1 className="text-5xl font-extrabold text-text-primary mb-2">{t('title')}</h1>
          <p className="text-text-secondary">{t('subtitle')}</p>
        </div>
      </section>
      <div className="max-w-3xl mx-auto"><hr className="border-border" /></div>

      {!authLoading && !user && (
        <div className="max-w-md mx-auto px-4 py-16 text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <LogIn className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-text-primary mb-2">Login to View Business Directory</h2>
          <p className="text-sm text-text-secondary mb-6">
            Please login to explore businesses and professionals from the Goswami community.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/login" className="px-6 py-2.5 bg-primary text-white rounded-lg font-medium text-sm hover:bg-primary-dark transition-colors">
              Login
            </Link>
            <Link to="/register" className="px-6 py-2.5 border border-border text-text-secondary rounded-lg font-medium text-sm hover:bg-gray-50 transition-colors">
              Register
            </Link>
          </div>
        </div>
      )}

      {(authLoading || user) && <section className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-4 py-2.5 border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="">{t('allCategories')}</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="text-center py-20 text-text-secondary">{t('common:buttons.loading')}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-text-secondary">{t('noListings')}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((item) => (
              <div key={item.id} className="bg-white rounded-xl border border-border p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3 mb-3">
                  {item.logo_url ? (
                    <img src={item.logo_url} alt="" className="w-12 h-12 rounded-lg object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                      {item.business_name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-text-primary">{item.business_name}</h3>
                    {ownerNames[item.id] && (
                      <p className="text-xs text-text-secondary mb-1">by {ownerNames[item.id]}</p>
                    )}
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{item.category}</span>
                  </div>
                </div>
                <p className="text-sm text-text-secondary mb-3 line-clamp-2">
                  {localized(item.description_en, item.description_hi, lang)}
                </p>
                <div className="space-y-1 text-xs text-text-secondary">
                  {item.city && (
                    <p className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {item.city}{item.state ? `, ${item.state}` : ''}</p>
                  )}
                  {item.phone && (
                    <p className="flex items-center gap-1"><Phone className="w-3 h-3" /> {item.phone}</p>
                  )}
                  {(item as any).email && (
                    <p className="flex items-center gap-1"><Mail className="w-3 h-3" /> {(item as any).email}</p>
                  )}
                  {item.website && (
                    <a href={item.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                      <Globe className="w-3 h-3" /> {t('website')}
                    </a>
                  )}
                </div>
                {(((item as any).branches?.length > 0) || (item as any).visiting_card_front) && (
                  <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                    {(item as any).branches?.length > 0 && (
                      <button onClick={() => setViewBranches(viewBranches === item.id ? null : item.id)} className="flex items-center gap-1 text-xs text-primary hover:underline">
                        <Building2 className="w-3 h-3" /> Branches ({(item as any).branches.length})
                      </button>
                    )}
                    {(item as any).visiting_card_front && (
                      <button onClick={() => setViewCard(viewCard === item.id ? null : item.id)} className="flex items-center gap-1 text-xs text-primary hover:underline">
                        <CreditCard className="w-3 h-3" /> Visiting Card
                      </button>
                    )}
                  </div>
                )}
                {viewBranches === item.id && (item as any).branches?.length > 0 && (
                  <div className="mt-3 space-y-1.5">
                    {(item as any).branches.map((b: any, i: number) => (
                      <div key={b.id || i} className="bg-surface rounded-lg p-2.5 text-xs">
                        <p className="font-medium text-text-primary">{b.name}</p>
                        <p className="text-text-secondary">{b.address}{b.city ? `, ${b.city}` : ''}{b.phone ? ` · ${b.phone}` : ''}</p>
                      </div>
                    ))}
                  </div>
                )}
                {viewCard === item.id && (
                  <div className="mt-3 space-y-2">
                    {(item as any).visiting_card_front && (
                      <img src={(item as any).visiting_card_front} alt="Front" className="w-full rounded-lg border border-border" />
                    )}
                    {(item as any).visiting_card_back && (
                      <img src={(item as any).visiting_card_back} alt="Back" className="w-full rounded-lg border border-border" />
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>}
    </div>
  )
}
