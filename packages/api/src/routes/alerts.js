const express = require('express')
const { prisma } = require('../lib/prisma.js')
const router = express.Router({ mergeParams: true })

// Helper to get clientId from params (handles both /:clientId and /:id)
const getClientId = (req) => req.params.clientId || req.params.id

// Get alerts
router.get('/', async (req, res) => {
  try {
    const clientId = getClientId(req)
    const alerts = await prisma.alertPopup.findMany({
      where: { clientId },
      orderBy: { id: 'desc' }
    })
    res.json(alerts)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Create alert
router.post('/', async (req, res) => {
  try {
    const clientId = getClientId(req)
    const alert = await prisma.alertPopup.create({
      data: { ...req.body, clientId }
    })
    res.json(alert)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Update alert
router.put('/:id', async (req, res) => {
  try {
    const alert = await prisma.alertPopup.update({
      where: { id: req.params.id },
      data: req.body
    })
    res.json(alert)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Delete alert
router.delete('/:id', async (req, res) => {
  try {
    await prisma.alertPopup.delete({
      where: { id: req.params.id }
    })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router

