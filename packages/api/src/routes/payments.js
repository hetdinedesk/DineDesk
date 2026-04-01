const express = require('express')
const { prisma } = require('../lib/prisma.js')
const router = express.Router({ mergeParams: true })

// Helper to get clientId from params (handles both /:clientId and /:id)
const getClientId = (req) => req.params.clientId || req.params.id

// Get payment config
router.get('/', async (req, res) => {
  try {
    const clientId = getClientId(req)
    const payment = await prisma.paymentGateway.findUnique({
      where: { clientId }
    })
    res.json(payment || {})
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Update payment config
router.put('/', async (req, res) => {
  try {
    const clientId = getClientId(req)
    
    // Check if client exists first
    const client = await prisma.client.findUnique({ where: { id: clientId } })
    if (!client) return res.status(404).json({ error: 'Client not found' })

    const payment = await prisma.paymentGateway.upsert({
      where: { clientId },
      update: req.body,
      create: { ...req.body, clientId }
    })
    res.json(payment)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
