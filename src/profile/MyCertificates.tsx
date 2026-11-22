import { useEffect, useState } from 'react'
import { ScrollText, Download } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { generateCertificateHtml } from '../lib/generateCertificateHtml'
import { Spinner } from '../components/ui/Spinner'
import { CertificateHtmlPreview } from '../components/shared/CertificateHtmlPreview'

interface Cert {
  id: string
  issued_date: string
  notes: string | null
  certificate_types: { title_en: string; name: string; description_en: string | null; issued_by: string | null; orientation: string | null; template: string | null; signatories?: any[] | null } | null
}

export function MyCertificates() {
  const { profile } = useAuth()
  const [certs, setCerts] = useState<Cert[]>([])
  const [roleMap, setRoleMap] = useState<Record<string, string>>({}) // slug → full_name
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return
    Promise.all([
      supabase.from('member_certificates')
        .select('id, issued_date, notes, certificate_types!member_certificates_certificate_type_id_fkey(title_en, name, description_en, issued_by, orientation, template, signatories)')
        .eq('user_id', profile.id)
        .eq('show_on_profile', true)
        .order('issued_date', { ascending: false }),
      supabase.from('profiles').select('full_name, role').eq('account_status', 'active'),
    ]).then(([mc, pr]) => {
      setCerts((mc.data as unknown as Cert[]) || [])
      const map: Record<string, string> = {}
      ;((pr.data as any[]) || []).forEach((m: any) => { if (m.role) map[m.role] = m.full_name })
      setRoleMap(map)
      setLoading(false)
    })
  }, [profile])

  // Supabase sometimes returns joined table as array — normalize to single object
  function getCt(cert: Cert) {
    const raw = cert.certificate_types
    if (!raw) return null
    return Array.isArray(raw) ? (raw as any[])[0] ?? null : raw
  }

  function resolveSignatories(ct: Cert['certificate_types']) {
    if (!ct?.signatories?.length) return undefined
    return ct.signatories.map((s: any) => ({
      label: s.label || '',
      memberName: s.designationSlug ? roleMap[s.designationSlug] : undefined,
      signUrl: s.signUrl,
    }))
  }

  async function download(cert: Cert) {
    const ct = getCt(cert)
    await generateCertificateHtml({
      memberName: profile?.full_name || 'Member',
      memberId: profile?.member_id ?? undefined,
      certificateTitle: ct?.title_en || 'Certificate',
      description: ct?.description_en ?? undefined,
      issuedDate: cert.issued_date,
      issuedBy: ct?.issued_by ?? undefined,
      notes: cert.notes ?? undefined,
      certificateNumber: cert.id.slice(0, 8).toUpperCase(),
      orientation: (ct?.orientation as 'landscape' | 'portrait') || 'landscape',
      template: (ct?.template as 'classic' | 'modern' | 'royal' | 'tricolor') || 'classic',
      memberPhotoUrl: profile?.profile_photo_url ?? undefined,
      signatories: resolveSignatories(ct),
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
                const ct = getCt(cert)
                const isPortrait = ct?.orientation === 'portrait'
                const certW = isPortrait ? 595 : 794
                const certH = isPortrait ? 842 : 530
                const scale = isPortrait ? 0.24 : 0.38
                const containerH = isPortrait ? 226 : 220
                return (
                  <div className="w-full border-b border-border overflow-hidden flex justify-center items-start" style={{ height: `${containerH}px`, paddingTop: '12px', background: '#f5f5f5' }}>
                    <div style={{ transform: `scale(${scale})`, transformOrigin: 'top center', width: `${certW}px`, height: `${certH}px`, pointerEvents: 'none', flexShrink: 0 }}>
                      <CertificateHtmlPreview
                        template={ct?.template || 'classic'}
                        orientation={ct?.orientation || 'landscape'}
                        title={ct?.title_en || 'Certificate'}
                        memberName={profile?.full_name}
                        memberId={profile?.member_id ?? undefined}
                        description={ct?.description_en ?? undefined}
                        issuedDate={cert.issued_date}
                        issuedBy={ct?.issued_by ?? undefined}
                        memberPhotoUrl={profile?.profile_photo_url ?? undefined}
                        signatories={resolveSignatories(ct)}
                      />
                    </div>
                  </div>
                )
              })()}
              {/* Footer */}
              <div className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-text-primary">{getCt(cert)?.title_en}</p>
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
