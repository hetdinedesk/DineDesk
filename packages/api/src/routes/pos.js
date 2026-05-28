const express = require('express')
const { prisma } = require('../lib/prisma')
const { authenticateToken } = require('../middleware/auth')
const { encrypt, decrypt, encryptJSON, decryptJSON } = require('../lib/encryption')
const { getAdapter, OAUTH_TYPES, APIKEY_TYPES } = require('../pos-adapters')

const router = express.Router({ mergeParams: true })
router.use(authenticateToken)

// Helper: load POSConfig + decrypt credentials into adapter config
async function loadAdapterConfig(clientId) {
  const pos = await prisma.pOSConfig.findUnique({ where: { clientId } })
  if (!pos) return null

  const creds = decryptJSON(pos.encryptedCredentials) || {}
  return {
    posType: pos.posType,
    accessToken: decrypt(pos.oauthAccessToken),
    refreshToken: decrypt(pos.oauthRefreshToken),
    tokenExpiresAt: pos.oauthTokenExpiresAt,
    locationId: pos.locationId,
    ...creds
  }
}

// Helper: strip secrets from POSConfig before returning to client
function sanitize(pos) {
  if (!pos) return null
  const { encryptedCredentials, oauthAccessToken, oauthRefreshToken, webhookSecret, ...safe } = pos
  return {
    ...safe,
    hasCredentials: !!(encryptedCredentials || oauthAccessToken),
    hasWebhookSecret: !!webhookSecret
  }
}

// ── GET /api/clients/:clientId/pos ───────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const pos = await prisma.pOSConfig.findUnique({
      where: { clientId: req.params.clientId },
      include: {
        menuSyncLogs: { orderBy: { createdAt: 'desc' }, take: 5 },
        _count: { select: { orderPushQueue: true } }
      }
    })
    res.json(sanitize(pos))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── POST /api/clients/:clientId/pos ──────────────────────────────────────────
