const express = require('express')
const { authenticateToken } = require('../middleware/auth')
const prisma = require('../lib/prisma')
const router = express.Router()
router.use(authenticateToken)

router.get('/:clientId/menu-categories', async (req, res) => {
  const cats = await prisma.menuCategory.findMany({
    where: { clientId: req.params.clientId },
    include: { items: true },
    orderBy: { sortOrder: 'asc' }
  })
  res.json(cats)
})
router.post('/:clientId/menu-categories', async (req, res) => {
  const cat = await prisma.menuCategory.create({ data: { ...req.body, clientId: req.params.clientId } })
  res.json(cat)
})
router.put('/:clientId/menu-categories/:id', async (req, res) => {
  const cat = await prisma.menuCategory.update({ where: { id: req.params.id }, data: req.body })
  res.json(cat)
})
router.delete('/:clientId/menu-categories/:id', async (req, res) => {
  await prisma.menuCategory.delete({ where: { id: req.params.id } })
  res.json({ success: true })
})

router.get('/:clientId/menu-items', async (req, res) => {
  const items = await prisma.menuItem.findMany({
    where: { clientId: req.params.clientId },
    include: { category: true },
    orderBy: { sortOrder: 'asc' }
  })
  res.json(items)
})
router.post('/:clientId/menu-items', async (req, res) => {
  const item = await prisma.menuItem.create({ data: { ...req.body, clientId: req.params.clientId } })
  res.json(item)
})
router.put('/:clientId/menu-items/:id', async (req, res) => {
  const item = await prisma.menuItem.update({ where: { id: req.params.id }, data: req.body })
  res.json(item)
})
router.delete('/:clientId/menu-items/:id', async (req, res) => {
  await prisma.menuItem.delete({ where: { id: req.params.id } })
  res.json({ success: true })
})
module.exports = router