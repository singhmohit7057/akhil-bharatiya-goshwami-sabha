import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Mail, MailX, Trash2, UserCheck, UserX } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { formatDate } from '../../lib/utils'
import { Spinner } from '../../components/ui/Spinner'

interface Subscriber {
  id: string
  email: string
  is_active: boolean
  created_at: string
}

export function Subscribers() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'active' | 'unsubscribed'>('active')

  useEffect(() => { fetchSubscribers() }, [])

  async function fetchSubscribers() {
    const { data } = await supabase.from('email_subscribers').select('*').order('created_at', { ascending: false })
    setSubscribers((data as Subscriber[]) || [])
    setLoading(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this subscriber permanently?')) return
    await supabase.from('email_subscribers').delete().eq('id', id)
    setSubscribers(subscribers.filter((s) => s.id !== id))
    toast.success('Deleted')
  }

  async function handleToggle(id: string, currentActive: boolean) {
    await supabase.from('email_subscribers').update({ is_active: !currentActive }).eq('id', id)
    setSubscribers(subscribers.map((s) => s.id === id ? { ...s, is_active: !currentActive } : s))
    toast.success(currentActive ? 'Unsubscribed' : 'Re-subscribed')
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  const active = subscribers.filter((s) => s.is_active)
  const unsubscribed = subscribers.filter((s) => !s.is_active)
  const list = tab === 'active' ? active : unsubscribed

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary mb-1">Subscribers</h1>
      <p className="text-sm text-text-secondary mb-6">Manage newsletter email subscribers</p>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <button onClick={() => setTab('active')}
          className={`bg-white rounded-xl border p-4 text-left transition-colors ${tab === 'active' ? 'border-green-300 bg-green-50' : 'border-border'}`}>
          <div className="flex items-center gap-2 mb-1">
            <UserCheck className="w-4 h-4 text-green-600" />
            <p className="text-xs text-green-600 font-medium">Active Subscribers</p>
          </div>
          <p className="text-2xl font-bold text-text-primary">{active.length}</p>
        </button>
        <button onClick={() => setTab('unsubscribed')}
          className={`bg-white rounded-xl border p-4 text-left transition-colors ${tab === 'unsubscribed' ? 'border-red-300 bg-red-50' : 'border-border'}`}>
          <div className="flex items-center gap-2 mb-1">
            <UserX className="w-4 h-4 text-red-500" />
            <p className="text-xs text-red-500 font-medium">Unsubscribed</p>
          </div>
          <p className="text-2xl font-bold text-text-primary">{unsubscribed.length}</p>
        </button>
      </div>

      {list.length === 0 ? (
        <div className="bg-white rounded-xl border border-border p-8 text-center text-text-secondary">
          {tab === 'active' ? 'No active subscribers yet.' : 'No unsubscribed users.'}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-gray-50 text-left">
                  <th className="px-4 py-3 font-medium text-text-secondary">#</th>
                  <th className="px-4 py-3 font-medium text-text-secondary">Email</th>
                  <th className="px-4 py-3 font-medium text-text-secondary">Status</th>
                  <th className="px-4 py-3 font-medium text-text-secondary">Subscribed On</th>
                  <th className="px-4 py-3 font-medium text-text-secondary">Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.map((s, i) => (
                  <tr key={s.id} className="border-b border-border/50 hover:bg-gray-50">
                    <td className="px-4 py-3 text-text-secondary">{i + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {s.is_active ? <Mail className="w-4 h-4 text-green-500" /> : <MailX className="w-4 h-4 text-red-400" />}
                        <span className="font-medium text-text-primary">{s.email}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${s.is_active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                        {s.is_active ? 'Active' : 'Unsubscribed'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-text-secondary text-xs">{formatDate(s.created_at, 'en')}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => handleToggle(s.id, s.is_active)} className="flex flex-col items-center gap-0.5 text-text-secondary hover:text-primary">
                          {s.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                          <span className="text-[9px]">{s.is_active ? 'Unsub' : 'Re-sub'}</span>
                        </button>
                        <button onClick={() => handleDelete(s.id)} className="flex flex-col items-center gap-0.5 text-text-secondary hover:text-red-500">
                          <Trash2 className="w-4 h-4" />
                          <span className="text-[9px]">Delete</span>
                        </button>
                      </div>
                    </td>
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
