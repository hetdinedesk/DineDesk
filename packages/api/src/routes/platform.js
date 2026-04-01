const express = require('express')
const { prisma } = require('../lib/prisma')
const { authenticateToken, requireRole } = require('../middleware/auth')
const router = express.Router()

router.use(authenticateToken)
router.use(requireRole('SUPER_ADMIN'))

// GET global config
router.get('/', async (req, res) => {
  try {
    const config = await prisma.globalConfig.findUnique({ where: { id: 'global' } })
    res.json(config || { settings: {} })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// UPDATE global config
router.put('/', async (req, res) => {
  try {
    const config = await prisma.globalConfig.upsert({
      where: { id: 'global' },
      update: { settings: req.body },
      create: { id: 'global', settings: req.body }
    })
    res.json(config)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
