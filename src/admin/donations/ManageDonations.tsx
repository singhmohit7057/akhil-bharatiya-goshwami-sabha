import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { formatDate } from '../../lib/utils'
import type { Donation, Profile } from '../../types'
import { Spinner } from '../../components/ui/Spinner'

interface DonationWithProfile extends Donation {
  profiles: Pick<Profile, 'full_name' | 'email'>
}

export function ManageDonations() {
  const { t, i18n } = useTranslation('admin')
  const lang = i18n.language
  const { isSuperAdmin } = useAuth()
  const superAdmin = isSuperAdmin()
  const [donations, setDonations] = useState<DonationWithProfile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('donations')
      .select('*, profiles(full_name, email)')
      .order('donation_date', { ascending: false })
      .then(({ data }) => {
        setDonations((data as DonationWithProfile[]) || [])
        setLoading(false)
      })
  }, [])

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  const totalAmount = donations.reduce((sum, d) => sum + Number(d.amount), 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{t('donations.title')}</h1>
          <p className="text-sm text-text-secondary mt-1">Total: ₹{totalAmount.toLocaleString()} from {donations.length} donations</p>
        </div>
        {superAdmin && (
          <Link to="/admin/donations/add" className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark">
            <Plus className="w-4 h-4" /> {t('donations.record')}
          </Link>
        )}
      </div>

      {donations.length === 0 ? (
        <div className="bg-white rounded-xl border border-border p-8 text-center text-text-secondary">{t('common:labels.noData')}</div>
      ) : (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-gray-50 text-left">
                  <th className="px-4 py-3 font-medium text-text-secondary">Member</th>
                  <th className="px-4 py-3 font-medium text-text-secondary">{t('donations.amount')}</th>
                  <th className="px-4 py-3 font-medium text-text-secondary">{t('donations.date')}</th>
                  <th className="px-4 py-3 font-medium text-text-secondary">{t('donations.purpose')}</th>
                  <th className="px-4 py-3 font-medium text-text-secondary">Payment</th>
                </tr>
              </thead>
              <tbody>
                {donations.map((d) => (
                  <tr key={d.id} className="border-b border-border/50">
                    <td className="px-4 py-3 text-text-primary font-medium">{d.profiles?.full_name}</td>
                    <td className="px-4 py-3 text-text-primary font-semibold">&#8377;{Number(d.amount).toLocaleString()}</td>
                    <td className="px-4 py-3 text-text-secondary">{formatDate(d.donation_date, lang)}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-gray-100 text-text-secondary px-2 py-0.5 rounded-full">{d.purpose || '—'}</span>
                    </td>
                    <td className="px-4 py-3 text-text-secondary text-xs">{d.payment_method || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
