import { jsPDF } from 'jspdf'

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
  const date = new Date(data.donation_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
  const amount = `Rs. ${Number(data.amount).toLocaleString('en-IN')}`
  const badge = isMembership ? 'MEMBERSHIP PAYMENT RECEIPT' : 'DONATION RECEIPT'
  const membershipStart = isMembership ? date : null
  const validUntil = isMembership
    ? new Date(getExpiryDate(data.donation_date)).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
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
  const date = new Date(data.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
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