// Create or update POS type selection
router.post('/', async (req, res) => {
  try {
    const { posType = 'none' } = req.body
    const clientId = req.params.clientId

    const pos = await prisma.pOSConfig.upsert({
      where: { clientId },
      update: { posType, connected: false, updatedAt: new Date() },
      create: { clientId, posType, connected: false }
    })
    res.json(sanitize(pos))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── POST /api/clients/:clientId/pos/save-credentials ─────────────────────────
// Save API key credentials (Abacus, Lightspeed, Revel) or manual OAuth tokens
router.post('/save-credentials', async (req, res) => {
  try {
    const { apiKey, apiSecret, storeId, baseUrl, accessToken, locationId, posType: bodyPosType } = req.body
    const clientId = req.params.clientId

    const creds = { apiKey, apiSecret, storeId, baseUrl }
    const credData = {
      encryptedCredentials: encryptJSON(creds),
      updatedAt: new Date(),
      ...(accessToken ? { oauthAccessToken: encrypt(accessToken) } : {}),
      ...(locationId  ? { locationId } : {})
    }

    const existing = await prisma.pOSConfig.findUnique({ where: { clientId } })
    const updated = existing
      ? await prisma.pOSConfig.update({ where: { clientId }, data: credData })
      : await prisma.pOSConfig.create({ data: { clientId, posType: bodyPosType || 'square', connected: false, ...credData } })
    res.json(sanitize(updated))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── POST /api/clients/:clientId/pos/test ────────────────────────────────────
router.post('/test', async (req, res) => {
  try {
    const clientId = req.params.clientId
    const adapterConfig = await loadAdapterConfig(clientId)
    if (!adapterConfig) return res.status(404).json({ error: 'POS not configured' })

    const adapter = getAdapter(adapterConfig)
    const start = Date.now()
    await adapter.testConnection()
    const latencyMs = Date.now() - start

    await prisma.pOSConfig.update({
      where: { clientId },
      data: { connected: true, connectionVerifiedAt: new Date() }
    })

    res.json({ success: true, latencyMs })
  } catch (err) {
    await prisma.pOSConfig.update({
      where: { clientId: req.params.clientId },
      data: { connected: false }
    }).catch(() => {})
    res.status(400).json({ success: false, error: err.message })
  }
})

// ── POST /api/clients/:clientId/pos/connect ──────────────────────────────────
// Connect with credentials (API-key POS or manual OAuth token entry)
router.post('/connect', async (req, res) => {
  try {
    const clientId = req.params.clientId
    const pos = await prisma.pOSConfig.findUnique({ where: { clientId } })
    if (!pos) return res.status(404).json({ error: 'POS not configured' })

    const creds = decryptJSON(pos.encryptedCredentials) || {}
    const adapterConfig = {
      posType: pos.posType,
      accessToken: decrypt(pos.oauthAccessToken),
      locationId: pos.locationId,
      ...creds
    }

    const adapter = getAdapter(adapterConfig)
    const result = await adapter.connect(adapterConfig)

    await prisma.pOSConfig.update({
      where: { clientId },
      data: {
        connected: true,
        connectionVerifiedAt: new Date(),
        locationId: result.locationId || pos.locationId,
        locationName: result.locationName || pos.locationName,
        updatedAt: new Date()
      }
    })

    res.json({ success: true, locationId: result.locationId, locationName: result.locationName })
  } catch (err) {
    res.status(400).json({ success: false, error: err.message })
  }
})

// ── POST /api/clients/:clientId/pos/sync-menu ────────────────────────────────
router.post('/sync-menu', async (req, res) => {
  try {
    const clientId = req.params.clientId
    const pos = await prisma.pOSConfig.findUnique({ where: { clientId } })
    if (!pos) return res.status(404).json({ error: 'POS not configured' })
    if (!pos.connected) return res.status(400).json({ error: 'POS is not connected' })

    // Rate limit: max 1 manual sync per 5 minutes
    if (pos.lastMenuSyncAt) {
      const msSinceLast = Date.now() - new Date(pos.lastMenuSyncAt).getTime()
      if (msSinceLast < 5 * 60 * 1000) {
        const waitSec = Math.ceil((5 * 60 * 1000 - msSinceLast) / 1000)
        return res.status(429).json({ error: `Please wait ${waitSec}s before syncing again` })
      }
    }

    const adapterConfig = await loadAdapterConfig(clientId)
    const adapter = getAdapter(adapterConfig)
    const start = Date.now()

    const { items } = await adapter.syncMenu()

    // Upsert items into MenuItem table
    let itemsAdded = 0, itemsUpdated = 0, itemsRemoved = 0

    const existingItems = await prisma.menuItem.findMany({
      where: { clientId },
      select: { id: true, name: true }
    })
    const existingNames = new Set(existingItems.map(i => i.name))

    for (const item of items) {
      const existing = await prisma.menuItem.findFirst({
        where: { clientId, name: item.name }
      })

      if (existing) {
        await prisma.menuItem.update({
          where: { id: existing.id },
          data: {
            description: item.description,
            price: item.basePrice,
            isAvailable: item.available,
            imageUrl: item.imageUrl,
            addons: item.modifierGroups || [],
            sizes: item.variants || [],
            hasVariants: (item.variants || []).length > 0,
            updatedAt: new Date()
          }
        })
        itemsUpdated++
      } else {
        // Find or create category
        let category = await prisma.menuCategory.findFirst({
          where: { clientId, name: item.category }
        })
        if (!category) {
          category = await prisma.menuCategory.create({
            data: { clientId, name: item.category }
          })
        }
        await prisma.menuItem.create({
          data: {
            clientId,
            categoryId: category.id,
            name: item.name,
            description: item.description,
            price: item.basePrice,
            isAvailable: item.available,
            imageUrl: item.imageUrl,
            addons: item.modifierGroups || [],
            sizes: item.variants || [],
            hasVariants: (item.variants || []).length > 0
          }
        })
        itemsAdded++
      }
    }

    // Mark items not in POS as unavailable
    const posNames = new Set(items.map(i => i.name))
    for (const existing of existingItems) {
      if (!posNames.has(existing.name)) {
        await prisma.menuItem.update({
          where: { id: existing.id },
          data: { isAvailable: false }
        })
        itemsRemoved++
      }
    }

    const durationMs = Date.now() - start

    await prisma.pOSConfig.update({
      where: { clientId },
      data: {
        lastMenuSyncAt: new Date(),
        menuItemsCount: items.length
      }
    })

    const log = await prisma.menuSyncLog.create({
      data: {
        clientId,
        posConfigId: pos.id,
        syncType: 'manual',
        status: 'success',
        itemsAdded,
        itemsUpdated,
        itemsRemoved,
        totalItems: items.length,
        durationMs
      }
    })

    res.json({
      success: true,
      itemsAdded,
      itemsUpdated,
      itemsRemoved,
      totalItems: items.length,
      durationMs,
      logId: log.id
    })
  } catch (err) {
    console.error('Menu sync error:', err)
    const pos = await prisma.pOSConfig.findUnique({ where: { clientId: req.params.clientId } }).catch(() => null)
    if (pos) {
      await prisma.menuSyncLog.create({
        data: {
          clientId: req.params.clientId,
          posConfigId: pos.id,
          syncType: 'manual',
          status: 'failed',
          errorMessage: err.message
        }
      }).catch(() => {})
    }
    res.status(500).json({ error: err.message })
  }
})

// ── GET /api/clients/:clientId/pos/sync-logs ─────────────────────────────────
router.get('/sync-logs', async (req, res) => {
  try {
    const logs = await prisma.menuSyncLog.findMany({
      where: { clientId: req.params.clientId },
      orderBy: { createdAt: 'desc' },
      take: 20
    })
    res.json(logs)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── GET /api/clients/:clientId/pos/health ────────────────────────────────────
router.get('/health', async (req, res) => {
  try {
    const clientId = req.params.clientId
    const adapterConfig = await loadAdapterConfig(clientId)
    if (!adapterConfig || adapterConfig.posType === 'none') {
      return res.json({ connected: false, posType: 'none' })
    }
    const adapter = getAdapter(adapterConfig)
    const health = await adapter.healthCheck()
    res.json({ ...health, posType: adapterConfig.posType })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── DELETE /api/clients/:clientId/pos ────────────────────────────────────────
router.delete('/', async (req, res) => {
  try {
    const clientId = req.params.clientId
    await prisma.pOSConfig.update({
      where: { clientId },
      data: {
        connected: false,
        oauthAccessToken: null,
        oauthRefreshToken: null,
        oauthTokenExpiresAt: null,
        encryptedCredentials: null,
        locationId: null,
        locationName: null
      }
    })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── POST /api/clients/:clientId/pos/oauth/square/callback ────────────────────
// Square OAuth callback handler
router.post('/oauth/square/callback', async (req, res) => {
  try {
    const { code } = req.body
    const clientId = req.params.clientId
    if (!code) return res.status(400).json({ error: 'Authorization code is required' })

    const SquareAdapter = require('../pos-adapters/square-adapter')
    const adapter = new SquareAdapter({ sandbox: process.env.NODE_ENV !== 'production' })

    const tokens = await adapter.exchangeCode(
      code,
      process.env.SQUARE_APP_ID,
      process.env.SQUARE_APP_SECRET,
      process.env.SQUARE_REDIRECT_URI
    )

    const pos = await prisma.pOSConfig.upsert({
      where: { clientId },
      update: {
        oauthAccessToken: encrypt(tokens.accessToken),
        oauthRefreshToken: tokens.refreshToken ? encrypt(tokens.refreshToken) : null,
        oauthTokenExpiresAt: tokens.expiresAt ? new Date(tokens.expiresAt) : null,
        posType: 'square',
        connected: false,
        updatedAt: new Date()
      },
      create: {
        clientId,
        posType: 'square',
        oauthAccessToken: encrypt(tokens.accessToken),
        oauthRefreshToken: tokens.refreshToken ? encrypt(tokens.refreshToken) : null,
        oauthTokenExpiresAt: tokens.expiresAt ? new Date(tokens.expiresAt) : null,
        connected: false
      }
    })

    // Auto-test connection and get location
    const sqAdapter = new SquareAdapter({ accessToken: tokens.accessToken })
    const result = await sqAdapter.connect({ accessToken: tokens.accessToken })

    await prisma.pOSConfig.update({
      where: { clientId },
      data: {
        connected: true,
        connectionVerifiedAt: new Date(),
        locationId: result.locationId,
        locationName: result.locationName
      }
    })

    res.json({ success: true, locationId: result.locationId, locationName: result.locationName })
  } catch (err) {
    res.status(400).json({ success: false, error: err.message })
  }
})

module.exports = router
