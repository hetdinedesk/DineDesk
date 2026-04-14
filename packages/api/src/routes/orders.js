const express = require('express')
const { prisma } = require('../lib/prisma')
const { sendOrderConfirmation, sendRestaurantNotification } = require('../lib/email')
const { authenticateToken } = require('../middleware/auth')
const router = express.Router({ mergeParams: true })

const getClientId = (req) => req.params.clientId || req.params.id

// Helper to generate next order number for a client
async function getNextOrderNumber(clientId) {
  const lastOrder = await prisma.order.findFirst({
    where: { clientId },
    orderBy: { orderNumber: 'desc' }
  })
  return (lastOrder?.orderNumber || 0) + 1
}

// POST - Create order
router.post('/', async (req, res) => {
  try {
    const clientId = getClientId(req)
    const {
      items,
      subtotal,
      taxAmount,
      total,
      currency,
      customerName,
      customerEmail,
      customerPhone,
      orderType = 'pickup',
      pickupTime,
      paymentMethod = 'cash',
      note,
      deliveryFee = 0,
      locationId
    } = req.body

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Order must contain at least one item' })
    }
    if (!customerName || !customerEmail || !customerPhone) {
      return res.status(400).json({ error: 'Customer name, email, and phone are required' })
    }

    // Get client config to check if ordering is enabled
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: { siteConfig: true }
    })
    if (!client) return res.status(404).json({ error: 'Client not found' })

    const ordering = client.siteConfig?.ordering || {}
    if (!ordering.enabled) {
      return res.status(400).json({ error: 'Online ordering is not enabled for this client' })
    }

    // Get payment gateway config
    const paymentGateway = await prisma.paymentGateway.findUnique({
      where: { clientId }
    })

    // Validate payment method
    if (paymentMethod === 'stripe') {
      if (!paymentGateway?.isActive || paymentGateway.provider !== 'stripe') {
        return res.status(400).json({ error: 'Stripe payment is not configured' })
      }
    } else if (paymentMethod === 'cash') {
      if (!paymentGateway?.cashEnabled) {
        return res.status(400).json({ error: 'Cash payment is not enabled' })
      }
    }

    // Server-side price verification — look up actual prices from DB
    const itemIds = items.map(i => i.id).filter(Boolean)
    const dbItems = await prisma.menuItem.findMany({
      where: { id: { in: itemIds }, clientId }
    })
    const priceMap = {}
    for (const dbItem of dbItems) {
      priceMap[dbItem.id] = parseFloat(dbItem.price) || 0
    }

    let verifiedSubtotal = 0
    const verifiedItems = items.map(item => {
      const realPrice = priceMap[item.id]
      if (realPrice === undefined) {
        // Item not found — keep submitted price but flag it
        return item
      }
      const qty = parseInt(item.quantity) || 1
      verifiedSubtotal += realPrice * qty
      return { ...item, price: realPrice }
    })

    // Recalculate tax and total
    const taxConfig = ordering.tax || {}
    const taxRate = parseFloat(taxConfig.rate || 0) / 100
    const verifiedTaxAmount = Math.round(verifiedSubtotal * taxRate * 100) / 100
    const verifiedDeliveryFee = orderType === 'delivery' ? parseFloat(deliveryFee || 0) : 0
    const verifiedTotal = Math.round((verifiedSubtotal + verifiedTaxAmount + verifiedDeliveryFee) * 100) / 100

    const orderNumber = await getNextOrderNumber(clientId)

    // Create order
    const order = await prisma.order.create({
      data: {
        clientId,
        orderNumber,
        status: 'new',
        items: verifiedItems,
        subtotal: verifiedSubtotal,
        taxAmount: verifiedTaxAmount,
        total: verifiedTotal,
        currency: currency || paymentGateway?.currency || 'AUD',
        customerName,
        customerEmail,
        customerPhone,
        orderType,
        pickupTime: pickupTime ? new Date(pickupTime) : null,
        paymentMethod,
        paymentStatus: paymentMethod === 'cash' ? 'pending' : 'pending',
        note,
        deliveryFee,
        paymentGatewayId: paymentGateway?.id,
        locationId: locationId || null
      }
    })

    // Get notification config from site config
    const notificationConfig = ordering.notifications || {}

    // Get location data if locationId is provided
    let locationData = {}
    if (order.locationId) {
      const location = await prisma.location.findUnique({
        where: { id: order.locationId }
      })
      if (location) {
        locationData = {
          name: location.name,
          address: location.address
        }
      }
    }

    // Prepare client data for email
    const clientData = {
      logo: client.logo || null,
      colours: client.colours || {},
      address: client.address || ''
    }

    // Send email notifications (non-blocking)
    const clientName = client.name || 'Restaurant'
    Promise.all([
      sendOrderConfirmation(order, clientName, notificationConfig, clientData, locationData),
      sendRestaurantNotification(order, clientName, notificationConfig, client.email)
    ]).catch(err => console.error('Email notification error:', err))

    // If Stripe payment, create PaymentIntent (will be implemented in payments.js)
    let stripeClientSecret = null
    if (paymentMethod === 'stripe') {
      // Return order ID so frontend can create PaymentIntent via separate endpoint
      return res.json({
        order,
        requiresPayment: true,
        orderId: order.id
      })
    }

    // For cash orders, return immediately
    res.json({
      order,
      requiresPayment: false
    })
  } catch (err) {
    console.error('Create order error:', err)
    res.status(500).json({ error: err.message })
  }
})

// GET /:orderId - Get single order by ID (public, no auth needed)
router.get('/:orderId', async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.orderId }
    })
    if (!order) return res.status(404).json({ error: 'Order not found' })
    res.json(order)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PATCH /:orderId/status - Update order status (for CMS dashboard)
router.patch('/:orderId/status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body
    const validStatuses = ['new', 'preparing', 'ready', 'completed', 'cancelled']
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' })
    }

    const order = await prisma.order.update({
      where: { id: req.params.orderId },
      data: { status }
    })
    res.json(order)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET - List orders for client (for CMS dashboard)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const clientId = getClientId(req)
    const { status, limit = 50 } = req.query

    const where = { clientId }
    if (status) where.status = status

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit)
    })
    res.json(orders)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
