const express = require('express')
const { authenticateToken, requireRole } = require('../middleware/auth')
const { prisma } = require('../lib/prisma')
const router = express.Router()
router.use(authenticateToken)
router.use(requireRole('SUPER_ADMIN'))

router.get('/', async (req, res) => {
  try {
    const logs = await prisma.activityLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200
    })
    res.json(logs)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router