import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, User, Users, ImageIcon } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { localized, calculateAge } from '../lib/utils'
import type { Profile, FamilyMember } from '../types'
import { Spinner } from '../components/ui/Spinner'

export function MatrimonialDetail() {
  const { id } = useParams()
  const { t, i18n } = useTranslation('matrimonial')
  const lang = i18n.language
  const [mp, setMp] = useState<any>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [family, setFamily] = useState<FamilyMember[]>([])
  const [photos, setPhotos] = useState<string[]>([])
  const [enlargedPhoto, setEnlargedPhoto] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return

    const code = id!.replace('-', '/')
    const isCode = code.startsWith('MAT/')
    let query = supabase.from('matrimonial_profiles').select('*, matrimonial_photos(*)')
    query = isCode ? query.eq('profile_code', code) : query.eq('id', id)
    query.single()
      .then(async ({ data }) => {
        if (!data) { setLoading(false); return }
        setMp(data)
        const allPhotos = (data.matrimonial_photos || []).sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        setPhotos(allPhotos.slice(1).map((p: any) => p.photo_url))
        const { data: prof } = await supabase.from('profiles').select('*').eq('id', data.user_id).single()
        if (prof) setProfile(prof as Profile)
        const { data: fam } = await supabase.from('family_members').select('*').eq('user_id', data.user_id)
        if (fam) setFamily(fam as FamilyMember[])
        setLoading(false)
      })
  }, [id])

  function getRelationFromPerspective(parentRelation: string, _candidateGender: string | null, memberGender?: string | null): string {
    const isMemberFemale = memberGender === 'female'
    const map: Record<string, string> = {
      father: 'Grandfather',
      mother: 'Grandmother',
      spouse: isMemberFemale ? 'Mother' : 'Father',
      son: 'Brother',
      daughter: 'Sister',
      brother: 'Uncle',
      sister: 'Aunt',
      grandfather: 'Great Grandfather',
      grandmother: 'Great Grandmother',
      other: 'Relative',
    }
    return map[parentRelation] || parentRelation
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Spinner size="lg" /></div>
  if (!mp) return <div className="text-center py-20 text-text-secondary">Profile not found</div>

  const candidateName = mp.candidate_name || profile?.full_name || ''
  const candidateDob = mp.date_of_birth || profile?.date_of_birth
  const candidateGotra = mp.gotra || profile?.gotra
  const candidateCity = mp.city || profile?.city
  const allPhotos = (mp.matrimonial_photos || []).sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  const candidatePhoto = allPhotos[0]?.photo_url || null

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <Link to="/matrimonial" className="flex items-center gap-1 text-sm text-primary hover:underline mb-6">
        <ArrowLeft className="w-4 h-4" /> {t('common:buttons.back')}
      </Link>

      <div className="bg-white rounded-xl border border-border p-6 md:p-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
            {candidatePhoto ? (
              <img src={candidatePhoto} alt="" className="w-20 h-20 rounded-full object-cover" />
            ) : (
              <User className="w-10 h-10 text-primary" />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">{candidateName}</h1>
            {candidateDob && <p className="text-sm text-text-secondary">{calculateAge(candidateDob)} years</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-6">
          {candidateGotra && <div className="bg-surface rounded-lg p-3"><p className="text-text-secondary">Gotra</p><p className="text-sm font-medium text-text-primary">{candidateGotra}</p></div>}
          {candidateDob && <div className="bg-surface rounded-lg p-3"><p className="text-text-secondary">Date of Birth</p><p className="text-sm font-medium text-text-primary">{new Date(candidateDob).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p></div>}
          {mp.height && <div className="bg-surface rounded-lg p-3"><p className="text-text-secondary">Height</p><p className="text-sm font-medium text-text-primary">{mp.height}</p></div>}
          <div className="bg-surface rounded-lg p-3"><p className="text-text-secondary">Status</p><p className="text-sm font-medium text-text-primary capitalize">{mp.marital_status}</p></div>
          {mp.education && <div className="bg-surface rounded-lg p-3"><p className="text-text-secondary">Education</p><p className="text-sm font-medium text-text-primary">{mp.education}</p></div>}
          {mp.occupation && <div className="bg-surface rounded-lg p-3"><p className="text-text-secondary">Occupation</p><p className="text-sm font-medium text-text-primary">{mp.occupation}</p></div>}
          {mp.income_range && <div className="bg-surface rounded-lg p-3"><p className="text-text-secondary">Income</p><p className="text-sm font-medium text-text-primary">{mp.income_range}</p></div>}
          {candidateCity && <div className="bg-surface rounded-lg p-3"><p className="text-text-secondary">City</p><p className="text-sm font-medium text-text-primary">{candidateCity}</p></div>}
        </div>

        {(mp.about_en || mp.about_hi) && (
          <div className="mb-6">
            <h2 className="font-semibold text-text-primary mb-2">{t('profile.about')}</h2>
            <p className="text-text-secondary whitespace-pre-wrap">{localized(mp.about_en, mp.about_hi, lang)}</p>
          </div>
        )}

        {(mp.preferences_en || mp.preferences_hi) && (
          <div className="mb-6">
            <h2 className="font-semibold text-text-primary mb-2">{t('profile.preferences')}</h2>
            <p className="text-text-secondary whitespace-pre-wrap">{localized(mp.preferences_en, mp.preferences_hi, lang)}</p>
          </div>
        )}

        {photos.length > 0 && (
          <div className="mb-6">
            <h2 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-primary" /> Photos ({photos.length}/5)
            </h2>
            <div className="grid grid-cols-5 gap-3">
              {Array.from({ length: 5 }).map((_, i) => (
                photos[i] ? (
                  <button
                    key={i}
                    onClick={() => setEnlargedPhoto(photos[i])}
                    className="w-full aspect-square rounded-xl overflow-hidden border border-border hover:shadow-lg hover:scale-105 transition-all cursor-pointer"
                  >
                    <img src={photos[i]} alt="" className="w-full h-full object-cover" />
                  </button>
                ) : (
                  <div key={i} className="w-full aspect-square rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center bg-gray-50">
                    <ImageIcon className="w-5 h-5 text-gray-300" />
                  </div>
                )
              ))}
            </div>
          </div>
        )}

        {/* Enlarged photo modal */}
        {enlargedPhoto && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setEnlargedPhoto(null)}>
            <div className="relative max-w-2xl max-h-[85vh]">
              <img src={enlargedPhoto} alt="" className="max-w-full max-h-[85vh] rounded-2xl object-contain" />
              <button
                onClick={() => setEnlargedPhoto(null)}
                className="absolute -top-3 -right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg text-text-primary hover:bg-gray-100 text-sm font-bold"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {(family.length > 0 || profile) && (
          <div>
            <h2 className="font-semibold text-text-primary mb-1 flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" /> Family Details
            </h2>
            <p className="text-xs text-text-secondary mb-3">Relationship from {candidateName}'s perspective</p>
            <div className="space-y-2">
              {/* Parent (the user who created the listing) */}
              {profile && (
                <div className="flex items-center justify-between p-3 bg-surface rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                      {profile.full_name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">{profile.full_name}</p>
                      <p className="text-xs text-primary font-medium">{profile.gender === 'female' ? 'Mother' : 'Father'}</p>
                    </div>
                  </div>
                </div>
              )}
              {family
                .filter((fm) => fm.name !== candidateName)
                .map((fm) => {
                  const rel = getRelationFromPerspective(fm.relation, mp.candidate_gender || profile?.gender, fm.gender)
                  return (
                    <div key={fm.id} className="flex items-center justify-between p-3 bg-surface rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                          {fm.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-text-primary">{fm.name}</p>
                          <p className="text-xs text-primary font-medium capitalize">{rel}</p>
                        </div>
                      </div>
                      {fm.occupation && (
                        <p className="text-xs text-text-secondary">{fm.occupation}</p>
                      )}
                    </div>
                  )
                })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
