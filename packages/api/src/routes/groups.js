const express = require('express')
const { authenticateToken, requireRole } = require('../middleware/auth')
const { prisma } = require('../lib/prisma')
const router = express.Router()
router.use(authenticateToken)
router.use(requireRole('SUPER_ADMIN', 'MANAGER'))

router.get('/', async (req, res) => {
  const groups = await prisma.group.findMany({ include: { clients: true } })
  res.json(groups)
})
router.post('/', async (req, res) => {
  const { name, color } = req.body
  if (!name) return res.status(400).json({ error: 'Group name is required' })
  const group = await prisma.group.create({ data: { name, color } })
  res.json(group)
})
router.put('/:id', async (req, res) => {
  const { name, color } = req.body
  const data = {}
  if (name !== undefined) data.name = name
  if (color !== undefined) data.color = color
  const group = await prisma.group.update({ where: { id: req.params.id }, data })
  res.json(group)
})
router.delete('/:id', async (req, res) => {
  await prisma.group.delete({ where: { id: req.params.id } })
  res.json({ success: true })
})
module.exports = router