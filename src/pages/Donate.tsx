import { useState } from 'react'
import toast from 'react-hot-toast'
import { Heart, Shield, Eye, Building2, QrCode, Mail, User, Phone, CreditCard, IndianRupee } from 'lucide-react'
import { supabase } from '../lib/supabase'

const PRESET_AMOUNTS = [500, 1000, 2500, 5000]

export function Donate() {
  const [amount, setAmount] = useState(5000)
  const [showCustom, setShowCustom] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', email: '', pan: '' })
  const [submitted, setSubmitted] = useState(false)

  function selectAmount(val: number) {
    setAmount(val)
    setShowCustom(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.phone) {
      toast.error('Please fill name and phone number')
      return
    }
    const { error } = await supabase.from('donation_submissions').insert({
      name: form.name, phone: form.phone || null, email: form.email || null,
      pan: form.pan || null, amount,
    })
    if (error) { toast.error('Failed to submit. Please try again.'); return }
    setForm({ name: '', phone: '', email: '', pan: '' })
    setAmount(5000)
    setShowCustom(false)
    setSubmitted(true)
  }

  return (
    <div>
      <section className="bg-surface py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm font-semibold text-primary tracking-widest uppercase mb-2">Support Our Cause</p>
          <h1 className="text-5xl font-extrabold text-text-primary mb-4">Donate</h1>
          <p className="text-base text-text-secondary max-w-2xl mx-auto leading-relaxed">
            Akhil Bharatiya Goswami Sabha has been working tirelessly for the welfare, education, and cultural preservation of the Goswami community across West Bengal. Your generous donation helps us organize community events, support underprivileged families, provide educational scholarships, and maintain our cultural heritage for future generations.
          </p>
          <p className="text-sm text-text-secondary mt-3">Every contribution, big or small, makes a difference.</p>
        </div>
      </section>
      <div className="max-w-3xl mx-auto"><hr className="border-border" /></div>

      <section className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Left: Why Donate */}
          <div className="lg:w-1/2">
            <h2 className="text-2xl font-bold text-text-primary mb-6">Why Donate to Us?</h2>

            <div className="space-y-5 mb-8">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">80G Tax Benefit</h3>
                  <p className="text-xs text-text-secondary mt-0.5">All donations are 50% tax exempt under Section 80G of the Income Tax Act.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                  <Eye className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">100% Transparency</h3>
                  <p className="text-xs text-text-secondary mt-0.5">We provide full financial accountability and regular impact reports to our donors.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
                  <Heart className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">Community Impact</h3>
                  <p className="text-xs text-text-secondary mt-0.5">Your donation directly supports education, cultural events, and welfare programs for the Goswami community.</p>
                </div>
              </div>
            </div>

            {/* Bank Details */}
            <div className="bg-white rounded-xl border border-border p-5 mb-4">
              <h3 className="text-sm font-bold text-text-primary flex items-center gap-2 mb-4">
                <Building2 className="w-4 h-4 text-primary" /> Direct Bank Transfer
              </h3>
              <div className="space-y-2 text-sm">
                <p><span className="font-medium text-text-primary">A/C Name:</span> <span className="text-text-secondary">AKHIL BHARATIYA GOSWAMI SABHA</span></p>
                <p><span className="font-medium text-text-primary">A/C Number:</span> <span className="text-text-secondary">[Account Number]</span></p>
                <p><span className="font-medium text-text-primary">Bank Name:</span> <span className="text-text-secondary">[Bank Name]</span></p>
                <p><span className="font-medium text-text-primary">IFSC Code:</span> <span className="text-text-secondary">[IFSC Code]</span></p>
                <p><span className="font-medium text-text-primary">Branch:</span> <span className="text-text-secondary">[Branch Name]</span></p>
              </div>

              <hr className="my-4 border-border" />

              <h3 className="text-sm font-bold text-text-primary flex items-center gap-2 mb-2">
                <QrCode className="w-4 h-4 text-primary" /> UPI ID
              </h3>
              <p className="text-sm text-primary font-medium">abgspb@bank</p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
              <p className="text-xs text-amber-800">
                <Mail className="w-3.5 h-3.5 inline mr-1" />
                Please send your transaction screenshot at <a href="mailto:abgspb3@gmail.com" className="text-primary font-medium hover:underline">abgspb3@gmail.com</a> for a formal donation receipt.
              </p>
              <p className="text-xs text-amber-800">
                <Phone className="w-3.5 h-3.5 inline mr-1" />
                Or send us on WhatsApp at <a href="https://wa.me/919331038940" target="_blank" rel="noopener noreferrer" className="text-primary font-medium hover:underline">9331038940</a>
              </p>
            </div>
          </div>

          {/* Right: Donation Form */}
          <div className="lg:w-1/2">
            <div className="bg-white rounded-2xl border border-border p-6 shadow-sm sticky top-24">
              {submitted ? (
                <div className="text-center py-10">
                  <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5">
                    <Heart className="w-10 h-10 text-green-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-text-primary mb-3">Thank You for Your Interest!</h2>
                  <p className="text-base text-text-secondary mb-6">
                    Our team member will contact you shortly to guide you through the donation process.
                  </p>
                  <div className="bg-surface rounded-xl p-5 text-left mb-6">
                    <p className="text-sm font-semibold text-text-primary mb-3">You can also directly transfer money to:</p>
                    <p className="text-sm text-text-secondary">• UPI: <strong className="text-text-primary">abgspb@bank</strong></p>
                    <p className="text-sm text-text-secondary">• Bank details mentioned on the left</p>
                    <p className="text-sm text-text-secondary mt-3">After payment, send the screenshot via:</p>
                    <p className="text-sm text-text-secondary mt-1">• Email: <a href="mailto:abgspb3@gmail.com" className="text-primary font-medium hover:underline">abgspb3@gmail.com</a></p>
                    <p className="text-sm text-text-secondary mt-1">• WhatsApp: <a href="https://wa.me/919331038940" className="text-primary font-medium hover:underline">9331038940</a></p>
                  </div>
                  <button onClick={() => setSubmitted(false)} className="px-8 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors">
                    Make Another Donation
                  </button>
                </div>
              ) : (
              <>
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-text-primary">Make an Impact</h2>
                <p className="text-xs text-text-secondary mt-1">Your contribution brings smiles to those in need.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Amount Selection */}
                <div>
                  <p className="text-xs font-bold text-text-primary uppercase tracking-wider mb-3">Select Donation Amount</p>
                  <div className="grid grid-cols-4 gap-2">
                    {PRESET_AMOUNTS.map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => selectAmount(val)}
                        className={`py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                          amount === val && !showCustom
                            ? 'bg-primary text-white border-primary'
                            : 'border-border text-text-primary hover:border-primary/30'
                        }`}
                      >
                        ₹{val.toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Amount Toggle */}
                <button
                  type="button"
                  onClick={() => { setShowCustom(!showCustom); if (!showCustom) setAmount(0) }}
                  className={`w-full py-2.5 border-2 border-dashed rounded-xl text-xs font-medium transition-colors ${
                    showCustom ? 'border-primary text-primary bg-primary/5' : 'border-border text-text-secondary hover:border-primary/30'
                  }`}
                >
                  {showCustom ? 'Custom Amount Selected' : '+ Enter Custom Amount'}
                </button>

                {/* Amount Field */}
                <div className={`flex items-center gap-2 rounded-xl p-4 ${showCustom ? 'bg-primary/5 border-2 border-primary' : 'bg-surface'}`}>
                  <IndianRupee className="w-5 h-5 text-primary" />
                  <input
                    type="number"
                    min="1"
                    value={amount || ''}
                    placeholder="0.00"
                    onChange={(e) => { setAmount(parseInt(e.target.value) || 0); if (!PRESET_AMOUNTS.includes(parseInt(e.target.value))) setShowCustom(true) }}
                    className="text-2xl font-bold text-text-primary bg-transparent border-none outline-none w-full"
                  />
                </div>

                {/* Donor Info */}
                <div>
                  <p className="text-xs font-bold text-text-primary uppercase tracking-wider mb-3">Donor Information</p>
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <div className="relative flex-1">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                        <input type="text" required placeholder="Full Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                          className="w-full pl-10 pr-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                      </div>
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-text-secondary">+91</span>
                        <input type="tel" required maxLength={10} placeholder="XXXXX XXXXX *" value={form.phone}
                          onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                          className="w-full pl-12 pr-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                      </div>
                    </div>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                      <input type="email" placeholder="Email Address *" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="w-full pl-10 pr-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                    </div>
                  </div>
                </div>

                {/* PAN */}
                <div>
                  <p className="text-xs font-bold text-text-primary uppercase tracking-wider mb-3">Tax Benefit (Section 80G)</p>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                    <input type="text" placeholder="PAN Card Number (optional)" maxLength={10} value={form.pan}
                      onChange={(e) => setForm({ ...form, pan: e.target.value.toUpperCase() })}
                      className="w-full pl-10 pr-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                  <p className="text-[10px] text-text-secondary mt-1">* PAN is mandatory for donations to claim tax exemption features under registered acts.</p>
                </div>

                <button type="submit" className="w-full py-3 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary-dark transition-colors">
                  Donate ₹{amount.toLocaleString()} Now
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
