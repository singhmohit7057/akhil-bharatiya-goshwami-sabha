import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Mail, IndianRupee, Trash2, Eye, EyeOff, MessageSquare } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { formatDate } from '../../lib/utils'
import { Spinner } from '../../components/ui/Spinner'

interface ContactSubmission {
  id: string; name: string; email: string | null; phone: string | null
  subject: string | null; message: string | null; is_read: boolean; created_at: string
}

interface DonationSubmission {
  id: string; name: string; phone: string | null; email: string | null
  pan: string | null; amount: number; is_read: boolean; created_at: string
}

interface SuggestionSubmission {
  id: string; name: string; phone: string | null
  suggestion: string; is_read: boolean; created_at: string
}

export function FormSubmissions() {
  const [tab, setTab] = useState<'contact' | 'donate' | 'suggestion'>('contact')
  const [contacts, setContacts] = useState<ContactSubmission[]>([])
  const [donations, setDonations] = useState<DonationSubmission[]>([])
  const [suggestions, setSuggestions] = useState<SuggestionSubmission[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      supabase.from('contact_submissions').select('*').order('created_at', { ascending: false }),
      supabase.from('donation_submissions').select('*').order('created_at', { ascending: false }),
      supabase.from('suggestion_submissions').select('*').order('created_at', { ascending: false }),
    ]).then(([cRes, dRes, sRes]) => {
      setContacts((cRes.data as ContactSubmission[]) || [])
      setDonations((dRes.data as DonationSubmission[]) || [])
      setSuggestions((sRes.data as SuggestionSubmission[]) || [])
      setLoading(false)
    })
  }, [])

  async function toggleRead(table: string, id: string, current: boolean) {
    await supabase.from(table).update({ is_read: !current }).eq('id', id)
    if (table === 'contact_submissions') setContacts(contacts.map((c) => c.id === id ? { ...c, is_read: !current } : c))
    else if (table === 'donation_submissions') setDonations(donations.map((d) => d.id === id ? { ...d, is_read: !current } : d))
    else setSuggestions(suggestions.map((s) => s.id === id ? { ...s, is_read: !current } : s))
  }

  async function handleDelete(table: string, id: string) {
    if (!confirm('Delete this submission?')) return
    await supabase.from(table).delete().eq('id', id)
    if (table === 'contact_submissions') setContacts(contacts.filter((c) => c.id !== id))
    else if (table === 'donation_submissions') setDonations(donations.filter((d) => d.id !== id))
    else setSuggestions(suggestions.filter((s) => s.id !== id))
    toast.success('Deleted')
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  const unreadContacts = contacts.filter((c) => !c.is_read).length
  const unreadDonations = donations.filter((d) => !d.is_read).length
  const unreadSuggestions = suggestions.filter((s) => !s.is_read).length

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary mb-1">Form Submissions</h1>
      <p className="text-sm text-text-secondary mb-6">View contact and donation form submissions</p>

      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab('contact')}
          className={`px-5 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${tab === 'contact' ? 'bg-primary text-white' : 'bg-white border border-border text-text-secondary hover:bg-gray-50'}`}>
          <Mail className="w-4 h-4" /> Contact Forms
          {unreadContacts > 0 && <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{unreadContacts}</span>}
        </button>
        <button onClick={() => setTab('donate')}
          className={`px-5 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${tab === 'donate' ? 'bg-primary text-white' : 'bg-white border border-border text-text-secondary hover:bg-gray-50'}`}>
          <IndianRupee className="w-4 h-4" /> Donation Forms
          {unreadDonations > 0 && <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{unreadDonations}</span>}
        </button>
        <button onClick={() => setTab('suggestion')}
          className={`px-5 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${tab === 'suggestion' ? 'bg-primary text-white' : 'bg-white border border-border text-text-secondary hover:bg-gray-50'}`}>
          <MessageSquare className="w-4 h-4" /> Suggestions
          {unreadSuggestions > 0 && <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{unreadSuggestions}</span>}
        </button>
      </div>

      {tab === 'contact' && (
        contacts.length === 0 ? (
          <div className="bg-white rounded-xl border border-border p-8 text-center text-text-secondary">No contact submissions yet.</div>
        ) : (
          <div className="space-y-3">
            {contacts.map((c) => (
              <div key={c.id} className={`bg-white rounded-xl border p-5 ${c.is_read ? 'border-border' : 'border-primary/30 bg-primary/5'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <p className="text-base font-bold text-text-primary">{c.name}</p>
                      {!c.is_read && <span className="text-[9px] bg-primary text-white px-1.5 py-0.5 rounded-full">New</span>}
                    </div>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium text-text-secondary">Email:</span> <span className="text-text-primary">{c.email || '—'}</span></div>
                      <div><span className="font-medium text-text-secondary">Phone:</span> <span className="text-text-primary">{c.phone || '—'}</span></div>
                      <div><span className="font-medium text-text-secondary">Subject:</span> <span className="text-text-primary font-medium">{c.subject || '—'}</span></div>
                      <div><span className="font-medium text-text-secondary">Message:</span><p className="text-text-primary mt-0.5 whitespace-pre-wrap">{c.message || '—'}</p></div>
                    </div>
                    <p className="text-[10px] text-text-secondary mt-3">{formatDate(c.created_at, 'en')}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => toggleRead('contact_submissions', c.id, c.is_read)} className="flex flex-col items-center gap-0.5 text-text-secondary hover:text-primary">
                      {c.is_read ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      <span className="text-[9px]">{c.is_read ? 'Mark Unread' : 'Mark Read'}</span>
                    </button>
                    <button onClick={() => handleDelete('contact_submissions', c.id)} className="flex flex-col items-center gap-0.5 text-text-secondary hover:text-red-500">
                      <Trash2 className="w-4 h-4" />
                      <span className="text-[9px]">Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {tab === 'donate' && (
        donations.length === 0 ? (
          <div className="bg-white rounded-xl border border-border p-8 text-center text-text-secondary">No donation submissions yet.</div>
        ) : (
          <div className="bg-white rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-gray-50 text-left">
                    <th className="px-4 py-3 font-medium text-text-secondary">Name</th>
                    <th className="px-4 py-3 font-medium text-text-secondary">Phone</th>
                    <th className="px-4 py-3 font-medium text-text-secondary">Email</th>
                    <th className="px-4 py-3 font-medium text-text-secondary">Amount</th>
                    <th className="px-4 py-3 font-medium text-text-secondary">PAN</th>
                    <th className="px-4 py-3 font-medium text-text-secondary">Date</th>
                    <th className="px-4 py-3 font-medium text-text-secondary">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {donations.map((d) => (
                    <tr key={d.id} className={`border-b border-border/50 ${d.is_read ? '' : 'bg-primary/5'}`}>
                      <td className="px-4 py-3">
                        <span className="font-medium text-text-primary">{d.name}</span>
                        {!d.is_read && <span className="ml-1.5 text-[9px] bg-primary text-white px-1.5 py-0.5 rounded-full">New</span>}
                      </td>
                      <td className="px-4 py-3 text-text-secondary">{d.phone || '—'}</td>
                      <td className="px-4 py-3 text-text-secondary">{d.email || '—'}</td>
                      <td className="px-4 py-3 font-semibold text-text-primary">₹{Number(d.amount).toLocaleString()}</td>
                      <td className="px-4 py-3 text-text-secondary">{d.pan || '—'}</td>
                      <td className="px-4 py-3 text-xs text-text-secondary">{formatDate(d.created_at, 'en')}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => toggleRead('donation_submissions', d.id, d.is_read)} className="flex flex-col items-center gap-0.5 text-text-secondary hover:text-primary">
                            {d.is_read ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            <span className="text-[9px]">{d.is_read ? 'Unread' : 'Read'}</span>
                          </button>
                          <button onClick={() => handleDelete('donation_submissions', d.id)} className="flex flex-col items-center gap-0.5 text-text-secondary hover:text-red-500">
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
        )
      )}

      {tab === 'suggestion' && (
        suggestions.length === 0 ? (
          <div className="bg-white rounded-xl border border-border p-8 text-center text-text-secondary">No suggestions yet.</div>
        ) : (
          <div className="space-y-3">
            {suggestions.map((s) => (
              <div key={s.id} className={`bg-white rounded-xl border p-5 ${s.is_read ? 'border-border' : 'border-primary/30 bg-primary/5'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <p className="text-base font-bold text-text-primary">{s.name}</p>
                      {!s.is_read && <span className="text-[9px] bg-primary text-white px-1.5 py-0.5 rounded-full">New</span>}
                    </div>
                    <div className="space-y-2 text-sm">
                      {s.phone && <div><span className="font-medium text-text-secondary">Phone:</span> <span className="text-text-primary">{s.phone}</span></div>}
                      <div><span className="font-medium text-text-secondary">Suggestion:</span><p className="text-text-primary mt-0.5 whitespace-pre-wrap">{s.suggestion}</p></div>
                    </div>
                    <p className="text-[10px] text-text-secondary mt-3">{formatDate(s.created_at, 'en')}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => toggleRead('suggestion_submissions', s.id, s.is_read)} className="flex flex-col items-center gap-0.5 text-text-secondary hover:text-primary">
                      {s.is_read ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      <span className="text-[9px]">{s.is_read ? 'Mark Unread' : 'Mark Read'}</span>
                    </button>
                    <button onClick={() => handleDelete('suggestion_submissions', s.id)} className="flex flex-col items-center gap-0.5 text-text-secondary hover:text-red-500">
                      <Trash2 className="w-4 h-4" />
                      <span className="text-[9px]">Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  )
}
