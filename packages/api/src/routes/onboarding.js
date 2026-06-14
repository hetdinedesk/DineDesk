const express = require('express')
const router = express.Router()
const multer = require('multer')
const { authenticateToken, requireRole } = require('../middleware/auth')

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true)
    else cb(new Error('Only PDF files are accepted'), false)
  }
})

// ── POST /api/onboarding/parse-pdf ────────────────────────────────────────
// Accepts an uploaded DineDesk onboarding PDF and returns structured JSON
// extracted from the text content. Used by CMS to prefill new client setup.
router.post(
  '/parse-pdf',
  authenticateToken,
  requireRole(['SUPER_ADMIN', 'MANAGER']),
  upload.single('pdf'),
  async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: 'No PDF file uploaded' })

      // Dynamically import pdf-parse (optional dep — graceful fallback)
      let pdfParse
      try {
        pdfParse = require('pdf-parse')
      } catch {
        return res.status(501).json({
          error: 'PDF parsing library not installed. Run: npm install pdf-parse --workspace=packages/api',
          fallback: true
        })
      }

      const parsed = await pdfParse(req.file.buffer)
      const text = parsed.text || ''

      // Helper: extract value after a label pattern
      const extract = (label, text) => {
        const regex = new RegExp(label + '[:\\s]+([^\\n]+)', 'i')
        const m = text.match(regex)
        return m ? m[1].trim() : ''
      }

      // Extract all structured fields from the PDF text
      const data = {
        // Business
        businessName:      extract('Restaurant \\/ Business Name', text) || extract('Business Name', text),
        tradingName:       extract('Trading Name', text),
        abn:               extract('ABN', text),
        acn:               extract('ACN', text),
        businessType:      extract('Business Type', text),
        cuisineType:       extract('Cuisine Type', text),
        businessAddress:   extract('Registered Business Address', text) || extract('Business Address', text),

        // Contact
        contactName:       extract('Full Name', text) || extract('Contact Name', text),
        contactRole:       extract('Role \\/ Title', text) || extract('Role', text),
        contactEmail:      extract('Email Address', text),
        contactPhone:      extract('Mobile \\/ Phone', text) || extract('Phone', text),
        contactPreference: extract('Preferred Contact Method', text),

        // Website & branding
        currentWebsite:    extract('Current Website', text),
        preferredDomain:   extract('Preferred Domain', text),
        brandColorPrimary: extract('Primary Brand Colour', text),
        brandColorSecondary: extract('Secondary Brand Colour', text),
        logoProvided:      extract('Do you have a logo', text),

        // POS
        posSystem:         extract('Current POS System', text),
        paymentProvider:   extract('Payment Provider', text),

        // Timeline
        goLiveDate:        extract('Desired Go-Live Date', text),
        plan:              extract('Package \\/ Plan', text) || extract('Plan', text),
        additionalNotes:   extract('Additional Notes', text),

        // Signature
        signedByName:      extract('Accepted by', text),

        // Theme & header
        theme:       extract('Selected Theme', text),
        headerType:  extract('Header Type', text),
        headerTheme: extract('Header Colour Mode', text),
        reviewsPlaceId: extract('Google Place ID', text),
        reviewsSource:  extract('Reviews Source', text),

        // Menu details
        menuUploadType:    extract('Menu Delivery Method', text),
        menuCategoryCount: extract('Categories \\(approx\\)', text),
        menuItemCount:     extract('Items \\(approx\\)', text),
        menuHasSizes:      extract('Size Variants', text),
        menuHasAddons:     extract('Add-ons \\/ Extras', text),
        menuNotes:         extract('Menu Notes', text),

        // Assets
        hasLogo:          extract('Logo', text),
        hasBannerImages:  extract('Hero \\/ Banner Images', text),
        hasMenuImages:    extract('Menu Item Photos', text),
        hasGalleryImages: extract('Gallery Photos', text),
        assetDeliveryMethod: extract('Asset Delivery Method', text),

        // Pages — scan for ✓ Yes
        pages: {
          home:         true,
          menu:         /menu[\s\S]{0,20}✓ yes/i.test(text),
          contact:      /contact us[\s\S]{0,20}✓ yes/i.test(text),
          about:        /about us[\s\S]{0,20}✓ yes/i.test(text),
          team:         /meet the team[\s\S]{0,20}✓ yes/i.test(text),
          locations:    /locations[\s\S]{0,20}✓ yes/i.test(text),
          specials:     /specials[\s\S]{0,20}✓ yes/i.test(text),
          gallery:      /gallery[\s\S]{0,20}✓ yes/i.test(text),
          privacyPolicy: true,
          terms:         true,
        },

        // Homepage sections — scan for ✓ Yes
        homepageLayout: {
          banners:  /hero banners[\s\S]{0,20}✓ yes/i.test(text),
          welcome:  /welcome section[\s\S]{0,20}✓ yes/i.test(text),
          promos:   /promo tiles[\s\S]{0,20}✓ yes/i.test(text),
          specials: /specials[\s\S]{0,20}✓ yes/i.test(text),
          featured: /featured items[\s\S]{0,20}✓ yes/i.test(text),
          loyalty:  /loyalty banner[\s\S]{0,20}✓ yes/i.test(text),
          reviews:  /reviews carousel[\s\S]{0,20}✓ yes/i.test(text),
          custom:   /custom block[\s\S]{0,20}✓ yes/i.test(text),
        },

        // Services — scan for "Yes" in each row
        services: {
          menuDisplay:    /menu display[\s\S]{0,30}yes/i.test(text),
          onlineOrdering: /online ordering[\s\S]{0,30}yes/i.test(text),
          reservations:   /table reservations[\s\S]{0,30}yes/i.test(text),
          specials:       /specials & promotions[\s\S]{0,30}yes/i.test(text),
          loyalty:        /loyalty program[\s\S]{0,30}yes/i.test(text),
          pos:            /pos integration[\s\S]{0,30}yes/i.test(text),
          multiLocation:  /multiple locations[\s\S]{0,30}yes/i.test(text),
          giftVouchers:   /gift vouchers[\s\S]{0,30}yes/i.test(text),
        },

        // Raw text for debugging / manual extraction
        _rawText: text.substring(0, 3000)
      }

      // Derive a suggested client ID from the business name
      const suggestedId = (data.businessName || 'new-client')
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .slice(0, 4)
        .join('-')

      return res.json({ success: true, data, suggestedId })
    } catch (err) {
      console.error('[onboarding/parse-pdf]', err)
      return res.status(500).json({ error: err.message })
    }
  }
)

module.exports = router
