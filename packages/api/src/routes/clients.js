const { log } = require('../lib/activityLog')
const express = require('express')
const { prisma } = require('../lib/prisma')
const { authenticateToken, requireRole } = require('../middleware/auth')
const { validateSiteConfig } = require('../lib/validation')
const { geocodeAddress, hasAddressChanged } = require('../lib/geocoding')
const multer = require('multer')
const sharp = require('sharp')
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3')
const fs = require('fs')
const path = require('path')

console.log('✅ Clients route file loaded')

// Generate short random ID (8 characters)
const generateShortId = () => {
  return Math.random().toString(36).substring(2, 10)
}

const upload = multer({ storage: multer.memoryStorage() })

// ═══════════════════════════════════════════════════════════
// Storage Configuration
// Supports both Cloudflare R2 and local filesystem fallback
// ═══════════════════════════════════════════════════════════

// Check if R2 is properly configured
const isR2Configured = () => {
  const { 
    CLOUDFLARE_R2_ENDPOINT, 
    CLOUDFLARE_R2_ACCESS_KEY, 
    CLOUDFLARE_R2_SECRET_KEY, 
    CLOUDFLARE_R2_BUCKET,
    CLOUDFLARE_R2_PUBLIC_URL 
  } = process.env
  
  return !!(CLOUDFLARE_R2_ENDPOINT && 
            CLOUDFLARE_R2_ACCESS_KEY && 
            CLOUDFLARE_R2_SECRET_KEY && 
            CLOUDFLARE_R2_BUCKET &&
            CLOUDFLARE_R2_PUBLIC_URL)
}

// Initialize R2 client only if configured
let r2 = null
if (isR2Configured()) {
  r2 = new S3Client({
    region: 'auto',
    endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
    credentials: {
      accessKeyId:     process.env.CLOUDFLARE_R2_ACCESS_KEY,
      secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_KEY
    }
  })
  console.log('✅ Cloudflare R2 storage configured')
} else {
  console.log('⚠️  Cloudflare R2 not configured — using local storage fallback')
}

// Ensure local uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

const router = express.Router()

// ═══════════════════════════════════════════════════════════════
// Simple in-memory cache for export endpoint
// Cache key: clientId, value: { data, timestamp }
// ═══════════════════════════════════════════════════════════════
const exportCache = new Map()
const CACHE_TTL_MS = 60000 // 60 seconds

function getCachedExport(clientId) {
  const cached = exportCache.get(clientId)
  if (!cached) return null
  const now = Date.now()
  if (now - cached.timestamp > CACHE_TTL_MS) {
    exportCache.delete(clientId)
    return null
  }
  return cached.data
}

function setCachedExport(clientId, data) {
  exportCache.set(clientId, { data, timestamp: Date.now() })
}

// ═══════════════════════════════════════════════════════════════
// PUBLIC ROUTES — no auth token needed
// MUST stay above router.use(authenticateToken)
// ═══════════════════════════════════════════════════════════════

router.get('/:id/export', async (req, res) => {
  console.log('📥 Export route called for ID:', req.params.id)
  try {
    const id = req.params.id

    // Check cache first
    const cached = getCachedExport(id)
    if (cached) {
      return res.json(cached)
    }

    const [client, menuCategories, menuItems, specials, pages, banners, footerSections, unassignedFooterLinks, cfg, navigationItems, homeSections, promoTiles, promoConfig, featuredConfig, welcomeContent, teamDepartments, specialsConfig, homepageLayout, customTextBlocks, paymentGateway, legalDocs] = await Promise.all([
      prisma.client.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          domain: true,
          status: true,
          locations: {
            select: {
              id: true,
              name: true,
              isPrimary: true,
              isActive: true,
              showInFooter: true,
              address: true,
              phone: true,
              formEmail: true
            }
          }
        }
      }),
      prisma.menuCategory.findMany({
        where: { clientId: id },
        orderBy: { sortOrder: 'asc' },
        select: {
          id: true,
          name: true,
          sortOrder: true
        }
      }),
      prisma.menuItem.findMany({
        where: { clientId: id },
        orderBy: { sortOrder: 'asc' },
        select: {
          id: true,
          categoryId: true,
          name: true,
          description: true,
          price: true,
          imageUrl: true,
          isAvailable: true,
          isFeatured: true,
          sortOrder: true
        }
      }),
      prisma.special.findMany({
        where: { clientId: id, isActive: true },
        select: {
          id: true,
          title: true,
          description: true,
          price: true,
          imageUrl: true,
          bannerImage: true,
          isActive: true,
          startDate: true,
          endDate: true,
          showInNav: true
        }
      }),
      prisma.page.findMany({
        where: { clientId: id, status: 'published' },
        select: {
          id: true,
          title: true,
          slug: true,
          subtitle: true,
          content: true,
          metaTitle: true,
          metaDesc: true,
          ogImage: true,
          pageType: true,
          status: true,
          bannerId: true,
          showEnquiryForm: true,
          showLocationMap: true,
          banner: { select: { id: true, imageUrl: true, title: true } }
        }
      }),
      prisma.banner.findMany({
        where: { clientId: id, isActive: true },
        orderBy: { sortOrder: 'asc' },
        select: {
          id: true,
          title: true,
          subtitle: true,
          text: true,
          imageUrl: true,
          buttonText: true,
          buttonUrl: true,
          isExternal: true,
          isActive: true,
          location: true,
          sortOrder: true,
          widthPx: true,
          heightPx: true
        }
      }),
      prisma.footerSection.findMany({
        where: { clientId: id },
        orderBy: { sortOrder: 'asc' },
        include: {
          links: { orderBy: { sortOrder: 'asc' }, include: { page: { select: { id: true, slug: true, pageType: true } } } }
        }
      }),
      prisma.footerLink.findMany({
        where: { clientId: id, footerSectionId: null },
        orderBy: { sortOrder: 'asc' },
        select: {
          id: true,
          label: true,
          externalUrl: true,
          pageId: true,
          sortOrder: true,
          isActive: true,
          page: { select: { id: true, slug: true, pageType: true } }
        }
      }),
      prisma.siteConfig.findUnique({ where: { clientId: id } }),
      prisma.navigationItem.findMany({
        where: { clientId: id, isActive: true },
        orderBy: { sortOrder: 'asc' },
        select: {
          id: true,
          label: true,
          url: true,
          parentId: true,
          sortOrder: true,
          isActive: true,
          pageId: true,
          page: { select: { id: true, slug: true, pageType: true } }
        }
      }).then(items => {
        // Build hierarchical tree
        const itemMap = new Map()
        const roots = []
        
        items.forEach(item => {
          itemMap.set(item.id, { ...item, children: [] })
        })
        
        items.forEach(item => {
          const node = itemMap.get(item.id)
          if (item.parentId && itemMap.has(item.parentId)) {
            itemMap.get(item.parentId).children.push(node)
          } else {
            roots.push(node)
          }
        })
        
        return roots
      }),
      prisma.homeSection.findMany({
        where: { clientId: id },
        orderBy: { sortOrder: 'asc' },
        select: {
          id: true,
          type: true,
          content: true,
          isActive: true,
          sortOrder: true,
          departmentId: true
        }
      }),
      prisma.promoTile.findMany({
        where: { clientId: id, isActive: true },
        orderBy: { sortOrder: 'asc' },
        select: {
          id: true,
          heading: true,
          subheading: true,
          imageUrl: true,
          linkUrl: true,
          linkLabel: true,
          isExternal: true,
          isActive: true,
          sortOrder: true
        }
      }),
      prisma.promoConfig.findUnique({
        where: { clientId: id }
      }).catch(() => null), // Handle missing table gracefully
      prisma.featuredConfig.findUnique({
        where: { clientId: id }
      }).catch(() => null), // Handle missing table gracefully
      prisma.welcomeContent.findUnique({
        where: { clientId: id }
      }).catch(() => null), // Handle missing table gracefully
      prisma.teamDepartment.findMany({
        where: { clientId: id, isActive: true },
        orderBy: { sortOrder: 'asc' },
        select: {
          id: true,
          name: true,
          isActive: true,
          sortOrder: true
        }
      }),
      prisma.specialsConfig.findUnique({
        where: { clientId: id }
      }).catch(() => null), // Handle missing table gracefully
      prisma.homepageLayout.findUnique({
        where: { clientId: id }
      }).catch(() => null), // Handle missing table gracefully
      prisma.customTextBlock.findMany({
        where: { clientId: id, isActive: true },
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          title: true,
          content: true,
          isActive: true,
          createdAt: true
        }
      }).catch(() => []), // Handle missing table gracefully
      prisma.paymentGateway.findUnique({
        where: { clientId: id },
        select: {
          id: true,
          provider: true,
          isActive: true,
          currency: true,
          cashEnabled: true,
          cashLabel: true,
          testMode: true,
          config: true
        }
      }),
      prisma.legalDoc.findMany({
        where: { clientId: id, isActive: true },
        orderBy: { id: 'asc' }
      })
    ])
    
    if (!client) return res.status(404).json({ error: 'Client not found' })

    // Fetch Google reviews if Place ID is set
let googleReviews = []
let finalReviews = []
let googlePlaceData = null
const placeId = cfg?.reviews?.googlePlaceId

