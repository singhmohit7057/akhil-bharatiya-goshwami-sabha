import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import {
  UserCheck, Users, Calendar, IndianRupee, Crown, Briefcase, Heart,
  Plus, UserPlus, CalendarPlus, CreditCard, Store,
  Check, X, MapPin, Clock, User,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { formatDate } from '../lib/utils'
import type { Profile, Event, Donation } from '../types'

interface DonationWithProfile extends Donation {
  profiles: Pick<Profile, 'full_name'>
}

export function AdminDashboard() {
  const { t } = useTranslation('admin')
  const { user } = useAuth()
  const [stats, setStats] = useState({ pending: 0, total: 0, executive: 0, events: 0, donations: 0, businesses: 0, matrimonial: 0, newThisMonth: 0 })
  const [pendingMembers, setPendingMembers] = useState<Profile[]>([])
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([])
  const [recentPayments, setRecentPayments] = useState<DonationWithProfile[]>([])

  useEffect(() => {
    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)

    Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('account_status', 'pending_approval'),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('account_status', 'active'),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_executive_member', true),
      supabase.from('events').select('id', { count: 'exact', head: true }),
      supabase.from('donations').select('amount'),
      supabase.from('business_directory').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('matrimonial_profiles').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('profiles').select('*').eq('account_status', 'pending_approval').order('created_at', { ascending: false }).limit(5),
      supabase.from('events').select('*').gte('event_date', new Date().toISOString()).order('event_date', { ascending: true }).limit(3),
      supabase.from('donations').select('*, profiles!donations_user_id_fkey(full_name)').order('donation_date', { ascending: false }).limit(5),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('account_status', 'active').gte('created_at', monthStart.toISOString()),
    ]).then(([pendingRes, totalRes, execRes, eventsRes, donationsRes, bizRes, matRes, pendingList, eventList, paymentList, newMonthRes]) => {
      const totalDonations = (donationsRes.data || []).reduce((sum: number, d: { amount: number }) => sum + Number(d.amount), 0)
      setStats({
        pending: pendingRes.count || 0,
        total: totalRes.count || 0,
        executive: execRes.count || 0,
        events: eventsRes.count || 0,
        donations: totalDonations,
        businesses: bizRes.count || 0,
        matrimonial: matRes.count || 0,
        newThisMonth: newMonthRes.count || 0,
      })
      setPendingMembers((pendingList.data as Profile[]) || [])
      setUpcomingEvents((eventList.data as Event[]) || [])
      setRecentPayments((paymentList.data as DonationWithProfile[]) || [])
    })
  }, [])

  async function handleApprove(member: Profile) {
    const count = await supabase.from('profiles').select('member_id', { count: 'exact', head: true }).not('member_id', 'is', null)
    const nextNum = (count.count || 0) + 1
    const memberId = `ABGSPB/${String(nextNum).padStart(4, '0')}`

    const { error } = await supabase.from('profiles').update({
      account_status: 'active',
      member_id: memberId,
      approved_by: user?.id,
      approved_at: new Date().toISOString(),
    }).eq('id', member.id)

    if (error) { toast.error('Failed'); return }
    toast.success(`${member.full_name} approved`)
    setPendingMembers(pendingMembers.filter((m) => m.id !== member.id))
    setStats((s) => ({ ...s, pending: s.pending - 1, total: s.total + 1 }))
  }

  async function handleReject(member: Profile) {
    if (!confirm(`Reject ${member.full_name}?`)) return
    const { error } = await supabase.rpc('delete_user_completely', { user_id: member.id })
    if (error) { toast.error('Failed'); return }
    toast.success('Rejected')
    setPendingMembers(pendingMembers.filter((m) => m.id !== member.id))
    setStats((s) => ({ ...s, pending: s.pending - 1 }))
  }

  const statCards = [
    { icon: UserCheck, label: t('dashboard.pendingApprovals'), value: stats.pending, to: '/admin/members/pending', color: 'bg-amber-50 text-amber-600' },
    { icon: Users, label: t('dashboard.totalMembers'), value: stats.total, to: '/admin/members', color: 'bg-blue-50 text-blue-600' },
    { icon: Crown, label: 'Executive Members', value: stats.executive, to: '/admin/members', color: 'bg-orange-50 text-orange-600' },
    { icon: Calendar, label: t('dashboard.totalEvents'), value: stats.events, to: '/admin/yearly-planner', color: 'bg-green-50 text-green-600' },
    { icon: IndianRupee, label: t('dashboard.totalDonations'), value: `₹${stats.donations.toLocaleString()}`, to: '/admin/payments', color: 'bg-purple-50 text-purple-600' },
    { icon: Briefcase, label: 'Business Listings', value: stats.businesses, to: '/admin/business', color: 'bg-cyan-50 text-cyan-600' },
    { icon: Heart, label: 'Matrimonial Profiles', value: stats.matrimonial, to: '/admin/matrimonial', color: 'bg-pink-50 text-pink-600' },
    { icon: Plus, label: 'New This Month', value: stats.newThisMonth, to: '/admin/members', color: 'bg-emerald-50 text-emerald-600' },
  ]

  const quickActions = [
    { icon: UserPlus, label: 'Add Member', to: '/admin/members/add', color: 'text-blue-600' },
    { icon: CalendarPlus, label: 'Add Event', to: '/admin/yearly-planner/add', color: 'text-green-600' },
    { icon: CreditCard, label: 'Record Payment', to: '/admin/payments/add', color: 'text-purple-600' },
    { icon: Store, label: 'Add Business', to: '/admin/business/add', color: 'text-cyan-600' },
    { icon: Heart, label: 'Add Matrimonial', to: '/admin/matrimonial/add', color: 'text-pink-600' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary mb-6">{t('title')}</h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
        {statCards.map((card) => (
          <Link key={card.label} to={card.to} className="bg-white rounded-xl border border-border p-4 hover:shadow-md transition-shadow">
            <div className={`w-9 h-9 rounded-lg ${card.color} flex items-center justify-center mb-2`}>
              <card.icon className="w-4.5 h-4.5" />
            </div>
            <p className="text-xl font-bold text-text-primary">{card.value}</p>
            <p className="text-xs text-text-secondary">{card.label}</p>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-border p-4 mb-6">
        <h2 className="text-sm font-semibold text-text-primary mb-3">Quick Actions</h2>
        <div className="flex flex-wrap gap-2">
          {quickActions.map((action) => (
            <Link key={action.label} to={action.to} className="flex items-center gap-2 px-4 py-2.5 border border-border rounded-lg text-sm font-medium text-text-primary hover:border-primary/30 hover:bg-primary/5 transition-colors">
              <action.icon className={`w-4 h-4 ${action.color}`} />
              {action.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Registrations */}
        <div className="bg-white rounded-xl border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-text-primary">Pending Approvals</h2>
            <Link to="/admin/members/pending" className="text-xs text-primary hover:underline">View All</Link>
          </div>
          {pendingMembers.length === 0 ? (
            <p className="text-xs text-text-secondary text-center py-6">No pending approvals</p>
          ) : (
            <div className="space-y-2">
              {pendingMembers.map((m) => (
                <div key={m.id} className="flex items-center justify-between p-2.5 bg-surface rounded-lg">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      {m.profile_photo_url ? (
                        <img src={m.profile_photo_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <User className="w-4 h-4 text-primary" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-text-primary truncate">{m.full_name}</p>
                      <p className="text-[11px] text-text-secondary truncate">{m.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button onClick={() => handleApprove(m)} className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100" title="Approve">
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleReject(m)} className="p-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100" title="Reject">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Events */}
        <div className="bg-white rounded-xl border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-text-primary">Upcoming Events</h2>
            <Link to="/admin/yearly-planner" className="text-xs text-primary hover:underline">View All</Link>
          </div>
          {upcomingEvents.length === 0 ? (
            <p className="text-xs text-text-secondary text-center py-6">No upcoming events</p>
          ) : (
            <div className="space-y-2">
              {upcomingEvents.map((event) => {
                const d = new Date(event.event_date)
                return (
                  <Link key={event.id} to={`/events/${event.id}`} className="flex items-center gap-3 p-2.5 bg-surface rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-lg flex flex-col items-center justify-center text-white shrink-0">
                      <p className="text-xs font-bold leading-none">{d.getDate()}</p>
                      <p className="text-[9px] uppercase">{d.toLocaleString('en', { month: 'short' })}</p>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-text-primary truncate">{event.title_en}</p>
                      <div className="flex items-center gap-2 text-[11px] text-text-secondary mt-0.5">
                        <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" />{d.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                        {event.location && <span className="flex items-center gap-0.5 truncate"><MapPin className="w-3 h-3" />{event.location}</span>}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Recent Payments */}
        <div className="bg-white rounded-xl border border-border p-4 lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-text-primary">Recent Payments</h2>
            <Link to="/admin/payments" className="text-xs text-primary hover:underline">View All</Link>
          </div>
          {recentPayments.length === 0 ? (
            <p className="text-xs text-text-secondary text-center py-6">No payments recorded</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-text-secondary border-b border-border">
                    <th className="pb-2 font-medium">Member</th>
                    <th className="pb-2 font-medium">Amount</th>
                    <th className="pb-2 font-medium">Date</th>
                    <th className="pb-2 font-medium">Type</th>
                    <th className="pb-2 font-medium">Method</th>
                  </tr>
                </thead>
                <tbody>
                  {recentPayments.map((p) => (
                    <tr key={p.id} className="border-b border-border/50">
                      <td className="py-2 font-medium text-text-primary">{p.profiles?.full_name}</td>
                      <td className="py-2 font-semibold text-text-primary">₹{Number(p.amount).toLocaleString()}</td>
                      <td className="py-2 text-text-secondary">{formatDate(p.donation_date, 'en')}</td>
                      <td className="py-2">
                        {p.purpose === 'Executive Membership' ? (
                          <span className="bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded-full text-[10px] flex items-center gap-0.5 w-fit"><Crown className="w-2.5 h-2.5" /> Membership</span>
                        ) : (
                          <span className="bg-green-50 text-green-700 px-1.5 py-0.5 rounded-full text-[10px]">{p.purpose || 'Donation'}</span>
                        )}
                      </td>
                      <td className="py-2 text-text-secondary">{p.payment_method || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
