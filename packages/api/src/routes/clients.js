const { log } = require('../lib/activityLog')
const express = require('express')
const { prisma } = require('../lib/prisma')
const { authenticateToken, requireRole } = require('../middleware/auth')
const { validateSiteConfig } = require('../lib/validation')
const { geocodeAddress, hasAddressChanged } = require('../lib/geocoding')
const multer = require('multer')
const sharp  = require('sharp')
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3')
const fs = require('fs')
const path = require('path')

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
const CACHE_TTL_MS = 5000 // 5 seconds

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
  try {
    const id = req.params.id

    // Check cache first
    const cached = getCachedExport(id)
    if (cached) {
      return res.json(cached)
    }
    const [client, menuCategories, specials, pages, banners, cfg, navigationItems] = await Promise.all([
      prisma.client.findUnique({ where: { id }, include: { locations: true } }),
      prisma.menuCategory.findMany({
        where: { clientId: id },
        include: { items: { orderBy: { sortOrder: 'asc' } } },
        orderBy: { sortOrder: 'asc' }
      }),
      prisma.special.findMany({ where: { clientId: id, isActive: true } }),
      prisma.page.findMany({ where: { clientId: id, status: 'published' } }),
      prisma.banner.findMany({ where: { clientId: id, isActive: true } }),
      prisma.siteConfig.findUnique({ where: { clientId: id } }),
      prisma.navigationItem.findMany({
        where: { clientId: id, isActive: true },
        orderBy: { sortOrder: 'asc' },
        include: { page: true }
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
            const parent = itemMap.get(item.parentId)
            parent.children.push(node)
          } else {
            roots.push(node)
          }
        })
        
        return roots
      })
    ])

    if (!client) return res.status(404).json({ error: 'Client not found' })

    // Fetch Google reviews if Place ID is set
let googleReviews = []
let googlePlaceData = null
const placeId = cfg?.reviews?.googlePlaceId

if (placeId && process.env.GOOGLE_PLACES_API_KEY) {
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
      googleReviews = (gData.result.reviews || [])
        .filter(r => r.rating >= minStars)
        .map(r => ({
          name:   r.author_name,
          stars:  r.rating,
          text:   r.text,
          date:   r.relative_time_description,
          source: 'Google',
          photo:  r.profile_photo_url,
        }))
    }
  } catch (err) {
    console.error('Google Places fetch error:', err.message)
  }
}

