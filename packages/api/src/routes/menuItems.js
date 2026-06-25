const express = require('express')
const { authenticateToken } = require('../middleware/auth')
const { prisma } = require('../lib/prisma')
const { log } = require('../lib/activityLog')
const router = express.Router()

// Import clearExportCache from clients route
let clearExportCache
router.use((req, res, next) => {
  // Lazy load to avoid circular dependency
  if (!clearExportCache) {
    clearExportCache = require('./clients').clearExportCache
  }
  next()
})

// ── Public: "Also ordered with" suggestions (no auth needed) ──────────────────
router.get('/:clientId/menu-items/suggestions', async (req, res) => {
  try {
    const { clientId } = req.params
    const itemIds = (req.query.itemIds || '').split(',').map(s => s.trim()).filter(Boolean)
    if (itemIds.length === 0) return res.json([])

    // Fetch last 500 completed orders for this client
    const orders = await prisma.order.findMany({
      where: { clientId, status: { in: ['completed', 'ready'] } },
      select: { items: true },
      orderBy: { createdAt: 'desc' },
      take: 500
    })

    // Build co-occurrence map: for each item in cart, count how often other items appear in same order
    const coCount = {}
    const cartSet = new Set(itemIds)
    orders.forEach(order => {
      const orderItemIds = (order.items || []).map(i => i.id).filter(Boolean)
      const hasCartItem = orderItemIds.some(id => cartSet.has(id))
      if (!hasCartItem) return
      orderItemIds.forEach(id => {
        if (!cartSet.has(id)) {
          coCount[id] = (coCount[id] || 0) + 1
        }
      })
    })

    // Get top 4 co-occurring item IDs
    const topIds = Object.entries(coCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 4)
      .map(([id]) => id)

    if (topIds.length === 0) return res.json([])

    // Fetch full item details
    const items = await prisma.menuItem.findMany({
      where: { id: { in: topIds }, clientId, isAvailable: true },
      select: { id: true, name: true, price: true, imageUrl: true, description: true, categoryName: true }
    })

    // Return in co-occurrence order
    const ordered = topIds.map(id => items.find(i => i.id === id)).filter(Boolean)
    res.json(ordered)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.use(authenticateToken)

router.get('/:clientId/menu-categories', async (req, res) => {
  try {
    const cats = await prisma.menuCategory.findMany({
      where: { clientId: req.params.clientId },
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

router.get('/:clientId/menu-items', async (req, res) => {
  try {
    const items = await prisma.menuItem.findMany({
      where: { clientId: req.params.clientId },
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
    const { categoryId, price, sizes, addons, hasVariants, ...rest } = req.body
    const clientId = req.params.clientId
    
    const item = await prisma.menuItem.create({
      data: {
        ...rest,
        clientId,
        price: price ? parseFloat(price) : null,
        sizes: sizes || [],
        addons: addons || [],
        hasVariants: hasVariants || false,
        ...(categoryId ? { categoryId } : {})
      }
    })
    
    // Clear export cache so preview sites get fresh data
    if (clearExportCache) clearExportCache(clientId)
    
    log({
      action: 'MENU_ITEM_ADDED', entity: 'MenuItem', entityName: item.name,
      userId: req.user.id, userName: req.user.name, clientId
    })
    res.json(item)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

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
    const { price, sizes, addons, hasVariants, ...rest } = req.body
    const clientId = req.params.clientId
    
    const item = await prisma.menuItem.update({
      where: { id: req.params.id },
      data: {
        ...rest,
        price: price !== undefined ? (price ? parseFloat(price) : null) : undefined,
        sizes: sizes !== undefined ? sizes : undefined,
        addons: addons !== undefined ? addons : undefined,
        hasVariants: hasVariants !== undefined ? hasVariants : undefined
      }
    })
    
    // Clear export cache so preview sites get fresh data
    if (clearExportCache) clearExportCache(clientId)
    
    res.json(item)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/:clientId/menu-items/:id', async (req, res) => {
  try {
    const clientId = req.params.clientId
    await prisma.menuItem.delete({ where: { id: req.params.id } })
    log({
      action: 'MENU_ITEM_DELETED', entity: 'MenuItem',
      userId: req.user.id, userName: req.user.name, clientId
    })
    // Clear export cache so preview sites get fresh data
    if (clearExportCache) clearExportCache(clientId)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router