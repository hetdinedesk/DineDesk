const express = require('express')
const { authenticateToken } = require('../middleware/auth')
const { prisma } = require('../lib/prisma')
const { log } = require('../lib/activityLog')
const router = express.Router()
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
    const { categoryId, price, ...rest } = req.body
    const item = await prisma.menuItem.create({
      data: {
        ...rest,
        clientId: req.params.clientId,
        price: price ? parseFloat(price) : null,
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

module.exports = router