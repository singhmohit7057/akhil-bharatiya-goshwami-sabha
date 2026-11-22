import { createElement } from 'react'
import { createRoot } from 'react-dom/client'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import { CertificateHtmlPreview } from '../components/shared/CertificateHtmlPreview'

interface Signatory { label: string; memberName?: string; signUrl?: string }

interface CertData {
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
  memberPhotoUrl?: string
  signatories?: Signatory[]
}

export async function generateCertificateHtml(data: CertData): Promise<void> {
  const isPortrait = data.orientation === 'portrait'
  const W = isPortrait ? 595 : 794
  const H = isPortrait ? 842 : 530

  // Create off-screen container at full certificate resolution
  const container = document.createElement('div')
  container.style.cssText = `position:fixed;left:-${W + 10}px;top:0;width:${W}px;height:${H}px;overflow:hidden;`
  document.body.appendChild(container)

  const root = createRoot(container)

  // Render HTML preview and wait for browser paint
  await new Promise<void>(resolve => {
    root.render(
      createElement(CertificateHtmlPreview, {
        template: data.template || 'classic',
        orientation: data.orientation || 'landscape',
        title: data.certificateTitle,
        memberName: data.memberName,
        memberId: data.memberId,
        description: data.description,
        issuedDate: data.issuedDate,
        issuedBy: data.issuedBy,
        memberPhotoUrl: data.memberPhotoUrl,
        signatories: data.signatories,
      })
    )
    setTimeout(resolve, 500)
  })

  try {
    // Wait for fonts to load before capturing
    await document.fonts.ready

    const canvas = await html2canvas(container, {
      width: W,
      height: H,
      scale: 2,
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#ffffff',
      logging: false,
    })

    const docW = isPortrait ? 210 : 297
    const docH = isPortrait ? 297 : 210

    const doc = new jsPDF({
      unit: 'mm',
      format: 'a4',
      orientation: isPortrait ? 'portrait' : 'landscape',
    })
    doc.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, docW, docH)

    const safeName = data.memberName.replace(/\s+/g, '_')
    const safeTitle = data.certificateTitle.replace(/\s+/g, '_')
    doc.save(`ABGSPB_${safeTitle}_${safeName}.pdf`)
  } finally {
    root.unmount()
    document.body.removeChild(container)
  }
}
