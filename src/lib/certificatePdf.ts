import { jsPDF } from 'jspdf'

interface CertificateData {
  memberName: string
  memberId?: string
  certificateTitle: string
  description?: string
  issuedDate: string
  issuedBy?: string
  notes?: string
  certificateNumber?: string
  orientation?: 'landscape' | 'portrait'
  template?: 'classic' | 'modern' | 'royal' | 'tricolor'
}

function fmtDate(d: string): string {
  const dt = new Date(d)
  return dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function generateCertificatePdf(data: CertificateData) {
  const isPortrait = data.orientation === 'portrait'
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: isPortrait ? 'portrait' : 'landscape' })
  const W = isPortrait ? 210 : 297, H = isPortrait ? 297 : 210

  // Background cream
  doc.setFillColor(255, 252, 245)
  doc.rect(0, 0, W, H, 'F')

  // Outer decorative border
  doc.setDrawColor(180, 130, 60)
  doc.setLineWidth(3)
  doc.rect(8, 8, W - 16, H - 16)
  doc.setLineWidth(0.8)
  doc.setDrawColor(220, 170, 80)
  doc.rect(12, 12, W - 24, H - 24)

  // Corner ornaments
  const corners = [[14, 14], [W - 14, 14], [14, H - 14], [W - 14, H - 14]]
  corners.forEach(([x, y]) => {
    doc.setFillColor(200, 150, 60)
    doc.circle(x, y, 2.5, 'F')
  })

  // Saffron top band
  doc.setFillColor(255, 153, 51)
  doc.rect(15, 15, W - 30, 22, 'F')

  // Organization name in header
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(14); doc.setFont('helvetica', 'bold')
  doc.text('AKHIL BHARATIYA GOSWAMI SABHA', W / 2, 23, { align: 'center' })
  doc.setFontSize(9); doc.setFont('helvetica', 'normal')
  doc.text('Paschim Bangal', W / 2, 31, { align: 'center' })

  // Certificate of heading
  doc.setTextColor(180, 130, 60)
  doc.setFontSize(11); doc.setFont('helvetica', 'bold')
  doc.text('CERTIFICATE', W / 2, 50, { align: 'center' })

  // Decorative line
  doc.setDrawColor(200, 150, 60); doc.setLineWidth(0.8)
  doc.line(80, 53, W / 2 - 18, 53)
  doc.line(W / 2 + 18, 53, W - 80, 53)
  doc.setFillColor(200, 150, 60); doc.circle(W / 2, 53, 1.5, 'F')

  // Certificate title
  doc.setTextColor(40, 40, 40)
  doc.setFontSize(22); doc.setFont('helvetica', 'bold')
  doc.text(data.certificateTitle.toUpperCase(), W / 2, 68, { align: 'center' })

  // Presented to
  doc.setTextColor(100, 80, 40)
  doc.setFontSize(10); doc.setFont('helvetica', 'italic')
  doc.text('This certificate is proudly presented to', W / 2, 82, { align: 'center' })

  // Member name
  doc.setTextColor(30, 30, 30)
  doc.setFontSize(28); doc.setFont('helvetica', 'bold')
  doc.text(data.memberName, W / 2, 98, { align: 'center' })

  // Underline under name
  const nameW = doc.getTextWidth(data.memberName)
  doc.setDrawColor(200, 150, 60); doc.setLineWidth(0.5)
  doc.line(W / 2 - nameW / 2, 101, W / 2 + nameW / 2, 101)

  // Member ID
  if (data.memberId) {
    doc.setTextColor(120, 100, 60)
    doc.setFontSize(9); doc.setFont('helvetica', 'normal')
    doc.text(`Member ID: ${data.memberId}`, W / 2, 109, { align: 'center' })
  }

  // Description
  if (data.description) {
    doc.setTextColor(70, 70, 70)
    doc.setFontSize(10); doc.setFont('helvetica', 'normal')
    const lines = doc.splitTextToSize(data.description, 200)
    doc.text(lines, W / 2, 120, { align: 'center' })
  }

  // Notes
  if (data.notes) {
    doc.setTextColor(90, 70, 40)
    doc.setFontSize(9); doc.setFont('helvetica', 'italic')
    const noteLines = doc.splitTextToSize(`"${data.notes}"`, 180)
    doc.text(noteLines, W / 2, 138, { align: 'center' })
  }

  // Bottom section
  const bottomY = 165
  doc.setDrawColor(200, 150, 60); doc.setLineWidth(0.5)
  doc.line(40, bottomY, 120, bottomY)
  doc.line(W - 120, bottomY, W - 40, bottomY)

  // Date
  doc.setTextColor(80, 80, 80)
  doc.setFontSize(9); doc.setFont('helvetica', 'normal')
  doc.text(fmtDate(data.issuedDate), 80, bottomY + 6, { align: 'center' })
  doc.text('Date of Issue', 80, bottomY + 12, { align: 'center' })

  // Issued by
  doc.setFont('helvetica', 'bold')
  doc.text(data.issuedBy || 'Akhil Bharatiya Goswami Sabha', W - 80, bottomY + 6, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  doc.text('Authorised Signatory', W - 80, bottomY + 12, { align: 'center' })

  // Certificate number
  if (data.certificateNumber) {
    doc.setTextColor(150, 150, 150)
    doc.setFontSize(7)
    doc.text(`Certificate No: ${data.certificateNumber}`, 20, H - 18)
  }

  // Bottom band
  doc.setFillColor(26, 107, 60)
  doc.rect(15, H - 25, W - 30, 10, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(7); doc.setFont('helvetica', 'normal')
  doc.text('akhilbharatiyagoswami.com  ·  Akhil Bharatiya Goswami Sabha, Paschim Bangal', W / 2, H - 18.5, { align: 'center' })

  const safeName = data.memberName.replace(/\s+/g, '_')
  const safeTitle = data.certificateTitle.replace(/\s+/g, '_')
  doc.save(`ABGSPB_${safeTitle}_${safeName}.pdf`)
}

// ── Template 2: Modern ────────────────────────────────────────────────────────
function generateModern(data: CertificateData) {
  const isPortrait = data.orientation === 'portrait'
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: isPortrait ? 'portrait' : 'landscape' })
  const W = isPortrait ? 210 : 297, H = isPortrait ? 297 : 210

  doc.setFillColor(255, 255, 255); doc.rect(0, 0, W, H, 'F')
  // Left orange accent bar
  doc.setFillColor(255, 153, 51); doc.rect(0, 0, 18, H, 'F')
  // Right thin line
  doc.setFillColor(240, 240, 240); doc.rect(W - 4, 0, 4, H, 'F')

  // Org name (vertical in sidebar)
  doc.setTextColor(255, 255, 255); doc.setFontSize(7); doc.setFont('helvetica', 'bold')
  doc.text('ABGSPB · PASCHIM BANGAL', 9, H / 2, { align: 'center', angle: 90 })

  const mx = 28
  // Certificate label
  doc.setTextColor(255, 153, 51); doc.setFontSize(10); doc.setFont('helvetica', 'bold')
  doc.text('CERTIFICATE', mx, 25)
  doc.setDrawColor(255, 153, 51); doc.setLineWidth(0.8)
  doc.line(mx, 28, mx + 40, 28)

  // Org full name
  doc.setTextColor(50, 50, 50); doc.setFontSize(13); doc.setFont('helvetica', 'bold')
  doc.text('Akhil Bharatiya Goswami Sabha', mx, 42)
  doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(120, 120, 120)
  doc.text('Paschim Bangal', mx, 50)

  doc.setDrawColor(230, 230, 230); doc.setLineWidth(0.3)
  doc.line(mx, 56, W - 15, 56)

  // Title
  doc.setTextColor(30, 30, 30); doc.setFontSize(isPortrait ? 20 : 24); doc.setFont('helvetica', 'bold')
  doc.text(data.certificateTitle.toUpperCase(), mx, isPortrait ? 75 : 78)

  doc.setFontSize(10); doc.setFont('helvetica', 'italic'); doc.setTextColor(100, 100, 100)
  doc.text('This certificate is proudly presented to', mx, isPortrait ? 88 : 91)

  // Name
  doc.setTextColor(30, 30, 30); doc.setFontSize(isPortrait ? 24 : 30); doc.setFont('helvetica', 'bold')
  doc.text(data.memberName, mx, isPortrait ? 104 : 108)

  if (data.memberId) {
    doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(150, 150, 150)
    doc.text(`Member ID: ${data.memberId}`, mx, isPortrait ? 113 : 117)
  }

  if (data.description) {
    doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor(80, 80, 80)
    const lines = doc.splitTextToSize(data.description, W - mx - 20)
    doc.text(lines, mx, isPortrait ? 128 : 132)
  }

  // Bottom area
  const bY = isPortrait ? 260 : 170
  doc.setDrawColor(230, 230, 230); doc.setLineWidth(0.3)
  doc.line(mx, bY, W - 15, bY)
  doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(80, 80, 80)
  doc.text(fmtDate(data.issuedDate), mx, bY + 8)
  doc.setFont('helvetica', 'normal'); doc.setTextColor(150, 150, 150)
  doc.text('Date of Issue', mx, bY + 15)
  doc.setFont('helvetica', 'bold'); doc.setTextColor(80, 80, 80)
  doc.text(data.issuedBy || 'Akhil Bharatiya Goswami Sabha', W - 15, bY + 8, { align: 'right' })
  doc.setFont('helvetica', 'normal'); doc.setTextColor(150, 150, 150)
  doc.text('Authorised Signatory', W - 15, bY + 15, { align: 'right' })

  const safeName = data.memberName.replace(/\s+/g, '_')
  const safeTitle = data.certificateTitle.replace(/\s+/g, '_')
  doc.save(`ABGSPB_${safeTitle}_${safeName}.pdf`)
}

