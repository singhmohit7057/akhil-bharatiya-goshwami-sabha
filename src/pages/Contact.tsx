import { useState } from 'react'
import toast from 'react-hot-toast'
import { MapPin, Phone, Mail, Send } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'

export function Contact() {
  const { t } = useTranslation('contact')
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' })
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.from('contact_submissions').insert({
      name: form.name, email: form.email || null, phone: form.phone || null,
      subject: form.subject || null, message: form.message || null,
    })
    if (error) { toast.error(t('failedError')); setLoading(false); return }
    setForm({ name: '', email: '', phone: '', subject: '', message: '' })
    setLoading(false)
    setSubmitted(true)
  }

  const inputClass = 'w-full px-4 py-3 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary'

  return (
    <div>
      <section className="bg-surface py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm font-semibold text-primary tracking-widest uppercase mb-2">{t('tagline')}</p>
          <h1 className="text-5xl font-extrabold text-text-primary mb-4">{t('title')}</h1>
          <p className="text-base text-text-secondary max-w-2xl mx-auto">{t('subtitle')}</p>
        </div>
      </section>
      <div className="max-w-3xl mx-auto"><hr className="border-border" /></div>

      <section className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Left: Contact Info */}
          <div className="lg:w-1/2 space-y-6">
            <div className="bg-white rounded-xl border border-border p-6">
              <h2 className="text-lg font-bold text-primary mb-6">{t('connectWithUs')}</h2>

              <div className="space-y-5">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-text-primary">{t('headquarters')}</h3>
                    <p className="text-xs text-text-secondary mt-0.5">{t('headquartersValue')}</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-text-primary">{t('phone')}</h3>
                    <a href="tel:+919331038940" className="text-xs text-text-secondary hover:text-primary mt-0.5 block">+91 9331038940</a>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-text-primary">{t('email')}</h3>
                    <a href="mailto:abgspb3@gmail.com" className="text-xs text-text-secondary hover:text-primary mt-0.5 block">abgspb3@gmail.com</a>
                  </div>
                </div>
              </div>

              <hr className="my-6 border-border" />

              <h3 className="text-sm font-bold text-text-primary mb-3">{t('socialPresence')}</h3>
              <div className="flex gap-3">
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-surface flex items-center justify-center hover:bg-primary/10 transition-colors">
                  <img src="/facebook.png" alt="Facebook" className="w-5 h-5" />
                </a>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-surface flex items-center justify-center hover:bg-primary/10 transition-colors">
                  <img src="/instagram.png" alt="Instagram" className="w-5 h-5" />
                </a>
                <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-surface flex items-center justify-center hover:bg-primary/10 transition-colors">
                  <img src="/youtube.png" alt="YouTube" className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Districts We Serve */}
            <div className="bg-gradient-to-br from-primary to-primary-dark rounded-xl p-6 text-white">
              <h3 className="text-lg font-bold mb-4">{t('districtsTitle')}</h3>
              <div className="flex flex-wrap gap-2 mb-4">
                {['Kolkata', 'Howrah', 'Hooghly', 'North 24 Parganas', 'South 24 Parganas', 'Burdwan', 'Bankura', 'Midnapore'].map((d) => (
                  <span key={d} className="px-3 py-1.5 bg-white/20 rounded-full text-xs font-medium">{d}</span>
                ))}
              </div>
              <p className="text-xs text-white/80">
                {t('districtsFootnote')}
              </p>
            </div>
          </div>

          {/* Right: Contact Form */}
          <div className="lg:w-1/2">
            <div className="bg-white rounded-xl border border-border p-6">
              {submitted ? (
                <div className="text-center py-10">
                  <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5">
                    <Send className="w-10 h-10 text-green-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-text-primary mb-3">{t('successTitle')}</h2>
                  <p className="text-base text-text-secondary mb-4">{t('successDesc')}</p>
                  <div className="bg-surface rounded-xl p-5 text-left mb-6">
                    <p className="text-sm font-semibold text-text-primary mb-2">{t('reachDirectly')}</p>
                    <p className="text-sm text-text-secondary mt-1">• Phone: <a href="tel:+919331038940" className="text-primary font-medium hover:underline">+91 9331038940</a></p>
                    <p className="text-sm text-text-secondary mt-1">• Email: <a href="mailto:abgspb3@gmail.com" className="text-primary font-medium hover:underline">abgspb3@gmail.com</a></p>
                    <p className="text-sm text-text-secondary mt-1">• WhatsApp: <a href="https://wa.me/919331038940" target="_blank" rel="noopener noreferrer" className="text-primary font-medium hover:underline">9331038940</a></p>
                  </div>
                  <button onClick={() => setSubmitted(false)} className="px-8 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors">
                    {t('sendAnother')}
                  </button>
                </div>
              ) : (
              <>
              <h2 className="text-lg font-bold text-text-primary mb-1">{t('formTitle')}</h2>
              <div className="w-12 h-1 bg-primary rounded-full mb-6" />

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">{t('fullName')} *</label>
                  <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={t('fullName')} className={inputClass} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">Email *</label>
                    <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="your@email.com" className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">Phone Number *</label>
                    <div className="flex">
                      <span className="px-3 py-3 bg-surface border border-r-0 border-border rounded-l-lg text-xs text-text-secondary flex items-center">+91</span>
                      <input type="tel" required maxLength={10} value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                        placeholder="XXXXX XXXXX" className={`${inputClass} rounded-l-none`} />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">{t('subject')} *</label>
                  <input type="text" required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder={t('subjectPlaceholder')} className={inputClass} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">{t('message')} *</label>
                  <textarea required rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder={t('messagePlaceholder')} className={inputClass} />
                </div>

                <button type="submit" disabled={loading} className="w-full py-3 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary-dark transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                  <Send className="w-4 h-4" /> {loading ? t('sending') : t('sendButton')}
                </button>
              </form>
              </>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
