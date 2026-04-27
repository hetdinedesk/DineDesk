const express = require('express')
const { prisma } = require('../lib/prisma')
const { authenticateToken } = require('../middleware/auth')
const router = express.Router({ mergeParams: true })

const getClientId = (req) => req.params.id

// GET /api/loyalty/customers/:phone?clientId=xxx - Lookup customer by phone
router.get('/customers/:phone', async (req, res) => {
  try {
    const { phone } = req.params
    const { clientId } = req.query

    if (!clientId) {
      return res.status(400).json({ error: 'clientId is required' })
    }

    // Normalize phone number (remove spaces, dashes, etc.)
    const normalizedPhone = phone.replace(/[\s\-()]/g, '')

    const customer = await prisma.customer.findUnique({
      where: {
        clientId_phone: {
          clientId,
          phone: normalizedPhone
        }
      }
    })

    if (!customer) {
      return res.json({ exists: false, points: 0, totalOrders: 0 })
    }

    res.json({ exists: true, customer })
  } catch (err) {
    console.error('Customer lookup error:', err)
    res.status(500).json({ error: err.message })
  }
})

// POST /api/loyalty/customers - Create or update customer
router.post('/customers', async (req, res) => {
  try {
    const { clientId, phone, name, email } = req.body

    if (!clientId || !phone) {
      return res.status(400).json({ error: 'clientId and phone are required' })
    }

    const normalizedPhone = phone.replace(/[\s\-()]/g, '')

    // Try to find existing customer
    let customer = await prisma.customer.findUnique({
      where: {
        clientId_phone: {
          clientId,
          phone: normalizedPhone
        }
      }
    })

    if (customer) {
      // Update existing customer
      customer = await prisma.customer.update({
        where: { id: customer.id },
        data: {
          name: name || customer.name,
          email: email || customer.email
        }
      })
    } else {
      // Create new customer
      customer = await prisma.customer.create({
        data: {
          clientId,
          phone: normalizedPhone,
          name: name || null,
          email: email || null,
          points: 0,
          totalOrders: 0,
          totalSpent: 0
        }
      })
    }

    res.json(customer)
  } catch (err) {
    console.error('Customer creation error:', err)
    res.status(500).json({ error: err.message })
  }
})

// GET /api/clients/:id/loyalty/config - Get loyalty config
router.get('/config', async (req, res) => {
  try {
    const clientId = getClientId(req)

    const config = await prisma.loyaltyConfig.findUnique({
      where: { clientId },
      include: {
        rewards: {
          where: { isActive: true },
          orderBy: { pointsRequired: 'asc' }
        }
      }
    })

    if (!config) {
      return res.json({ enabled: false, pointsPerDollar: 1, rewards: [] })
    }

    res.json(config)
  } catch (err) {
    console.error('Get loyalty config error:', err)
    res.status(500).json({ error: err.message })
  }
})

// POST /api/clients/:id/loyalty/config - Update loyalty config (auth required)
router.post('/config', authenticateToken, async (req, res) => {
  try {
    const clientId = getClientId(req)
    const { enabled, pointsPerDollar } = req.body

    const config = await prisma.loyaltyConfig.upsert({
      where: { clientId },
      update: {
        enabled: enabled !== undefined ? enabled : true,
        pointsPerDollar: pointsPerDollar || 1
      },
      create: {
        clientId,
        enabled: enabled !== undefined ? enabled : true,
        pointsPerDollar: pointsPerDollar || 1
      },
      include: {
        rewards: true
      }
    })

    res.json(config)
  } catch (err) {
    console.error('Update loyalty config error:', err)
    res.status(500).json({ error: err.message })
  }
})

// Legacy routes for compatibility with current production API
// GET /api/clients/:clientId/loyalty/config - Get loyalty config (old path)
router.get('/clients/:clientId/loyalty/config', async (req, res) => {
  try {
    const clientId = req.params.clientId

    const config = await prisma.loyaltyConfig.findUnique({
      where: { clientId },
      include: {
        rewards: {
          where: { isActive: true },
          orderBy: { pointsRequired: 'asc' }
        }
      }
    })

    if (!config) {
      return res.json({ enabled: false, pointsPerDollar: 1, rewards: [] })
    }

    res.json(config)
  } catch (err) {
    console.error('Get loyalty config error:', err)
    res.status(500).json({ error: err.message })
  }
})

