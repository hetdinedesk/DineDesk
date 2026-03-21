const { log } = require('../lib/activityLog')
const express = require('express')
const prisma = require('../lib/prisma')
const { authenticateToken } = require('../middleware/auth')
const multer = require('multer')
const sharp  = require('sharp')
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3')

const upload = multer({ storage: multer.memoryStorage() })

const r2 = new S3Client({
  region: 'auto',
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
  credentials: {
    accessKeyId:     process.env.CLOUDFLARE_R2_ACCESS_KEY,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_KEY
  }
})

const router = express.Router()

// ═══════════════════════════════════════════════════════════════
// PUBLIC ROUTES — no auth token needed
// MUST stay above router.use(authenticateToken)
// ═══════════════════════════════════════════════════════════════

router.get('/:id/export', async (req, res) => {
  try {
    const id = req.params.id
    const [client, menuCategories, specials, pages, banners, cfg] = await Promise.all([
      prisma.client.findUnique({ where: { id }, include: { locations: true } }),
      prisma.menuCategory.findMany({
        where: { clientId: id },
        include: { items: { orderBy: { sortOrder: 'asc' } } },
        orderBy: { sortOrder: 'asc' }
      }),
      prisma.special.findMany({ where: { clientId: id, isActive: true } }),
      prisma.page.findMany({ where: { clientId: id, status: 'published' } }),
      prisma.banner.findMany({ where: { clientId: id, isActive: true } }),
      prisma.siteConfig.findUnique({ where: { clientId: id } })
    ])

    if (!client) return res.status(404).json({ error: 'Client not found' })

    res.json({
  client,
  menuCategories,
  specials,
  pages,
  banners,
  settings:   cfg?.settings   || {},
  shortcodes: cfg?.shortcodes || {},
  colours:    cfg?.colours    || {},
  analytics:  cfg?.analytics  || {},
  homepage:   cfg?.homepage   || {},
  reviews:    cfg?.reviews    || {},
  booking:    cfg?.booking    || {},
  header:     cfg?.header     || {},
  headerCtas: cfg?.headerCtas || [],
})
  } catch (err) {
    console.error('Export error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// ═══════════════════════════════════════════════════════════════
// PROTECTED ROUTES
// ═══════════════════════════════════════════════════════════════
router.use(authenticateToken)

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

router.post('/', async (req, res) => {
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

router.put('/:id', async (req, res) => {
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

router.delete('/:id', async (req, res) => {
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
    const loc = await prisma.location.create({
      data: { ...req.body, clientId: req.params.id }
    })
    res.json(loc)
  } catch (err) {
    console.error('Create location error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

router.put('/:id/locations/:locId', async (req, res) => {
  try {
    const loc = await prisma.location.update({
      where: { id: req.params.locId },
      data: req.body
    })
    res.json(loc)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

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

router.post('/:id/pages', async (req, res) => {
  try {
    const page = await prisma.page.create({
      data: { ...req.body, clientId: req.params.id }
    })
    res.json(page)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/:id/pages/:pageId', async (req, res) => {
  try {
    const page = await prisma.page.update({
      where: { id: req.params.pageId },
      data: req.body
    })
    res.json(page)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/:id/pages/:pageId', async (req, res) => {
  try {
    await prisma.page.delete({ where: { id: req.params.pageId } })
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
    const config = await prisma.siteConfig.upsert({
      where:  { clientId: req.params.id },
      update: req.body,
      create: { clientId: req.params.id, ...req.body }
    })
    res.json(config)
  } catch (err) {
    res.status(500).json({ error: err.message })
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

// ── Image Upload to R2 ────────────────────────────────────────
router.post('/:clientId/images', upload.single('file'), async (req, res) => {
  try {
    const optimized = await sharp(req.file.buffer)
      .resize({ width: 1920, withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer()

    const key = `${req.params.clientId}/${Date.now()}.webp`

    await r2.send(new PutObjectCommand({
      Bucket:      process.env.CLOUDFLARE_R2_BUCKET,
      Key:         key,
      Body:        optimized,
      ContentType: 'image/webp'
    }))

    res.json({ url: `${process.env.CLOUDFLARE_R2_PUBLIC_URL}/${key}` })
  } catch (err) {
    console.error('Upload error:', err.message)
    res.status(500).json({ error: 'Upload failed' })
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
    const client     = await prisma.client.findUnique({ where: { id: req.params.id } })
    const siteName   = client.domain.replace(/\./g, '-')
    const netlifyData = await netlifyService.createSite(siteName, client.domain)

    await prisma.siteConfig.update({
      where: { clientId: client.id },
      data:  { netlify: { siteId: netlifyData.id, siteUrl: netlifyData.ssl_url } }
    })

    res.json(netlifyData)
  } catch (err) {
    console.error('Create site error:', err.message)
    res.status(500).json({ error: err.message })
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

module.exports = router