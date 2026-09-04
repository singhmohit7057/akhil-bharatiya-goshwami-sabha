import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export interface Designation {
  id: string
  name_en: string
  name_hi: string | null
  description: string | null
  slug: string
  is_admin_role: boolean
  sort_order: number
}

let cache: Designation[] | null = null

export function useDesignations() {
  const [designations, setDesignations] = useState<Designation[]>(cache || [])
  const [loading, setLoading] = useState(!cache)

  useEffect(() => {
    if (cache) return
    supabase
      .from('designations')
      .select('*')
      .order('sort_order')
      .then(({ data }) => {
        cache = (data as Designation[]) || []
        setDesignations(cache)
        setLoading(false)
      })
  }, [])

  function getLabel(slug: string, lang = 'en'): string {
    const d = designations.find((x) => x.slug === slug)
    if (!d) return slug.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    return lang === 'hi' && d.name_hi ? d.name_hi : d.name_en
  }

  function invalidateCache() {
    cache = null
  }

  return { designations, loading, getLabel, invalidateCache }
}
