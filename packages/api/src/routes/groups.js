const express = require('express')
const { authenticateToken } = require('../middleware/auth')
const prisma = require('../lib/prisma')
const router = express.Router()
router.use(authenticateToken)

router.get('/', async (req, res) => {
  const groups = await prisma.group.findMany({ include: { clients: true } })
  res.json(groups)
})
router.post('/', async (req, res) => {
  const group = await prisma.group.create({ data: req.body })
  res.json(group)
})
router.put('/:id', async (req, res) => {
  const group = await prisma.group.update({ where: { id: req.params.id }, data: req.body })
  res.json(group)
})
router.delete('/:id', async (req, res) => {
  await prisma.group.delete({ where: { id: req.params.id } })
  res.json({ success: true })
})
module.exports = router