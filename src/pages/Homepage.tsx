import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Users, MapPin, Calendar, Award, Handshake, Heart, Briefcase, PartyPopper, ChevronLeft, ChevronRight, User } from 'lucide-react'
import { supabase } from '../lib/supabase'

import { localized, formatDate, getRoleLabel } from '../lib/utils'
import type { Event, Profile } from '../types'
import { ADMIN_ROLES } from '../types'

const HERO_IMAGES = ['/Hero1.png', '/Hero2.png', '/Hero3.png', '/Hero4.png']

export function Homepage() {
  const { t, i18n } = useTranslation('home')
  const lang = i18n.language
  const [events, setEvents] = useState<Event[]>([])
  const [boardMembers, setBoardMembers] = useState<Profile[]>([])
  const [currentSlide, setCurrentSlide] = useState(0)

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % HERO_IMAGES.length)
  }, [])

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + HERO_IMAGES.length) % HERO_IMAGES.length)
  }

  useEffect(() => {
    const timer = setInterval(nextSlide, 5000)
    return () => clearInterval(timer)
  }, [nextSlide])

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
  }, [])

  const stats = [
    { icon: Users, value: '500+', label: t('stats.members') },
    { icon: MapPin, value: '50+', label: t('stats.cities') },
    { icon: Calendar, value: '100+', label: t('stats.events') },
    { icon: Award, value: '25+', label: t('stats.years') },
  ]

  const features = [
    { icon: Handshake, title: t('features.community'), desc: t('features.communityDesc'), color: 'bg-blue-50 text-blue-600' },
    { icon: Heart, title: t('features.matrimonial'), desc: t('features.matrimonialDesc'), color: 'bg-pink-50 text-pink-600' },
    { icon: Briefcase, title: t('features.business'), desc: t('features.businessDesc'), color: 'bg-amber-50 text-amber-600' },
    { icon: PartyPopper, title: t('features.events'), desc: t('features.eventsDesc'), color: 'bg-green-50 text-green-600' },
  ]

  return (
    <div>
      {/* Hero Slider */}
      <section className="relative h-[500px] md:h-[600px] overflow-hidden">
        {/* Slides */}
        {HERO_IMAGES.map((img, i) => (
          <div
            key={img}
            className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
            style={{ opacity: currentSlide === i ? 1 : 0 }}
          >
            <img src={img} alt="" className="w-full h-full object-cover" />
          </div>
        ))}

        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/20" />

        {/* Content */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="max-w-4xl mx-auto text-center px-4">
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-3 drop-shadow-lg">{t('hero.title')}</h1>
            <p className="text-xl md:text-2xl font-medium text-white/90 mb-2">{t('hero.subtitle')}</p>
            <p className="text-lg text-white/80 max-w-2xl mx-auto">{t('hero.description')}</p>
          </div>
        </div>

        {/* Navigation arrows */}
        <button onClick={prevSlide} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button onClick={nextSlide} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors">
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Dots */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
          {HERO_IMAGES.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`w-2.5 h-2.5 rounded-full transition-all ${currentSlide === i ? 'bg-white w-8' : 'bg-white/50'}`}
            />
          ))}
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-white border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <stat.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xl font-bold text-text-primary leading-tight">{stat.value}</p>
                <p className="text-xs text-text-secondary">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* About + Features combined */}
      <section className="py-14 px-4 bg-surface">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-10 items-start">
            {/* About */}
            <div className="lg:w-1/2">
              <p className="text-sm font-semibold text-primary tracking-widest uppercase mb-2">About Us</p>
              <h2 className="text-3xl font-bold text-text-primary mb-4">{t('about.title')}</h2>
              <p className="text-text-secondary leading-relaxed mb-6">{t('about.description')}</p>
              <Link
                to="/about"
                className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
              >
                {t('about.readMore')} →
              </Link>
            </div>

            {/* Features grid */}
            <div className="lg:w-1/2 grid grid-cols-2 gap-3">
              {features.map((f) => (
                <div key={f.title} className="bg-white p-4 rounded-xl border border-border hover:shadow-md transition-shadow">
                  <div className={`w-9 h-9 rounded-lg ${f.color} flex items-center justify-center mb-3`}>
                    <f.icon className="w-4.5 h-4.5" />
                  </div>
                  <h3 className="text-sm font-semibold text-text-primary mb-1">{f.title}</h3>
                  <p className="text-xs text-text-secondary leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Upcoming Events */}
      <section className="py-14 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-sm font-semibold text-primary tracking-widest uppercase mb-1">What's Happening</p>
              <h2 className="text-2xl font-bold text-text-primary">{t('events.title')}</h2>
            </div>
            <Link
              to="/events"
              className="text-sm font-medium text-primary hover:underline hidden sm:block"
            >
              {t('events.viewAll')} →
            </Link>
          </div>

          {events.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {events.map((event) => (
                <Link
                  key={event.id}
                  to={`/events/${event.id}`}
                  className="bg-white rounded-xl border border-border overflow-hidden hover:shadow-lg transition-all group flex flex-col"
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

          <div className="text-center mt-6 sm:hidden">
            <Link to="/events" className="text-sm font-medium text-primary hover:underline">
              {t('events.viewAll')} →
            </Link>
          </div>
        </div>
      </section>

      {/* Governing Members */}
      <section className="py-14 px-4 bg-surface">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-sm font-semibold text-primary tracking-widest uppercase mb-1">Our Leadership</p>
            <h2 className="text-2xl font-bold text-text-primary">Governing Members</h2>
          </div>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
            {boardMembers.length > 0 ? (
              boardMembers.map((member) => (
                <div key={member.id} className="text-center group">
                  <div className="w-16 h-16 mx-auto rounded-full bg-white border-2 border-border group-hover:border-primary transition-colors overflow-hidden flex items-center justify-center mb-2">
                    {member.profile_photo_url ? (
                      <img src={member.profile_photo_url} alt="" className="w-16 h-16 rounded-full object-cover" />
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
                    <div className="w-16 h-16 mx-auto rounded-full bg-white border-2 border-border group-hover:border-primary transition-colors flex items-center justify-center mb-2">
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
            <Link to="/about" className="text-sm font-medium text-primary hover:underline">
              View All Leaders →
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 px-4 bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-extrabold text-text-primary mb-3">Join Our Growing Community</h2>
          <p className="text-text-secondary mb-6">Become a member of Akhil Bharatiya Goswami Sabha and connect with the community across West Bengal.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/register" className="px-8 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors">
              Register Now
            </Link>
            <Link to="/about" className="px-8 py-3 border border-border text-text-secondary font-semibold rounded-lg hover:bg-white transition-colors">
              Learn More
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
