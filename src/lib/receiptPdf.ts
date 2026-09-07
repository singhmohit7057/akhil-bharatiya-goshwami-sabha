import { jsPDF } from 'jspdf'

function fmtDate(dateStr: string | undefined | null): string {
  if (!dateStr) return '—'
  const d = dateStr.split('T')[0] // strip time if present
  const parts = d.split('-')
  if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`
  return dateStr
}

interface ReceiptData {
  id: string
  amount: number
  donation_date: string
  purpose: string | null
  payment_method: string | null
  transaction_id: string | null
  memberName: string
  memberId?: string
  memberEmail?: string
}

function getExpiryDate(dateStr: string): string {
  const d = new Date(dateStr)
  d.setFullYear(d.getFullYear() + 1)
  return d.toISOString().split('T')[0]
}

export function generatePaymentReceiptPdf(data: ReceiptData) {
  const doc = new jsPDF({ unit: 'mm', format: 'a5', orientation: 'portrait' })

  const isMembership = data.purpose === 'Executive Membership'
  const receiptNo = data.id.slice(0, 8).toUpperCase()
  const date = fmtDate(data.donation_date)
  const amount = `Rs. ${Number(data.amount).toLocaleString('en-IN')}`
  const badge = isMembership ? 'MEMBERSHIP PAYMENT RECEIPT' : 'DONATION RECEIPT'
  const membershipStart = isMembership ? date : null
  const validUntil = isMembership
    ? fmtDate(getExpiryDate(data.donation_date))
    : null

  const W = 148, mx = 14
  let y = 0

  // Orange header
  doc.setFillColor(255, 153, 51)
  doc.rect(0, 0, W, 38, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(13); doc.setFont('helvetica', 'bold')
  doc.text('AKHIL BHARATIYA GOSWAMI SABHA', W / 2, 13, { align: 'center' })
  doc.setFontSize(9); doc.setFont('helvetica', 'normal')
  doc.text('Paschim Bangal', W / 2, 20, { align: 'center' })
  doc.setFontSize(8)
  const bw = doc.getTextWidth(badge) + 8
  doc.setFillColor(255, 255, 255, 0.3)
  doc.roundedRect((W - bw) / 2, 25, bw, 8, 3, 3, 'F')
  doc.setTextColor(255, 255, 255)
  doc.text(badge, W / 2, 30.5, { align: 'center' })

  y = 46
  doc.setTextColor(50, 50, 50)

  // Receipt No box
  doc.setFillColor(249, 249, 249); doc.setDrawColor(220, 220, 220)
  doc.roundedRect(mx, y, W - mx * 2, 10, 2, 2, 'FD')
  doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(150, 150, 150)
  doc.text('Receipt No.', mx + 3, y + 6.5)
  doc.setFont('helvetica', 'bold'); doc.setTextColor(50, 50, 50); doc.setFontSize(9)
  doc.text(receiptNo, W - mx - 3, y + 6.5, { align: 'right' })
  y += 16

  // Detail rows
  const rows: [string, string][] = [
    ...(data.memberId ? [['Member ID', data.memberId] as [string, string]] : []),
    ['Member Name', data.memberName],
    ...(data.memberEmail ? [['Email', data.memberEmail] as [string, string]] : []),
    ['Date', date],
    ['Purpose', data.purpose || 'General Donation'],
    ['Payment Mode', data.payment_method || 'N/A'],
    ...(data.transaction_id ? [['Remark', data.transaction_id] as [string, string]] : []),
  ]

  doc.setFontSize(9)
  rows.forEach(([label, value]) => {
    doc.setFont('helvetica', 'normal'); doc.setTextColor(130, 130, 130)
    doc.text(label + ':', mx, y)
    doc.setFont('helvetica', 'bold'); doc.setTextColor(50, 50, 50)
    doc.text(value, W - mx, y, { align: 'right' })
    doc.setDrawColor(235, 235, 235)
    doc.line(mx, y + 2, W - mx, y + 2)
    y += 9
  })

  y += 4
  // Amount box
  doc.setFillColor(255, 248, 240); doc.setDrawColor(255, 192, 100)
  doc.roundedRect(mx, y, W - mx * 2, 16, 3, 3, 'FD')
  doc.setFont('helvetica', 'normal'); doc.setTextColor(200, 100, 0); doc.setFontSize(10)
  doc.text('Amount Paid', mx + 4, y + 10)
  doc.setFont('helvetica', 'bold'); doc.setFontSize(16)
  doc.text(amount, W - mx - 4, y + 10.5, { align: 'right' })
  y += 22

  // Membership period
  if (membershipStart && validUntil) {
    doc.setFillColor(240, 253, 244); doc.setDrawColor(187, 247, 208)
    doc.roundedRect(mx, y, W - mx * 2, 18, 3, 3, 'FD')
    doc.setFont('helvetica', 'bold'); doc.setTextColor(22, 163, 74); doc.setFontSize(9)
    doc.text('Membership Period', W / 2, y + 6, { align: 'center' })
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8)
    doc.text(`From: ${membershipStart}`, mx + 6, y + 13)
    doc.text(`To: ${validUntil}`, W - mx - 6, y + 13, { align: 'right' })
    y += 22
  }

  // Footer
  y = 198
  doc.setDrawColor(220, 220, 220); doc.line(mx, y, W - mx, y)
  doc.setFont('helvetica', 'bold'); doc.setTextColor(80, 80, 80); doc.setFontSize(8)
  doc.text('Akhil Bharatiya Goswami Sabha, Paschim Bangal', W / 2, y + 6, { align: 'center' })
  doc.setFont('helvetica', 'normal'); doc.setTextColor(150, 150, 150); doc.setFontSize(7)
  doc.text('Computer-generated receipt. No signature required.', W / 2, y + 11, { align: 'center' })
  doc.text('akhilbharatiyagoswami.com · abgspb3@gmail.com', W / 2, y + 16, { align: 'center' })

  doc.save(`ABGSPB_${isMembership ? 'Membership' : 'Donation'}_Receipt_${receiptNo}.pdf`)
}

async function fetchImageBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url)
    const blob = await res.blob()
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(blob)
    })
  } catch { return null }
}

interface MemberProfileData {
  memberId?: string
  fullName: string
  email?: string
  phone?: string
  role?: string
  isExecutive?: boolean
  memberSince?: string
  membershipEndDate?: string
  fatherName?: string
  motherName?: string
  dob?: string
  gender?: string
  caste?: string
  gotra?: string
  maritalStatus?: string
  city?: string
  address?: string
  villageAddress?: string
  photoUrl?: string
  familyMembers?: { name: string; relation: string; gender?: string; dob?: string; photoUrl?: string }[]
  business?: {
    isEmployed: boolean
    businessName?: string
    employerName?: string
    sector?: string
    designation?: string
    gstNumber?: string
    phone?: string
    email?: string
    description?: string
    address?: string
    website?: string
    logoUrl?: string
    vcFrontUrl?: string
    vcBackUrl?: string
  } | null
  payments?: { date: string; purpose: string; amount: number; mode?: string | null }[]
}

export async function generateMemberProfilePdf(data: MemberProfileData) {
  const doc = new jsPDF({ unit: 'mm', format: 'a5', orientation: 'portrait' })
  const W = 148, mx = 12
  let y = 0

  const addHeader = (title: string) => {
    doc.setFillColor(255, 153, 51)
    doc.rect(0, 0, W, 36, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(12); doc.setFont('helvetica', 'bold')
    doc.text('AKHIL BHARATIYA GOSWAMI SABHA', W / 2, 12, { align: 'center' })
    doc.setFontSize(9); doc.setFont('helvetica', 'normal')
    doc.text('Paschim Bangal', W / 2, 19, { align: 'center' })
    doc.setFontSize(8)
    const bw = doc.getTextWidth(title) + 10
    doc.setFillColor(255, 255, 255, 0.3)
    doc.roundedRect((W - bw) / 2, 24, bw, 7, 2, 2, 'F')
    doc.setTextColor(255, 255, 255)
    doc.text(title, W / 2, 29, { align: 'center' })
  }

  // ── PAGE 1 ───────────────────────────────────────────────────────────────
  addHeader('MEMBER PROFILE')
  y = 42

  // Photo + name block
  const photoSize = 22
  let photoLoaded = false
  if (data.photoUrl) {
    const imgData = await fetchImageBase64(data.photoUrl)
    if (imgData) {
      doc.addImage(imgData, 'JPEG', mx, y, photoSize, photoSize)
      photoLoaded = true
    }
  }
  if (!photoLoaded) {
    doc.setFillColor(240, 230, 220); doc.setDrawColor(200, 180, 160)
    doc.roundedRect(mx, y, photoSize, photoSize, 3, 3, 'FD')
    doc.setTextColor(180, 150, 120); doc.setFontSize(14); doc.setFont('helvetica', 'bold')
    doc.text((data.fullName || 'M').charAt(0).toUpperCase(), mx + photoSize / 2, y + photoSize / 2 + 4, { align: 'center' })
  }

  const tx = mx + photoSize + 4
  doc.setTextColor(30, 30, 30)
  doc.setFontSize(12); doc.setFont('helvetica', 'bold')
  doc.text(data.fullName, tx, y + 7)
  doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(120, 120, 120)
  if (data.memberId) doc.text(`ID: ${data.memberId}`, tx, y + 14)
  // Role badge
  let badgeX = tx
  const badgeY = y + 17
  if (data.role) {
    doc.setFillColor(255, 240, 220); doc.setDrawColor(255, 200, 150)
    const rw = doc.getTextWidth(data.role) + 6
    doc.roundedRect(badgeX, badgeY, rw, 6, 1.5, 1.5, 'FD')
    doc.setTextColor(200, 100, 0); doc.setFontSize(7)
    doc.text(data.role, badgeX + 3, badgeY + 4.2)
    badgeX += rw + 3
  }
  if (data.isExecutive) {
    const label = 'Executive Member'
    const ew = doc.getTextWidth(label) + 6
    doc.setFillColor(255, 248, 220); doc.setDrawColor(250, 200, 100)
    doc.roundedRect(badgeX, badgeY, ew, 6, 1.5, 1.5, 'FD')
    doc.setTextColor(180, 120, 0); doc.setFontSize(7)
    doc.text(label, badgeX + 3, badgeY + 4.2)
  }
  y += photoSize + 8

  doc.setDrawColor(230, 230, 230); doc.line(mx, y, W - mx, y); y += 5

  // Row helpers
  const row = (label: string, value: string | null | undefined, required = false) => {
    const val = value || (required ? '—' : null)
    if (!val) return
    doc.setFont('helvetica', 'normal'); doc.setTextColor(140, 140, 140); doc.setFontSize(7.5)
    doc.text(label + ':', mx, y)
    doc.setFont('helvetica', 'bold'); doc.setTextColor(val === '—' ? 160 : 40, val === '—' ? 160 : 40, val === '—' ? 160 : 40); doc.setFontSize(8)
    doc.text(val, W / 2, y)
    y += 7
  }
  const sectionTitle = (title: string) => {
    doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 120, 40)
    doc.text(title, mx, y); y += 5
  }

  // PERSONAL DETAILS
  sectionTitle('PERSONAL DETAILS')
  row('Phone', data.phone)
  row('Email', data.email)
  row("Father's Name", data.fatherName, true)
  row("Mother's Name", data.motherName, true)
  row('Date of Birth', fmtDate(data.dob), true)
  row('Gender', data.gender ? data.gender.charAt(0).toUpperCase() + data.gender.slice(1) : null, true)
  row('Caste', data.caste, true)
  row('Gotra', data.gotra, true)
  row('Marital Status', data.maritalStatus ? data.maritalStatus.charAt(0).toUpperCase() + data.maritalStatus.slice(1) : null, true)
  row('Member Since', fmtDate(data.memberSince))
  if (data.isExecutive && data.membershipEndDate) row('Membership Till', fmtDate(data.membershipEndDate))

  // ADDRESS
  doc.setDrawColor(230, 230, 230); doc.line(mx, y, W - mx, y); y += 4
  sectionTitle('ADDRESS')
  row('City', data.city, true)
  const addrRow = (label: string, text: string | undefined) => {
    if (!text) { row(label, null, true); return }
    doc.setFont('helvetica', 'normal'); doc.setTextColor(140, 140, 140); doc.setFontSize(7.5)
    doc.text(label + ':', mx, y)
    doc.setFont('helvetica', 'bold'); doc.setTextColor(40, 40, 40); doc.setFontSize(7.5)
    const lines = doc.splitTextToSize(text, W - W / 2 - mx - 2)
    doc.text(lines, W / 2, y)
    y += lines.length * 5 + 2
  }
  addrRow('Local Address', data.address)
  addrRow('Village Address', data.villageAddress)

  // Page 1 footer
  doc.setDrawColor(220, 220, 220); doc.line(mx, 200, W - mx, 200)
  doc.setFont('helvetica', 'normal'); doc.setTextColor(150, 150, 150); doc.setFontSize(7)
  doc.text('Page 1 of 4  ·  akhilbharatiyagoswami.com · abgspb3@gmail.com', W / 2, 205, { align: 'center' })

  // ── PAGE 2: FAMILY DETAILS ────────────────────────────────────────────────
  doc.addPage()
  addHeader('FAMILY DETAILS')
  y = 42

  doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(50, 50, 50)
  doc.text(data.fullName, mx, y)
  if (data.memberId) {
    doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(130, 130, 130)
    doc.text(data.memberId, W - mx, y, { align: 'right' })
  }
  y += 10

  if (!data.familyMembers || data.familyMembers.length === 0) {
    doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(160, 160, 160)
    doc.text('No family members recorded.', W / 2, y + 10, { align: 'center' })
  } else {
    for (const [i, fm] of data.familyMembers.entries()) {
      const rowH = 18
      if (i % 2 === 0) { doc.setFillColor(252, 252, 252) } else { doc.setFillColor(255, 255, 255) }
      doc.rect(mx, y, W - mx * 2, rowH, 'F')

      // Photo
      const imgSize = 14
      let fmPhotoLoaded = false
      if (fm.photoUrl) {
        const fmImg = await fetchImageBase64(fm.photoUrl)
        if (fmImg) { doc.addImage(fmImg, 'JPEG', mx + 1, y + 2, imgSize, imgSize); fmPhotoLoaded = true }
      }
      if (!fmPhotoLoaded) {
        doc.setFillColor(220, 210, 200); doc.roundedRect(mx + 1, y + 2, imgSize, imgSize, 2, 2, 'F')
        doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(160, 130, 110)
        doc.text(fm.name.charAt(0).toUpperCase(), mx + 1 + imgSize / 2, y + 2 + imgSize / 2 + 2.5, { align: 'center' })
      }

      const tx2 = mx + imgSize + 4
      doc.setFontSize(8.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(40, 40, 40)
      doc.text(fm.name, tx2, y + 7)
      doc.setFontSize(7.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(100, 100, 100)
      const meta2 = [fm.relation, fm.gender ? fm.gender.charAt(0).toUpperCase() + fm.gender.slice(1) : '', fm.dob ? fmtDate(fm.dob) : ''].filter(Boolean).join('  ·  ')
      doc.text(meta2, tx2, y + 13)
      y += rowH + 2
    }
  }

  // Page 2 footer
  doc.setDrawColor(220, 220, 220); doc.line(mx, 200, W - mx, 200)
  doc.setFont('helvetica', 'normal'); doc.setTextColor(150, 150, 150); doc.setFontSize(7)
  doc.text('Page 2 of 4  ·  akhilbharatiyagoswami.com · abgspb3@gmail.com', W / 2, 205, { align: 'center' })

  // ── PAGE 2: BUSINESS / JOB DETAILS ───────────────────────────────────────
  doc.addPage()
  addHeader(data.business?.isEmployed ? 'JOB DETAILS' : 'BUSINESS DETAILS')
  y = 40

  doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(50, 50, 50)
  doc.text(data.fullName, mx, y)
  if (data.memberId) {
    doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(130, 130, 130)
    doc.text(data.memberId, W - mx, y, { align: 'right' })
  }
  y += 7

  const valX = mx + 32
  const valMaxW = W - mx - valX

  const bizRow = (label: string, value: string | null | undefined, required = false) => {
    const val = value || (required ? '—' : null)
    if (!val) return
    doc.setFont('helvetica', 'normal'); doc.setTextColor(140, 140, 140); doc.setFontSize(7)
    doc.text(label + ':', mx, y)
    doc.setFont('helvetica', 'bold'); doc.setTextColor(val === '—' ? 160 : 40, val === '—' ? 160 : 40, val === '—' ? 160 : 40); doc.setFontSize(7.5)
    const lines = doc.splitTextToSize(val, valMaxW)
    doc.text(lines, valX, y)
    y += lines.length > 1 ? lines.length * 4.5 + 1 : 6.5
  }

  if (!data.business) {
    doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(160, 160, 160)
    doc.text('No business or job details recorded.', W / 2, y + 10, { align: 'center' })
  } else {
    const biz = data.business
    bizRow('Type', biz.isEmployed ? 'Employed' : 'Business / Self-Employed')
    bizRow(biz.isEmployed ? 'Employer' : 'Business Name', biz.isEmployed ? biz.employerName : biz.businessName, true)
    bizRow('Sector', biz.sector, true)
    bizRow('Designation', biz.designation, true)
    bizRow('GST Number', biz.gstNumber, true)
    bizRow('Work Phone', biz.phone, true)
    bizRow('Work Email', biz.email, true)
    if (biz.description) {
      doc.setFont('helvetica', 'normal'); doc.setTextColor(140, 140, 140); doc.setFontSize(7)
      doc.text('Description:', mx, y)
      doc.setFont('helvetica', 'bold'); doc.setTextColor(40, 40, 40); doc.setFontSize(7)
      const lines = doc.splitTextToSize(biz.description, valMaxW)
      doc.text(lines, valX, y)
      y += lines.length * 4.5 + 2
    }
    bizRow('Address', biz.address, true)
    bizRow('Website', biz.website)

    // Business logo
    if (biz.logoUrl) {
      const logoData = await fetchImageBase64(biz.logoUrl)
      if (logoData) {
        y += 2
        doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 120, 40); doc.setFontSize(7.5)
        doc.text('BUSINESS LOGO', mx, y); y += 3
        doc.addImage(logoData, 'JPEG', mx, y, 15, 15)
        y += 18
      }
    }

    // Visiting cards
    const hasVc = biz.vcFrontUrl || biz.vcBackUrl
    if (hasVc) {
      y += 1
      doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 120, 40); doc.setFontSize(7.5)
      doc.text('VISITING CARD', mx, y); y += 3
      const vcW = biz.vcFrontUrl && biz.vcBackUrl ? 56 : 90
      const vcH = vcW * 0.56
      let vcX = mx
      if (biz.vcFrontUrl) {
        const vcFront = await fetchImageBase64(biz.vcFrontUrl)
        if (vcFront) { doc.addImage(vcFront, 'JPEG', vcX, y, vcW, vcH); vcX += vcW + 4 }
      }
      if (biz.vcBackUrl) {
        const vcBack = await fetchImageBase64(biz.vcBackUrl)
        if (vcBack) doc.addImage(vcBack, 'JPEG', vcX, y, vcW, vcH)
      }
      y += vcH + 3
    }
  }

  // Page 3 footer
  doc.setDrawColor(220, 220, 220); doc.line(mx, 200, W - mx, 200)
  doc.setFont('helvetica', 'normal'); doc.setTextColor(150, 150, 150); doc.setFontSize(7)
  doc.text('Page 3 of 4  ·  akhilbharatiyagoswami.com · abgspb3@gmail.com', W / 2, 205, { align: 'center' })

  // ── PAGE 3: TRANSACTIONS ─────────────────────────────────────────────────
  doc.addPage()
  addHeader('TRANSACTION HISTORY')
  y = 42

  doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(50, 50, 50)
  doc.text(data.fullName, mx, y)
  if (data.memberId) {
    doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(130, 130, 130)
    doc.text(data.memberId, W - mx, y, { align: 'right' })
  }
  y += 8

  const payments = data.payments || []
  if (payments.length === 0) {
    doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(160, 160, 160)
    doc.text('No payment records found.', W / 2, y + 10, { align: 'center' })
  } else {
    doc.setFillColor(245, 245, 245); doc.setDrawColor(220, 220, 220)
    doc.rect(mx, y, W - mx * 2, 7, 'FD')
    doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(100, 100, 100)
    doc.text('Date', mx + 2, y + 5)
    doc.text('Purpose', mx + 28, y + 5)
    doc.text('Mode', mx + 82, y + 5)
    doc.text('Amount', W - mx - 2, y + 5, { align: 'right' })
    y += 8

    let total = 0
    payments.forEach((p, i) => {
      if (i % 2 === 0) { doc.setFillColor(252, 252, 252) } else { doc.setFillColor(255, 255, 255) }
      doc.rect(mx, y - 1, W - mx * 2, 7, 'F')
      doc.setFontSize(7.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(60, 60, 60)
      doc.text(fmtDate(p.date), mx + 2, y + 4)
      doc.text(doc.splitTextToSize(p.purpose || 'General Donation', 50)[0], mx + 28, y + 4)
      doc.text(p.mode || '—', mx + 82, y + 4)
      doc.setFont('helvetica', 'bold'); doc.setTextColor(p.purpose === 'Executive Membership' ? 180 : 30, p.purpose === 'Executive Membership' ? 120 : 30, 0)
      doc.text(`Rs.${Number(p.amount).toLocaleString('en-IN')}`, W - mx - 2, y + 4, { align: 'right' })
      total += Number(p.amount)
      y += 7
    })

    y += 2
    doc.setDrawColor(255, 153, 51); doc.line(mx, y, W - mx, y); y += 4
    doc.setFillColor(255, 248, 240); doc.setDrawColor(255, 192, 100)
    doc.roundedRect(mx, y, W - mx * 2, 12, 2, 2, 'FD')
    doc.setFont('helvetica', 'normal'); doc.setTextColor(180, 90, 0); doc.setFontSize(8)
    doc.text(`Total Contributions (${payments.length} payments)`, mx + 4, y + 8)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11)
    doc.text(`Rs. ${total.toLocaleString('en-IN')}`, W - mx - 4, y + 8.5, { align: 'right' })
  }

  // Page 4 footer
  doc.setDrawColor(220, 220, 220); doc.line(mx, 195, W - mx, 195)
  doc.setFont('helvetica', 'bold'); doc.setTextColor(80, 80, 80); doc.setFontSize(7.5)
  doc.text('Akhil Bharatiya Goswami Sabha, Paschim Bangal', W / 2, 200, { align: 'center' })
  doc.setFont('helvetica', 'normal'); doc.setTextColor(150, 150, 150); doc.setFontSize(7)
  doc.text('Page 4 of 4  ·  akhilbharatiyagoswami.com · abgspb3@gmail.com', W / 2, 205, { align: 'center' })

  const safeId = data.memberId?.replace('/', '-') || data.fullName.replace(/\s+/g, '_')
  doc.save(`ABGSPB_Profile_${safeId}.pdf`)
}

interface SouvenirReceiptData {
  id: string
  amount: number
  date: string
  sponsorName: string
  companyName?: string
  phone?: string
  eventTitle?: string
  eventName?: string
  eventYear?: number
  adSize?: string
  paymentMode?: string
  remark?: string
}

export function generateSouvenirReceiptPdf(data: SouvenirReceiptData) {
  const doc = new jsPDF({ unit: 'mm', format: 'a5', orientation: 'portrait' })

  const receiptNo = data.id.slice(0, 8).toUpperCase()
  const date = fmtDate(data.date)
  const amount = `Rs. ${Number(data.amount).toLocaleString('en-IN')}`
  const adSizeLabel = data.adSize === 'full_page' ? 'Full Page' : data.adSize === 'half_page' ? 'Half Page' : (data.adSize || 'N/A')

  const W = 148, mx = 14
  let y = 0

  // Orange header
  doc.setFillColor(255, 153, 51)
  doc.rect(0, 0, W, 38, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(13); doc.setFont('helvetica', 'bold')
  doc.text('AKHIL BHARATIYA GOSWAMI SABHA', W / 2, 13, { align: 'center' })
  doc.setFontSize(9); doc.setFont('helvetica', 'normal')
  doc.text('Paschim Bangal', W / 2, 20, { align: 'center' })
  doc.setFontSize(8)
  const badge = 'SOUVENIR RECEIPT'
  const bw = doc.getTextWidth(badge) + 8
  doc.setFillColor(255, 255, 255, 0.3)
  doc.roundedRect((W - bw) / 2, 25, bw, 8, 3, 3, 'F')
  doc.setTextColor(255, 255, 255)
  doc.text(badge, W / 2, 30.5, { align: 'center' })

  y = 46
  doc.setTextColor(50, 50, 50)

  // Receipt No box
  doc.setFillColor(249, 249, 249); doc.setDrawColor(220, 220, 220)
  doc.roundedRect(mx, y, W - mx * 2, 10, 2, 2, 'FD')
  doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(150, 150, 150)
  doc.text('Receipt No.', mx + 3, y + 6.5)
  doc.setFont('helvetica', 'bold'); doc.setTextColor(50, 50, 50); doc.setFontSize(9)
  doc.text(receiptNo, W - mx - 3, y + 6.5, { align: 'right' })
  y += 16

  // Detail rows
  const rows: [string, string][] = [
    ['Sponsor Name', data.sponsorName],
    ...(data.companyName ? [['Company Name', data.companyName] as [string, string]] : []),
    ...(data.phone ? [['Contact Number', data.phone] as [string, string]] : []),
    ['Date', date],
    ...(data.eventTitle ? [['Event Title', data.eventTitle] as [string, string]] : []),
    ...((data.eventName || data.eventYear) ? [['Event', [data.eventName, data.eventYear].filter(Boolean).join(' ')] as [string, string]] : []),
    ['Ad Size', adSizeLabel],
    ['Payment Mode', data.paymentMode || 'N/A'],
    ...(data.remark ? [['Remark', data.remark] as [string, string]] : []),
  ]

  doc.setFontSize(9)
  rows.forEach(([label, value]) => {
    doc.setFont('helvetica', 'normal'); doc.setTextColor(130, 130, 130)
    doc.text(label + ':', mx, y)
    doc.setFont('helvetica', 'bold'); doc.setTextColor(50, 50, 50)
    doc.text(value, W - mx, y, { align: 'right' })
    doc.setDrawColor(235, 235, 235)
    doc.line(mx, y + 2, W - mx, y + 2)
    y += 9
  })

  y += 4
  // Amount box
  doc.setFillColor(255, 248, 240); doc.setDrawColor(255, 192, 100)
  doc.roundedRect(mx, y, W - mx * 2, 16, 3, 3, 'FD')
  doc.setFont('helvetica', 'normal'); doc.setTextColor(200, 100, 0); doc.setFontSize(10)
  doc.text('Amount Paid', mx + 4, y + 10)
  doc.setFont('helvetica', 'bold'); doc.setFontSize(16)
  doc.text(amount, W - mx - 4, y + 10.5, { align: 'right' })

  // Footer
  y = 198
  doc.setDrawColor(220, 220, 220); doc.line(mx, y, W - mx, y)
  doc.setFont('helvetica', 'bold'); doc.setTextColor(80, 80, 80); doc.setFontSize(8)
  doc.text('Akhil Bharatiya Goswami Sabha, Paschim Bangal', W / 2, y + 6, { align: 'center' })
  doc.setFont('helvetica', 'normal'); doc.setTextColor(150, 150, 150); doc.setFontSize(7)
  doc.text('Computer-generated receipt. No signature required.', W / 2, y + 11, { align: 'center' })
  doc.text('akhilbharatiyagoswami.com · abgspb3@gmail.com', W / 2, y + 16, { align: 'center' })

  doc.save(`ABGSPB_Souvenir_Receipt_${receiptNo}.pdf`)
}
