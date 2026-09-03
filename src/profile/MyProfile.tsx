import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { User, Mail, Phone, MapPin, Calendar, Shield, Gem, UserCircle, Download } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { toPng } from 'html-to-image'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { formatDate, getRoleLabel } from '../lib/utils'

import type { FamilyMember, BusinessDetail } from '../types'
import { Spinner } from '../components/ui/Spinner'

export function MyProfile() {
  const { t, i18n } = useTranslation('profile')
  const lang = i18n.language
  const { profile, loading: authLoading } = useAuth()
  const [family, setFamily] = useState<FamilyMember[]>([])
  const [business, setBusiness] = useState<BusinessDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return
    Promise.all([
      supabase.from('family_members').select('*').eq('user_id', profile.id),
      supabase.from('business_details').select('*').eq('user_id', profile.id).maybeSingle(),
    ]).then(([famRes, bizRes]) => {
      if (famRes.data) setFamily(famRes.data as FamilyMember[])
      if (bizRes.data) setBusiness(bizRes.data as BusinessDetail)
      setLoading(false)
    })
  }, [profile])

  if (authLoading || loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  if (!profile) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-border p-5">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
            {profile.profile_photo_url ? (
              <img src={profile.profile_photo_url} alt="" className="w-20 h-20 rounded-full object-cover" />
            ) : (
              <User className="w-10 h-10 text-primary" />
            )}
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary">{profile.full_name}</h1>
            <div className="flex flex-wrap gap-2 mt-1">
              <span className="text-xs bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-medium">
                {getRoleLabel(profile.role)}
              </span>
              {profile.is_executive_member && (
                <span className="text-xs bg-amber-50 text-amber-600 px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1">
                  <Shield className="w-3 h-3" /> Executive Member
                </span>
              )}
            </div>
            <p className="text-xs text-text-secondary mt-1.5 flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Member since {formatDate(profile.created_at, lang)}
            </p>
          </div>
        </div>
      </div>

      {/* PVC ID Card */}
      <div className="bg-white rounded-xl border border-border p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-text-primary">Member ID Card</h2>
          <button
            onClick={async () => {
              const card = document.getElementById('id-card')
              if (!card) return
              try {
                const dataUrl = await toPng(card, {
                  pixelRatio: 4,
                  quality: 1,
                })
                const link = document.createElement('a')
                link.download = `ABGSPB_ID_Card_${(profile?.member_id || 'member').replace(/\//g, '-')}.png`
                link.href = dataUrl
                link.click()
              } catch {
                alert('Failed to download. Please try again.')
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary border border-primary/30 rounded-lg hover:bg-primary/5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> Download Card
          </button>
        </div>

        <div className="flex justify-center">
          <div id="id-card" className="w-[420px] rounded-2xl overflow-hidden shadow-xl" style={{ aspectRatio: '85.6/54' }}>
            <div className="h-full flex flex-col relative bg-white">
              {/* Saffron top band */}
              <div className="h-[52px] bg-gradient-to-r from-[#FF9933] to-[#e8702a] px-5 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5">
                  <img src="/logo.png" alt="" className="w-9 h-9 rounded-full object-contain bg-white/20 p-0.5" />
                  <div>
                    <p className="text-[10px] font-bold text-white tracking-wide leading-tight">AKHIL BHARATIYA GOSWAMI SABHA</p>
                    <p className="text-[8px] text-white/80 tracking-wider">PASCHIM BANGAL</p>
                  </div>
                </div>
              </div>

              {/* White body */}
              <div className="flex-1 px-5 py-3 flex gap-4">
                {/* Photo with saffron border */}
                <div className="w-[76px] h-[92px] rounded-lg border-2 border-[#FF9933] flex items-center justify-center overflow-hidden shrink-0 bg-gray-50">
                  {profile.profile_photo_url ? (
                    <img src={profile.profile_photo_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-8 h-8 text-gray-300" />
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <p className="text-[14px] font-bold text-gray-900 leading-tight truncate">{profile.full_name}</p>
                    {profile.full_name_hi && (
                      <p className="text-[11px] text-gray-500 truncate">{profile.full_name_hi}</p>
                    )}
                    <p className="text-[10px] font-semibold text-[#FF9933] mt-0.5">{getRoleLabel(profile.role)}</p>
                    <div className="mt-1 flex gap-4">
                      <div>
                        <p className="text-[7px] text-gray-400 uppercase tracking-wide">Membership ID</p>
                        <p className="text-[10px] font-mono font-bold text-gray-700">{profile.member_id || 'PENDING'}</p>
                      </div>
                      <div>
                        <p className="text-[7px] text-gray-400 uppercase tracking-wide">Member Since</p>
                        <p className="text-[10px] font-semibold text-gray-700">{profile.created_at ? formatDate(profile.created_at, lang) : ''}</p>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 mt-1">
                    {profile.gotra && (
                      <div>
                        <p className="text-[7px] text-gray-400 uppercase">Gotra</p>
                        <p className="text-[9px] font-semibold text-gray-700">{profile.gotra}</p>
                      </div>
                    )}
                    {profile.city && (
                      <div>
                        <p className="text-[7px] text-gray-400 uppercase">City</p>
                        <p className="text-[9px] font-semibold text-gray-700">{profile.city}</p>
                      </div>
                    )}
                    {profile.phone && (
                      <div>
                        <p className="text-[7px] text-gray-400 uppercase">Phone</p>
                        <p className="text-[9px] font-semibold text-gray-700">{profile.phone}</p>
                      </div>
                    )}
                    {profile.date_of_birth && (
                      <div>
                        <p className="text-[7px] text-gray-400 uppercase">DOB</p>
                        <p className="text-[9px] font-semibold text-gray-700">{formatDate(profile.date_of_birth, lang)}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* QR Code */}
                <div className="flex flex-col items-center justify-center shrink-0">
                  <div className="rounded border border-gray-200 p-1 bg-white">
                    <QRCodeSVG
                      value={`https://akhilbharatiyagoswami.com/verify/${encodeURIComponent(profile.member_id || profile.id)}`}
                      size={52}
                      level="M"
                      fgColor="#1a6b3c"
                    />
                  </div>
                  <p className="text-[6px] text-gray-400 mt-0.5">Scan to verify</p>
                </div>
              </div>

              {/* Green bottom band */}
              <div className="h-[28px] bg-gradient-to-r from-[#1a6b3c] to-[#138808] px-5 flex items-center justify-between shrink-0">
                {profile.is_executive_member && (
                  <span className="text-[7px] bg-white/20 text-white px-2.5 py-0.5 rounded-full font-bold tracking-widest uppercase">
                    ★ Executive Member ★
                  </span>
                )}
                {!profile.is_executive_member && (
                  <span className="text-[7px] text-white/70">
                    Member Since {profile.created_at ? formatDate(profile.created_at, lang).split(' ').slice(0, 3).join(' ') : ''}
                  </span>
                )}
                <p className="text-[7px] text-white/70 font-medium">akhilbharatiyagoswami.com</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Personal Info */}
      <div className="bg-white rounded-xl border border-border p-5">
        <h2 className="font-semibold text-text-primary mb-4">{t('personalInfo')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <InfoRow icon={Mail} label={t('common:labels.email')} value={profile.email} />
          <InfoRow icon={Phone} label={t('common:labels.phone')} value={profile.phone} />
          <InfoRow icon={MapPin} label={t('common:labels.city')} value={[profile.city, profile.state].filter(Boolean).join(', ')} />
          <InfoRow icon={Calendar} label={t('common:labels.dateOfBirth')} value={profile.date_of_birth ? formatDate(profile.date_of_birth, lang) : null} />
          <InfoRow icon={Gem} label={t('common:labels.gotra')} value={profile.gotra} />
          <InfoRow icon={UserCircle} label={t('common:labels.gender')} value={profile.gender ? t(`common:labels.${profile.gender}`) : null} />
          {profile.address && <InfoRow icon={MapPin} label={t('common:labels.address')} value={`${profile.address}${profile.pincode ? ` - ${profile.pincode}` : ''}`} />}
        </div>
      </div>

      {/* Family */}
      {family.length > 0 && (
        <div className="bg-white rounded-xl border border-border p-5">
          <h2 className="font-semibold text-text-primary mb-4">{t('familyMembers.title')}</h2>
          <div className="space-y-2">
            {family.map((fm) => (
              <div key={fm.id} className="flex items-center justify-between p-3 bg-surface rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
                    {fm.photo_url ? (
                      <img src={fm.photo_url} alt="" className="w-9 h-9 rounded-full object-cover" />
                    ) : (
                      <User className="w-4 h-4 text-primary" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">{fm.name}</p>
                    <p className="text-xs text-text-secondary capitalize">{fm.relation}</p>
                  </div>
                </div>
                {fm.occupation && <p className="text-xs text-text-secondary">{fm.occupation}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Business */}
      {business && (
        <div className="bg-white rounded-xl border border-border p-5">
          <h2 className="font-semibold text-text-primary mb-4">{t('businessDetails.title')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            {business.is_employed ? (
              <>
                <InfoRow label={t('businessDetails.employerName')} value={business.employer_name} />
                <InfoRow label={t('businessDetails.designation')} value={business.designation} />
              </>
            ) : (
              <>
                <InfoRow label={t('businessDetails.businessName')} value={business.business_name} />
                <InfoRow label={t('businessDetails.sector')} value={business.sector} />
              </>
            )}
            <InfoRow label={t('businessDetails.location')} value={business.location} />
          </div>
        </div>
      )}
    </div>
  )
}

function InfoRow({ icon: Icon, label, value }: { icon?: React.ElementType; label: string; value: string | null | undefined }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-2">
      {Icon && <Icon className="w-4 h-4 text-text-secondary mt-0.5" />}
      <div>
        <p className="text-xs text-text-secondary">{label}</p>
        <p className="text-text-primary">{value}</p>
      </div>
    </div>
  )
}