// ── Template 3: Royal ─────────────────────────────────────────────────────────
function generateRoyal(data: CertificateData) {
  const isPortrait = data.orientation === 'portrait'
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: isPortrait ? 'portrait' : 'landscape' })
  const W = isPortrait ? 210 : 297, H = isPortrait ? 297 : 210

  // Dark navy background
  doc.setFillColor(15, 20, 50); doc.rect(0, 0, W, H, 'F')

  // Gold border
  doc.setDrawColor(212, 175, 55); doc.setLineWidth(2)
  doc.rect(8, 8, W - 16, H - 16)
  doc.setLineWidth(0.5); doc.setDrawColor(180, 140, 40)
  doc.rect(12, 12, W - 24, H - 24)

  // Gold top band
  doc.setFillColor(212, 175, 55); doc.rect(15, 15, W - 30, 20, 'F')
  doc.setTextColor(15, 20, 50); doc.setFontSize(11); doc.setFont('helvetica', 'bold')
  doc.text('AKHIL BHARATIYA GOSWAMI SABHA · PASCHIM BANGAL', W / 2, 27, { align: 'center' })

  // Certificate heading
  doc.setTextColor(212, 175, 55); doc.setFontSize(11); doc.setFont('helvetica', 'bold')
  doc.text('— CERTIFICATE —', W / 2, 52, { align: 'center' })

  // Title
  doc.setTextColor(255, 255, 255); doc.setFontSize(isPortrait ? 20 : 26); doc.setFont('helvetica', 'bold')
  doc.text(data.certificateTitle.toUpperCase(), W / 2, 68, { align: 'center' })

  doc.setTextColor(180, 160, 100); doc.setFontSize(10); doc.setFont('helvetica', 'italic')
  doc.text('This certificate is proudly presented to', W / 2, 82, { align: 'center' })

  // Name
  doc.setTextColor(212, 175, 55); doc.setFontSize(isPortrait ? 26 : 32); doc.setFont('helvetica', 'bold')
  doc.text(data.memberName, W / 2, 98, { align: 'center' })

  // Gold underline
  const nw = doc.getTextWidth(data.memberName)
  doc.setDrawColor(212, 175, 55); doc.setLineWidth(0.8)
  doc.line(W / 2 - nw / 2, 101, W / 2 + nw / 2, 101)

  if (data.memberId) {
    doc.setTextColor(150, 140, 100); doc.setFontSize(9); doc.setFont('helvetica', 'normal')
    doc.text(`Member ID: ${data.memberId}`, W / 2, 110, { align: 'center' })
  }

  if (data.description) {
    doc.setTextColor(200, 190, 160); doc.setFontSize(10); doc.setFont('helvetica', 'normal')
    const lines = doc.splitTextToSize(data.description, W - 60)
    doc.text(lines, W / 2, 123, { align: 'center' })
  }

  // Bottom
  const bY = isPortrait ? 255 : 162
  doc.setDrawColor(212, 175, 55); doc.setLineWidth(0.5)
  doc.line(40, bY, 120, bY); doc.line(W - 120, bY, W - 40, bY)
  doc.setTextColor(212, 175, 55); doc.setFontSize(9); doc.setFont('helvetica', 'normal')
  doc.text(fmtDate(data.issuedDate), 80, bY + 7, { align: 'center' })
  doc.text('Date of Issue', 80, bY + 13, { align: 'center' })
  doc.setFont('helvetica', 'bold')
  doc.text(data.issuedBy || 'Akhil Bharatiya Goswami Sabha', W - 80, bY + 7, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  doc.text('Authorised Signatory', W - 80, bY + 13, { align: 'center' })

  // Gold bottom band
  doc.setFillColor(212, 175, 55); doc.rect(15, H - 23, W - 30, 8, 'F')
  doc.setTextColor(15, 20, 50); doc.setFontSize(7); doc.setFont('helvetica', 'bold')
  doc.text('akhilbharatiyagoswami.com', W / 2, H - 17.5, { align: 'center' })

  const safeName = data.memberName.replace(/\s+/g, '_')
  const safeTitle = data.certificateTitle.replace(/\s+/g, '_')
  doc.save(`ABGSPB_${safeTitle}_${safeName}.pdf`)
}

