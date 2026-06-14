import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const BRAND = [249, 115, 22]   // #f97316
const DARK  = [15, 23, 42]     // #0f172a
const GREY  = [100, 116, 139]  // #64748b
const LIGHT = [248, 250, 252]  // #f8fafc

function sectionHeader(doc, y, text) {
  doc.setFillColor(...BRAND)
  doc.roundedRect(14, y, 182, 8, 2, 2, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(255, 255, 255)
  doc.text(text.toUpperCase(), 18, y + 5.5)
  return y + 14
}

function field(doc, y, label, value, x = 14, w = 86) {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(...GREY)
  doc.text(label.toUpperCase(), x, y)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...DARK)
  const val = value || '—'
  const lines = doc.splitTextToSize(val, w - 4)
  doc.text(lines, x, y + 4.5)
  return y + 4.5 + (lines.length * 4.5)
}

function row2(doc, y, label1, val1, label2, val2) {
  const left = field(doc, y, label1, val1, 14, 88)
  const right = field(doc, y, label2, val2, 110, 88)
  return Math.max(left, right) + 3
}

export function generateOnboardingPDF(data) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()

  // ── HEADER BAR ──────────────────────────────────────────────
  doc.setFillColor(...BRAND)
  doc.rect(0, 0, pageW, 28, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.setTextColor(255, 255, 255)
  doc.text('DineDesk', 14, 17)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(255, 220, 190)
  doc.text('Client Onboarding Form', 14, 23)

  const submittedDate = new Date().toLocaleDateString('en-AU', {
    day: '2-digit', month: 'long', year: 'numeric'
  })
  doc.setTextColor(255, 255, 255)
  doc.text(`Submitted: ${submittedDate}`, pageW - 14, 17, { align: 'right' })

  // ── REF NUMBER ──────────────────────────────────────────────
  const ref = 'DD-' + Date.now().toString(36).toUpperCase()
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(255, 220, 190)
  doc.text(`Ref: ${ref}`, pageW - 14, 23, { align: 'right' })

  let y = 38

  // ── SECTION 1: Business Details ─────────────────────────────
  y = sectionHeader(doc, y, '1. Business Details')
  y = row2(doc, y, 'Restaurant / Business Name', data.businessName, 'Trading Name (if different)', data.tradingName)
  y = row2(doc, y, 'ABN', data.abn, 'ACN', data.acn)
  y = row2(doc, y, 'Business Type', data.businessType, 'Cuisine Type', data.cuisineType)
  y = field(doc, y, 'Business Address', data.businessAddress, 14, 182) + 3

  // ── SECTION 2: Primary Contact ──────────────────────────────
  y = sectionHeader(doc, y, '2. Primary Contact')
  y = row2(doc, y, 'Contact Name', data.contactName, 'Role / Title', data.contactRole)
  y = row2(doc, y, 'Email Address', data.contactEmail, 'Mobile / Phone', data.contactPhone)
  y = field(doc, y, 'Preferred Contact Method', data.contactPreference, 14, 182) + 3

  // ── SECTION 3: Locations ────────────────────────────────────
  y = sectionHeader(doc, y, '3. Restaurant Location(s)')
  if (data.locations && data.locations.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [['Location Name', 'Address', 'Suburb', 'State', 'Phone']],
      body: data.locations.map(l => [l.name || '—', l.address || '—', l.suburb || '—', l.state || '—', l.phone || '—']),
      styles: { fontSize: 8, cellPadding: 2.5 },
      headStyles: { fillColor: BRAND, textColor: [255,255,255], fontStyle: 'bold', fontSize: 7.5 },
      alternateRowStyles: { fillColor: LIGHT },
      margin: { left: 14, right: 14 },
      theme: 'grid'
    })
    y = doc.lastAutoTable.finalY + 8
  } else {
    y = field(doc, y, 'Location', 'No locations provided', 14, 182) + 8
  }

  // Check page overflow — add new page if needed
  if (y > pageH - 60) { doc.addPage(); y = 20 }

  // ── SECTION 4: Website & Branding ───────────────────────────
  y = sectionHeader(doc, y, '4. Website & Branding')
  y = row2(doc, y, 'Current Website', data.currentWebsite, 'Preferred Domain', data.preferredDomain)
  y = row2(doc, y, 'Primary Brand Colour', data.brandColorPrimary, 'Secondary Brand Colour', data.brandColorSecondary)
  y = row2(doc, y, 'Logo Provided?', data.logoProvided, 'Logo Format', data.logoFormat)
  y = field(doc, y, 'Brand Notes / Style Guide', data.brandNotes, 14, 182) + 3

  if (y > pageH - 60) { doc.addPage(); y = 20 }

  // ── SECTION 5: Theme ─────────────────────────────────────────
  y = sectionHeader(doc, y, '5. Theme Selection')
  y = row2(doc, y, 'Selected Theme', data.theme || '—', 'Header Type', data.headerType || '—')
  y = row2(doc, y, 'Header Colour Mode', data.headerTheme || '—', 'Utility Belt', data.utilityBelt ? 'Enabled' : 'Disabled')
  const utilityOn = Object.entries(data.utilityItems || {}).filter(([,v]) => v).map(([k]) => k).join(', ')
  y = field(doc, y, 'Utility Belt Components', utilityOn || '—', 14, 182) + 3
  if (data.headerCtas?.length) {
    autoTable(doc, {
      startY: y,
      head: [['CTA Label', 'URL', 'Variant']],
      body: data.headerCtas.map(c => [c.label||'—', c.url||'—', c.variant||'primary']),
      styles: { fontSize: 8, cellPadding: 2.5 },
      headStyles: { fillColor: BRAND, textColor: [255,255,255], fontStyle: 'bold', fontSize: 7.5 },
      alternateRowStyles: { fillColor: LIGHT },
      margin: { left: 14, right: 14 }, theme: 'grid'
    })
    y = doc.lastAutoTable.finalY + 8
  }

  if (y > pageH - 60) { doc.addPage(); y = 20 }

  // ── SECTION 6: Pages ─────────────────────────────────────────
  y = sectionHeader(doc, y, '6. Pages Required')
  const pageLabels = {
    home:'Home', menu:'Menu', contact:'Contact Us', about:'About Us',
    team:'Meet the Team', locations:'Locations', specials:'Specials',
    gallery:'Gallery', privacyPolicy:'Privacy Policy', terms:'Terms of Use'
  }
  const pagesBody = Object.entries(data.pages || {}).map(([k,v]) => [pageLabels[k]||k, v ? '✓ Yes' : '— No'])
  if (data.extraPages?.length) {
    data.extraPages.forEach(p => pagesBody.push([`Custom: ${p.title}`, p.purpose||'—']))
  }
  autoTable(doc, {
    startY: y,
    head: [['Page', 'Required']],
    body: pagesBody,
    styles: { fontSize: 8, cellPadding: 2.5 },
    headStyles: { fillColor: BRAND, textColor: [255,255,255], fontStyle: 'bold', fontSize: 7.5 },
    alternateRowStyles: { fillColor: LIGHT },
    margin: { left: 14, right: 14 }, theme: 'grid',
    columnStyles: { 1: { halign: 'center', cellWidth: 30 } }
  })
  y = doc.lastAutoTable.finalY + 8

  if (y > pageH - 60) { doc.addPage(); y = 20 }

  // ── SECTION 7: Homepage Layout ───────────────────────────────
  y = sectionHeader(doc, y, '7. Homepage Layout')
  const sectionLabels = {
    banners:'Hero Banners', welcome:'Welcome Section', promos:'Promo Tiles',
    specials:'Specials', featured:'Featured Items', loyalty:'Loyalty Banner',
    reviews:'Reviews Carousel', custom:'Custom Block'
  }
  const homepageBody = Object.entries(data.homepageLayout || {}).map(([k,v]) => [sectionLabels[k]||k, v ? '✓ Yes' : '— No'])
  autoTable(doc, {
    startY: y,
    head: [['Homepage Section', 'Include']],
    body: homepageBody,
    styles: { fontSize: 8, cellPadding: 2.5 },
    headStyles: { fillColor: BRAND, textColor: [255,255,255], fontStyle: 'bold', fontSize: 7.5 },
    alternateRowStyles: { fillColor: LIGHT },
    margin: { left: 14, right: 14 }, theme: 'grid',
    columnStyles: { 1: { halign: 'center', cellWidth: 30 } }
  })
  y = doc.lastAutoTable.finalY + 5
  if (data.homepageLayout?.reviews) {
    y = row2(doc, y, 'Reviews Source', data.reviewsSource||'—', 'Google Place ID', data.reviewsPlaceId||'—')
  }
  y += 3

  if (y > pageH - 60) { doc.addPage(); y = 20 }

  // ── SECTION 8: Menu ──────────────────────────────────────────
  y = sectionHeader(doc, y, '8. Menu Details')
  y = row2(doc, y, 'Menu Delivery Method', data.menuUploadType||'—', 'Categories (approx)', data.menuCategoryCount||'—')
  y = row2(doc, y, 'Items (approx)', data.menuItemCount||'—', 'Size Variants', data.menuHasSizes||'—')
  y = row2(doc, y, 'Add-ons / Extras', data.menuHasAddons||'—', '', '')
  y = field(doc, y, 'Menu Notes', data.menuNotes, 14, 182) + 3

  if (y > pageH - 60) { doc.addPage(); y = 20 }

  // ── SECTION 9: Specials ──────────────────────────────────────
  y = sectionHeader(doc, y, '9. Specials & Offers')
  if (data.specials?.length) {
    autoTable(doc, {
      startY: y,
      head: [['Title', 'Price / Value', 'Start', 'End', 'Recurring']],
      body: data.specials.map(s => [s.title||'—', s.price||'—', s.startDate||'—', s.isRegular ? 'Ongoing' : (s.endDate||'—'), s.isRegular ? 'Yes' : 'No']),
      styles: { fontSize: 7.5, cellPadding: 2 },
      headStyles: { fillColor: BRAND, textColor: [255,255,255], fontStyle: 'bold', fontSize: 7.5 },
      alternateRowStyles: { fillColor: LIGHT },
      margin: { left: 14, right: 14 }, theme: 'grid'
    })
    y = doc.lastAutoTable.finalY + 8
  } else {
    y = field(doc, y, 'Specials', 'None provided at this stage', 14, 182) + 8
  }

  if (y > pageH - 60) { doc.addPage(); y = 20 }

  // ── SECTION 10: Assets ───────────────────────────────────────
  y = sectionHeader(doc, y, '10. Assets & Media')
  y = row2(doc, y, 'Logo', data.hasLogo||'—', 'Hero / Banner Images', data.hasBannerImages||'—')
  y = row2(doc, y, 'Menu Item Photos', data.hasMenuImages||'—', 'Gallery Photos', data.hasGalleryImages||'—')
  y = row2(doc, y, 'Asset Delivery Method', data.assetDeliveryMethod||'—', '', '')
  y = field(doc, y, 'Asset Notes', data.assetNotes, 14, 182) + 3

  if (y > pageH - 60) { doc.addPage(); y = 20 }

  // ── SECTION 11: Features ─────────────────────────────────────
  y = sectionHeader(doc, y, '11. Features & Services')
  const services = [
    ['Online Ordering', data.services?.onlineOrdering ? 'Yes' : 'No'],
    ['Table Reservations', data.services?.reservations ? 'Yes' : 'No'],
    ['Menu Display', data.services?.menuDisplay ? 'Yes' : 'No'],
    ['Loyalty Program', data.services?.loyalty ? 'Yes' : 'No'],
    ['POS Integration', data.services?.pos ? 'Yes' : 'No'],
    ['Multiple Locations', data.services?.multiLocation ? 'Yes' : 'No'],
    ['Specials / Promotions', data.services?.specials ? 'Yes' : 'No'],
    ['Gift Vouchers', data.services?.giftVouchers ? 'Yes' : 'No'],
  ]
  autoTable(doc, {
    startY: y,
    head: [['Feature', 'Required']],
    body: services,
    styles: { fontSize: 8, cellPadding: 2.5 },
    headStyles: { fillColor: BRAND, textColor: [255,255,255], fontStyle: 'bold', fontSize: 7.5 },
    alternateRowStyles: { fillColor: LIGHT },
    margin: { left: 14, right: 14 }, theme: 'grid',
    columnStyles: { 1: { halign: 'center', cellWidth: 30 } }
  })
  y = doc.lastAutoTable.finalY + 8

  if (y > pageH - 60) { doc.addPage(); y = 20 }

  // ── SECTION 12: POS & Payments ───────────────────────────────
  y = sectionHeader(doc, y, '12. POS & Payment Details')
  y = row2(doc, y, 'Current POS System', data.posSystem, 'POS Version / Type', data.posVersion)
  y = row2(doc, y, 'Payment Provider', data.paymentProvider, 'Online Ordering Accepted', data.acceptsOnlinePayment)
  y = field(doc, y, 'Additional POS Notes', data.posNotes, 14, 182) + 3

  if (y > pageH - 70) { doc.addPage(); y = 20 }

  // ── SECTION 13: Go-Live & Timeline ───────────────────────────
  y = sectionHeader(doc, y, '13. Timeline & Go-Live')
  y = row2(doc, y, 'Desired Go-Live Date', data.goLiveDate, 'Package / Plan', data.plan)
  y = row2(doc, y, 'Referred By', data.referredBy, 'How Did You Hear About Us?', data.hearAboutUs)
  y = field(doc, y, 'Additional Notes / Special Requirements', data.additionalNotes, 14, 182) + 3

  if (y > pageH - 60) { doc.addPage(); y = 20 }

  // ── SECTION 14: Terms & Signature ────────────────────────────
  y = sectionHeader(doc, y, '14. Terms & Conditions — Acceptance')

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(...GREY)
  const termsText = `By signing below, the client agrees to DineDesk's Terms of Service, Privacy Policy and Service Level Agreement. The client confirms all information provided is accurate and authorises DineDesk to proceed with site setup based on the details provided.`
  const termsLines = doc.splitTextToSize(termsText, 182)
  doc.text(termsLines, 14, y)
  y += termsLines.length * 3.8 + 5

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...DARK)
  doc.text(`Accepted by: ${data.signedByName || data.contactName || ''}`, 14, y)
  y += 5

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...GREY)
  doc.text(`Date: ${submittedDate}`, 14, y)
  y += 4

  if (data.signatureConsent) {
    doc.setTextColor(22, 163, 74)
    doc.setFont('helvetica', 'bold')
    doc.text('✓ Client confirmed agreement to Terms of Service & Privacy Policy', 14, y)
    y += 5
  }

  // ── SIGNATURE LINE ───────────────────────────────────────────
  y += 8
  doc.setDrawColor(...DARK)
  doc.setLineWidth(0.3)
  doc.line(14, y, 100, y)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(...GREY)
  doc.text('Authorised Signature', 14, y + 3.5)

  doc.line(114, y, 200, y)
  doc.text('Date', 114, y + 3.5)

  // ── FOOTER ───────────────────────────────────────────────────
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFillColor(248, 250, 252)
    doc.rect(0, pageH - 12, pageW, 12, 'F')
    doc.setDrawColor(226, 232, 240)
    doc.setLineWidth(0.3)
    doc.line(0, pageH - 12, pageW, pageH - 12)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...GREY)
    doc.text('DineDesk — Confidential Onboarding Document', 14, pageH - 4.5)
    doc.text(`Ref: ${ref}  |  Page ${i} of ${totalPages}`, pageW - 14, pageH - 4.5, { align: 'right' })
  }

  // Return both the blob and the ref
  return { pdf: doc, ref, filename: `DineDesk_Onboarding_${(data.businessName || 'Client').replace(/\s+/g, '_')}_${ref}.pdf` }
}
