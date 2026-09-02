import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { CheckCircle, XCircle, User, Shield, Calendar, MapPin, Gem, Search } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { getRoleLabel, formatDate } from '../lib/utils'
import type { Profile } from '../types'
import { Spinner } from '../components/ui/Spinner'

export function VerifyMember() {
  const { memberId } = useParams()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(!!memberId)
  const [notFound, setNotFound] = useState(false)
  const [searchId, setSearchId] = useState('')

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!searchId.trim()) return
    navigate(`/verify/${encodeURIComponent(searchId.trim())}`)
  }

  useEffect(() => {
    if (!memberId) { setLoading(false); return }
    setLoading(true)
    setNotFound(false)
    setProfile(null)

    const decodedId = decodeURIComponent(memberId)

    supabase
      .from('profiles')
      .select('*')
      .eq('member_id', decodedId)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          setNotFound(true)
        } else {
          setProfile(data as Profile)
        }
        setLoading(false)
      })
  }, [memberId])

  if (!memberId && !loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">Verify Member</h1>
          <p className="text-sm text-text-secondary mb-6">
            Enter a membership ID to verify if someone is a registered member of Akhil Bharatiya Goshwami Sabha.
          </p>
          <form onSubmit={handleSearch} className="flex gap-2 mb-4">
            <input
              type="text"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              placeholder="e.g. ABGSPB/0001"
              className="flex-1 px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm"
            />
            <button
              type="submit"
              className="px-5 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
            >
              Verify
            </button>
          </form>
          <p className="text-xs text-text-secondary">
            You can find the membership ID on the member's ID card or profile page.
          </p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-4">
          <XCircle className="w-10 h-10 text-red-400" />
        </div>
        <h1 className="text-2xl font-bold text-text-primary mb-2">Member Not Found</h1>
        <p className="text-text-secondary max-w-md mb-2">
          No member found with ID <strong className="font-mono">{decodeURIComponent(memberId || '')}</strong>
        </p>
        <p className="text-sm text-text-secondary mb-6">
          The member ID may be incorrect or the membership may have been revoked.
        </p>
        <Link to="/" className="px-6 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors">
          Go to Homepage
        </Link>
      </div>
    )
  }

  const isActive = profile.account_status === 'active'

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Verification badge */}
        <div className="text-center mb-6">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-3 ${isActive ? 'bg-green-50' : 'bg-red-50'}`}>
            {isActive ? (
              <CheckCircle className="w-10 h-10 text-green-500" />
            ) : (
              <XCircle className="w-10 h-10 text-red-400" />
            )}
          </div>
          <h1 className="text-xl font-bold text-text-primary">
            {isActive ? 'Verified Member' : 'Inactive Member'}
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Akhil Bharatiya Goshwami Sabha, Paschim Bangal
          </p>
        </div>

        {/* Member card */}
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          {/* Saffron header */}
          <div className="bg-gradient-to-r from-[#FF9933] to-[#e8702a] px-6 py-4 flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center overflow-hidden shrink-0">
              {profile.profile_photo_url ? (
                <img src={profile.profile_photo_url} alt="" className="w-16 h-16 rounded-full object-cover" />
              ) : (
                <User className="w-8 h-8 text-white/70" />
              )}
            </div>
            <div className="text-white">
              <p className="text-lg font-bold leading-tight">{profile.full_name}</p>
              {profile.full_name_hi && <p className="text-sm text-white/80">{profile.full_name_hi}</p>}
              <p className="text-xs font-medium text-white/90 mt-0.5">{getRoleLabel(profile.role)}</p>
            </div>
          </div>

          {/* Details */}
          <div className="px-6 py-5 space-y-3">
            <div className="flex items-center justify-between p-3 bg-surface rounded-lg">
              <span className="text-xs text-text-secondary">Member ID</span>
              <span className="text-sm font-mono font-bold text-text-primary">{profile.member_id}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-surface rounded-lg">
              <span className="text-xs text-text-secondary flex items-center gap-1"><Shield className="w-3 h-3" /> Status</span>
              <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                {isActive ? 'Active' : 'Inactive'}
              </span>
            </div>

            {profile.is_executive_member && (
              <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200">
                <span className="text-xs text-amber-700 flex items-center gap-1"><Shield className="w-3 h-3" /> Executive Member</span>
                <span className="text-xs font-bold text-amber-700">★ Yes</span>
              </div>
            )}

            {profile.gotra && (
              <div className="flex items-center justify-between p-3 bg-surface rounded-lg">
                <span className="text-xs text-text-secondary flex items-center gap-1"><Gem className="w-3 h-3" /> Gotra</span>
                <span className="text-sm font-medium text-text-primary">{profile.gotra}</span>
              </div>
            )}

            {profile.city && (
              <div className="flex items-center justify-between p-3 bg-surface rounded-lg">
                <span className="text-xs text-text-secondary flex items-center gap-1"><MapPin className="w-3 h-3" /> City</span>
                <span className="text-sm font-medium text-text-primary">{profile.city}{profile.state ? `, ${profile.state}` : ''}</span>
              </div>
            )}

            {profile.created_at && (
              <div className="flex items-center justify-between p-3 bg-surface rounded-lg">
                <span className="text-xs text-text-secondary flex items-center gap-1"><Calendar className="w-3 h-3" /> Member Since</span>
                <span className="text-sm font-medium text-text-primary">{formatDate(profile.created_at, 'en')}</span>
              </div>
            )}
          </div>

          {/* Green footer */}
          <div className="bg-gradient-to-r from-[#1a6b3c] to-[#138808] px-6 py-3 text-center">
            <p className="text-[10px] text-white/80">
              Verified by Akhil Bharatiya Goshwami Sabha, Paschim Bangal
            </p>
            <p className="text-[9px] text-white/60 mt-0.5">akhilbharatiyagoswami.com</p>
          </div>
        </div>
      </div>
    </div>
  )
}
