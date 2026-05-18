const express = require('express')
const { authenticateToken, requireRole } = require('../middleware/auth')
const { prisma } = require('../lib/prisma')
const router = express.Router()
router.use(authenticateToken)
router.use(requireRole('SUPER_ADMIN'))

router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 50
    const skip = (page - 1) * limit

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip
      }),
      prisma.activityLog.count()
    ])

    res.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router