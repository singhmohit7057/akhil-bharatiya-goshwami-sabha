import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Download, Crown, IndianRupee, Calendar } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { formatDate } from '../lib/utils'

import type { Donation } from '../types'
import { Spinner } from '../components/ui/Spinner'

const MEMBERSHIP_FEE = 1100

interface MembershipPayment {
  id: string
  amount: number
  donation_date: string
  payment_method: string | null
  transaction_id: string | null
  valid_until: string
}

function getExpiryDate(dateStr: string): string {
  const d = new Date(dateStr)
  d.setFullYear(d.getFullYear() + 1)
  return d.toISOString().split('T')[0]
}

function generateReceipt(donation: Donation, profileName: string, type: 'donation' | 'membership') {
  const receiptContent = `
════════════════════════════════════════════
      AKHIL BHARATIYA GOSWAMI SABHA
            PASCHIM BANGAL
════════════════════════════════════════════

  ${type === 'membership' ? 'MEMBERSHIP PAYMENT RECEIPT' : 'DONATION RECEIPT'}

────────────────────────────────────────────
  Receipt No    : ${donation.id.slice(0, 8).toUpperCase()}
  Date          : ${new Date(donation.donation_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
  Name          : ${profileName}
────────────────────────────────────────────

  Amount        : ₹${Number(donation.amount).toLocaleString('en-IN')}
  Purpose       : ${donation.purpose || 'General Donation'}
  Payment Mode  : ${donation.payment_method || 'N/A'}
  Transaction ID: ${donation.transaction_id || 'N/A'}
${type === 'membership' ? `  Valid Until   : ${new Date(getExpiryDate(donation.donation_date)).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}` : ''}

════════════════════════════════════════════
  This is a computer-generated receipt.
  Thank you for your contribution!
════════════════════════════════════════════
`
  const blob = new Blob([receiptContent], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `ABGSPB_${type === 'membership' ? 'Membership' : 'Donation'}_Receipt_${donation.id.slice(0, 8).toUpperCase()}.txt`
  a.click()
  URL.revokeObjectURL(url)
}

export function MyDonations() {
  const { t, i18n } = useTranslation('profile')
  const lang = i18n.language
  const { profile } = useAuth()
  const [donations, setDonations] = useState<Donation[]>([])
  const [membershipPayments, setMembershipPayments] = useState<MembershipPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'donations' | 'membership'>('donations')

  useEffect(() => {
    if (!profile) return
    supabase
      .from('donations')
      .select('*')
      .eq('user_id', profile.id)
      .order('donation_date', { ascending: false })
      .then(({ data }) => {
        const all = (data as Donation[]) || []
        const general = all.filter((d) => d.purpose !== 'Executive Membership')
        const membership = all
          .filter((d) => d.purpose === 'Executive Membership')
          .map((d) => ({
            id: d.id,
            amount: Number(d.amount),
            donation_date: d.donation_date,
            payment_method: d.payment_method,
            transaction_id: d.transaction_id,
            valid_until: getExpiryDate(d.donation_date),
          }))
        setDonations(general)
        setMembershipPayments(membership)
        setLoading(false)
      })
  }, [profile])

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  const totalDonations = donations.reduce((sum, d) => sum + Number(d.amount), 0)

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-1">
            <IndianRupee className="w-4 h-4 text-primary" />
            <p className="text-xs text-text-secondary">Total Donations</p>
          </div>
          <p className="text-xl font-bold text-text-primary">&#8377;{totalDonations.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-4 h-4 text-primary" />
            <p className="text-xs text-text-secondary">Contributions</p>
          </div>
          <p className="text-xl font-bold text-text-primary">{donations.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-1">
            <Crown className="w-4 h-4 text-amber-500" />
            <p className="text-xs text-text-secondary">Membership Payments</p>
          </div>
          <p className="text-xl font-bold text-text-primary">{membershipPayments.length}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setTab('donations')}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'donations' ? 'bg-primary text-white' : 'bg-white border border-border text-text-secondary hover:border-primary/30'
          }`}
        >
          Donations ({donations.length})
        </button>
        <button
          onClick={() => setTab('membership')}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
            tab === 'membership' ? 'bg-primary text-white' : 'bg-white border border-border text-text-secondary hover:border-primary/30'
          }`}
        >
          <Crown className="w-3.5 h-3.5" /> Membership History ({membershipPayments.length})
        </button>
      </div>

      {/* Donations Tab */}
      {tab === 'donations' && (
        <div className="bg-white rounded-xl border border-border p-5">
          <h2 className="text-base font-semibold text-text-primary mb-4">{t('donations.title')}</h2>

          {donations.length === 0 ? (
            <p className="text-text-secondary text-center py-8">{t('donations.noDonations')}</p>
          ) : (
            <div className="space-y-3">
              {donations.map((d) => (
                <div key={d.id} className="flex items-center justify-between p-4 bg-surface rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <IndianRupee className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-text-primary">&#8377;{Number(d.amount).toLocaleString()}</p>
                      <p className="text-xs text-text-secondary">
                        {d.purpose || 'General'} {d.payment_method ? `· ${d.payment_method}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-sm text-text-secondary">{formatDate(d.donation_date, lang)}</p>
                    <button
                      onClick={() => generateReceipt(d, profile?.full_name || '', 'donation')}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-primary border border-primary/30 rounded-lg hover:bg-primary/5 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" /> Receipt
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Membership History Tab */}
      {tab === 'membership' && (
        <div className="bg-white rounded-xl border border-border p-5">
          <h2 className="text-base font-semibold text-text-primary mb-2">Membership Payment History</h2>
          <p className="text-xs text-text-secondary mb-4">Executive membership fee: ₹{MEMBERSHIP_FEE.toLocaleString()} per year</p>

          {membershipPayments.length === 0 ? (
            <div className="text-center py-8">
              <Crown className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-text-secondary">No membership payments found.</p>
              <p className="text-xs text-text-secondary mt-1">Pay ₹{MEMBERSHIP_FEE.toLocaleString()} to become an Executive Member.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {membershipPayments.map((mp, _index) => {
                const isActive = new Date(mp.valid_until) >= new Date()
                return (
                  <div key={mp.id} className={`p-4 rounded-lg border ${isActive ? 'bg-amber-50/50 border-amber-200' : 'bg-surface border-transparent'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isActive ? 'bg-amber-100' : 'bg-gray-100'}`}>
                          <Crown className={`w-5 h-5 ${isActive ? 'text-amber-600' : 'text-gray-400'}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-text-primary">&#8377;{mp.amount.toLocaleString()}</p>
                            {isActive ? (
                              <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Active</span>
                            ) : (
                              <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">Expired</span>
                            )}
                          </div>
                          <p className="text-xs text-text-secondary mt-0.5">
                            {formatDate(mp.donation_date, lang)} → {formatDate(mp.valid_until, lang)}
                          </p>
                          <p className="text-xs text-text-secondary">
                            {mp.payment_method || 'Payment'} {mp.transaction_id ? `· ${mp.transaction_id}` : ''}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => generateReceipt(
                          { id: mp.id, user_id: profile?.id || '', amount: mp.amount, donation_date: mp.donation_date, purpose: 'Executive Membership', receipt_url: null, payment_method: mp.payment_method, transaction_id: mp.transaction_id, notes: null, recorded_by: null, created_at: mp.donation_date } as Donation,
                          profile?.full_name || '',
                          'membership',
                        )}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-primary border border-primary/30 rounded-lg hover:bg-primary/5 transition-colors shrink-0"
                      >
                        <Download className="w-3.5 h-3.5" /> Receipt
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
