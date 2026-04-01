const express = require('express')
const { authenticateToken } = require('../middleware/auth')
const { prisma } = require('../lib/prisma')
const router = express.Router({ mergeParams: true })
router.use(authenticateToken)

// Helper to get clientId from params (handles both /:clientId and /:id)
const getClientId = (req) => req.params.clientId || req.params.id

router.post('/deploy', async (req, res) => {
  const clientId = getClientId(req)
  const config = await prisma.siteConfig.findUnique({ where: { clientId } })
  const hookUrl = config?.netlify?.buildHook
  if (!hookUrl) return res.status(400).json({ error: 'No build hook configured' })
  const axios = require('axios')
  await axios.post(hookUrl)
  await prisma.deployment.create({ data: { clientId, status: 'triggered', triggeredBy: req.user.name } })
  res.json({ success: true })
})
router.get('/', async (req, res) => {
  const clientId = getClientId(req)
  const deploys = await prisma.deployment.findMany({ where: { clientId }, orderBy: { createdAt: 'desc' } })
  res.json(deploys)
})
module.exports = router