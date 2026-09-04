import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Users, Shield, Crown, UserCheck, MapPin, Handshake, Heart, Briefcase, PartyPopper, User, Calendar, MessageSquare, Send } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'

import { localized, formatDate, getRoleLabel } from '../lib/utils'
import type { Event, Profile } from '../types'

export function Homepage() {
  const { t, i18n } = useTranslation('home')
  const lang = i18n.language
  const [events, setEvents] = useState<Event[]>([])
  const [boardMembers, setBoardMembers] = useState<Profile[]>([])
  const [executiveMembers, setExecutiveMembers] = useState<Profile[]>([])
  const [regularMembers, setRegularMembers] = useState<Profile[]>([])
  const [memberSlide, setMemberSlide] = useState(0)

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
    // Fetch governing role slugs dynamically from designations table
    async function loadGoverningMembers() {
      const { data: desigData } = await supabase.from('designations').select('slug').eq('is_admin_role', true)
      const governingSlugs = (desigData || []).map((d: any) => d.slug).filter(Boolean)
      if (governingSlugs.length > 0) {
        supabase.from('profiles').select('*').in('role', governingSlugs).eq('account_status', 'active').order('role').limit(32)
          .then(({ data }) => { if (data) setBoardMembers(data as Profile[]) })
        supabase.from('profiles').select('*').eq('account_status', 'active').eq('is_executive_member', true).not('role', 'in', `(${governingSlugs.map(s => `"${s}"`).join(',')})`).order('full_name').limit(32)
          .then(({ data }) => { if (data) setExecutiveMembers(data as Profile[]) })
        supabase.from('profiles').select('*').eq('account_status', 'active').eq('is_executive_member', false).not('role', 'in', `(${governingSlugs.map(s => `"${s}"`).join(',')})`).order('full_name').limit(32)
          .then(({ data }) => { if (data) setRegularMembers(data as Profile[]) })
        Promise.all([
          supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('account_status', 'active').in('role', governingSlugs),
          supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('account_status', 'active').eq('is_executive_member', true),
          supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('account_status', 'active').eq('is_executive_member', false),
        ]).then(([govRes, execRes, memRes]) => {
          const exec = execRes.count ?? 0
          const mem = memRes.count ?? 0
          setMemberStats({ governing: govRes.count ?? 0, executive: exec, members: mem, total: exec + mem })
        })
      }
    }
    loadGoverningMembers()

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
      .from('homepage_gallery')
      .select('*')
      .order('sort_order', { ascending: true })
      .limit(6)
      .then(({ data }) => {
        if (data) setGalleryImages(data)
      })
  }, [])

  const stats = [
    { icon: Shield, value: memberStats.governing, label: t('stats.governingMembers'), color: 'bg-orange-100 text-orange-700' },
    { icon: Crown, value: memberStats.executive, label: t('stats.executiveMembers'), color: 'bg-amber-100 text-amber-700' },
    { icon: UserCheck, value: memberStats.members, label: t('stats.members'), color: 'bg-blue-100 text-blue-700' },
    { icon: Users, value: memberStats.total, label: t('stats.totalMembers'), color: 'bg-green-100 text-green-700' },
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
          <source src="/hero.mp4" type="video/mp4" />
        </video>

        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/30" />

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
          <p className="text-sm font-semibold text-primary tracking-widest uppercase mb-3">{t('about.tagline', 'About Us')}</p>
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
            <p className="text-sm font-semibold text-primary tracking-widest uppercase mb-2">{t('inspiration.tagline')}</p>
            <h2 className="text-3xl font-bold text-text-primary mb-4">{t('inspiration.name')}</h2>
            <p className="text-base text-text-secondary leading-relaxed mb-4">{t('inspiration.desc1')}</p>
            <p className="text-base text-text-secondary leading-relaxed">{t('inspiration.desc2')}</p>
          </div>
        </div>
      </section>

      {/* Members Auto-Slide — all members, 4×4 grid */}
      {(() => {
        const allMembers = [...boardMembers, ...executiveMembers, ...regularMembers]
        const PER_SLIDE = 16 // 4 columns × 4 rows
        const totalSlides = Math.ceil(allMembers.length / PER_SLIDE) || 1
        const currentItems = allMembers.slice(memberSlide * PER_SLIDE, (memberSlide + 1) * PER_SLIDE)
        return (
          <section className="py-16 px-4 bg-surface">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-8">
                <p className="text-sm font-semibold text-primary tracking-widest uppercase mb-2">{t('leadership.tagline')}</p>
                <h2 className="text-2xl font-bold text-text-primary">{t('leadership.title')}</h2>
              </div>

              <AutoMemberSlide
                items={allMembers}
                perSlide={PER_SLIDE}
                slide={memberSlide}
                setSlide={setMemberSlide}
                totalSlides={totalSlides}
                currentItems={currentItems}
                boardSlugs={boardMembers.map(m => m.id)}
                executiveSlugs={executiveMembers.map(m => m.id)}
                lang={lang}
              />

              {totalSlides > 1 && (
                <div className="flex justify-center gap-1.5 mt-6">
                  {Array.from({ length: totalSlides }).map((_, i) => (
                    <button key={i} onClick={() => setMemberSlide(i)}
                      className={`w-2 h-2 rounded-full transition-colors ${i === memberSlide ? 'bg-primary' : 'bg-gray-300'}`} />
                  ))}
                </div>
              )}

              <div className="text-center mt-6">
                <Link to="/members" className="text-sm font-medium text-primary hover:underline">{t('leadership.viewAll')}</Link>
              </div>
            </div>
          </section>
        )
      })()}

      {/* Gallery */}
      {galleryImages.length > 0 && (
        <section className="min-h-[80vh] flex flex-col justify-center py-16 px-4 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <p className="text-sm font-semibold text-primary tracking-widest uppercase mb-2">{t('gallery.tagline')}</p>
              <h2 className="text-2xl font-bold text-text-primary">{t('gallery.title')}</h2>
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
                {t('gallery.viewAll')}
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Upcoming Events */}
      <section className="min-h-[80vh] flex flex-col justify-center py-16 px-4 bg-surface">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-sm font-semibold text-primary tracking-widest uppercase mb-2">{t('eventsSection.tagline')}</p>
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
            <p className="text-sm font-semibold text-primary tracking-widest uppercase mb-2">{t('suggestion.tagline')}</p>
            <h2 className="text-2xl font-bold text-text-primary">{t('suggestion.title')}</h2>
            <p className="text-sm text-text-secondary mt-2">{t('suggestion.subtitle')}</p>
          </div>

          {suggestionSubmitted ? (
            <div className="bg-surface rounded-2xl p-10 text-center">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-xl font-bold text-text-primary mb-2">{t('suggestion.thankYou')}</h3>
              <p className="text-sm text-text-secondary mb-4">{t('suggestion.thankYouDesc')}</p>
              <button onClick={() => setSuggestionSubmitted(false)} className="px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors">
                {t('suggestion.submitAnother')}
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
                  <label className="block text-sm font-medium text-text-primary mb-1">{t('suggestion.yourName')} *</label>
                  <input type="text" required value={suggestionForm.name} onChange={(e) => setSuggestionForm({ ...suggestionForm, name: e.target.value })}
                    placeholder={t('suggestion.namePlaceholder')} className="w-full px-4 py-3 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">{t('suggestion.phoneNumber')}</label>
                  <input type="tel" maxLength={10} value={suggestionForm.phone}
                    onChange={(e) => setSuggestionForm({ ...suggestionForm, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                    placeholder={t('suggestion.phonePlaceholder')} className="w-full px-4 py-3 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">{t('suggestion.yourSuggestion')} *</label>
                <textarea required rows={4} value={suggestionForm.suggestion} onChange={(e) => setSuggestionForm({ ...suggestionForm, suggestion: e.target.value })}
                  placeholder={t('suggestion.suggestionPlaceholder')} className="w-full px-4 py-3 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div className="text-center">
                <button type="submit" disabled={suggestionSaving} className="px-8 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors flex items-center gap-2 mx-auto disabled:opacity-50">
                  <Send className="w-4 h-4" /> {suggestionSaving ? t('suggestion.submitting') : t('suggestion.submit')}
                </button>
              </div>
            </form>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 px-4 bg-surface">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-text-primary mb-3">{t('cta.title')}</h2>
          <p className="text-sm text-text-secondary mb-6">{t('cta.subtitle')}</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/register" className="px-8 py-2.5 bg-primary text-white font-medium text-sm rounded-lg hover:bg-primary-dark transition-colors">
              {t('cta.registerNow')}
            </Link>
            <Link to="/donate" className="px-8 py-2.5 border border-border text-text-secondary font-medium text-sm rounded-lg hover:bg-white transition-colors">
              {t('cta.donateNow')}
            </Link>
          </div>
        </div>
      </section>
      {/* Email Subscribe */}
      <section className="py-4 px-4 bg-white border-t border-border">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center gap-4">
          {subscribeSuccess ? (
            <div className="flex items-center gap-2 mx-auto">
              <span className="text-green-600 text-sm font-medium">{t('subscribe.success')}</span>
              <Link to="/unsubscribe" className="text-[10px] text-text-secondary underline">{t('subscribe.unsubscribe')}</Link>
            </div>
          ) : (
            <>
              <div className="flex-1">
                <p className="text-sm font-bold text-text-primary">{t('subscribe.title')}</p>
                <p className="text-xs text-text-secondary">{t('subscribe.subtitle')}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <form onSubmit={handleSubscribe} className="flex gap-2">
                  <input
                    type="email"
                    required
                    placeholder={t('subscribe.placeholder')}
                    value={subscribeEmail}
                    onChange={(e) => setSubscribeEmail(e.target.value)}
                    className="w-52 px-3 py-2 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <button type="submit" disabled={subscribing} className="px-5 py-2 bg-primary text-white font-medium text-xs rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 shrink-0">
                    {subscribing ? '...' : t('subscribe.button')}
                  </button>
                </form>
                <Link to="/unsubscribe" className="text-[10px] text-text-secondary underline shrink-0 hidden sm:block">{t('subscribe.unsubscribe')}</Link>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  )
}

function AutoMemberSlide({ items, perSlide, slide, setSlide, totalSlides, currentItems, boardSlugs, executiveSlugs, lang }: {
  items: Profile[]; perSlide: number; slide: number; setSlide: (n: number) => void
  totalSlides: number; currentItems: Profile[]; boardSlugs: string[]; executiveSlugs: string[]; lang: string
}) {
  useEffect(() => {
    if (items.length <= perSlide) return
    const timer = setInterval(() => {
      setSlide((slide + 1) % totalSlides)
    }, 3500)
    return () => clearInterval(timer)
  }, [items.length, totalSlides, perSlide, slide])

  if (currentItems.length === 0) return <p className="text-center text-sm text-text-secondary py-8">No members yet.</p>

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {currentItems.map((member) => {
        const ring = boardSlugs.includes(member.id)
          ? 'ring-orange-300'
          : executiveSlugs.includes(member.id)
          ? 'ring-amber-300'
          : 'ring-gray-200'
        return (
          <div key={member.id} className="flex items-center gap-3 bg-white rounded-xl p-3 border border-border hover:shadow-sm transition-shadow">
            <div className={`w-14 h-14 shrink-0 rounded-full overflow-hidden flex items-center justify-center ring-2 ${ring}`}>
              {member.profile_photo_url ? (
                <img src={member.profile_photo_url} alt="" className="w-14 h-14 rounded-full object-cover" />
              ) : (
                <User className="w-6 h-6 text-gray-300" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-text-primary leading-tight truncate">
                {lang === 'hi' && member.full_name_hi ? member.full_name_hi : member.full_name}
              </p>
              <p className="text-[11px] text-primary font-medium mt-0.5 truncate">{getRoleLabel(member.role)}</p>
              {member.city && <p className="text-[10px] text-text-secondary truncate">{member.city}</p>}
            </div>
          </div>
        )
      })}
    </div>
  )
}
