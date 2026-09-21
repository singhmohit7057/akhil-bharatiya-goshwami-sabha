import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { User, GraduationCap, Briefcase, MapPin, LogIn, Heart } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { SEO } from '../components/SEO'
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
    <>
    <SEO
      title="Matrimonial | Akhil Bharatiya Goswami Sabha Paschim Bangal"
      description="Browse matrimonial profiles of Goswami community members on Akhil Bharatiya Goswami Sabha Paschim Bangal. For executive members only."
      canonical="/matrimonial"
      noindex={true}
    />
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
            <option value="">All</option>
            <option value="male">Groom</option>
            <option value="female">Bride</option>
          </select>
        </div>

        {loading ? (
          <div className="text-center py-20 text-text-secondary">{t('common:buttons.loading')}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-text-secondary">{t('noProfiles')}</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((mp) => {
              const photo = [...((mp as any).matrimonial_photos || [])].sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())[0]?.photo_url
              const name = (mp as any).candidate_name || mp.profiles?.full_name || ''
              const dob = (mp as any).date_of_birth || mp.profiles?.date_of_birth
              const age = dob ? calculateAge(dob) : null
              const city = (mp as any).city || mp.profiles?.city
              const gender = (mp as any).candidate_gender || mp.profiles?.gender
              const profileCode = (mp as any).profile_code
              const href = `/matrimonial/${profileCode ? profileCode.replace('/', '-') : mp.id}`

              return (
                <Link key={mp.id} to={href} className="group bg-white rounded-2xl border border-border overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
                  {/* Photo */}
                  <div className="relative h-56 bg-gradient-to-br from-primary/20 to-primary/5 overflow-hidden">
                    {photo ? (
                      <img src={photo} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="w-16 h-16 text-primary/30" />
                      </div>
                    )}
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    {/* Name + age on photo */}
                    <div className="absolute bottom-3 left-4 right-4">
                      <h3 className="text-white font-bold text-lg leading-tight">{name}</h3>
                      {age && <p className="text-white/80 text-sm">{age} years</p>}
                    </div>
                    {/* Gender badge */}
                    {gender && (
                      <div className={`absolute top-3 right-3 px-2 py-1 rounded-full text-[10px] font-semibold flex items-center gap-1 ${
                        gender === 'female' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        <Heart className="w-3 h-3" />
                        {gender === 'female' ? 'Bride' : 'Groom'}
                      </div>
                    )}
                    {/* Profile code */}
                    {profileCode && (
                      <div className="absolute top-3 left-3 bg-black/40 text-white text-[10px] px-2 py-0.5 rounded-full font-medium">
                        {profileCode}
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="p-4 space-y-2">
                    {city && (
                      <p className="flex items-center gap-2 text-sm text-text-secondary">
                        <MapPin className="w-3.5 h-3.5 text-primary shrink-0" /> {city}
                      </p>
                    )}
                    {mp.education && (
                      <p className="flex items-center gap-2 text-sm text-text-secondary">
                        <GraduationCap className="w-3.5 h-3.5 text-primary shrink-0" /> {mp.education}
                      </p>
                    )}
                    {mp.occupation && (
                      <p className="flex items-center gap-2 text-sm text-text-secondary">
                        <Briefcase className="w-3.5 h-3.5 text-primary shrink-0" /> {mp.occupation}
                      </p>
                    )}
                    {(mp.about_en || mp.about_hi) && (
                      <p className="text-xs text-text-secondary line-clamp-2 pt-1 border-t border-border/50">
                        {localized(mp.about_en, mp.about_hi, lang)}
                      </p>
                    )}
                    <p className="text-xs text-primary font-medium pt-1 group-hover:underline">View Profile →</p>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </section>}
    </div>
    </>
  )
}
