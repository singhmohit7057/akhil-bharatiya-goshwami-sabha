import { useEffect, useState } from 'react'
import { Gift } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { formatDate } from '../../lib/utils'
import type { Donation, Profile } from '../../types'
import { Spinner } from '../../components/ui/Spinner'

interface SouvenirDonation extends Donation {
  profiles: Pick<Profile, 'full_name' | 'email' | 'phone'>
}

export function Souvenir() {
  const [donations, setDonations] = useState<SouvenirDonation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchDonations() }, [])

  async function fetchDonations() {
    const { data } = await supabase
      .from('donations')
      .select('*, profiles(full_name, email, phone)')
      .eq('purpose', 'souvenir')
      .order('donation_date', { ascending: false })
    setDonations((data as SouvenirDonation[]) || [])
    setLoading(false)
  }

  const total = donations.reduce((sum, d) => sum + Number(d.amount), 0)

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Souvenir</h1>
          <p className="text-sm text-text-secondary mt-1">Track souvenir-related contributions and sponsors</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-border p-5">
          <p className="text-sm text-text-secondary">Total Contributions</p>
          <p className="text-2xl font-bold text-text-primary">&#8377;{total.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-5">
          <p className="text-sm text-text-secondary">Contributors</p>
          <p className="text-2xl font-bold text-text-primary">{donations.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-5">
          <p className="text-sm text-text-secondary">Average</p>
          <p className="text-2xl font-bold text-text-primary">&#8377;{donations.length ? Math.round(total / donations.length).toLocaleString() : 0}</p>
        </div>
      </div>

      {/* List */}
      {donations.length === 0 ? (
        <div className="bg-white rounded-xl border border-border p-8 text-center text-text-secondary">
          <Gift className="w-8 h-8 mx-auto mb-2 opacity-40" />
          No souvenir contributions recorded yet. Record donations with purpose "souvenir" to see them here.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-gray-50 text-left">
                  <th className="px-4 py-3 font-medium text-text-secondary">Contributor</th>
                  <th className="px-4 py-3 font-medium text-text-secondary">Amount</th>
                  <th className="px-4 py-3 font-medium text-text-secondary">Date</th>
                  <th className="px-4 py-3 font-medium text-text-secondary">Contact</th>
                </tr>
              </thead>
              <tbody>
                {donations.map((d) => (
                  <tr key={d.id} className="border-b border-border/50 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-text-primary">{d.profiles?.full_name}</td>
                    <td className="px-4 py-3 text-text-primary">&#8377;{Number(d.amount).toLocaleString()}</td>
                    <td className="px-4 py-3 text-text-secondary">{formatDate(d.donation_date, 'en')}</td>
                    <td className="px-4 py-3 text-text-secondary">{d.profiles?.phone || d.profiles?.email}</td>
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
