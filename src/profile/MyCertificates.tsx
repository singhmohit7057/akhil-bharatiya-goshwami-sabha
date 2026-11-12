import { useEffect, useState } from 'react'
import { ScrollText, Download } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { generateCertificate } from '../lib/certificatePdf'
import { Spinner } from '../components/ui/Spinner'

interface Cert {
  id: string
  issued_date: string
  notes: string | null
  certificate_types: { title_en: string; name: string; description_en: string | null; issued_by: string | null; orientation: string | null; template: string | null } | null
}

export function MyCertificates() {
  const { profile } = useAuth()
  const [certs, setCerts] = useState<Cert[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return
    supabase.from('member_certificates')
      .select('id, issued_date, notes, certificate_types(title_en, name, description_en, issued_by, orientation, template)')
      .eq('user_id', profile.id)
      .eq('show_on_profile', true)
      .order('issued_date', { ascending: false })
      .then(({ data }) => { setCerts((data as unknown as Cert[]) || []); setLoading(false) })
  }, [profile])

  function download(cert: Cert) {
    const ct = cert.certificate_types
    generateCertificate({
      memberName: profile?.full_name || 'Member',
      memberId: profile?.member_id || undefined,
      certificateTitle: ct?.title_en || 'Certificate',
      description: ct?.description_en || undefined,
      issuedDate: cert.issued_date,
      issuedBy: ct?.issued_by || undefined,
      notes: cert.notes || undefined,
      certificateNumber: cert.id.slice(0, 8).toUpperCase(),
      orientation: (ct?.orientation as 'landscape' | 'portrait') || 'landscape',
      template: (ct?.template as 'classic' | 'modern' | 'royal' | 'tricolor') || 'classic',
    })
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <ScrollText className="w-5 h-5 text-primary" />
        <h2 className="text-base font-semibold text-text-primary">My Certificates</h2>
      </div>

      {certs.length === 0 ? (
        <div className="bg-white rounded-xl border border-border p-10 text-center">
          <ScrollText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-text-secondary">No certificates issued yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {certs.map(cert => (
            <div key={cert.id} className="bg-white rounded-xl border border-border overflow-hidden">
              {/* Mini certificate preview */}
              {(() => {
                const isPortrait = cert.certificate_types?.orientation === 'portrait'
                // portrait: 210×297mm → 595×842px approx; landscape: 297×210mm → 794×530px approx
                const certW = isPortrait ? 595 : 794
                const certH = isPortrait ? 842 : 530
                const scale = isPortrait ? 0.24 : 0.38
                const containerH = isPortrait ? 226 : 220
                return (
              <div className="w-full bg-[#fffcf5] border-b border-border overflow-hidden flex justify-center items-start" style={{ height: `${containerH}px`, paddingTop: '12px' }}>
                <div style={{ transform: `scale(${scale})`, transformOrigin: 'top center', width: `${certW}px`, height: `${certH}px`, pointerEvents: 'none', flexShrink: 0 }}>
                  {/* Certificate preview */}
                  <div style={{ width: `${certW}px`, height: `${certH}px`, background: '#fffcf5', border: '6px solid #b4823c', position: 'relative', fontFamily: 'serif' }}>
                    <div style={{ position: 'absolute', inset: '8px', border: '2px solid #dcaa50' }} />
                    {/* Header */}
                    <div style={{ background: 'linear-gradient(90deg,#ff9933,#e8702a)', padding: '10px 0', textAlign: 'center' }}>
                      <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '18px', letterSpacing: '2px' }}>AKHIL BHARATIYA GOSWAMI SABHA</div>
                      <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '11px', letterSpacing: '3px' }}>Paschim Bangal</div>
                    </div>
                    {/* Body */}
                    <div style={{ textAlign: 'center', padding: '24px 40px 0' }}>
                      <div style={{ color: '#b4823c', fontSize: '13px', fontWeight: 'bold', letterSpacing: '4px', textTransform: 'uppercase' }}>CERTIFICATE</div>
                      <div style={{ width: '60%', margin: '6px auto', borderTop: '1px solid #c89630' }} />
                      <div style={{ color: '#282828', fontWeight: 'bold', fontSize: '26px', letterSpacing: '2px', textTransform: 'uppercase', marginTop: '10px' }}>
                        {cert.certificate_types?.title_en}
                      </div>
                      <div style={{ color: '#645028', fontSize: '12px', fontStyle: 'italic', margin: '8px 0 4px' }}>This certificate is proudly presented to</div>
                      <div style={{ color: '#1a1a1a', fontWeight: 'bold', fontSize: '36px' }}>{profile?.full_name}</div>
                      <div style={{ width: '40%', margin: '4px auto', borderTop: '1px solid #c89630' }} />
                      <div style={{ color: '#787050', fontSize: '11px', marginTop: '4px' }}>Member ID: {profile?.member_id}</div>
                      {cert.certificate_types?.description_en && (
                        <div style={{ color: '#464646', fontSize: '12px', marginTop: '12px', maxWidth: '520px', margin: '12px auto 0' }}>{cert.certificate_types.description_en}</div>
                      )}
                    </div>
                    {/* Bottom band */}
                    <div style={{ position: 'absolute', bottom: 0, left: '15px', right: '15px', background: 'linear-gradient(90deg,#1a6b3c,#138808)', padding: '6px', textAlign: 'center' }}>
                      <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '9px' }}>akhilbharatiyagoswami.com · Akhil Bharatiya Goswami Sabha, Paschim Bangal</div>
                    </div>
                  </div>
                </div>
              </div>
              )})()}
              {/* Footer */}
              <div className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-text-primary">{cert.certificate_types?.title_en}</p>
                  <p className="text-[11px] text-text-secondary">Issued: {new Date(cert.issued_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
                <button onClick={() => download(cert)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary border border-primary/30 rounded-lg hover:bg-primary/5 transition-colors shrink-0">
                  <Download className="w-3.5 h-3.5" /> Download PDF
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