const exportData = {
  client,
  menuCategories,
  specials,
  pages,
  banners,
  navigationItems,
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
  siteType:   cfg?.settings?.siteType || 'restaurant',
  // Reviews — merge Google live data with CMS config
  reviews: {
    ...(cfg?.reviews || {}),
    // Override scores with live Google data if available
    overallScore:   googlePlaceData?.rating       || cfg?.reviews?.overallScore,
    totalReviews:   googlePlaceData?.totalReviews || cfg?.reviews?.totalReviews,
    googleScore:    googlePlaceData?.rating       || cfg?.reviews?.googleScore,
    googleCount:    googlePlaceData?.totalReviews || cfg?.reviews?.googleCount,
    // Live reviews from Google (filtered by min stars)
    googleReviews,
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
// PROTECTED ROUTES
// ═══════════════════════════════════════════════════════════════
router.use(authenticateToken)

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
    const client = await prisma.client.create({ data: req.body })
    await prisma.siteConfig.create({ data: { clientId: client.id } })
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

router.get('/:id', async (req, res) => {
  try {
    const client = await prisma.client.findUnique({
      where: { id: req.params.id },
      include: { group: true, locations: true, pages: true, siteConfig: true }
    })
    res.json(client)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/:id', clientAdminOnly, async (req, res) => {
  try {
    const client = await prisma.client.update({
      where: { id: req.params.id },
      data: req.body
    })
    res.json(client)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/:id', clientAdminOnly, async (req, res) => {
  try {
    await prisma.client.delete({ where: { id: req.params.id } })
    res.json({ success: true })
  } catch (err) {
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
    const { isPrimary, ...data } = req.body
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
    res.json(loc)
  } catch (err) {
    console.error('[Location Update] Error:', err.message, err.stack)
    res.status(500).json({ error: err.message, stack: err.stack })
  }
}

router.put('/:id/locations/:locId', updateLocationHandler)
router.patch('/:id/locations/:locId', updateLocationHandler)

router.delete('/:id/locations/:locId', async (req, res) => {
  try {
    await prisma.location.delete({ where: { id: req.params.locId } })
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
  'title', 'slug', 'content', 'status', 'bannerId', 'metaTitle', 'metaDesc', 'ogImage',
  'inNavigation', 'navOrder', 'parentId'
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
      const root = await prisma.navigationItem.findFirst({
        where: { id: navigationRootId, clientId, parentId: null }
      })
      if (!root) {
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
        return created
      })
      return res.json(page)
    }

    const page = await prisma.page.create({
      data: { ...data, clientId }
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
    console.log('[CONFIG SAVE] Received request for client:', req.params.id)
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
        where: { clientId: req.params.id },
        select: { version: true }
      })
      updateData.version = (existing?.version || 0) + 1
    }

    console.log('[CONFIG SAVE] Upserting with version:', updateData.version)

    const config = await prisma.siteConfig.upsert({
      where:  { clientId: req.params.id },
      update: updateData,
      create: { clientId: req.params.id, ...updateData }
    })

    console.log('[CONFIG SAVE] Successfully saved config')

    // Clear export cache for this client
    exportCache.delete(req.params.id)

    res.json(config)
  } catch (err) {
    console.error('[CONFIG SAVE] Error:', err)
    console.error('[CONFIG SAVE] Error stack:', err.stack)
    res.status(500).json({ error: err.message, stack: err.stack })
  }
})

// ── Menu Categories ───────────────────────────────────────────
router.get('/:clientId/menu-categories', async (req, res) => {
  try {
    const cats = await prisma.menuCategory.findMany({
      where:   { clientId: req.params.clientId },
      include: { items: true },
      orderBy: { sortOrder: 'asc' }
    })
    res.json(cats)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/:clientId/menu-categories', async (req, res) => {
  try {
    const cat = await prisma.menuCategory.create({
      data: { ...req.body, clientId: req.params.clientId }
    })
    res.json(cat)
  } catch (err) {
    console.error('Create category error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

router.put('/:clientId/menu-categories/:id', async (req, res) => {
  try {
    const cat = await prisma.menuCategory.update({
      where: { id: req.params.id },
      data: req.body
    })
    res.json(cat)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/:clientId/menu-categories/:id', async (req, res) => {
  try {
    await prisma.menuCategory.delete({ where: { id: req.params.id } })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── Menu Items ────────────────────────────────────────────────
router.get('/:clientId/menu-items', async (req, res) => {
  try {
    const items = await prisma.menuItem.findMany({
      where:   { clientId: req.params.clientId },
      include: { category: true },
      orderBy: { sortOrder: 'asc' }
    })
    res.json(items)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/:clientId/menu-items', async (req, res) => {
  try {
    const { categoryId, price, ...rest } = req.body
    const item = await prisma.menuItem.create({
      data: {
        ...rest,
        clientId: req.params.clientId,
        price:    price ? parseFloat(price) : null,
        ...(categoryId ? { categoryId } : {})
      }
    })
    log({
      action: 'MENU_ITEM_ADDED', entity: 'MenuItem', entityName: item.name,
      userId: req.user.id, userName: req.user.name, clientId: req.params.clientId
    })
    res.json(item)
  } catch (err) {
    console.error('Create menu item error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// reorder MUST be above /:id PUT route
router.put('/:clientId/menu-items/reorder', async (req, res) => {
  try {
    const updates = req.body.items
    await Promise.all(
      updates.map(({ id, sortOrder }) =>
        prisma.menuItem.update({ where: { id }, data: { sortOrder } })
      )
    )
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/:clientId/menu-items/:id', async (req, res) => {
  try {
    const { price, ...rest } = req.body
    const item = await prisma.menuItem.update({
      where: { id: req.params.id },
      data: {
        ...rest,
        ...(price !== undefined ? { price: price ? parseFloat(price) : null } : {})
      }
    })
    res.json(item)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/:clientId/menu-items/:id', async (req, res) => {
  try {
    await prisma.menuItem.delete({ where: { id: req.params.id } })
    log({
      action: 'MENU_ITEM_DELETED', entity: 'MenuItem',
      userId: req.user.id, userName: req.user.name, clientId: req.params.clientId
    })
    res.json({ success: true })
  } catch (err) {
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
    // Site name format: urban-eats-dinedesk-xxxxx (random suffix for uniqueness)
    // Custom domain format: urban-eats-dinedesk.com.au (based on client name/domain)
    const generateSiteDetails = (client) => {
      // Priority: Use explicit domain field, otherwise generate from client name
      let baseName = client.domain || client.name || 'site'
      
      // If domain is provided and looks like a full domain (contains .com, .au, etc)
      if (client.domain && client.domain.includes('.')) {
        // Extract just the restaurant name part from domain
        // e.g., "urban-eats-dinedesk.com.au" -> "urban-eats-dinedesk"
        baseName = client.domain
          .replace(/^https?:\/\/(www\.)?/, '')  // Remove protocol
          .replace(/\.(com|co|au|uk|ca|in|io|org|net|biz)(\..*)?$/, '') // Remove TLD
      }
      
      // Sanitize for Netlify site name (alphanumeric + hyphens only)
      let sanitizedName = baseName
        .replace(/\./g, '-')                    // Replace dots with hyphens
        .replace(/[^a-z0-9-]/g, '-')           // Replace non-alphanumeric with hyphens
        .toLowerCase()
        .replace(/-+/g, '-')                   // Collapse multiple hyphens
        .replace(/^-|-$/g, '')                 // Remove leading/trailing hyphens
      
      // Ensure "-dinedesk" branding is included
      if (!sanitizedName.includes('dinedesk')) {
        sanitizedName = sanitizedName + '-dinedesk'
      }
      
      // Keep under Netlify's 63 character limit
      // Reserve space for random suffix
      const maxLen = 57  // 63 - 6 for suffix and hyphens
      if (sanitizedName.length > maxLen) {
        sanitizedName = sanitizedName.slice(0, maxLen)
      }
      
      // Add random suffix to ensure global uniqueness on Netlify
      const randomSuffix = Math.random().toString(36).substring(2, 7) // 5 random chars
      const netlifySiteName = `${sanitizedName}-${randomSuffix}`
      
      // Generate custom domain if not explicitly provided
      let customDomain = client.domain
      if (!customDomain || !customDomain.includes('.')) {
        // Auto-generate domain in format: restaurant-name-dinedesk.com.au
        customDomain = `${sanitizedName}.com.au`
      }
      
      return {
        siteName: netlifySiteName,
        customDomain: customDomain,
        baseName: sanitizedName
      }
    }
    
    const { siteName, customDomain, baseName } = generateSiteDetails(client)

    console.log('🚀 Creating Netlify site:', siteName)
    console.log('🌐 Custom Domain:', customDomain)
    console.log('📋 Template:', template)
    console.log('🔗 API URL:', apiUrl)
    console.log('👤 Client:', client.name, '| ID:', client.id)

    // 1 — Create the Netlify site
    console.log('⏳ Step 1/6: Creating Netlify site...')
    const netlifyData = await netlifyService.createSite(siteName, null)
    console.log('✅ Site created:', netlifyData.id)

    // 2 — Set env vars so the build knows which client/template to use
    console.log('⏳ Step 2/6: Setting environment variables...')
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
    console.log('⏳ Step 3/6: Configuring custom domain:', customDomain)
    try {
      await netlifyService.addDomain(netlifyData.id, customDomain)
      console.log('✅ Custom domain added successfully')
    } catch (err) {
      console.warn('⚠️  Could not add custom domain:', err.message)
      console.warn('   You can manually add it later in Netlify dashboard')
    }

    // 4 — Create a build hook named "CMS Deploy"
    console.log('⏳ Step 4/6: Creating build hook...')
    const hookRes = await require('axios').post(
      `https://api.netlify.com/api/v1/sites/${netlifyData.id}/build_hooks`,
      { title: 'CMS Deploy', branch: 'main' },
      { headers: { Authorization: 'Bearer ' + process.env.NETLIFY_TOKEN } }
    )
    const buildHook = hookRes.data.url
    console.log('🪝 Build hook created')

    // 5 — Trigger first build
    console.log('⏳ Step 5/6: Triggering first build...')
    await netlifyService.triggerDeploy(buildHook)
    console.log('⚡ First build triggered')

    // 6 — Save everything back to config
    console.log('⏳ Step 6/6: Saving configuration to database...')
    const existing = config?.netlify || {}
    await prisma.siteConfig.upsert({
      where:  { clientId: client.id },
      update: {
        netlify: {
          ...existing,
          siteId:       netlifyData.id,
          previewUrl:   netlifyData.ssl_url || netlifyData.url,
          customDomain: customDomain,
          buildHook,
          template,
        }
      },
      create: {
        clientId: client.id,
        netlify: {
          siteId:       netlifyData.id,
          previewUrl:   netlifyData.ssl_url || netlifyData.url,
          customDomain: customDomain,
          buildHook,
          template,
        }
      }
    })
    console.log('💾 Configuration saved to database')

    log({
      action: 'NETLIFY_SITE_CREATED', entity: 'Deployment',
      userId: req.user.id, userName: req.user.name, clientId: client.id
    })

    // Generate shareable preview URLs
    const previewUrl = netlifyData.ssl_url || netlifyData.url
    const netlifyAppUrl = `https://${siteName}.netlify.app`
    
    console.log('🎉 Site creation complete!')
    console.log('🌐 Netlify Preview URL:', previewUrl)
    console.log('🏷️  Netlify App URL:', netlifyAppUrl)
    console.log('🌐 Custom Domain:', customDomain)
    console.log('📝 Note: Custom domain will be active once DNS propagates (5-10 minutes)')
    
    res.json({
      success:        true,
      siteId:         netlifyData.id,
      siteName:       siteName,
      previewUrl:     previewUrl,
      netlifyAppUrl:  netlifyAppUrl,
      customDomain:   customDomain,
      buildHook,
      message:        `Site created! Access via ${netlifyAppUrl} or configure DNS for ${customDomain}`
    })
  } catch (err) {
    console.error('❌ Create site error:', err.message)
    console.error('Stack trace:', err.stack)
    console.error('Response data:', err.response?.data)
    
    // Provide user-friendly error messages
    let userMessage = err.message
    let hint = ''
    
    if (err.message.includes('not available') || err.message.includes('already taken')) {
      userMessage = 'The generated site name is already taken on Netlify. This can happen even with unique domains because Netlify site names must be globally unique across all Netlify users.'
      hint = 'The system has been updated to automatically add a random suffix to ensure uniqueness. Please try creating the site again - it should work now!'
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

// Mount navigation router under /:id/navigation
router.use('/:id/navigation', require('./navigation'))

router.use('/:id/navbar', require('./navbar'))

module.exports = router