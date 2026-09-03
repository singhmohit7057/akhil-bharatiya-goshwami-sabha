import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Users, Shield, Crown, UserCheck, MapPin, Handshake, Heart, Briefcase, PartyPopper, User, Calendar, MessageSquare, Send } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'

import { localized, formatDate, getRoleLabel } from '../lib/utils'
import type { Event, Profile } from '../types'
import { ADMIN_ROLES } from '../types'

export function Homepage() {
  const { t, i18n } = useTranslation('home')
  const lang = i18n.language
  const [events, setEvents] = useState<Event[]>([])
  const [boardMembers, setBoardMembers] = useState<Profile[]>([])

  const [memberStats, setMemberStats] = useState({ governing: 0, executive: 0, members: 0, total: 0 })
  const [galleryImages, setGalleryImages] = useState<{ id: string; image_url: string; caption: string | null }[]>([])
  const [suggestionForm, setSuggestionForm] = useState({ name: '', phone: '', suggestion: '' })
  const [suggestionSaving, setSuggestionSaving] = useState(false)
  const [suggestionSubmitted, setSuggestionSubmitted] = useState(false)
  const [subscribeEmail, setSubscribeEmail] = useState('')
  const [subscribing, setSubscribing] = useState(false)
  const [subscribeSuccess, setSubscribeSuccess] = useState(false)

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault()
    setSubscribing(true)
    const { error } = await supabase.from('email_subscribers').insert({ email: subscribeEmail })
    if (error) {
      if (error.code === '23505') toast.success('You are already subscribed!')
      else toast.error('Failed to subscribe')
      setSubscribing(false)
      return
    }
    setSubscribeEmail('')
    setSubscribing(false)
    setSubscribeSuccess(true)
  }

  useEffect(() => {
    supabase
      .from('events')
      .select('*')
      .eq('is_published', true)
      .gte('event_date', new Date().toISOString())
      .order('event_date', { ascending: true })
      .limit(3)
      .then(({ data }) => {
        if (data) setEvents(data as Event[])
      })

    supabase
      .from('profiles')
      .select('*')
      .in('role', ADMIN_ROLES)
      .eq('account_status', 'active')
      .order('role')
      .limit(16)
      .then(({ data }) => {
        if (data) setBoardMembers(data as Profile[])
      })

    Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('account_status', 'active').in('role', ADMIN_ROLES),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('account_status', 'active').eq('is_executive_member', true),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('account_status', 'active').eq('is_executive_member', false),
    ]).then(([govRes, execRes, memRes]) => {
      if (govRes.error) console.error('Gov count error:', govRes.error)
      if (execRes.error) console.error('Exec count error:', execRes.error)
      if (memRes.error) console.error('Mem count error:', memRes.error)
      const exec = execRes.count ?? 0
      const mem = memRes.count ?? 0
      setMemberStats({
        governing: govRes.count ?? 0,
        executive: exec,
        members: mem,
        total: exec + mem,
      })
    })

    supabase
      .from('homepage_gallery')
      .select('*')
      .order('sort_order', { ascending: true })
      .limit(6)
      .then(({ data }) => {
        if (data) setGalleryImages(data)
      })
  }, [])

  const stats = [
    { icon: Shield, value: memberStats.governing, label: 'Governing Members', color: 'bg-orange-100 text-orange-700' },
    { icon: Crown, value: memberStats.executive, label: 'Executive Members', color: 'bg-amber-100 text-amber-700' },
    { icon: UserCheck, value: memberStats.members, label: 'Members', color: 'bg-blue-100 text-blue-700' },
    { icon: Users, value: memberStats.total, label: 'Total Members', color: 'bg-green-100 text-green-700' },
  ]

  const features = [
    { icon: Handshake, title: t('features.community'), desc: t('features.communityDesc'), color: 'bg-blue-100 text-blue-700' },
    { icon: Heart, title: t('features.matrimonial'), desc: t('features.matrimonialDesc'), color: 'bg-pink-100 text-pink-700' },
    { icon: Briefcase, title: t('features.business'), desc: t('features.businessDesc'), color: 'bg-amber-100 text-amber-700' },
    { icon: PartyPopper, title: t('features.events'), desc: t('features.eventsDesc'), color: 'bg-green-100 text-green-700' },
  ]

  return (
    <div>
      {/* Hero Video */}
      <section className="relative h-[500px] md:h-[600px] overflow-hidden">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/herosection.mp4" type="video/mp4" />
        </video>

        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/60" />

        {/* Content */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="max-w-4xl mx-auto text-center px-4">
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-3 drop-shadow-lg">{t('hero.title')}</h1>
            <p className="text-3xl md:text-4xl font-bold text-white/90 mb-2">{t('hero.subtitle')}</p>
            <p className="text-lg text-white/80 max-w-2xl mx-auto">{t('hero.description')}</p>
          </div>
        </div>
      </section>

      {/* Social Links Bar */}
      <div className="bg-orange-50 border-b border-orange-100 py-4">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-center gap-6">
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-text-primary hover:text-primary transition-colors">
            <img src="/instagram.png" alt="Instagram" className="w-5 h-5 rounded" />
            <span className="text-xs font-medium">Instagram</span>
          </a>
          <span className="text-text-secondary/30">|</span>
          <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-text-primary hover:text-primary transition-colors">
            <img src="/facebook.png" alt="Facebook" className="w-5 h-5 rounded" />
            <span className="text-xs font-medium">Facebook</span>
          </a>
          <span className="text-text-secondary/30">|</span>
          <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-text-primary hover:text-primary transition-colors">
            <img src="/youtube.png" alt="YouTube" className="w-5 h-5 rounded" />
            <span className="text-xs font-medium">YouTube</span>
          </a>
        </div>
      </div>

      {/* Stats Bar */}
      <section className="bg-white border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className={`rounded-xl p-5 ${stat.color.split(' ')[0]} text-center`}>
              <div className={`w-10 h-10 rounded-lg bg-white/80 flex items-center justify-center mx-auto mb-3`}>
                <stat.icon className={`w-5 h-5 ${stat.color.split(' ')[1]}`} />
              </div>
              <p className="text-3xl font-bold text-text-primary">{stat.value}</p>
              <p className="text-sm font-medium text-text-primary mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* About + Features combined */}
      <section className="min-h-[80vh] flex flex-col justify-center py-16 px-4 bg-surface">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <p className="text-sm font-semibold text-primary tracking-widest uppercase mb-3">About Us</p>
          <h2 className="text-3xl font-bold text-text-primary mb-5">{t('about.title')}</h2>
          <p className="text-base text-text-secondary leading-relaxed">{t('about.description')}</p>
        </div>
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-5 mb-8">
          {features.map((f) => (
            <div key={f.title} className={`p-7 rounded-xl border border-border hover:shadow-md transition-shadow text-center ${f.color.split(' ')[0]}`}>
              <div className="w-12 h-12 rounded-lg bg-white/80 flex items-center justify-center mx-auto mb-4">
                <f.icon className={`w-6 h-6 ${f.color.split(' ')[1]}`} />
              </div>
              <h3 className="text-base font-bold text-text-primary mb-2">{f.title}</h3>
              <p className="text-sm text-text-primary/70 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
        <div className="text-center">
          <Link
            to="/about"
            className="text-sm font-medium text-primary hover:underline"
          >
            {t('about.readMore')} →
          </Link>
        </div>
      </section>

      {/* Founder / Swami Section */}
      <section className="min-h-[80vh] flex flex-col justify-center py-16 px-4 bg-white">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-10">
          <div className="md:w-2/5 shrink-0">
            <img src="/swami.jpeg" alt="Swami Tribhuwan Puri" className="w-full max-w-sm mx-auto rounded-2xl shadow-lg" />
          </div>
          <div className="md:w-3/5 text-center md:text-left">
            <p className="text-sm font-semibold text-primary tracking-widest uppercase mb-2">Our Inspiration</p>
            <h2 className="text-3xl font-bold text-text-primary mb-4">Swami Tribhuwan Puri</h2>
            <p className="text-base text-text-secondary leading-relaxed mb-4">
              Swami Tribhuwan Puri Ji is a revered spiritual leader and the guiding force behind the Akhil Bharatiya Goswami Sabha. His teachings on community service, cultural preservation, and spiritual growth have inspired thousands of members across West Bengal.
            </p>
            <p className="text-base text-text-secondary leading-relaxed">
              Under his guidance, the Sabha has grown into a strong community organization committed to the welfare, education, and unity of the Goswami community.
            </p>
          </div>
        </div>
      </section>

      {/* Governing Members */}
      <section className="min-h-[80vh] flex flex-col justify-center py-16 px-4 bg-surface">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-sm font-semibold text-primary tracking-widest uppercase mb-2">Our Leadership</p>
            <h2 className="text-2xl font-bold text-text-primary">Governing Members</h2>
          </div>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
            {boardMembers.length > 0 ? (
              boardMembers.map((member) => (
                <div key={member.id} className="text-center group">
                  <div className="w-24 h-24 mx-auto rounded-full bg-white border-2 border-border group-hover:border-primary transition-colors overflow-hidden flex items-center justify-center mb-3">
                    {member.profile_photo_url ? (
                      <img src={member.profile_photo_url} alt="" className="w-24 h-24 rounded-full object-cover" />
                    ) : (
                      <User className="w-7 h-7 text-gray-300" />
                    )}
                  </div>
                  <p className="text-xs font-semibold text-text-primary leading-tight truncate">{member.full_name.split(' ')[0]}</p>
                  <p className="text-[10px] text-primary font-medium truncate">{getRoleLabel(member.role)}</p>
                </div>
              ))
            ) : (
              Array.from({ length: 16 }).map((_, i) => {
                const placeholders = [
                  { name: 'President', role: 'President' },
                  { name: 'Vice President', role: 'Vice President' },
                  { name: 'Chairman', role: 'Chairman' },
                  { name: 'Vice Chairman', role: 'Vice Chairman' },
                  { name: 'Secretary', role: 'Secretary' },
                  { name: 'Jt. Secretary', role: 'Joint Secretary' },
                  { name: 'Treasurer', role: 'Treasurer' },
                  { name: 'Jt. Treasurer', role: 'Joint Treasurer' },
                  { name: 'Working Pres.', role: 'Working President' },
                  { name: 'Jt. Working Pres.', role: 'Jt. Working Pres.' },
                  { name: 'Coordinator', role: 'Coordinator' },
                  { name: 'Deputy Chair', role: 'Deputy Chairman' },
                  { name: 'Mentor', role: 'Mentor' },
                  { name: 'PRO', role: 'PR Officer' },
                  { name: 'Legal Advisor', role: 'Legal Advisor' },
                  { name: 'Media', role: 'Media & Spoke' },
                ]
                const p = placeholders[i]
                return (
                  <div key={i} className="text-center group">
                    <div className="w-24 h-24 mx-auto rounded-full bg-white border-2 border-border group-hover:border-primary transition-colors flex items-center justify-center mb-3">
                      <User className="w-7 h-7 text-gray-300" />
                    </div>
                    <p className="text-xs font-semibold text-text-primary leading-tight truncate">{p.name}</p>
                    <p className="text-[10px] text-primary font-medium truncate">{p.role}</p>
                  </div>
                )
              })
            )}
          </div>
          <div className="text-center mt-6">
            <Link to="/members" className="text-sm font-medium text-primary hover:underline">
              View All Members →
            </Link>
          </div>
        </div>
      </section>

      {/* Gallery */}
      {galleryImages.length > 0 && (
        <section className="min-h-[80vh] flex flex-col justify-center py-16 px-4 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <p className="text-sm font-semibold text-primary tracking-widest uppercase mb-2">Memories</p>
              <h2 className="text-2xl font-bold text-text-primary">Photo Gallery</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {galleryImages.map((img) => (
                <div key={img.id} className="aspect-[16/10] rounded-xl overflow-hidden">
                  <img src={img.image_url} alt={img.caption || ''} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                </div>
              ))}
            </div>
            <div className="text-center mt-8">
              <Link to="/gallery" className="text-sm font-medium text-primary hover:underline">
                View All Photos →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Upcoming Events */}
      <section className="min-h-[80vh] flex flex-col justify-center py-16 px-4 bg-surface">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-sm font-semibold text-primary tracking-widest uppercase mb-2">What's Happening</p>
            <h2 className="text-2xl font-bold text-text-primary">{t('events.title')}</h2>
          </div>

          {events.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {events.map((event) => (
                <Link
                  key={event.id}
                  to={`/events/${(event as any).slug || event.id}`}
                  className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl border border-purple-200 overflow-hidden hover:shadow-lg transition-all group flex flex-col"
                >
                  <div className="h-40 w-full overflow-hidden">
                    {event.image_url ? (
                      <img src={event.image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                        <Calendar className="w-10 h-10 text-white/60" />
                      </div>
                    )}
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="text-sm font-semibold text-text-primary group-hover:text-primary transition-colors mb-1">
                      {localized(event.title_en, event.title_hi, lang)}
                    </h3>
                    <p className="text-xs text-text-secondary line-clamp-2 mb-3 flex-1">
                      {localized(event.description_en, event.description_hi, lang)}
                    </p>
                    <div className="flex flex-col gap-1 text-xs text-text-secondary border-t border-border pt-3">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-primary" />
                        {formatDate(event.event_date, lang)}
                      </span>
                      {event.location && (
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-primary" /> {event.location}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-center text-text-secondary py-8">{t('events.noEvents')}</p>
          )}

          <div className="text-center mt-8">
            <Link to="/events" className="text-sm font-medium text-primary hover:underline">
              {t('events.viewAll')} →
            </Link>
          </div>
        </div>
      </section>

      {/* Suggestion Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-sm font-semibold text-primary tracking-widest uppercase mb-2">We Value Your Voice</p>
            <h2 className="text-2xl font-bold text-text-primary">Share Your Suggestion</h2>
            <p className="text-sm text-text-secondary mt-2">Help us improve and grow. Your feedback matters to us.</p>
          </div>

          {suggestionSubmitted ? (
            <div className="bg-surface rounded-2xl p-10 text-center">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-xl font-bold text-text-primary mb-2">Thank You!</h3>
              <p className="text-sm text-text-secondary mb-4">Your suggestion has been submitted. We appreciate your feedback.</p>
              <button onClick={() => setSuggestionSubmitted(false)} className="px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors">
                Submit Another
              </button>
            </div>
          ) : (
            <form
              onSubmit={async (e) => {
                e.preventDefault()
                if (!suggestionForm.name || !suggestionForm.suggestion) { toast.error('Please fill name and suggestion'); return }
                setSuggestionSaving(true)
                const { error } = await supabase.from('suggestion_submissions').insert({
                  name: suggestionForm.name, phone: suggestionForm.phone || null, suggestion: suggestionForm.suggestion,
                })
                if (error) { toast.error('Failed to submit'); setSuggestionSaving(false); return }
                setSuggestionForm({ name: '', phone: '', suggestion: '' })
                setSuggestionSaving(false)
                setSuggestionSubmitted(true)
              }}
              className="bg-surface rounded-2xl p-8 space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Your Name *</label>
                  <input type="text" required value={suggestionForm.name} onChange={(e) => setSuggestionForm({ ...suggestionForm, name: e.target.value })}
                    placeholder="Full name" className="w-full px-4 py-3 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Phone Number</label>
                  <input type="tel" maxLength={10} value={suggestionForm.phone}
                    onChange={(e) => setSuggestionForm({ ...suggestionForm, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                    placeholder="Optional" className="w-full px-4 py-3 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Your Suggestion *</label>
                <textarea required rows={4} value={suggestionForm.suggestion} onChange={(e) => setSuggestionForm({ ...suggestionForm, suggestion: e.target.value })}
                  placeholder="Share your ideas, feedback, or suggestions..." className="w-full px-4 py-3 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div className="text-center">
                <button type="submit" disabled={suggestionSaving} className="px-8 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors flex items-center gap-2 mx-auto disabled:opacity-50">
                  <Send className="w-4 h-4" /> {suggestionSaving ? 'Submitting...' : 'Submit Suggestion'}
                </button>
              </div>
            </form>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 px-4 bg-surface">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-text-primary mb-3">Join Our Growing Community</h2>
          <p className="text-sm text-text-secondary mb-6">Become a member of Akhil Bharatiya Goswami Sabha and connect with the community across West Bengal.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/register" className="px-8 py-2.5 bg-primary text-white font-medium text-sm rounded-lg hover:bg-primary-dark transition-colors">
              Register Now
            </Link>
            <Link to="/donate" className="px-8 py-2.5 border border-border text-text-secondary font-medium text-sm rounded-lg hover:bg-white transition-colors">
              Donate Now
            </Link>
          </div>
        </div>
      </section>
      {/* Email Subscribe */}
      <section className="py-4 px-4 bg-white border-t border-border">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center gap-4">
          {subscribeSuccess ? (
            <div className="flex items-center gap-2 mx-auto">
              <span className="text-green-600 text-sm font-medium">✓ Subscribed successfully!</span>
              <Link to="/unsubscribe" className="text-[10px] text-text-secondary underline">Unsubscribe</Link>
            </div>
          ) : (
            <>
              <div className="flex-1">
                <p className="text-sm font-bold text-text-primary">Get Community Updates</p>
                <p className="text-xs text-text-secondary">Be the first to know about events, news & announcements</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <form onSubmit={handleSubscribe} className="flex gap-2">
                  <input
                    type="email"
                    required
                    placeholder="Enter your email"
                    value={subscribeEmail}
                    onChange={(e) => setSubscribeEmail(e.target.value)}
                    className="w-52 px-3 py-2 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <button type="submit" disabled={subscribing} className="px-5 py-2 bg-primary text-white font-medium text-xs rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 shrink-0">
                    {subscribing ? '...' : 'Subscribe'}
                  </button>
                </form>
                <Link to="/unsubscribe" className="text-[10px] text-text-secondary underline shrink-0 hidden sm:block">Unsubscribe</Link>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  )
}