// POST /api/clients/:clientId/loyalty/config - Update loyalty config (old path, auth required)
router.post('/clients/:clientId/loyalty/config', authenticateToken, async (req, res) => {
  try {
    const clientId = req.params.clientId
    const { enabled, pointsPerDollar } = req.body

    const config = await prisma.loyaltyConfig.upsert({
      where: { clientId },
      update: {
        enabled: enabled !== undefined ? enabled : true,
        pointsPerDollar: pointsPerDollar || 1
      },
      create: {
        clientId,
        enabled: enabled !== undefined ? enabled : true,
        pointsPerDollar: pointsPerDollar || 1
      },
      include: {
        rewards: true
      }
    })

    res.json(config)
  } catch (err) {
    console.error('Update loyalty config error:', err)
    res.status(500).json({ error: err.message })
  }
})

// GET /api/clients/:id/loyalty/rewards - Get rewards
router.get('/rewards', async (req, res) => {
  try {
    const clientId = getClientId(req)

    const rewards = await prisma.reward.findMany({
      where: { clientId, isActive: true },
      orderBy: { pointsRequired: 'asc' }
    })

    res.json(rewards)
  } catch (err) {
    console.error('Get rewards error:', err)
    res.status(500).json({ error: err.message })
  }
})

// POST /api/clients/:id/loyalty/rewards - Create reward (auth required)
router.post('/rewards', authenticateToken, async (req, res) => {
  try {
    const clientId = getClientId(req)
    const { name, description, pointsRequired, discountValue, discountType = 'fixed' } = req.body

    if (!name || !pointsRequired || !discountValue) {
      return res.status(400).json({ error: 'name, pointsRequired, and discountValue are required' })
    }

    // Get or create loyalty config
    let loyaltyConfig = await prisma.loyaltyConfig.findUnique({
      where: { clientId }
    })

    if (!loyaltyConfig) {
      loyaltyConfig = await prisma.loyaltyConfig.create({
        data: { clientId, enabled: false, pointsPerDollar: 1 }
      })
    }

    const reward = await prisma.reward.create({
      data: {
        clientId,
        loyaltyConfigId: loyaltyConfig.id,
        name,
        description,
        pointsRequired,
        discountValue,
        discountType
      }
    })

    res.json(reward)
  } catch (err) {
    console.error('Create reward error:', err)
    res.status(500).json({ error: err.message })
  }
})

// PATCH /api/clients/:id/loyalty/rewards/:rewardId - Update reward (auth required)
router.patch('/rewards/:rewardId', authenticateToken, async (req, res) => {
  try {
    const { rewardId } = req.params
    const { name, description, pointsRequired, discountValue, discountType, isActive } = req.body

    const reward = await prisma.reward.update({
      where: { id: rewardId },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(pointsRequired !== undefined && { pointsRequired }),
        ...(discountValue !== undefined && { discountValue }),
        ...(discountType !== undefined && { discountType }),
        ...(isActive !== undefined && { isActive })
      }
    })

    res.json(reward)
  } catch (err) {
    console.error('Update reward error:', err)
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/clients/:id/loyalty/rewards/:rewardId - Soft delete reward (auth required)
router.delete('/rewards/:rewardId', authenticateToken, async (req, res) => {
  try {
    const { rewardId } = req.params

    await prisma.reward.update({
      where: { id: rewardId },
      data: { isActive: false }
    })

    res.json({ success: true })
  } catch (err) {
    console.error('Delete reward error:', err)
    res.status(500).json({ error: err.message })
  }
})

// POST /api/loyalty/redeem - Redeem reward
router.post('/redeem', async (req, res) => {
  try {
    const { customerId, rewardId } = req.body

    if (!customerId || !rewardId) {
      return res.status(400).json({ error: 'customerId and rewardId are required' })
    }

    // Get customer and reward
    const [customer, reward] = await Promise.all([
      prisma.customer.findUnique({ where: { id: customerId } }),
      prisma.reward.findUnique({ where: { id: rewardId } })
    ])

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' })
    }

    if (!reward) {
      return res.status(404).json({ error: 'Reward not found' })
    }

    if (!reward.isActive) {
      return res.status(400).json({ error: 'Reward is not active' })
    }

    if (customer.points < reward.pointsRequired) {
      return res.status(400).json({ 
        error: 'Insufficient points',
        required: reward.pointsRequired,
        available: customer.points
      })
    }

    // Deduct points
    const updatedCustomer = await prisma.customer.update({
      where: { id: customerId },
      data: {
        points: customer.points - reward.pointsRequired
      }
    })

    res.json({
      success: true,
      customer: updatedCustomer,
      reward,
      pointsDeducted: reward.pointsRequired
    })
  } catch (err) {
    console.error('Redeem reward error:', err)
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
