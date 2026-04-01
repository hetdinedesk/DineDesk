const express = require('express')
const { prisma } = require('../lib/prisma.js')
const router = express.Router({ mergeParams: true })

// Helper to get clientId from params (handles both /:clientId and /:id)
const getClientId = (req) => req.params.clientId || req.params.id

// Get homepage sections
router.get('/', async (req, res) => {
  try {
    const clientId = getClientId(req)
    const sections = await prisma.homeSection.findMany({
      where: { clientId },
      orderBy: { sortOrder: 'asc' }
    })
    res.json(sections)
  } catch (err) {
    console.error('Get homepage error:', err)
    res.status(500).json({ error: err.message })
  }
})

// Save homepage sections
router.put('/', async (req, res) => {
  try {
    const clientId = getClientId(req)
    const sections = req.body
    await prisma.$transaction(async (tx) => {
      // Delete all
      await tx.homeSection.deleteMany({ where: { clientId } })
      
      // Create new
      for (let section of sections) {
        await tx.homeSection.create({
          data: {
            clientId,
            type: section.type,
            title: section.title,
            content: section.content,
            imageUrl: section.imageUrl,
            buttonText: section.buttonText,
            buttonUrl: section.buttonUrl,
            sortOrder: section.sortOrder,
            isActive: section.isActive !== false
          }
        })
      }
    })
    res.json({ success: true })
  } catch (err) {
    console.error('Save homepage error:', err)
    res.status(500).json({ error: err.message })
  }
})

// Create single section (for POST)
router.post('/', async (req, res) => {
  try {
    const clientId = getClientId(req)
    const section = await prisma.homeSection.create({
      data: { ...req.body, clientId }
    })
    res.json(section)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Delete single section
router.delete('/:id', async (req, res) => {
  try {
    await prisma.homeSection.delete({
      where: { id: req.params.id }
    })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router

