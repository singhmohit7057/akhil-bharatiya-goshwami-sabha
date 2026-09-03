import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Crown, Calendar, CheckCircle, XCircle, Clock, ArrowRight, IndianRupee } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'

import { formatDate } from '../lib/utils'
import type { Donation } from '../types'
import { Spinner } from '../components/ui/Spinner'

const MEMBERSHIP_FEE = 1100

interface MembershipData {
  is_active: boolean
  paid_on: string | null
  valid_from: string | null
  valid_until: string | null
  payment_history: Donation[]
}

export function Membership() {
  const { i18n } = useTranslation()
  const lang = i18n.language
  const { profile } = useAuth()
  const [data, setData] = useState<MembershipData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return

    supabase
      .from('donations')
      .select('*')
      .eq('user_id', profile.id)
      .eq('purpose', 'Executive Membership')
      .order('donation_date', { ascending: false })
      .then(({ data: donations }) => {
        const history = (donations as Donation[]) || []
        const latestPayment = history.length > 0 ? history[0] : null
        const paidOn = latestPayment?.donation_date || null
        const validFrom = (profile as any).membership_start_date || paidOn
        const validUntil = (profile as any).membership_end_date || (validFrom ? (() => { const d = new Date(validFrom); d.setFullYear(d.getFullYear() + 1); return d.toISOString().split('T')[0] })() : null)
        const isActive = profile.is_executive_member && validUntil ? new Date(validUntil) >= new Date() : false

        setData({
          is_active: isActive,
          paid_on: paidOn,
          valid_from: validFrom,
          valid_until: validUntil,
          payment_history: history,
        })
        setLoading(false)
      })
  }, [profile])

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  if (!data || !profile) return null

  const isExpired = data.valid_until ? new Date(data.valid_until) < new Date() : false
  const daysRemaining = data.valid_until ? Math.ceil((new Date(data.valid_until).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0
  const neverPaid = data.payment_history.length === 0

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <div className={`rounded-xl border p-6 ${
        data.is_active
          ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200'
          : 'bg-white border-border'
      }`}>
        <div className="flex items-start gap-3">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${
            data.is_active ? 'bg-amber-100' : 'bg-gray-100'
          }`}>
            <Crown className={`w-7 h-7 ${data.is_active ? 'text-amber-600' : 'text-gray-400'}`} />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-text-primary">Executive Membership</h2>
            <div className="flex items-center gap-2 mt-1.5">
              {data.is_active ? (
                <span className="flex items-center gap-1.5 text-sm font-medium text-green-700 bg-green-50 px-3 py-1 rounded-full">
                  <CheckCircle className="w-4 h-4" /> Active
                </span>
              ) : isExpired ? (
                <span className="flex items-center gap-1.5 text-sm font-medium text-red-600 bg-red-50 px-3 py-1 rounded-full">
                  <XCircle className="w-4 h-4" /> Expired
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  <XCircle className="w-4 h-4" /> Not Active
                </span>
              )}
            </div>
            {data.is_active && daysRemaining > 0 && (
              <p className="text-sm text-text-secondary mt-2 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {daysRemaining} days remaining
              </p>
            )}
            <p className="text-xs text-text-secondary mt-2">
              One-time annual fee of <strong>₹{MEMBERSHIP_FEE.toLocaleString()}</strong> · Valid for 1 year from start date
            </p>
          </div>
        </div>
      </div>

      {/* Validity Period — only if paid at least once */}
      {data.valid_from && data.valid_until && (
        <div className="bg-white rounded-xl border border-border p-5">
          <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" /> Membership Period
          </h3>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-surface rounded-lg p-4 text-center">
              <p className="text-xs text-text-secondary mb-1">Starts From</p>
              <p className="text-sm font-semibold text-text-primary">{formatDate(data.valid_from, lang)}</p>
            </div>
            <ArrowRight className="w-5 h-5 text-text-secondary shrink-0" />
            <div className="flex-1 bg-surface rounded-lg p-4 text-center">
              <p className="text-xs text-text-secondary mb-1">Expires On</p>
              <p className={`text-sm font-semibold ${isExpired ? 'text-red-600' : 'text-text-primary'}`}>
                {formatDate(data.valid_until, lang)}
                {isExpired && <span className="block text-xs font-normal text-red-500 mt-0.5">Membership expired</span>}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Payment History */}
      {data.payment_history.length > 0 && (
        <div className="bg-white rounded-xl border border-border p-5">
          <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
            <IndianRupee className="w-4 h-4 text-primary" /> Payment History
          </h3>
          <div className="space-y-2">
            {data.payment_history.map((d, index) => (
              <div key={d.id} className="flex items-center justify-between p-4 bg-surface rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    index === 0 && !isExpired ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {data.payment_history.length - index}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">₹{Number(d.amount).toLocaleString()}</p>
                    <p className="text-xs text-text-secondary">
                      {d.payment_method || 'Payment'} {d.transaction_id ? `· ${d.transaction_id}` : ''}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-text-primary">{formatDate(d.donation_date, lang)}</p>
                  <p className="text-xs text-text-secondary">
                    {index === 0 && !isExpired ? 'Current' : 'Previous'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTA — Pay / Renew */}
      {(!data.is_active || isExpired) && (
        <div className="bg-gradient-to-r from-primary to-primary-dark rounded-xl p-6 text-white">
          <div className="flex items-start gap-3">
            <div className="w-16 h-16 bg-white/15 rounded-xl flex flex-col items-center justify-center shrink-0">
              <IndianRupee className="w-6 h-6" />
              <p className="text-xs font-bold mt-0.5">{MEMBERSHIP_FEE.toLocaleString()}</p>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-1">
                {isExpired ? 'Renew Your Membership' : neverPaid ? 'Become an Executive Member' : 'Reactivate Membership'}
              </h3>
              <p className="text-sm text-white/80 mb-4">
                {isExpired
                  ? `Your membership expired on ${formatDate(data.valid_until!, lang)}. Pay ₹${MEMBERSHIP_FEE.toLocaleString()} to renew for another year.`
                  : `Pay a one-time fee of ₹${MEMBERSHIP_FEE.toLocaleString()} to become an Executive Member. Membership starts from the date of payment and is valid for 1 year.`
                }
              </p>
            </div>
          </div>

          <div className="bg-white/10 rounded-lg p-4 mt-4 mb-4">
            <p className="text-sm font-medium mb-2">Executive Member Benefits:</p>
            <ul className="text-sm text-white/80 space-y-1.5">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                Access to Matrimonial section
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                Priority event invitations
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                Executive member badge on profile
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                Voting rights in community decisions
              </li>
            </ul>
          </div>

          <div className="bg-white/10 rounded-lg p-4">
            <p className="text-sm font-medium mb-1">How to Pay:</p>
            <p className="text-sm text-white/80">
              Contact the administration or visit your nearest community office. Payment can be made via UPI, bank transfer, or cash. Your membership will be activated once the payment is confirmed by an admin.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
