interface SignatoryDisplay { label: string; memberName?: string; signUrl?: string }

interface Props {
  template: string
  orientation: string
  title?: string
  memberName?: string
  memberId?: string
  description?: string
  issuedDate?: string
  issuedBy?: string
  memberPhotoUrl?: string
  signatories?: SignatoryDisplay[]
}

// Renders an accurate scaled HTML preview of a certificate.
// Parent must set a fixed height container with overflow:hidden.
// scale is applied via transform: scale(scale) on the inner element.
export function CertificateHtmlPreview({ template, orientation, title = 'Certificate Title', memberName = 'Member Name', memberId, description, issuedDate, issuedBy, memberPhotoUrl, signatories }: Props) {
  const isPortrait = orientation === 'portrait'
  const W = isPortrait ? 595 : 794
  const H = isPortrait ? 842 : 530

  const inner = (() => {
    if (template === 'modern') return (
      <div style={{ width: W, height: H, background: '#fff', position: 'relative', fontFamily: 'Arial, sans-serif', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 60, background: '#ff9933', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: '#fff', fontSize: 11, fontWeight: 700, writingMode: 'vertical-rl', transform: 'rotate(180deg)', letterSpacing: 2 }}>ABGSPB · PASCHIM BANGAL</span>
        </div>
        <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 12, background: '#f0f0f0' }} />
        <div style={{ marginLeft: 80, padding: isPortrait ? '28px 24px' : '24px 24px' }}>
          <div style={{ color: '#ff9933', fontSize: 14, fontWeight: 700, letterSpacing: 3, borderBottom: '2px solid #ff9933', display: 'inline-block', paddingBottom: 3, marginBottom: 10 }}>CERTIFICATE</div>
          <div style={{ color: '#222', fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Akhil Bharatiya Goswami Sabha</div>
          <div style={{ color: '#aaa', fontSize: 12, marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #eee' }}>Paschim Bangal</div>
          <div style={{ color: '#111', fontSize: isPortrait ? 28 : 32, fontWeight: 700, marginBottom: 6, textTransform: 'uppercase' }}>{title}</div>
          <div style={{ color: '#999', fontSize: 13, fontStyle: 'italic', marginBottom: 14 }}>This certificate is proudly presented to</div>
          <div style={{ color: '#111', fontSize: isPortrait ? 36 : 42, fontWeight: 700, marginBottom: 4 }}>{memberName}</div>
          {memberId && <div style={{ color: '#bbb', fontSize: 12 }}>Member ID: {memberId}</div>}
          {description && <div style={{ color: '#555', fontSize: 13, marginTop: 14, maxWidth: 480 }}>{description}</div>}
          <div style={{ position: 'absolute', bottom: 24, left: 90, right: 20, borderTop: '1px solid #eee', paddingTop: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div><div style={{ color: '#555', fontSize: 12, fontWeight: 700 }}>{issuedDate ? new Date(issuedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}</div><div style={{ color: '#aaa', fontSize: 10 }}>Date of Issue</div></div>
              <div style={{ textAlign: 'right' }}><div style={{ color: '#555', fontSize: 12, fontWeight: 700 }}>Akhil Bharatiya Goswami Sabha</div><div style={{ color: '#aaa', fontSize: 10 }}>Authorised Signatory</div></div>
            </div>
          </div>
        </div>
      </div>
    )

    if (template === 'royal') return (
      <div style={{ width: W, height: H, background: '#fff', position: 'relative', fontFamily: 'Arial, sans-serif', overflow: 'hidden' }}>
        {/* Top bands */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 5, background: '#ff9933' }} />
        <div style={{ position: 'absolute', top: 5, left: 0, right: 0, height: 3, background: '#005aaa' }} />
        {/* Bottom bands */}
        <div style={{ position: 'absolute', bottom: 3, left: 0, right: 0, height: 5, background: '#005aaa' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: '#ff9933' }} />
        {/* Left side bar */}
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 10, background: '#ff9933' }} />
        <div style={{ position: 'absolute', left: 10, top: 0, bottom: 0, width: 5, background: '#ffbe50' }} />
        <div style={{ position: 'absolute', left: 15, top: 0, bottom: 0, width: 7, background: '#005aaa' }} />
        {/* Right side bar */}
        <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 10, background: '#ff9933' }} />
        <div style={{ position: 'absolute', right: 10, top: 0, bottom: 0, width: 5, background: '#ffbe50' }} />
        <div style={{ position: 'absolute', right: 15, top: 0, bottom: 0, width: 7, background: '#005aaa' }} />
        {/* Header */}
        <div style={{ margin: '10px 25px 0', background: '#fff8ed', border: '1px solid #ff9933', padding: isPortrait ? '8px 10px' : '6px 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Left: Logo */}
          <div style={{ flexShrink: 0, width: isPortrait ? 56 : 44 }}>
            <img src="/logo.png" alt="ABGSPB" style={{ width: isPortrait ? 56 : 44, height: isPortrait ? 56 : 44, objectFit: 'contain', borderRadius: '50%' }} />
          </div>
          {/* Center: Org name + address */}
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 7, color: '#888', marginBottom: 2 }}>Regd. No. S/1L/52021</div>
            <div style={{ color: '#b83000', fontSize: isPortrait ? 16 : 13, fontWeight: 700, letterSpacing: 1 }}>AKHIL BHARATIYA GOSWAMI SABHA</div>
            <div style={{ color: '#7a3c00', fontSize: isPortrait ? 10 : 9, marginBottom: 3 }}>Paschim Bangal</div>
            <div style={{ color: '#111', fontSize: isPortrait ? 8 : 7, lineHeight: 1.5 }}>
              HQ: 24, Kashipur Road, Kolkata - 700 002<br />
              Mo. 90514 39163 | abgsp3@gmail.com | www.akhilbharatiyagoswami.com
            </div>
          </div>
          {/* Right: Swami photo */}
          <div style={{ flexShrink: 0, textAlign: 'center', width: isPortrait ? 56 : 44 }}>
            <img src="/swami2.jpeg" alt="Swami" style={{ width: isPortrait ? 50 : 40, height: isPortrait ? 50 : 40, objectFit: 'cover', borderRadius: '50%', border: '2px solid #ff9933' }} />
            <div style={{ fontSize: 6, color: '#555', marginTop: 2, lineHeight: 1.3 }}>श्री त्रिभुवन<br />पुरी जी महाराज</div>
          </div>
        </div>
        <div style={{ margin: '5px 25px 0', height: 2, background: '#ff9933' }} />
        <div style={{ margin: '2px 25px 0', height: 1, background: '#005aaa' }} />
        {/* Title badge */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: isPortrait ? 18 : 14, marginLeft: 22, marginRight: 22 }}>
          <span style={{ background: '#8c0f0f', border: '2px solid #d4a800', borderRadius: 20, padding: isPortrait ? '8px 32px' : '6px 24px', color: '#ffffff', fontSize: isPortrait ? 22 : 18, fontWeight: 'bold', letterSpacing: 1, textAlign: 'center', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{title}</span>
        </div>
        {/* Year */}
        <div style={{ display: 'flex', justifyContent: 'center', color: '#8c0f0f', fontSize: 11, marginTop: 10, fontWeight: 600 }}>
          Year {issuedDate ? new Date(issuedDate).getFullYear() : new Date().getFullYear()}
        </div>
        {/* Member photo */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: isPortrait ? 14 : 10 }}>
          {memberPhotoUrl ? (
            <img src={memberPhotoUrl} alt="" style={{ width: isPortrait ? 100 : 80, height: isPortrait ? 120 : 96, objectFit: 'cover', border: '3px solid #d4a800', borderRadius: 4 }} />
          ) : (
            <div style={{ width: isPortrait ? 100 : 80, height: isPortrait ? 120 : 96, border: '3px solid #d4a800', borderRadius: 4, background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc', fontSize: 11 }}>Photo</div>
          )}
        </div>
        {/* Member name */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: isPortrait ? 10 : 8, color: '#b83000', fontSize: isPortrait ? 32 : 28, fontWeight: 700 }}>{memberName}</div>
        {memberId && <div style={{ display: 'flex', justifyContent: 'center', color: '#888', fontSize: 11, marginTop: 4 }}>Member ID: {memberId}</div>}
        {description && <div style={{ textAlign: 'center', margin: isPortrait ? '14px 36px 0' : '10px 36px 0', color: '#333', fontSize: isPortrait ? 16 : 15, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{description}</div>}
        {/* Signatories */}
        <SignatoryRow signatories={signatories} bottom={isPortrait ? 55 : 38} textColor="#555" lineColor="#888" />
        {issuedBy && (
          <div style={{ position: 'absolute', bottom: 12, left: 0, right: 0, textAlign: 'center', color: '#555', fontSize: 10, fontStyle: 'italic' }}>
            {issuedBy}
          </div>
        )}
      </div>
    )

    if (template === 'tricolor') return (
      <div style={{ width: W, height: H, background: '#fff', position: 'relative', fontFamily: 'Arial, sans-serif', overflow: 'hidden' }}>
        <div style={{ background: '#ff9933', height: isPortrait ? 180 : 140, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ color: '#fff', fontSize: 20, fontWeight: 700, letterSpacing: 2 }}>AKHIL BHARATIYA GOSWAMI SABHA</div>
          <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, letterSpacing: 3, marginTop: 4 }}>Paschim Bangal</div>
        </div>
        <div style={{ textAlign: 'center', padding: isPortrait ? '20px 40px' : '14px 60px' }}>
          <div style={{ display: 'inline-block', border: '1.5px solid #ff9933', borderRadius: 4, padding: '4px 20px', marginBottom: 14 }}>
            <span style={{ color: '#ff7800', fontSize: 12, fontWeight: 700 }}>CERTIFICATE OF RECOGNITION</span>
          </div>
          <div style={{ color: '#111', fontSize: isPortrait ? 26 : 30, fontWeight: 700, textTransform: 'uppercase', marginBottom: 10 }}>{title}</div>
          <div style={{ color: '#888', fontSize: 13, fontStyle: 'italic', marginBottom: 16 }}>This is to certify that</div>
          <div style={{ color: '#111', fontSize: isPortrait ? 38 : 44, fontWeight: 700, marginBottom: 8 }}>{memberName}</div>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
            <div style={{ height: 4, width: 60, background: '#ff9933' }} />
            <div style={{ height: 4, width: 60, background: '#ccc' }} />
            <div style={{ height: 4, width: 60, background: '#138808' }} />
          </div>
          {memberId && <div style={{ color: '#aaa', fontSize: 12 }}>Member ID: {memberId}</div>}
          {description && <div style={{ color: '#555', fontSize: 13, marginTop: 14, maxWidth: 480, margin: '14px auto 0' }}>{description}</div>}
        </div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: '#138808', height: isPortrait ? 120 : 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <div style={{ display: 'flex', gap: 80 }}>
            <div style={{ textAlign: 'center' }}><div style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>{issuedDate ? new Date(issuedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}</div><div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10 }}>Date of Issue</div></div>
            <div style={{ textAlign: 'center' }}><div style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>Akhil Bharatiya Goswami Sabha</div><div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10 }}>Authorised Signatory</div></div>
          </div>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 9 }}>akhilbharatiyagoswami.com</div>
        </div>
      </div>
    )

    // Classic (default)
    return (
      <div style={{ width: W, height: H, background: '#fffcf5', border: '6px solid #b4823c', position: 'relative', fontFamily: 'Georgia, serif', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 8, border: '2px solid #dcaa50' }} />
        {([[14,14],[W-14,14],[14,H-14],[W-14,H-14]] as [number,number][]).map(([x,y],i) => (
          <div key={i} style={{ position: 'absolute', left: x-6, top: y-6, width: 12, height: 12, borderRadius: '50%', background: '#c89632' }} />
        ))}
        <div style={{ background: 'linear-gradient(90deg,#ff9933,#e8702a)', padding: '10px 0', textAlign: 'center' }}>
          <div style={{ color: '#fff', fontWeight: 'bold', fontSize: 18, letterSpacing: 2 }}>AKHIL BHARATIYA GOSWAMI SABHA</div>
          <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, letterSpacing: 3 }}>Paschim Bangal</div>
        </div>
        <div style={{ textAlign: 'center', padding: isPortrait ? '20px 40px 0' : '14px 60px 0' }}>
          <div style={{ color: '#b4823c', fontSize: 13, fontWeight: 'bold', letterSpacing: 4, textTransform: 'uppercase' }}>CERTIFICATE</div>
          <div style={{ width: '60%', margin: '6px auto', borderTop: '1px solid #c89630' }} />
          <div style={{ color: '#282828', fontWeight: 'bold', fontSize: isPortrait ? 26 : 30, letterSpacing: 2, textTransform: 'uppercase', marginTop: 10 }}>{title}</div>
          <div style={{ color: '#645028', fontSize: 12, fontStyle: 'italic', margin: '8px 0 4px' }}>This certificate is proudly presented to</div>
          <div style={{ color: '#1a1a1a', fontWeight: 'bold', fontSize: isPortrait ? 38 : 44 }}>{memberName}</div>
          <div style={{ width: '40%', margin: '4px auto', borderTop: '1px solid #c89630' }} />
          {memberId && <div style={{ color: '#787050', fontSize: 11, marginTop: 4 }}>Member ID: {memberId}</div>}
          {description && <div style={{ color: '#464646', fontSize: 12, marginTop: 12, maxWidth: 520, margin: '12px auto 0' }}>{description}</div>}
        </div>
        <div style={{ position: 'absolute', bottom: 0, left: 15, right: 15, background: 'linear-gradient(90deg,#1a6b3c,#138808)', padding: 6, textAlign: 'center' }}>
          <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 9 }}>akhilbharatiyagoswami.com · Akhil Bharatiya Goswami Sabha, Paschim Bangal</div>
        </div>
      </div>
    )
  })()

  return (
    <div style={{ width: W, height: H }}>
      {inner}
    </div>
  )
}

function SignatoryRow({ signatories, bottom, textColor = '#555', lineColor = '#888' }: {
  signatories?: SignatoryDisplay[]
  bottom: number
  textColor?: string
  lineColor?: string
}) {
  const slots = signatories?.length
    ? signatories
    : [
        { label: 'Founder' }, { label: 'President' },
        { label: 'Secretary' }, { label: 'Treasurer' },
      ]
  return (
    <div style={{ position: 'absolute', bottom, left: 25, right: 25 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        {slots.map((sig, i) => (
          <div key={i} style={{ textAlign: 'center', width: `${Math.floor(96 / slots.length)}%` }}>
            {sig.signUrl && (
              <img src={sig.signUrl} alt="" style={{ height: 28, maxWidth: 90, objectFit: 'contain', marginBottom: 2, display: 'inline-block' }} />
            )}
            <div style={{ borderTop: `1px solid ${lineColor}`, paddingTop: 4, color: textColor, fontSize: 9 }}>
              {sig.memberName && <div style={{ fontWeight: 600, fontSize: 9, marginBottom: 1 }}>{sig.memberName}</div>}
              {sig.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
