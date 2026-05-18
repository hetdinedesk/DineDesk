const express = require('express')
const { prisma } = require('../lib/prisma')
const { authenticateToken } = require('../middleware/auth')
const router = express.Router({ mergeParams: true })

// Helper to get clientId from params (handles both /:clientId and /:id)
const getClientId = (req) => req.params.clientId || req.params.id

// Get legal docs
router.get('/', async (req, res) => {
  try {
    const clientId = getClientId(req)
    const docs = await prisma.legalDoc.findMany({
      where: { clientId },
      orderBy: { id: 'asc' }
    })
    res.json(docs)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Create legal doc
router.post('/', authenticateToken, async (req, res) => {
  try {
    const clientId = getClientId(req)
    const doc = await prisma.legalDoc.create({
      data: { ...req.body, clientId }
    })
    res.json(doc)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Update legal doc
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const doc = await prisma.legalDoc.update({
      where: { id: req.params.id },
      data: req.body
    })
    res.json(doc)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Delete legal doc
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await prisma.legalDoc.delete({
      where: { id: req.params.id }
    })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router

