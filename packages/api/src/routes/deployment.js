const express = require('express')
const { authenticateToken } = require('../middleware/auth')
const prisma = require('../lib/prisma')
const router = express.Router()
router.use(authenticateToken)

router.post('/:id/deploy', async (req, res) => {
  const config = await prisma.siteConfig.findUnique({ where: { clientId: req.params.id } })
  const hookUrl = config?.netlify?.buildHook
  if (!hookUrl) return res.status(400).json({ error: 'No build hook configured' })
  const axios = require('axios')
  await axios.post(hookUrl)
  await prisma.deployment.create({ data: { clientId: req.params.id, status: 'triggered', triggeredBy: req.user.name } })
  res.json({ success: true })
})
router.get('/:id/deploys', async (req, res) => {
  const deploys = await prisma.deployment.findMany({ where: { clientId: req.params.id }, orderBy: { createdAt: 'desc' } })
  res.json(deploys)
})
module.exports = router