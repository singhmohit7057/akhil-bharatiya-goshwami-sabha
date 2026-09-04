import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Target, Eye, BookOpen, User, Landmark, Users, Home, ScrollText, Sparkles, MapPin } from 'lucide-react'
import { supabase } from '../lib/supabase'

import { getRoleLabel } from '../lib/utils'
import type { Profile } from '../types'
import { ADMIN_ROLES } from '../types'

export function About() {
  const { t, i18n } = useTranslation('about')
  const lang = i18n.language
  const [leaders, setLeaders] = useState<Profile[]>([])

  useEffect(() => {
    supabase
      .from('profiles')
      .select('*')
      .in('role', ADMIN_ROLES)
      .eq('account_status', 'active')
      .then(({ data }) => {
        if (data) setLeaders(data as Profile[])
      })
  }, [])

  const sections = [
    { icon: BookOpen, title: t('history.title'), desc: t('history.description'), color: 'bg-amber-50 text-amber-600' },
    { icon: Target, title: t('mission.title'), desc: t('mission.description'), color: 'bg-primary/10 text-primary' },
    { icon: Eye, title: t('vision.title'), desc: t('vision.description'), color: 'bg-secondary/10 text-secondary' },
  ]

  const tenOrders = t('goswami.tenOrders.orders').split(', ')

  return (
    <div>
      {/* Hero */}
      <section className="bg-surface py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm font-semibold text-primary tracking-widest uppercase mb-3">{t('tagline')}</p>
          <h1 className="text-5xl font-extrabold text-text-primary">{t('title')}</h1>
        </div>
      </section>

      <div className="max-w-3xl mx-auto"><hr className="border-border" /></div>

      {/* Goswami Samaj Section */}
      <section className="py-16 px-4 bg-surface">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-primary tracking-widest uppercase mb-3">{t('goswami.subtitle')}</p>
            <h2 className="text-3xl font-bold text-text-primary mb-4">{t('goswami.title')}</h2>
            <p className="text-text-secondary max-w-2xl mx-auto leading-relaxed">{t('goswami.intro')}</p>
          </div>

          {/* Etymology */}
          <div className="bg-white rounded-2xl border border-border p-8 mb-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                <Sparkles className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-text-primary mb-2">{t('goswami.etymology.title')}</h3>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-purple-50/50 rounded-xl border border-purple-100 text-center">
                <p className="text-2xl font-bold text-purple-700 mb-1">{t('goswami.etymology.gau')}</p>
                <p className="text-sm text-text-secondary">{t('goswami.etymology.gauDesc')}</p>
              </div>
              <div className="flex items-center justify-center text-2xl text-text-secondary font-light">+</div>
              <div className="p-4 bg-purple-50/50 rounded-xl border border-purple-100 text-center">
                <p className="text-2xl font-bold text-purple-700 mb-1">{t('goswami.etymology.swami')}</p>
                <p className="text-sm text-text-secondary">{t('goswami.etymology.swamiDesc')}</p>
              </div>
            </div>
            <div className="mt-4 p-4 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-xl border border-primary/10 text-center">
              <p className="text-2xl font-bold text-primary mb-1">{t('goswami.etymology.goswami')}</p>
              <p className="text-sm text-text-secondary">{t('goswami.etymology.goswamiDesc')}</p>
            </div>
          </div>

          {/* Origin */}
          <div className="bg-white rounded-2xl border border-border p-8 mb-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                <Landmark className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-text-primary mb-2">{t('goswami.origin.title')}</h3>
                <p className="text-text-secondary leading-relaxed">{t('goswami.origin.description')}</p>
              </div>
            </div>
          </div>

          {/* Ten Orders */}
          <div className="bg-white rounded-2xl border border-border p-8 mb-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <ScrollText className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-text-primary mb-2">{t('goswami.tenOrders.title')}</h3>
                <p className="text-text-secondary leading-relaxed">{t('goswami.tenOrders.description')}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
              {tenOrders.map((order, i) => (
                <div key={i} className="text-center p-3 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-xl border border-primary/10">
                  <p className="text-lg font-bold text-primary">{i + 1}</p>
                  <p className="text-sm font-medium text-text-primary">{order.trim()}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-text-secondary italic">{t('goswami.tenOrders.note')}</p>
          </div>

          {/* Four Sacred Mathas */}
          <div className="bg-white rounded-2xl border border-border p-8 mb-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                <MapPin className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-text-primary mb-1">{t('goswami.mathas.title')}</h3>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(['north', 'west', 'east', 'south'] as const).map((dir) => {
                const colors = { north: 'bg-blue-50 border-blue-100 text-blue-700', west: 'bg-amber-50 border-amber-100 text-amber-700', east: 'bg-green-50 border-green-100 text-green-700', south: 'bg-red-50 border-red-100 text-red-700' }
                const icons = { north: '🏔️', west: '🌊', east: '🌅', south: '🏛️' }
                return (
                  <div key={dir} className={`p-4 rounded-xl border ${colors[dir].split(' ').slice(0, 2).join(' ')}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{icons[dir]}</span>
                      <h4 className={`font-bold ${colors[dir].split(' ')[2]}`}>{t(`goswami.mathas.${dir}.name`)}</h4>
                    </div>
                    <p className="text-sm text-text-secondary">{t(`goswami.mathas.${dir}.orders`)}</p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Lifestyle Divisions */}
          <div className="bg-white rounded-2xl border border-border p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center shrink-0">
                <Users className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-text-primary mb-2">{t('goswami.divisions.title')}</h3>
                <p className="text-text-secondary leading-relaxed">{t('goswami.divisions.description')}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 bg-amber-50/50 rounded-xl border border-amber-100">
                <div className="flex items-center gap-2 mb-2">
                  <Landmark className="w-5 h-5 text-amber-600" />
                  <h4 className="font-bold text-text-primary">{t('goswami.divisions.mathdhari.title')}</h4>
                </div>
                <p className="text-sm text-text-secondary leading-relaxed">{t('goswami.divisions.mathdhari.description')}</p>
              </div>
              <div className="p-5 bg-green-50/50 rounded-xl border border-green-100">
                <div className="flex items-center gap-2 mb-2">
                  <Home className="w-5 h-5 text-green-600" />
                  <h4 className="font-bold text-text-primary">{t('goswami.divisions.gharbari.title')}</h4>
                </div>
                <p className="text-sm text-text-secondary leading-relaxed">{t('goswami.divisions.gharbari.description')}</p>
              </div>
            </div>
          </div>

          {/* Mission, Vision, History */}
          <div className="bg-white rounded-2xl border border-border p-8 mt-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-text-primary">Our Foundation</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {sections.map((s) => (
                <div key={s.title} className={`p-5 rounded-xl border ${s.color.split(' ')[0].replace('text', 'border')}/30 ${s.color.split(' ')[0]}/5`}>
                  <div className="flex items-center gap-2 mb-3">
                    <s.icon className={`w-5 h-5 ${s.color.split(' ')[1]}`} />
                    <h3 className="font-bold text-text-primary">{s.title}</h3>
                  </div>
                  <p className="text-sm text-text-secondary leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Leadership */}
      {leaders.length > 0 && (
        <section className="py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-text-primary text-center mb-3">{t('leadership.title')}</h2>
            <p className="text-text-secondary text-center mb-10">{t('leadership.description')}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {leaders.map((leader) => (
                <div key={leader.id} className="text-center">
                  <div className="w-24 h-24 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-3 overflow-hidden">
                    {leader.profile_photo_url ? (
                      <img src={leader.profile_photo_url} alt="" className="w-24 h-24 rounded-full object-cover" />
                    ) : (
                      <User className="w-10 h-10 text-primary" />
                    )}
                  </div>
                  <p className="font-semibold text-text-primary">
                    {lang === 'hi' && leader.full_name_hi ? leader.full_name_hi : leader.full_name}
                  </p>
                  <p className="text-sm text-primary font-medium">{getRoleLabel(leader.role)}</p>
                  {leader.city && <p className="text-xs text-text-secondary mt-1">{leader.city}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