// ── Template 4: Tricolor ──────────────────────────────────────────────────────
function generateTricolor(data: CertificateData) {
  const isPortrait = data.orientation === 'portrait'
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: isPortrait ? 'portrait' : 'landscape' })
  const W = isPortrait ? 210 : 297, H = isPortrait ? 297 : 210

  doc.setFillColor(255, 255, 255); doc.rect(0, 0, W, H, 'F')

  // Saffron top
  doc.setFillColor(255, 153, 51); doc.rect(0, 0, W, isPortrait ? 55 : 45, 'F')
  // Green bottom
  doc.setFillColor(19, 136, 8); doc.rect(0, H - (isPortrait ? 40 : 35), W, isPortrait ? 40 : 35, 'F')

  // Org name in saffron header
  doc.setTextColor(255, 255, 255); doc.setFontSize(13); doc.setFont('helvetica', 'bold')
  doc.text('AKHIL BHARATIYA GOSWAMI SABHA', W / 2, isPortrait ? 22 : 18, { align: 'center' })
  doc.setFontSize(9); doc.setFont('helvetica', 'normal')
  doc.text('Paschim Bangal', W / 2, isPortrait ? 32 : 27, { align: 'center' })

  // Certificate badge
  const bx = W / 2, by = isPortrait ? 55 : 45
  doc.setFillColor(255, 255, 255); doc.setDrawColor(255, 153, 51)
  doc.setLineWidth(1.5)
  doc.roundedRect(bx - 35, by - 7, 70, 14, 3, 3, 'FD')
  doc.setTextColor(255, 120, 0); doc.setFontSize(9); doc.setFont('helvetica', 'bold')
  doc.text('CERTIFICATE OF RECOGNITION', bx, by + 3, { align: 'center' })

  // Title
  doc.setTextColor(20, 20, 20); doc.setFontSize(isPortrait ? 22 : 26); doc.setFont('helvetica', 'bold')
  doc.text(data.certificateTitle.toUpperCase(), W / 2, isPortrait ? 82 : 72, { align: 'center' })

  doc.setFontSize(10); doc.setFont('helvetica', 'italic'); doc.setTextColor(100, 100, 100)
  doc.text('This is to certify that', W / 2, isPortrait ? 95 : 85, { align: 'center' })

  // Name
  doc.setTextColor(20, 20, 20); doc.setFontSize(isPortrait ? 26 : 32); doc.setFont('helvetica', 'bold')
  doc.text(data.memberName, W / 2, isPortrait ? 112 : 102, { align: 'center' })

  // Tricolor underline
  const nw = doc.getTextWidth(data.memberName)
  const ul = W / 2 - nw / 2, ur = W / 2 + nw / 2, uly = isPortrait ? 115 : 105
  doc.setDrawColor(255, 153, 51); doc.setLineWidth(1.5); doc.line(ul, uly, ul + nw / 3, uly)
  doc.setDrawColor(200, 200, 200); doc.line(ul + nw / 3, uly, ur - nw / 3, uly)
  doc.setDrawColor(19, 136, 8); doc.line(ur - nw / 3, uly, ur, uly)

  if (data.memberId) {
    doc.setTextColor(150, 150, 150); doc.setFontSize(9); doc.setFont('helvetica', 'normal')
    doc.text(`Member ID: ${data.memberId}`, W / 2, isPortrait ? 124 : 114, { align: 'center' })
  }

  if (data.description) {
    doc.setTextColor(70, 70, 70); doc.setFontSize(10); doc.setFont('helvetica', 'normal')
    const lines = doc.splitTextToSize(data.description, W - 60)
    doc.text(lines, W / 2, isPortrait ? 138 : 128, { align: 'center' })
  }

  // Bottom green section
  const gbY = H - (isPortrait ? 40 : 35)
  doc.setTextColor(255, 255, 255); doc.setFontSize(9); doc.setFont('helvetica', 'normal')
  doc.text(fmtDate(data.issuedDate), 60, gbY + 12, { align: 'center' })
  doc.text('Date of Issue', 60, gbY + 19, { align: 'center' })
  doc.setFont('helvetica', 'bold')
  doc.text(data.issuedBy || 'Akhil Bharatiya Goswami Sabha', W - 60, gbY + 12, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  doc.text('Authorised Signatory', W - 60, gbY + 19, { align: 'center' })
  doc.setFontSize(7)
  doc.text('akhilbharatiyagoswami.com', W / 2, gbY + 27, { align: 'center' })

  const safeName = data.memberName.replace(/\s+/g, '_')
  const safeTitle = data.certificateTitle.replace(/\s+/g, '_')
  doc.save(`ABGSPB_${safeTitle}_${safeName}.pdf`)
}

// ── Main export — routes to correct template ──────────────────────────────────
const _generateClassic = generateCertificatePdf
export { _generateClassic as generateClassicCertificate }

export function generateCertificate(data: CertificateData) {
  switch (data.template) {
    case 'modern': return generateModern(data)
    case 'royal': return generateRoyal(data)
    case 'tricolor': return generateTricolor(data)
    default: return generateCertificatePdf(data)
  }
}
