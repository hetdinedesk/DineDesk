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
    
    console.log('[API] Creating menu item with:', { name: rest.name, sizes, addons, hasVariants })
    
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
    
    console.log('[API] Created menu item:', { id: item.id, sizes: item.sizes, addons: item.addons })
    
    // Clear export cache so preview sites get fresh data
    if (clearExportCache) clearExportCache(clientId)
    
    log({
      action: 'MENU_ITEM_ADDED', entity: 'MenuItem', entityName: item.name,
      userId: req.user.id, userName: req.user.name, clientId
    })
    res.json(item)
  } catch (err) {
    console.error('Create menu item error:', err.message)
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
    
    console.log('[API] Updating menu item:', { id: req.params.id, sizes, addons, hasVariants })
    
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
    
    console.log('[API] Updated menu item:', { id: item.id, sizes: item.sizes, addons: item.addons })
    
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