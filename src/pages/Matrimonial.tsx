import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { User, GraduationCap, Briefcase, MapPin, LogIn } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { localized, calculateAge } from '../lib/utils'
import type { MatrimonialProfile, Profile } from '../types'

interface MatrimonialWithProfile extends MatrimonialProfile {
  profiles: Profile
}

export function Matrimonial() {
  const { t, i18n } = useTranslation('matrimonial')
  const lang = i18n.language
  const { user, loading: authLoading } = useAuth()
  const [profiles, setProfiles] = useState<MatrimonialWithProfile[]>([])
  const [genderFilter, setGenderFilter] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('matrimonial_profiles')
      .select('*, profiles(*), matrimonial_photos(*)')
      .eq('is_active', true)
      .eq('is_approved', true)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setProfiles((data as MatrimonialWithProfile[]) || [])
        setLoading(false)
      })
  }, [])

  const filtered = profiles.filter((p) => {
    const gender = (p as any).candidate_gender || p.profiles?.gender
    if (genderFilter && gender !== genderFilter) return false
    return true
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
          <h2 className="text-xl font-bold text-text-primary mb-2">{t('loginGate.title')}</h2>
          <p className="text-sm text-text-secondary mb-6">{t('loginGate.subtitle')}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/login" className="px-6 py-2.5 bg-primary text-white rounded-lg font-medium text-sm hover:bg-primary-dark transition-colors">
              {t('loginGate.login')}
            </Link>
            <Link to="/register" className="px-6 py-2.5 border border-border text-text-secondary rounded-lg font-medium text-sm hover:bg-gray-50 transition-colors">
              {t('loginGate.register')}
            </Link>
          </div>
        </div>
      )}

      {(authLoading || user) && <section className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex gap-3 mb-8">
          <select
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value)}
            className="px-4 py-2.5 border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="">{t('filters.all')}</option>
            <option value="male">{t('common:labels.male')}</option>
            <option value="female">{t('common:labels.female')}</option>
          </select>
        </div>

        {loading ? (
          <div className="text-center py-20 text-text-secondary">{t('common:buttons.loading')}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-text-secondary">{t('noProfiles')}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((mp) => (
              <Link
                key={mp.id}
                to={`/matrimonial/${(mp as any).profile_code ? (mp as any).profile_code.replace('/', '-') : mp.id}`}
                className="bg-white rounded-xl border border-border overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                      {(mp as any).matrimonial_photos?.[0]?.photo_url ? (
                        <img src={(mp as any).matrimonial_photos[0].photo_url} alt="" className="w-16 h-16 rounded-full object-cover" />
                      ) : (
                        <User className="w-8 h-8 text-primary" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-text-primary">{(mp as any).candidate_name || mp.profiles?.full_name}</h3>
                      {((mp as any).date_of_birth || mp.profiles?.date_of_birth) && (
                        <p className="text-sm text-text-secondary">{calculateAge((mp as any).date_of_birth || mp.profiles?.date_of_birth)} years</p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2 text-sm text-text-secondary">
                    {mp.education && (
                      <p className="flex items-center gap-2"><GraduationCap className="w-4 h-4" /> {mp.education}</p>
                    )}
                    {mp.occupation && (
                      <p className="flex items-center gap-2"><Briefcase className="w-4 h-4" /> {mp.occupation}</p>
                    )}
                    {mp.profiles?.city && (
                      <p className="flex items-center gap-2"><MapPin className="w-4 h-4" /> {mp.profiles.city}</p>
                    )}
                  </div>
                  <p className="text-sm text-text-secondary mt-3 line-clamp-2">
                    {localized(mp.about_en, mp.about_hi, lang)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>}
    </div>
  )
}