// Check if reviews section is active and enabled in CMS
  const reviewsSection = homeSections.find(section => section.type === 'reviews' && section.isActive)
  let reviewsContent = {}
  if (reviewsSection) {
    try {
      reviewsContent = typeof reviewsSection.content === 'string' ? JSON.parse(reviewsSection.content) : reviewsSection.content || {}
    } catch (e) {
      reviewsContent = {}
    }
  }
  
  // Validate place ID format (Google Place IDs should start with "ChI" and be 27+ characters long)
  const isValidPlaceId = (placeId) => {
    if (!placeId || typeof placeId !== 'string') return false;
    // Google Place IDs typically start with "ChI" and are at least 27 characters
    return placeId.startsWith('ChI') && placeId.length >= 27;
  }
  
  // Only fetch Google reviews if:
  // 1. Reviews section is active and enabled
  // 2. Place ID is configured and valid
  // 3. Google Reviews are enabled in the section
  const shouldFetchGoogleReviews = reviewsSection && 
                                reviewsContent.showGoogleReviews !== false && 
                                placeId && 
                                isValidPlaceId(placeId) &&
                                process.env.GOOGLE_PLACES_API_KEY

  if (shouldFetchGoogleReviews) {
  try {
    const gRes = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,rating,user_ratings_total,reviews&key=${process.env.GOOGLE_PLACES_API_KEY}`
    )
    const gData = await gRes.json()
    if (gData.result) {
      googlePlaceData = {
        rating:       gData.result.rating,
        totalReviews: gData.result.user_ratings_total,
      }
      const minStars = cfg?.reviews?.minStars || 3
      const rawReviews = gData.result.reviews || []
      const filteredReviews = rawReviews.filter(r => r.rating >= minStars)
      googleReviews = (gData.result.reviews || [])
        .filter(r => r.rating >= minStars)
        .map(r => ({
          name:   r.author_name,
          stars:  r.rating,
          text:   r.text || 'No review text available',
          date:   r.time ? new Date(r.time * 1000).toISOString() : new Date().toISOString(), // Convert Unix timestamp to ISO string
          source: 'Google',
          photo:  r.profile_photo_url,
        }))
      // If we have very few reviews after filtering, supplement with sample reviews to ensure variety
      finalReviews = googleReviews;
      if (finalReviews.length < 5 && cfg?.reviews?.showSampleReviews !== false) {
        const sampleReviews = [
          {
            name: 'Sarah Mitchell',
            stars: 5,
            text: 'Absolutely fantastic dining experience! The atmosphere was perfect and the food was exceptional. Will definitely be coming back.',
            date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week ago
            source: 'Sample',
            photo: null,
          },
          {
            name: 'Michael Chen',
            stars: 4,
            text: 'Great restaurant with excellent service. The menu variety is impressive and everything we tried was delicious. Highly recommend!',
            date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 2 weeks ago
            source: 'Sample',
            photo: null,
          },
          {
            name: 'Emma Thompson',
            stars: 5,
            text: 'One of the best dining experiences we\'ve had! The attention to detail and quality of ingredients really shows. Perfect for special occasions.',
            date: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(), // 3 weeks ago
            source: 'Sample',
            photo: null,
          },
          {
            name: 'David Rodriguez',
            stars: 4,
            text: 'Excellent food and wonderful ambiance. The staff was very attentive and made us feel welcome. Will return soon!',
            date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 1 month ago
            source: 'Sample',
            photo: null,
          },
          {
            name: 'Lisa Anderson',
            stars: 5,
            text: 'Outstanding in every way! From the moment we walked in until we left, everything was perfect. The chef is truly talented.',
            date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(), // 1.5 months ago
            source: 'Sample',
            photo: null,
          }
        ];
        
        // Add sample reviews to reach at least 5 total reviews
        const neededReviews = 5 - finalReviews.length;
        finalReviews = [...finalReviews, ...sampleReviews.slice(0, neededReviews)];
      }
    }
  } catch (err) {
    console.error('[GOOGLE API] Error fetching Google reviews:', err)
  }
} else if (placeId && !isValidPlaceId(placeId)) {
  console.log('[GOOGLE API] Invalid Place ID format:', placeId);
}

const exportData = {
  client,
  locations: client.locations || [], // Extract locations from client
  menuCategories,
  menuItems,
  specials,
  pages,
  banners,
  footerSections,
  unassignedFooterLinks: unassignedFooterLinks || [],
  navigationItems,
  homeSections,
  promoTiles: promoTiles || [],
  promoConfig: promoConfig || { heading: null, subheading: null, isActive: true },
  featuredConfig: featuredConfig || { heading: null, subheading: null, isActive: true },
  welcomeContent: welcomeContent || { subtitle: null, heading: null, text: null, imageUrl: null, ctaText: null, ctaUrl: null, isExternal: false, isActive: true },
  teamDepartments: teamDepartments || [],
  specialsConfig: specialsConfig || { heading: null, subheading: null, showOnHomepage: false, maxItems: 2 },
  homepageLayout: homepageLayout || { components: [] },
  customTextBlocks: customTextBlocks || [],
  settings:   cfg?.settings   || {},
  shortcodes: cfg?.shortcodes || {},
  colours:    cfg?.colours    || {},
  analytics:  cfg?.analytics  || {},
  homepage:   cfg?.homepage   || {},
  booking:    cfg?.booking    || {},
  header:     cfg?.header     || {},
  headerCtas: cfg?.headerCtas || [],
  footer:     cfg?.footer     || {},
  social:     cfg?.social     || {},
  ordering:   cfg?.ordering   || { enabled: false },
  paymentGateway: paymentGateway ? {
    id: paymentGateway.id,
    provider: paymentGateway.provider,
    isActive: paymentGateway.isActive,
    currency: paymentGateway.currency,
    cashEnabled: paymentGateway.cashEnabled,
    cashLabel: paymentGateway.cashLabel,
    testMode: paymentGateway.testMode,
    testPublishableKey: paymentGateway.config?.testPublishableKey || '',
    livePublishableKey: paymentGateway.config?.livePublishableKey || ''
  } : {},
  legalDocs: legalDocs || [],
  siteType:   cfg?.settings?.siteType || 'restaurant',
  // Reviews — merge Google live data with CMS config
  reviews: {
    ...(cfg?.reviews || {}),
    // Override scores with live Google data if available
    overallScore:   googlePlaceData?.rating || cfg?.reviews?.overallScore || 4.5,
    googleCount:    googlePlaceData?.totalReviews || cfg?.reviews?.googleCount || 25,
    googleScore:    googlePlaceData?.rating || cfg?.reviews?.googleScore || 4.5,
    // Only provide reviews if they were fetched from Google or manually configured
    googleReviews: (finalReviews && finalReviews.length > 0) ? finalReviews : (cfg?.reviews?.googleReviews || []),
    // Google reviews configuration for frontend
    placeId: cfg?.reviews?.googlePlaceId || null,
    averageRating: googlePlaceData?.rating || cfg?.reviews?.averageRating || 4.5,
    totalReviews: googlePlaceData?.totalReviews || cfg?.reviews?.totalReviews || 25,
    showFloatingWidget: cfg?.reviews?.enableFloating !== false,
    showReviewCta: cfg?.reviews?.showReviewCta !== false,
    reviews: (finalReviews && finalReviews.length > 0) ? finalReviews : (cfg?.reviews?.googleReviews || []),
    // Carousel content options - only show if reviews section is active and enabled
    showReviewsCarousel: reviewsSection && reviewsContent.showGoogleReviews !== false,
    alternateStyles: cfg?.reviews?.alternateStyles === true
  }
}

    // Cache the response
    setCachedExport(id, exportData)

    res.json(exportData)
  } catch (err) {
    console.error('Export error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// ═══════════════════════════════════════════════════════════════
// PUBLIC SUB-ROUTERS — customer-facing (no auth required)
// ═══════════════════════════════════════════════════════════════
router.use('/:id/orders',     require('./orders'))
router.use('/:id/payments',   require('./payments'))

// ═══════════════════════════════════════════════════════════════
// PROTECTED ROUTES
// ═══════════════════════════════════════════════════════════════
router.use(authenticateToken)

// Debug logger for client routes
router.use((req, res, next) => {
  console.log(`[CLIENT ROUTE] ${req.method} ${req.url}`)
  next()
})

// Role-based access: Only SUPER_ADMIN and MANAGER can create/update/delete clients
// EDITOR can only view assigned clients (handled in individual routes)
const clientAdminOnly = requireRole('SUPER_ADMIN', 'MANAGER')

// ── Clients CRUD ──────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const clients = await prisma.client.findMany({
      include: { group: true, locations: true },
      orderBy: { updatedAt: 'desc' }
    })
    res.json(clients)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/', clientAdminOnly, async (req, res) => {
  try {
    const { name } = req.body

    // Check if client with same name already exists
    const existingClient = await prisma.client.findFirst({
      where: { name: name?.trim() }
    })

    if (existingClient) {
      return res.status(400).json({ error: 'A client with this name already exists' })
    }

    // Generate unique short ID with retry logic
    let shortId
    let attempts = 0
    const maxAttempts = 10

    while (attempts < maxAttempts) {
      attempts++
      shortId = generateShortId()
      const idExists = await prisma.client.findUnique({ where: { id: shortId } })
      if (!idExists) break
    }

    if (!shortId || attempts >= maxAttempts) {
      return res.status(500).json({ error: 'Could not generate unique ID' })
    }

    const client = await prisma.client.create({ data: { ...req.body, id: shortId } })
    await prisma.siteConfig.create({ data: { clientId: client.id } })

    // Auto-create Home page (unassigned - user decides whether to show in nav)
    await prisma.page.create({
      data: {
        clientId: client.id,
        slug: '',
        title: 'Home',
        subtitle: 'Welcome to ' + (client.name || 'our restaurant'),
        status: 'published',
        inNavigation: false,
        pageType: 'home',
        content: JSON.stringify({
          blocks: [
            { type: 'hero', title: 'Welcome', subtitle: 'Experience the finest dining' }
          ]
        })
      }
    })

    // Auto-create legal documents
    const privacyContent = `# Privacy Policy

## What Data We Collect

We collect the following types of data from our customers:

- **Personal Information**: Name, email address, phone number provided during checkout
- **Order Information**: Order details, items ordered, delivery/pickup preferences
- **Location Data**: Selected restaurant location for order fulfillment
- **Payment Information**: Payment method used (processed securely through Stripe)

## How We Use Your Data

We use your data to:

- Process and fulfill your orders
- Send order confirmations and receipts
- Communicate about your order status
- Improve our services and customer experience
- Respond to your inquiries and support requests

## How We Store and Protect Your Data

- All data is stored securely in encrypted databases
- Payment information is processed through Stripe and never stored on our servers
- We use industry-standard security measures to protect your data
- Access to your data is restricted to authorized personnel only

## Third-Party Services

We use the following third-party services:

- **Stripe**: For secure payment processing
- **Email Service**: For sending order confirmations and notifications
- **Cloudflare R2**: For secure file storage

## Cookie Policy

We use cookies to:
- Remember your preferences
- Maintain your shopping cart session
- Improve website performance
- Analyze website usage

## Data Retention

We retain your data for:
- Order records: 7 years (as required by law)
- Customer accounts: Until you request deletion
- Marketing communications: Until you opt out

## Your Rights

You have the right to:
- Access your personal data
- Request deletion of your data
- Opt out of marketing communications
- Update your information
- Lodge a complaint with relevant authorities

To exercise these rights, contact us at support@${client.name.toLowerCase().replace(/\s+/g, '')}.com`

    const termsContent = `# Terms & Conditions

## Order Acceptance & Cancellation Policies

- All orders are subject to availability
- We reserve the right to cancel orders if items are unavailable
- Customers may cancel orders within 30 minutes of placement
- Cancellations after 30 minutes may incur a fee
- We reserve the right to refuse service to anyone

## Payment Terms & Conditions

- Payment is required at time of ordering
- We accept credit/debit cards (via Stripe) and cash
- All prices are in ${client.currency || 'AUD'}
- Prices are subject to change without notice
- Refunds will be processed to the original payment method

## Refund Policies

- Full refunds for cancelled orders before preparation begins
- Partial refunds for orders cancelled during preparation
- No refunds for completed orders
- Refunds processed within 5-7 business days

## Service Availability & Disclaimers

- Online ordering is available during restaurant operating hours
- We do not guarantee preparation or delivery times
- We are not liable for delays due to weather, traffic, or other circumstances
- Images are for illustration purposes only

## User Accounts & Responsibilities

- Users must provide accurate and complete information
- Users are responsible for maintaining account security
- Users must be at least 18 years old to place orders
- One account per person is permitted

## Intellectual Property Rights

- All website content is owned by ${client.name}
- Menu items, recipes, and branding are proprietary
- Unauthorized reproduction is prohibited

## Limitation of Liability

- We are not liable for indirect or consequential damages
- Our liability is limited to the order value
- We are not responsible for third-party service interruptions

## Governing Law & Jurisdiction

- These terms are governed by the laws of Australia
- Any disputes will be resolved in Australian courts
- By using our service, you agree to these terms`

    const restaurantTermsContent = `# Terms of Service for Restaurants

## Restaurant Responsibilities

- Accurately maintain menu items, prices, and descriptions
- Fulfill orders within estimated preparation times
- Ensure food safety and quality standards
- Maintain accurate operating hours
- Provide excellent customer service

## Commission/Fee Structure

- Commission rates are as agreed in the restaurant agreement
- Fees are deducted from order totals before payout
- Detailed commission statements provided monthly
- Payment to restaurants within 7 days of order completion

## Payment Processing Terms

- All payments processed through the platform
- Stripe processes payments securely
- Restaurant agrees to payment terms and conditions
- Disputes handled according to Stripe's policies

## Order Fulfillment Obligations

- Accept all orders unless capacity is reached
- Notify platform immediately of capacity issues
- Cancel orders only in exceptional circumstances
- Maintain inventory accuracy

## Menu Accuracy Requirements

- Keep menu items, prices, and descriptions current
- Remove unavailable items promptly
- Update seasonal items regularly
- Ensure allergen information is accurate

## Cancellation Policies

- Restaurant may cancel orders with valid reason
- Customers may cancel within specified timeframes
- Platform reserves right to mediate disputes
- Repeated cancellations may affect restaurant rating

## Performance Standards

- Maintain average order completion time under 30 minutes
- Maintain customer satisfaction rating above 4.0/5.0
- Respond to customer inquiries within 24 hours
- Keep cancellation rate below 5%

## Termination

- Either party may terminate with 30 days notice
- Immediate termination for material breach
- Platform may suspend for policy violations
- Outstanding fees due at termination`

    await prisma.legalDoc.createMany({
      data: [
        {
          clientId: client.id,
          type: 'privacy',
          title: 'Privacy Policy',
          content: privacyContent,
          urlSlug: 'privacy',
          isActive: true
        },
        {
          clientId: client.id,
          type: 'terms',
          title: 'Terms & Conditions',
          content: termsContent,
          urlSlug: 'terms',
          isActive: true
        },
        {
          clientId: client.id,
          type: 'restaurant-terms',
          title: 'Restaurant Terms of Service',
          content: restaurantTermsContent,
          urlSlug: 'restaurant-terms',
          isActive: true
        }
      ]
    })

    // Auto-create footer section for legal links
    const legalFooterSection = await prisma.footerSection.create({
      data: {
        clientId: client.id,
        title: 'Legal',
        sortOrder: 999,
        isActive: true
      }
    })

    // Auto-create footer links for legal documents
    await prisma.footerLink.createMany({
      data: [
        {
          clientId: client.id,
          footerSectionId: legalFooterSection.id,
          label: 'Privacy Policy',
          externalUrl: '/privacy',
          sortOrder: 1,
          isActive: true
        },
        {
          clientId: client.id,
          footerSectionId: legalFooterSection.id,
          label: 'Terms & Conditions',
          externalUrl: '/terms',
          sortOrder: 2,
          isActive: true
        },
        {
          clientId: client.id,
          footerSectionId: legalFooterSection.id,
          label: 'Restaurant Terms',
          externalUrl: '/restaurant-terms',
          sortOrder: 3,
          isActive: true
        }
      ]
    })

    log({
      action: 'CLIENT_CREATED', entity: 'Client', entityName: client.name,
      userId: req.user.id, userName: req.user.name,
      clientId: client.id, clientName: client.name
    })
    res.json(client)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Clone a client
router.post('/:id/clone', clientAdminOnly, async (req, res) => {
  try {
    const sourceClient = await prisma.client.findUnique({
      where: { id: req.params.id },
      include: {
        siteConfig: true,
        menuCategories: { include: { items: true } },
        pages: true,
        navigationItems: true,
        footerSections: { include: { links: true } },
        banners: true,
        specials: true,
        promoTiles: true,
        promoConfig: true,
        specialsConfig: true,
        featuredConfig: true,
        welcomeContent: true,
        teamDepartments: true,
        homeSections: true,
        homepageLayout: true,
        customTextBlocks: true,
        legalDocs: true
      }
    })

    if (!sourceClient) {
      return res.status(404).json({ error: 'Client not found' })
    }

    // Generate unique short ID for cloned client
    let shortId
    let attempts = 0
    const maxAttempts = 10

    while (attempts < maxAttempts) {
      attempts++
      shortId = generateShortId()
      const idExists = await prisma.client.findUnique({ where: { id: shortId } })
      if (!idExists) break
    }

    if (!shortId || attempts >= maxAttempts) {
      return res.status(500).json({ error: 'Could not generate unique ID' })
    }

    // Create cloned client
    const clonedClient = await prisma.client.create({
      data: {
        id: shortId,
        name: sourceClient.name + ' (duplicate)',
        domain: null,
        status: 'draft',
        clonable: false
      }
    })

    // Clone site config
    if (sourceClient.siteConfig) {
      await prisma.siteConfig.create({
        data: {
          clientId: clonedClient.id,
          version: 1,
          settings: sourceClient.siteConfig.settings,
          netlify: sourceClient.siteConfig.netlify,
          colours: sourceClient.siteConfig.colours,
          analytics: sourceClient.siteConfig.analytics,
          shortcodes: sourceClient.siteConfig.shortcodes,
          homepage: sourceClient.siteConfig.homepage,
          reviews: sourceClient.siteConfig.reviews,
          booking: sourceClient.siteConfig.booking,
          notes: sourceClient.siteConfig.notes,
          header: sourceClient.siteConfig.header,
          footer: sourceClient.siteConfig.footer,
          headerCtas: sourceClient.siteConfig.headerCtas,
          social: sourceClient.siteConfig.social
        }
      })
    } else {
      await prisma.siteConfig.create({ data: { clientId: clonedClient.id } })
    }

    // Clone menu categories and items
    for (const category of sourceClient.menuCategories) {
      const clonedCategory = await prisma.menuCategory.create({
        data: {
          clientId: clonedClient.id,
          name: category.name,
          sortOrder: category.sortOrder
        }
      })

      for (const item of category.items) {
        await prisma.menuItem.create({
          data: {
            clientId: clonedClient.id,
            categoryId: clonedCategory.id,
            name: item.name,
            description: item.description,
            price: item.price,
            imageUrl: item.imageUrl,
            sortOrder: item.sortOrder,
            isAvailable: item.isAvailable,
            isFeatured: item.isFeatured
          }
        })
      }
    }

    // Clone pages
    for (const page of sourceClient.pages) {
      await prisma.page.create({
        data: {
          clientId: clonedClient.id,
          slug: page.slug,
          title: page.title,
          subtitle: page.subtitle,
          metaTitle: page.metaTitle,
          metaDesc: page.metaDesc,
          content: page.content,
          status: page.status,
          inNavigation: page.inNavigation,
          pageType: page.pageType,
          bannerId: null,
          parentId: null,
          navOrder: page.navOrder
        }
      })
    }

    // Clone navigation items
    for (const navItem of sourceClient.navigationItems) {
      await prisma.navigationItem.create({
        data: {
          clientId: clonedClient.id,
          label: navItem.label,
          pageId: null,
          url: navItem.url,
          parentId: null,
          sortOrder: navItem.sortOrder,
          isActive: navItem.isActive
        }
      })
    }

    // Clone footer sections
    for (const footerSection of sourceClient.footerSections) {
      const clonedFooterSection = await prisma.footerSection.create({
        data: {
          clientId: clonedClient.id,
          title: footerSection.title,
          sortOrder: footerSection.sortOrder
        }
      })

      for (const link of footerSection.links) {
        await prisma.footerLink.create({
          data: {
            clientId: clonedClient.id,
            footerSectionId: clonedFooterSection.id,
            pageId: null,
            label: link.label,
            externalUrl: link.externalUrl,
            sortOrder: link.sortOrder
          }
        })
      }
    }

    // Clone legal docs
    for (const legalDoc of sourceClient.legalDocs || []) {
      await prisma.legalDoc.create({
        data: {
          clientId: clonedClient.id,
          type: legalDoc.type,
          title: legalDoc.title,
          content: legalDoc.content,
          urlSlug: legalDoc.urlSlug,
          isActive: legalDoc.isActive
        }
      })
    }

    // Clone banners
    for (const banner of sourceClient.banners) {
      await prisma.banner.create({
        data: {
          clientId: clonedClient.id,
          imageUrl: banner.imageUrl,
          title: banner.title,
          subtitle: banner.subtitle,
          isActive: banner.isActive,
          sortOrder: banner.sortOrder
        }
      })
    }

    // Clone specials
    for (const special of sourceClient.specials) {
      await prisma.special.create({
        data: {
          clientId: clonedClient.id,
          title: special.title,
          description: special.description,
          price: special.price,
          imageUrl: special.imageUrl,
          bannerImage: special.bannerImage,
          startDate: special.startDate,
          endDate: special.endDate,
          isActive: special.isActive,
          showInNav: special.showInNav
        }
      })
    }

    // Clone promo tiles
    for (const promoTile of sourceClient.promoTiles) {
      await prisma.promoTile.create({
        data: {
          clientId: clonedClient.id,
          heading: promoTile.heading,
          subheading: promoTile.subheading,
          imageUrl: promoTile.imageUrl,
          linkUrl: promoTile.linkUrl,
          linkLabel: promoTile.linkLabel,
          isExternal: promoTile.isExternal,
          sortOrder: promoTile.sortOrder,
          isActive: promoTile.isActive
        }
      })
    }

    // Clone promo config
    if (sourceClient.promoConfig) {
      await prisma.promoConfig.create({
        data: {
          clientId: clonedClient.id,
          heading: sourceClient.promoConfig.heading,
          subheading: sourceClient.promoConfig.subheading,
          isActive: sourceClient.promoConfig.isActive
        }
      })
    }

    // Clone specials config
    if (sourceClient.specialsConfig) {
      await prisma.specialsConfig.create({
        data: {
          clientId: clonedClient.id,
          heading: sourceClient.specialsConfig.heading,
          subheading: sourceClient.specialsConfig.subheading,
          showOnHomepage: sourceClient.specialsConfig.showOnHomepage,
          maxItems: sourceClient.specialsConfig.maxItems
        }
      })
    }

    // Clone featured config
    if (sourceClient.featuredConfig) {
      await prisma.featuredConfig.create({
        data: {
          clientId: clonedClient.id,
          heading: sourceClient.featuredConfig.heading,
          subheading: sourceClient.featuredConfig.subheading,
          isActive: sourceClient.featuredConfig.isActive
        }
      })
    }

    // Clone welcome content
    if (sourceClient.welcomeContent) {
      await prisma.welcomeContent.create({
        data: {
          clientId: clonedClient.id,
          subtitle: sourceClient.welcomeContent.subtitle,
          heading: sourceClient.welcomeContent.heading,
          text: sourceClient.welcomeContent.text,
          imageUrl: sourceClient.welcomeContent.imageUrl,
          ctaText: sourceClient.welcomeContent.ctaText,
          ctaUrl: sourceClient.welcomeContent.ctaUrl,
          isExternal: sourceClient.welcomeContent.isExternal,
          isActive: sourceClient.welcomeContent.isActive
        }
      })
    }

    // Clone team departments
    for (const dept of sourceClient.teamDepartments) {
      await prisma.teamDepartment.create({
        data: {
          clientId: clonedClient.id,
          name: dept.name,
          sortOrder: dept.sortOrder,
          isActive: dept.isActive
        }
      })
    }

    // Clone home sections
    for (const section of sourceClient.homeSections) {
      const createdSection = await prisma.homeSection.create({
        data: {
          clientId: clonedClient.id,
          type: section.type,
          title: section.title,
          content: section.content,
          imageUrl: section.imageUrl,
          buttonText: section.buttonText,
          buttonUrl: section.buttonUrl,
          sortOrder: section.sortOrder,
          isActive: section.isActive
        }
      })

      // Clone member department relationships
      if (section.memberDepartments && section.memberDepartments.length > 0) {
        for (const md of section.memberDepartments) {
          await prisma.memberDepartment.create({
            data: {
              homeSectionId: createdSection.id,
              departmentId: md.departmentId
            }
          })
        }
      }
    }

    // Clone homepage layout
    if (sourceClient.homepageLayout) {
      await prisma.homepageLayout.create({
        data: {
          clientId: clonedClient.id,
          components: sourceClient.homepageLayout.components
        }
      })
    }

    // Clone custom text blocks
    for (const block of sourceClient.customTextBlocks) {
      await prisma.customTextBlock.create({
        data: {
          clientId: clonedClient.id,
          title: block.title,
          content: block.content,
          isActive: block.isActive
        }
      })
    }

    log({
      action: 'CLIENT_CLONED', entity: 'Client', entityName: clonedClient.name,
      userId: req.user.id, userName: req.user.name,
      clientId: clonedClient.id, clientName: clonedClient.name,
      sourceClientId: sourceClient.id, sourceClientName: sourceClient.name
    })

    res.json(clonedClient)
  } catch (err) {
    console.error('Clone client error:', err)
    res.status(500).json({ error: err.message })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const client = await prisma.client.findUnique({
      where: { id: req.params.id },
      include: { group: true, locations: true, pages: true, siteConfig: true }
    })
    if (!client) return res.status(404).json({ error: 'Client not found' })
    res.json(client)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/:id', clientAdminOnly, async (req, res) => {
  try {
    const clientId = req.params.id
    const client = await prisma.client.findUnique({ where: { id: clientId } })
    if (!client) return res.status(404).json({ error: 'Client not found' })

    // Whitelist allowed fields to prevent mass assignment
    const allowed = ['name', 'domain', 'status', 'groupId', 'clonable']
    const data = {}
    for (const key of allowed) {
      if (req.body[key] !== undefined) data[key] = req.body[key]
    }

    const updated = await prisma.client.update({
      where: { id: clientId },
      data
    })
    res.json(updated)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/:id', clientAdminOnly, async (req, res) => {
  try {
    const id = req.params.id
    await prisma.$transaction(async (tx) => {
      // Delete in dependency order (children before parents)
      await tx.order.deleteMany({ where: { clientId: id } })
      await tx.formSubmission.deleteMany({ where: { clientId: id } })
      await tx.deployment.deleteMany({ where: { clientId: id } })
      await tx.activityLog.deleteMany({ where: { clientId: id } })
      await tx.legalDoc.deleteMany({ where: { clientId: id } })
      await tx.paymentGateway.deleteMany({ where: { clientId: id } })
      await tx.alertPopup.deleteMany({ where: { clientId: id } })
      await tx.homeSection.deleteMany({ where: { clientId: id } })
      // Footer links → footer sections (cascade handles links, but be safe)
      await tx.footerLink.deleteMany({ where: { footerSection: { clientId: id } } })
      await tx.footerSection.deleteMany({ where: { clientId: id } })
      // Navigation items reference pages, delete nav first
      await tx.navigationItem.deleteMany({ where: { clientId: id } })
      // Pages have self-ref (parentId) and banner ref — clear both before deleting
      await tx.page.updateMany({ where: { clientId: id }, data: { bannerId: null, parentId: null } })
      await tx.banner.deleteMany({ where: { clientId: id } })
      await tx.page.deleteMany({ where: { clientId: id } })
      await tx.menuItem.deleteMany({ where: { clientId: id } })
      await tx.menuCategory.deleteMany({ where: { clientId: id } })
      await tx.special.deleteMany({ where: { clientId: id } })
      await tx.location.deleteMany({ where: { clientId: id } })
      await tx.siteConfig.deleteMany({ where: { clientId: id } })
      await tx.client.delete({ where: { id } })
    })

    log({
      action: 'CLIENT_DELETED', entity: 'Client',
      entityName: req.params.id,
      userId: req.user.id, userName: req.user.name,
      clientId: id
    })

    res.json({ success: true })
  } catch (err) {
    console.error('Delete client error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// ── Locations ─────────────────────────────────────────────────
router.get('/:id/locations', async (req, res) => {
  try {
    const locs = await prisma.location.findMany({ where: { clientId: req.params.id } })
    res.json(locs)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/:id/locations', async (req, res) => {
  try {
    const { isPrimary, id, clientId: cid, createdAt, updatedAt, page, exteriorImage, ...data } = req.body
    const clientId = req.params.id
    
    // Auto-geocode address if lat/lng not provided
    let lat = data.lat
    let lng = data.lng
    
    if (!lat || !lng) {
      const coords = await geocodeAddress({
        address: data.address,
        suburb: data.suburb,
        city: data.city,
        state: data.state,
        postcode: data.postcode,
        country: data.country
      })
      if (coords) {
        lat = coords.lat
        lng = coords.lng
      }
    }
    
    if (isPrimary) {
      // Reset other primaries
      await prisma.location.updateMany({
        where: { clientId, isPrimary: true },
        data: { isPrimary: false }
      })
    }
    
    const loc = await prisma.location.create({
      data: { ...data, lat, lng, isPrimary, clientId }
    })
    
    // Clear export cache so preview sites get fresh data
    exportCache.delete(clientId)
    
    res.json(loc)
  } catch (err) {
    console.error('Create location error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// Handle both PUT and PATCH for location updates
const updateLocationHandler = async (req, res) => {
  try {
    const { isPrimary, ...rawData } = req.body
    const locId = req.params.locId
    const clientId = req.params.id
    
    // Get current loc clientId to verify
    const currentLoc = await prisma.location.findUnique({ where: { id: locId } })
    if (!currentLoc || currentLoc.clientId !== clientId) {
      return res.status(404).json({ error: 'Location not found' })
    }
    
    // Filter out fields that shouldn't be updated
    const { id, clientId: cid, createdAt, updatedAt, page, ...data } = rawData
    
    // Normalize hours format - convert full day names to abbreviated and remove duplicates
    if (data.hours) {
      const dayNameMap = {
        'Monday': 'Mon', 'Tuesday': 'Tue', 'Wednesday': 'Wed', 'Thursday': 'Thu',
        'Friday': 'Fri', 'Saturday': 'Sat', 'Sunday': 'Sun'
      }
      const normalizedHours = {}
      
      Object.entries(data.hours).forEach(([key, value]) => {
        // Skip full day names - they'll be replaced by abbreviated versions
        if (dayNameMap[key]) {
          // This is a full name, skip it (abbreviated version should be in data too)
          return
        }
        // Keep abbreviated names as-is
        normalizedHours[key] = value
      })
      
      data.hours = normalizedHours
    }
    
    // Auto-geocode if address changed and lat/lng not manually provided
    let lat = data.lat
    let lng = data.lng
    
    try {
      const addressChanged = hasAddressChanged(data, currentLoc)
      const coordsMissing = !lat || !lng
      
      if (addressChanged || coordsMissing) {
        const coords = await geocodeAddress({
          address: data.address,
          suburb: data.suburb,
          city: data.city,
          state: data.state,
          postcode: data.postcode,
          country: data.country
        })
        if (coords) {
          lat = coords.lat
          lng = coords.lng
        }
      }
    } catch (geoErr) {
      // Log geocoding error but don't fail the update
      console.error('[Location Update] Geocoding error:', geoErr.message)
    }
    
    if (isPrimary) {
      // Reset other primaries
      await prisma.location.updateMany({
        where: { clientId, isPrimary: true, id: { not: locId } },
        data: { isPrimary: false }
      })
    }
    
    const loc = await prisma.location.update({
      where: { id: locId },
      data: { ...data, lat, lng, isPrimary }
    })
    
    // Clear export cache so preview sites get fresh data
    exportCache.delete(clientId)
    
    res.json(loc)
  } catch (err) {
    console.error('[Location Update] Error:', err.message, err.stack)
    res.status(500).json({ error: err.message })
  }
}

router.put('/:id/locations/:locId', updateLocationHandler)
router.patch('/:id/locations/:locId', updateLocationHandler)

router.delete('/:id/locations/:locId', async (req, res) => {
  try {
    const clientId = req.params.id
    await prisma.location.delete({ where: { id: req.params.locId } })
    
    // Clear export cache so preview sites get fresh data
    exportCache.delete(clientId)
    
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── Specials ──────────────────────────────────────────────────
router.get('/:id/specials', async (req, res) => {
  try {
    const specials = await prisma.special.findMany({ where: { clientId: req.params.id } })
    res.json(specials)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/:id/specials', async (req, res) => {
  try {
    const { price, ...rest } = req.body
    const special = await prisma.special.create({
      data: { ...rest, clientId: req.params.id, price: price ? parseFloat(price) : null }
    })
    res.json(special)
  } catch (err) {
    console.error('Create special error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

router.put('/:id/specials/:specId', async (req, res) => {
  try {
    const special = await prisma.special.update({
      where: { id: req.params.specId },
      data: req.body
    })
    res.json(special)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/:id/specials/:specId', async (req, res) => {
  try {
    await prisma.special.delete({ where: { id: req.params.specId } })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── Pages ─────────────────────────────────────────────────────
router.get('/:id/pages', async (req, res) => {
  try {
    const pages = await prisma.page.findMany({ where: { clientId: req.params.id } })
    res.json(pages)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

const PAGE_WRITABLE_FIELDS = [
  'title', 'subtitle', 'slug', 'content', 'metaTitle', 'metaDesc', 'ogImage',
  'status', 'inNavigation', 'navOrder', 'parentId', 'pageType', 'bannerId',
  'showEnquiryForm', 'showLocationMap'
]

function pickPageData (body) {
  const data = {}
  for (const k of PAGE_WRITABLE_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(body, k) && body[k] !== undefined) {
      data[k] = body[k]
    }
  }
  if (data.bannerId === '') data.bannerId = null
  return data
}

router.post('/:id/pages', async (req, res) => {
  try {
    const clientId = req.params.id
    const { navigationRootId } = req.body
    const data = pickPageData(req.body)

    if (navigationRootId) {
      const root = await prisma.navigationItem.findUnique({
        where: { id: navigationRootId }
      })
      if (!root || root.clientId !== clientId) {
        return res.status(400).json({
          error: 'Invalid or missing navigation header. Save headers first, then add pages.'
        })
      }

      const page = await prisma.$transaction(async (tx) => {
        const created = await tx.page.create({
          data: { ...data, clientId }
        })
        const max = await tx.navigationItem.aggregate({
          where: { clientId, parentId: root.id },
          _max: { sortOrder: true }
        })
        const slug = String(created.slug || '').replace(/^\//, '')
        await tx.navigationItem.create({
          data: {
            clientId,
            parentId: root.id,
            pageId: created.id,
            label: created.title,
            url: slug ? `/${slug}` : '/',
            sortOrder: (max._max.sortOrder ?? -1) + 1,
            isActive: true
          }
        })
        // Automatically create a footer link for the new page
        const maxFooterLink = await tx.footerLink.aggregate({
          where: { footerSection: null },
          _max: { sortOrder: true }
        })
        await tx.footerLink.create({
          data: {
            clientId,
            footerSectionId: null, // Unassigned footer link
            pageId: created.id,
            label: created.title,
            url: slug ? `/${slug}` : '/',
            sortOrder: (maxFooterLink._max.sortOrder ?? -1) + 1,
            isActive: true
          }
        })
        return created
      })
      return res.json(page)
    }

    const page = await prisma.$transaction(async (tx) => {
      const created = await tx.page.create({
        data: { ...data, clientId }
      })
      // Automatically create a footer link for the new page
      const maxFooterLink = await tx.footerLink.aggregate({
        where: { footerSection: null },
        _max: { sortOrder: true }
      })
      await tx.footerLink.create({
        data: {
          clientId,
          footerSectionId: null, // Unassigned footer link
          pageId: created.id,
          label: created.title,
          url: String(created.slug || '').replace(/^\//, '') ? `/${String(created.slug || '').replace(/^\//, '')}` : '/',
          sortOrder: (maxFooterLink._max.sortOrder ?? -1) + 1,
          isActive: true
        }
      })
      return created
    })
    res.json(page)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/:id/pages/:pageId', async (req, res) => {
  try {
    const data = pickPageData(req.body)
    const page = await prisma.page.update({
      where: { id: req.params.pageId },
      data
    })
    res.json(page)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/:id/pages/:pageId', async (req, res) => {
  try {
    const pageId = req.params.pageId
    await prisma.navigationItem.deleteMany({ where: { pageId } })
    await prisma.footerLink.deleteMany({ where: { pageId } })
    await prisma.page.delete({ where: { id: pageId } })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── Banners ───────────────────────────────────────────────────
router.get('/:id/banners', async (req, res) => {
  try {
    const banners = await prisma.banner.findMany({ where: { clientId: req.params.id } })
    res.json(banners)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/:id/banners', async (req, res) => {
  try {
    const banner = await prisma.banner.create({
      data: { ...req.body, clientId: req.params.id }
    })
    res.json(banner)
  } catch (err) {
    console.error('Create banner error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

router.put('/:id/banners/:bannerId', async (req, res) => {
  try {
    const banner = await prisma.banner.update({
      where: { id: req.params.bannerId },
      data: req.body
    })
    res.json(banner)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/:id/banners/:bannerId', async (req, res) => {
  try {
    await prisma.banner.delete({ where: { id: req.params.bannerId } })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── Promo Tiles ───────────────────────────────────────────────
router.get('/:id/promo-tiles', async (req, res) => {
  try {
    const tiles = await prisma.promoTile.findMany({ 
      where: { clientId: req.params.id },
      orderBy: { sortOrder: 'asc' }
    })
    res.json(tiles)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/:id/promo-tiles', async (req, res) => {
  try {
    const tile = await prisma.promoTile.create({
      data: { ...req.body, clientId: req.params.id }
    })
    res.json(tile)
  } catch (err) {
    console.error('Create promo tile error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

router.put('/:id/promo-tiles/:tileId', async (req, res) => {
  try {
    const tile = await prisma.promoTile.update({
      where: { id: req.params.tileId },
      data: req.body
    })
    res.json(tile)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/:id/promo-tiles/:tileId', async (req, res) => {
  try {
    await prisma.promoTile.delete({ where: { id: req.params.tileId } })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── Promo Config ─────────────────────────────────────────────
router.get('/:id/promo-config', async (req, res) => {
  try {
    const config = await prisma.promoConfig.findUnique({
      where: { clientId: req.params.id }
    })
    res.json(config || { heading: null, subheading: null, isActive: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/:id/promo-config', async (req, res) => {
  try {
    const config = await prisma.promoConfig.upsert({
      where: { clientId: req.params.id },
      create: { ...req.body, clientId: req.params.id },
      update: req.body
    })
    res.json(config)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── Featured Config ───────────────────────────────────────────
router.get('/:id/featured-config', async (req, res) => {
  try {
    const config = await prisma.featuredConfig.findUnique({
      where: { clientId: req.params.id }
    })
    res.json(config || { heading: null, subheading: null, isActive: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/:id/featured-config', async (req, res) => {
  try {
    const config = await prisma.featuredConfig.upsert({
      where: { clientId: req.params.id },
      create: { ...req.body, clientId: req.params.id },
      update: req.body
    })
    res.json(config)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── Welcome Content ───────────────────────────────────────────
router.get('/:id/welcome-content', async (req, res) => {
  try {
    const content = await prisma.welcomeContent.findUnique({
      where: { clientId: req.params.id }
    })
    res.json(content || { subtitle: null, heading: null, text: null, imageUrl: null, ctaText: null, ctaUrl: null, isExternal: false, isActive: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/:id/welcome-content', async (req, res) => {
  try {
    const content = await prisma.welcomeContent.upsert({
      where: { clientId: req.params.id },
      create: { ...req.body, clientId: req.params.id },
      update: req.body
    })
    res.json(content)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── Homepage Layout ─────────────────────────────────────────────
router.get('/:id/homepage-layout', async (req, res) => {
  try {
    const layout = await prisma.homepageLayout.findUnique({
      where: { clientId: req.params.id }
    })
    // Return default layout if none exists
    const defaultComponents = [
      { id: 'welcome', type: 'welcome', visible: true, order: 0 },
      { id: 'promos', type: 'promos', visible: true, order: 1 },
      { id: 'specials', type: 'specials', visible: true, order: 2 },
      { id: 'reviews', type: 'reviews', visible: true, order: 3 }
    ]
    res.json(layout || { components: defaultComponents })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/:id/homepage-layout', async (req, res) => {
  try {
    const layout = await prisma.homepageLayout.upsert({
      where: { clientId: req.params.id },
      create: { ...req.body, clientId: req.params.id },
      update: req.body
    })
    res.json(layout)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── Custom Text Blocks ───────────────────────────────────────────
router.get('/:id/custom-text-blocks', async (req, res) => {
  try {
    const blocks = await prisma.customTextBlock.findMany({
      where: { clientId: req.params.id },
      orderBy: { createdAt: 'asc' }
    })
    res.json(blocks)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/:id/custom-text-blocks', async (req, res) => {
  try {
    const block = await prisma.customTextBlock.create({
      data: { ...req.body, clientId: req.params.id }
    })
    res.json(block)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/:id/custom-text-blocks/:blockId', async (req, res) => {
  try {
    const block = await prisma.customTextBlock.update({
      where: { id: req.params.blockId },
      data: req.body
    })
    res.json(block)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/:id/custom-text-blocks/:blockId', async (req, res) => {
  try {
    await prisma.customTextBlock.delete({
      where: { id: req.params.blockId }
    })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── Team Departments ─────────────────────────────────────────────
router.get('/:id/departments', async (req, res) => {
  try {
    const departments = await prisma.teamDepartment.findMany({
      where: { clientId: req.params.id },
      orderBy: { sortOrder: 'asc' }
    })
    res.json(departments)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/:id/departments', async (req, res) => {
  try {
    const department = await prisma.teamDepartment.create({
      data: { ...req.body, clientId: req.params.id }
    })
    exportCache.delete(req.params.id)
    res.json(department)
  } catch (err) {
    console.error('Create department error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

router.put('/:id/departments/:deptId', async (req, res) => {
  try {
    const department = await prisma.teamDepartment.update({
      where: { id: req.params.deptId },
      data: req.body
    })
    exportCache.delete(req.params.id)
    res.json(department)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/:id/departments/:deptId', async (req, res) => {
  try {
    // Remove department reference from home sections
    await prisma.homeSection.updateMany({
      where: { departmentId: req.params.deptId },
      data: { departmentId: null }
    })
    await prisma.teamDepartment.delete({ where: { id: req.params.deptId } })
    exportCache.delete(req.params.id)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── Specials Config ────────────────────────────────────────────
router.get('/:id/specials-config', async (req, res) => {
  try {
    const config = await prisma.specialsConfig.findUnique({
      where: { clientId: req.params.id }
    })
    res.json(config || { heading: null, subheading: null, showOnHomepage: false, maxItems: 2, isActive: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/:id/specials-config', async (req, res) => {
  try {
    console.log('[SPECIALS CONFIG SAVE] Request body:', req.body)
    const config = await prisma.specialsConfig.upsert({
      where: { clientId: req.params.id },
      create: { ...req.body, clientId: req.params.id },
      update: req.body
    })
    console.log('[SPECIALS CONFIG SAVE] Successfully saved:', config)
    res.json(config)
  } catch (err) {
    console.error('[SPECIALS CONFIG SAVE] Error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// ── SiteConfig ────────────────────────────────────────────────
router.get('/:id/config', async (req, res) => {
  try {
    const config = await prisma.siteConfig.findUnique({ where: { clientId: req.params.id } })
    res.json(config || {})
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/:id/config', async (req, res) => {
  try {
    const clientId = req.params.id
    console.log('[CONFIG SAVE] Received request for client:', clientId)
    
    // Check if client exists first to avoid foreign key errors on upsert
    const client = await prisma.client.findUnique({ where: { id: clientId } })
    if (!client) {
      console.error('[CONFIG SAVE] Client not found:', clientId)
      return res.status(404).json({ error: 'Client not found' })
    }

    console.log('[CONFIG SAVE] Request body keys:', Object.keys(req.body))
    console.log('[CONFIG SAVE] Request body:', JSON.stringify(req.body, null, 2))
    
    // Validate request body
    const validation = validateSiteConfig(req.body)
    if (!validation.valid) {
      console.error('[CONFIG SAVE] Validation failed:', validation.errors)
      return res.status(400).json({ error: 'Validation failed', details: validation.errors })
    }

    console.log('[CONFIG SAVE] Validation passed')

    // Increment version if not explicitly provided
    const updateData = validation.data
    if (!updateData.version) {
      const existing = await prisma.siteConfig.findUnique({
        where: { clientId },
        select: { version: true }
      })
      updateData.version = (existing?.version || 0) + 1
    }

    console.log('[CONFIG SAVE] Upserting with version:', updateData.version)

    const config = await prisma.siteConfig.upsert({
      where:  { clientId },
      update: updateData,
      create: { clientId, ...updateData }
    })

    console.log('[CONFIG SAVE] Successfully saved config')

    // Clear export cache for this client
    exportCache.delete(clientId)

    res.json(config)
  } catch (err) {
    console.error('[CONFIG SAVE] Error:', err)
    console.error('[CONFIG SAVE] Error stack:', err.stack)
    res.status(500).json({ error: err.message })
  }
})

// ── Image Upload to R2 (with local fallback) ──────────────────
router.post('/:clientId/images', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' })
    }

    // Optimize image
    const optimized = await sharp(req.file.buffer)
      .resize({ width: 1920, withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer()

    const key = `${req.params.clientId}/${Date.now()}.webp`

    // Try R2 first, fall back to local storage
    if (isR2Configured() && r2) {
      try {
        await r2.send(new PutObjectCommand({
          Bucket:      process.env.CLOUDFLARE_R2_BUCKET,
          Key:         key,
          Body:        optimized,
          ContentType: 'image/webp'
        }))

        const url = `${process.env.CLOUDFLARE_R2_PUBLIC_URL}/${key}`
        console.log(`📤 Uploaded to R2: ${key}`)
        return res.json({ url, storage: 'r2' })
      } catch (r2Error) {
        console.error('R2 upload failed, falling back to local:', r2Error.message)
        // Fall through to local storage
      }
    }

    // Local storage fallback
    const clientDir = path.join(uploadsDir, req.params.clientId)
    if (!fs.existsSync(clientDir)) {
      fs.mkdirSync(clientDir, { recursive: true })
    }

    // Use the same key for local storage
    const localPath = path.join(uploadsDir, key)
    fs.writeFileSync(localPath, optimized)

    // Return URL using PUBLIC_API_URL for consistency across environments
    const publicUrl = process.env.PUBLIC_API_URL || `${req.protocol}://${req.get('host')}`
    const url = `${publicUrl}/uploads/${key}`
    console.log(`📤 Uploaded locally: ${key} → ${localPath}`)
    res.json({ url, storage: 'local' })

  } catch (err) {
    console.error('Upload error:', err.message, err.stack)
    res.status(500).json({ 
      error: 'Upload failed',
      details: err.message,
      hint: isR2Configured() 
        ? 'Check R2 credentials and bucket permissions' 
        : 'R2 not configured — using local storage'
    })
  }
})

// ── Netlify / Deploy ──────────────────────────────────────────
const netlifyService = require('../services/netlify')

router.post('/:id/deploy', async (req, res) => {
  try {
    const config = await prisma.siteConfig.findUnique({ where: { clientId: req.params.id } })
    const hookUrl = config?.netlify?.buildHook

    if (!hookUrl) {
      return res.status(400).json({
        error: 'No build hook URL saved. Go to Config → Netlify and paste your Build Hook URL first.'
      })
    }

    await netlifyService.triggerDeploy(hookUrl)

    await prisma.deployment.create({
      data: { clientId: req.params.id, status: 'triggered', triggeredBy: req.user.name }
    })

    log({
      action: 'DEPLOY_TRIGGERED', entity: 'Deployment',
      userId: req.user.id, userName: req.user.name, clientId: req.params.id
    })

    res.json({ success: true })
  } catch (err) {
    console.error('Deploy error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

router.get('/:id/deploys', async (req, res) => {
  try {
    const deploys = await prisma.deployment.findMany({
      where:   { clientId: req.params.id },
      orderBy: { createdAt: 'desc' },
      take:    10
    })
    res.json(deploys)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/:id/netlify/create', async (req, res) => {
  try {
    const client    = await prisma.client.findUnique({ where: { id: req.params.id } })
    if (!client) {
      return res.status(404).json({ error: 'Client not found' })
    }
    
    const config    = await prisma.siteConfig.findUnique({ where: { clientId: client.id } })
    // Theme now comes from colours.theme (Design section), not netlify.template
    const template  = config?.colours?.theme || req.body.template || 'theme-v1'
    const apiUrl    = process.env.NEXT_PUBLIC_CMS_API_URL
                   || process.env.CMS_API_URL
                   || 'http://localhost:3001/api'

    // Validate Netlify token
    if (!process.env.NETLIFY_TOKEN) {
      return res.status(400).json({ 
        error: 'Netlify token is missing. Please add NETLIFY_TOKEN to your .env file.' 
      })
    }

    // Generate site name and custom domain for Netlify
    // Site name format: {clientId}-{restaurant-name}  (clientId is already unique)
    // Preview URL:      https://{clientId}-{restaurant-name}.netlify.app
    // Custom domain:    {clientId}-{restaurant-name}.com.au (or user-provided domain)
    const generateSiteDetails = (client) => {
      // Sanitize restaurant name for Netlify subdomain (alphanumeric + hyphens)
      let restaurantSlug = (client.name || 'restaurant')
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')

      // Keep slug reasonable — clientId is 8 chars + hyphen = 9, Netlify max is 63
      if (restaurantSlug.length > 50) {
        restaurantSlug = restaurantSlug.slice(0, 50).replace(/-$/, '')
      }

      // Format: {clientId}-{restaurant-name}  — clientId guarantees uniqueness
      const netlifySiteName = `${client.id}-${restaurantSlug}`

      // Custom domain: use explicit domain from client record, or auto-generate
      let customDomain = client.domain
      if (!customDomain || !customDomain.includes('.')) {
        customDomain = `${client.id}-${restaurantSlug}.com.au`
      }

      return {
        siteName: netlifySiteName,
        customDomain: customDomain,
        baseName: restaurantSlug
      }
    }
    
    const { siteName, customDomain, baseName } = generateSiteDetails(client)

    console.log('🚀 Creating Netlify site:', siteName)
    console.log('🌐 Custom Domain:', customDomain)
    console.log('📋 Template:', template)
    console.log('🔗 API URL:', apiUrl)
    console.log('👤 Client:', client.name, '| ID:', client.id)

    // 1 — Create the Netlify site (retry with random suffix if name is taken)
    console.log('⏳ Step 1/7: Creating Netlify site...')
    let netlifyData = null
    let finalSiteName = siteName
    const maxNameRetries = 5
    for (let attempt = 0; attempt < maxNameRetries; attempt++) {
      const suffix = Math.random().toString(36).substring(2, 10) // 8 random chars
      const tryName = attempt === 0 ? siteName : `${siteName}-${suffix}`
      console.log(`   🔄 Attempt ${attempt + 1}/${maxNameRetries}: Creating site "${tryName}"...`)
      try {
        netlifyData = await netlifyService.createSite(tryName, null)
        finalSiteName = tryName
        console.log(`   ✅ Success on attempt ${attempt + 1}`)
        break
      } catch (nameErr) {
        const msg = (nameErr.message || '').toLowerCase()
        console.error(`   ❌ Attempt ${attempt + 1} failed: ${nameErr.message}`)

        // Account limit — do NOT retry, bubble up immediately
        if (msg.includes('usage limit') || msg.includes('exceeded') || msg.includes('cannot create more')) {
          throw new Error('Netlify account site limit reached. Delete unused sites at https://app.netlify.com before creating a new one.')
        }

        // Name taken — retry with a different suffix
        const isTaken = msg.includes('not available') || msg.includes('already taken')
        if (isTaken && attempt < maxNameRetries - 1) {
          console.warn(`   ⏳ Name "${tryName}" is taken, waiting 1s before retry...`)
          await new Promise(r => setTimeout(r, 1000))
          continue
        }
        throw nameErr // last attempt or non-name error — bubble up
      }
    }
    console.log('✅ Site created:', netlifyData.id, '| Name:', finalSiteName)

    // 1.5 — Link the GitHub repo via API to enable builds
    let repoLinked = false
    try {
      console.log('⏳ Step 1.5/7: Linking GitHub repository...')
      await netlifyService.linkRepoToSite(netlifyData.id)
      console.log('✅ Repository linked successfully')
      repoLinked = true
    } catch (err) {
      console.warn('⚠️  Could not link repository via API:', err.message)
      console.warn('   You can link it manually in Netlify UI: Site settings → Build & deploy → Link repository')
    }

    // 2 — Set env vars so the build knows which client/template to use
    console.log('⏳ Step 2/7: Setting environment variables...')
    let envVarsSet = false
    try {
      await netlifyService.setEnvVars(netlifyData.id, {
        // Note: SITE_ID is reserved by Netlify, so we only set NEXT_PUBLIC_SITE_ID
        // The site-template code checks for both and will use NEXT_PUBLIC_SITE_ID as fallback
        NEXT_PUBLIC_SITE_ID:        client.id,
        SITE_TEMPLATE:              template,
        NEXT_PUBLIC_CMS_API_URL:    apiUrl,
      })
      console.log('🔧 Environment variables set successfully')
      envVarsSet = true
    } catch (err) {
      console.warn('⚠️  Environment variables could not be set automatically:', err.message)
      console.warn('   This usually means your Netlify token needs "env:write" scope')
      console.warn('   You can set them manually in Netlify dashboard:')
      console.warn(`   1. Go to https://app.netlify.com/sites/${netlifyData.id}/settings/environment-variables`)
      console.warn('   2. Add these variables (NOTE: Do NOT use SITE_ID - it\'s reserved by Netlify):')
      console.warn(`      - NEXT_PUBLIC_SITE_ID: ${client.id}`)
      console.warn(`      - SITE_TEMPLATE: ${template}`)
      console.warn(`      - NEXT_PUBLIC_CMS_API_URL: ${apiUrl}`)
    }

    // 3 — Add custom domain to the site
    console.log('⏳ Step 3/7: Configuring custom domain:', customDomain)
    try {
      await netlifyService.addDomain(netlifyData.id, customDomain)
      console.log('✅ Custom domain added successfully')
    } catch (err) {
      console.warn('⚠️  Could not add custom domain:', err.message)
      console.warn('   You can manually add it later in Netlify dashboard')
    }

    // 4 — Create a build hook named "CMS Deploy"
    console.log('⏳ Step 4/7: Creating build hook...')
    const hookRes = await require('axios').post(
      `https://api.netlify.com/api/v1/sites/${netlifyData.id}/build_hooks`,
      { title: 'CMS Deploy', branch: process.env.SITE_TEMPLATE_REPO_BRANCH || 'main' },
      { headers: { Authorization: 'Bearer ' + process.env.NETLIFY_TOKEN } }
    )
    const buildHook = hookRes.data.url
    console.log('🪝 Build hook created')

    // 5 — Trigger first build
    console.log('⏳ Step 5/7: Triggering first build...')
    await netlifyService.triggerDeploy(buildHook)
    console.log('⚡ First build triggered')

    // 6 — Save everything back to config
    console.log('⏳ Step 6/7: Saving configuration to database...')
    const existing = config?.netlify || {}
    await prisma.siteConfig.upsert({
      where:  { clientId: client.id },
      update: {
        netlify: {
          ...existing,
          siteId:       netlifyData.id,
          previewUrl:   `https://${finalSiteName}.netlify.app`,
          customDomain: customDomain,
          buildHook,
          template,
          repoLinked,
        }
      },
      create: {
        clientId: client.id,
        netlify: {
          siteId:       netlifyData.id,
          previewUrl:   `https://${finalSiteName}.netlify.app`,
          customDomain: customDomain,
          buildHook,
          template,
          repoLinked,
        }
      }
    })
    console.log('💾 Configuration saved to database')

    log({
      action: 'NETLIFY_SITE_CREATED', entity: 'Deployment',
      userId: req.user.id, userName: req.user.name, clientId: client.id
    })

    // Generate shareable preview URLs
    const netlifyAppUrl = `https://${finalSiteName}.netlify.app`
    const previewUrl = netlifyAppUrl
    
    console.log('🎉 Site creation complete!')
    console.log('🌐 Netlify Preview URL:', previewUrl)
    console.log('🏷️  Netlify App URL:', netlifyAppUrl)
    console.log('🌐 Custom Domain:', customDomain)
    console.log('📝 Note: Custom domain will be active once DNS propagates (5-10 minutes)')
    
    res.json({
      success:        true,
      siteId:         netlifyData.id,
      siteName:       siteName,
      previewUrl:     netlifyAppUrl,
      netlifyAppUrl:  netlifyAppUrl,
      customDomain:   customDomain,
      buildHook,
      repoLinked,
      message:        repoLinked
        ? `Site created & repo linked! Building now — preview at ${netlifyAppUrl}`
        : `Site created but repo not linked. Add SITE_TEMPLATE_REPO to .env and recreate the site.`
    })
  } catch (err) {
    console.error('❌ Create site error:', err.message)
    console.error('Stack trace:', err.stack)
    console.error('Response data:', err.response?.data)
    
    // Provide user-friendly error messages
    let userMessage = err.message
    let hint = ''
    
    if (err.message.includes('site limit') || err.message.includes('usage limit') || err.message.includes('exceeded') || err.message.includes('cannot create more')) {
      userMessage = 'Your Netlify account has reached its site limit. Delete unused sites to free up a slot.'
      hint = 'Go to https://app.netlify.com → select old/test sites → Site settings → Delete site. Then try again.'
    } else if (err.message.includes('not available') || err.message.includes('already taken')) {
      userMessage = 'Could not create site — the name was taken even after multiple retries with random suffixes.'
      hint = 'Try again, or delete the old site from your Netlify dashboard: https://app.netlify.com'
    } else if (err.message.includes('authentication failed')) {
      hint = 'Update your NETLIFY_TOKEN in the .env file with a fresh token from https://app.netlify.com/account/applications'
    } else if (err.message.includes('permissions')) {
      hint = 'Create a new Netlify token with full permissions (api:read, api:write, site:write)'
    } else if (err.code === 'ECONNREFUSED') {
      userMessage = 'Cannot connect to Netlify API. Check your internet connection.'
      hint = 'If you are behind a firewall or proxy, please configure it appropriately.'
    }
    
    res.status(500).json({ 
      error: userMessage,
      details: err.response?.data || 'Unknown error',
      hint: hint || 'Check the API server logs for more details'
    })
  }
})

router.post('/:id/netlify/domain', async (req, res) => {
  try {
    const { domain } = req.body
    if (!domain || !domain.trim()) {
      return res.status(400).json({ error: 'Domain name is required' })
    }

    const cleanDomain = domain.trim().replace(/^https?:\/\//, '').replace(/\/$/, '')
    
    const config = await prisma.siteConfig.findUnique({ where: { clientId: req.params.id } })
    const siteId = config?.netlify?.siteId
    
    if (!siteId) {
      return res.status(400).json({ 
        error: 'No Netlify site found. Please create a site first in the Setup tab.' 
      })
    }

    // Validate domain format
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9\-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/
    if (!domainRegex.test(cleanDomain)) {
      return res.status(400).json({ 
        error: 'Invalid domain format. Use example.com or subdomain.example.com' 
      })
    }

    // Add domain via Netlify API
    try {
      await netlifyService.addDomain(siteId, cleanDomain)
    } catch (domainErr) {
      if (domainErr.message.includes('already in use')) {
        return res.status(400).json({ 
          error: `Domain ${cleanDomain} is already connected to another Netlify site. Please remove it from the other site first.`,
          details: 'Each domain can only be used by one Netlify site at a time.'
        })
      }
      throw domainErr
    }

    // Save to database
    const updated = await prisma.siteConfig.update({
      where: { clientId: req.params.id },
      data: {
        netlify: {
          ...config.netlify,
          primaryDomain: cleanDomain,
          domainLive: false, // Wait for DNS verification
        }
      }
    })

    log({
      action: 'NETLIFY_DOMAIN_ADDED', entity: 'Deployment',
      userId: req.user.id, userName: req.user.name, clientId: req.params.id
    })

    res.json({ 
      success: true, 
      domain: cleanDomain,
      message: 'Domain added successfully! Now update your DNS records.',
      dnsInstructions: {
        rootDomain: {
          type: 'A',
          name: '@',
          value: '75.2.60.5',
          description: 'Points root domain to Netlify'
        },
        www: {
          type: 'CNAME',
          name: 'www',
          value: `${cleanDomain.replace('.', '-dinedesk.')}`,
          description: 'Points www to Netlify subdomain'
        },
        alternative: {
          method: 'Netlify DNS',
          description: 'Use Netlify nameservers for automatic configuration',
          nameservers: [
            'dns1.p01.nsone.net',
            'dns2.p01.nsone.net',
            'dns3.p01.nsone.net',
            'dns4.p01.nsone.net'
          ]
        }
      }
    })
  } catch (err) {
    console.error('Domain error:', err.message, err.stack)
    res.status(500).json({ 
      error: 'Failed to add domain',
      details: err.message 
    })
  }
})

router.get('/:id/netlify/deploys', async (req, res) => {
  try {
    const config = await prisma.siteConfig.findUnique({ where: { clientId: req.params.id } })
    const siteId = config?.netlify?.siteId
    if (!siteId) return res.json([])
    const deploys = await netlifyService.getDeploys(siteId)
    res.json(deploys)
  } catch (err) {
    res.json([])
  }
})

// Verify if site exists on Netlify
router.get('/:id/netlify/verify', async (req, res) => {
  try {
    const config = await prisma.siteConfig.findUnique({ where: { clientId: req.params.id } })
    const siteId = config?.netlify?.siteId
    
    if (!siteId) {
      return res.json({ exists: false, reason: 'No site ID configured' })
    }
    
    // Check if site exists on Netlify
    const axios = require('axios')
    const response = await axios.get(
      `https://api.netlify.com/api/v1/sites/${siteId}`,
      { headers: { Authorization: 'Bearer ' + process.env.NETLIFY_TOKEN } }
    )
    
    if (response.status === 200) {
      res.json({ 
        exists: true, 
        site: {
          id: response.data.id,
          name: response.data.name,
          url: response.data.url,
          ssl_url: response.data.ssl_url
        }
      })
    } else {
      res.json({ exists: false, reason: 'Site not accessible' })
    }
  } catch (err) {
    console.error('Verify error:', err.message)
    if (err.response?.status === 404) {
      res.json({ exists: false, reason: 'Site not found on Netlify' })
    } else {
      res.status(500).json({ 
        exists: false, 
        reason: 'Verification failed: ' + err.message 
      })
    }
  }
})

// Build & Deploy endpoint - triggers rebuild via build hook
router.post('/:id/netlify/rebuild', async (req, res) => {
  try {
    const client = await prisma.client.findUnique({ where: { id: req.params.id } })
    if (!client) {
      return res.status(404).json({ error: 'Client not found' })
    }
    
    const config = await prisma.siteConfig.findUnique({ where: { clientId: client.id } })
    const buildHook = config?.netlify?.buildHook
    
    if (!buildHook) {
      return res.status(400).json({ error: 'No build hook configured. Please recreate the site.' })
    }
    
    console.log('🔄 Triggering rebuild for client:', client.name)
    console.log('🪝 Using build hook:', buildHook.substring(0, 30) + '...')
    
    // Trigger build via webhook
    await require('axios').post(buildHook, {}, {
      headers: { 'Content-Type': 'application/json' }
    })
    
    console.log('✅ Rebuild triggered successfully')
    
    log({
      action: 'NETLIFY_REBUILD_TRIGGERED',
      entity: 'Deployment',
      userId: req.user?.id || 'system',
      userName: req.user?.name || 'System',
      clientId: client.id
    })
    
    res.json({ 
      success: true, 
      message: 'Build triggered successfully',
      timestamp: new Date().toISOString()
    })
  } catch (err) {
    console.error('❌ Rebuild error:', err.message)
    
    if (err.response) {
      console.error('   Status:', err.response.status)
      console.error('   Response:', JSON.stringify(err.response.data, null, 2))
    }
    
    res.status(500).json({ 
      error: 'Failed to trigger rebuild',
      details: err.message 
    })
  }
})

// GET Netlify setup status — tells the frontend whether env vars are configured
router.get('/:id/netlify/setup-status', async (req, res) => {
  const config = await prisma.siteConfig.findUnique({ where: { clientId: req.params.id } })
  res.json({
    hasToken:       !!process.env.NETLIFY_TOKEN,
    hasRepo:        !!process.env.SITE_TEMPLATE_REPO,
    repoPath:       process.env.SITE_TEMPLATE_REPO || null,
    repoLinked:     config?.netlify?.repoLinked ?? false,
    hasSite:        !!config?.netlify?.siteId,
  })
})

// POST link an existing Netlify site to the site-template repo
router.post('/:id/netlify/link-repo', async (req, res) => {
  try {
    const config = await prisma.siteConfig.findUnique({ where: { clientId: req.params.id } })
    const siteId = config?.netlify?.siteId
    if (!siteId) return res.status(400).json({ error: 'No Netlify site configured. Create one first.' })

    const { branch } = req.body || {}
    await netlifyService.linkRepoToSite(siteId, branch)

    // Update config to mark repo as linked
    await prisma.siteConfig.update({
      where: { clientId: req.params.id },
      data: {
        netlify: {
          ...config.netlify,
          repoLinked: true
        }
      }
    })

    log({
      action: 'NETLIFY_REPO_LINKED', entity: 'Deployment',
      userId: req.user.id, userName: req.user.name, clientId: req.params.id
    })

    res.json({ success: true, message: 'Repository linked successfully' })
  } catch (err) {
    console.error('❌ link-repo error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// GET env vars from Netlify for this site
router.get('/:id/netlify/env', async (req, res) => {
  try {
    const config = await prisma.siteConfig.findUnique({ where: { clientId: req.params.id } })
    const siteId = config?.netlify?.siteId
    if (!siteId) return res.json([])
    const vars = await netlifyService.getEnvVars(siteId)
    res.json(vars)
  } catch (err) {
    console.error('❌ GET env vars error:', err.message)
    res.status(500).json({ error: 'Failed to fetch env vars', details: err.message })
  }
})

// PUT (bulk upsert) env vars on Netlify — body: { vars: [{ key, value }] }
router.put('/:id/netlify/env', async (req, res) => {
  try {
    const config = await prisma.siteConfig.findUnique({ where: { clientId: req.params.id } })
    const siteId = config?.netlify?.siteId
    if (!siteId) return res.status(400).json({ error: 'No Netlify site configured' })

    const { vars = [] } = req.body
    if (!Array.isArray(vars) || vars.length === 0) {
      return res.status(400).json({ error: 'vars array is required' })
    }

    const results = []
    for (const { key, value } of vars) {
      if (!key || key.trim() === '') continue
      const r = await netlifyService.upsertEnvVar(siteId, key.trim(), String(value ?? ''))
      results.push(r)
    }

    log({
      action: 'NETLIFY_ENV_UPDATED', entity: 'Deployment',
      userId: req.user.id, userName: req.user.name, clientId: req.params.id
    })

    res.json({ success: true, updated: results.length })
  } catch (err) {
    console.error('❌ PUT env vars error:', err.message)
    res.status(500).json({ error: 'Failed to update env vars', details: err.message })
  }
})

// DELETE a single env var from Netlify
router.delete('/:id/netlify/env/:key', async (req, res) => {
  try {
    const config = await prisma.siteConfig.findUnique({ where: { clientId: req.params.id } })
    const siteId = config?.netlify?.siteId
    if (!siteId) return res.status(400).json({ error: 'No Netlify site configured' })

    await netlifyService.deleteEnvVar(siteId, req.params.key)

    log({
      action: 'NETLIFY_ENV_DELETED', entity: 'Deployment',
      userId: req.user.id, userName: req.user.name, clientId: req.params.id
    })

    res.json({ success: true })
  } catch (err) {
    console.error('❌ DELETE env var error:', err.message)
    res.status(500).json({ error: 'Failed to delete env var', details: err.message })
  }
})

// Rollback to a previous deploy
router.post('/:id/netlify/rollback/:deployId', async (req, res) => {
  try {
    const config = await prisma.siteConfig.findUnique({ where: { clientId: req.params.id } })
    const siteId = config?.netlify?.siteId
    if (!siteId) return res.status(400).json({ error: 'No Netlify site configured' })

    const result = await netlifyService.rollbackDeploy(siteId, req.params.deployId)

    log({
      action: 'NETLIFY_ROLLBACK', entity: 'Deployment',
      userId: req.user.id, userName: req.user.name, clientId: req.params.id,
      details: `Rolled back to deploy ${req.params.deployId}`
    })

    res.json({ success: true, deploy: result })
  } catch (err) {
    console.error('❌ Rollback error:', err.message)
    res.status(500).json({ error: 'Failed to rollback deploy', details: err.message })
  }
})

// Delete Netlify site
router.delete('/:id/netlify', async (req, res) => {
  try {
    const config = await prisma.siteConfig.findUnique({ where: { clientId: req.params.id } })
    const siteId = config?.netlify?.siteId
    
    if (!siteId) {
      return res.status(400).json({ error: 'No Netlify site configured' })
    }

    // Delete the site from Netlify
    await netlifyService.deleteSite(siteId)

    // Clear the Netlify configuration from database
    await prisma.siteConfig.update({
      where: { clientId: req.params.id },
      data: {
        netlify: null
      }
    })

    log({
      action: 'NETLIFY_SITE_DELETED',
      entity: 'Deployment',
      userId: req.user.id,
      userName: req.user.name,
      clientId: req.params.id
    })

    res.json({ success: true, message: 'Netlify site deleted successfully' })
  } catch (err) {
    console.error('❌ Delete Netlify site error:', err.message)
    res.status(500).json({ error: 'Failed to delete Netlify site', details: err.message })
  }
})

// ── Mount Sub-Routers ──────────────────────────────────────────
// These routers use mergeParams: true to access the client ID as req.params.id
router.use('/:id/navigation', require('./navigation'))
router.use('/:id/navbar',     require('./navbar'))
router.use('/:id/homepage',   require('./homepage'))
router.use('/:id/alerts',     require('./alerts'))
router.use('/:id/legal',      require('./legal'))
router.use('/:id/analytics',  require('./analytics'))

module.exports = router
