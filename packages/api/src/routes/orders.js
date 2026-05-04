const express = require('express')
const { prisma } = require('../lib/prisma')
const { sendOrderConfirmation, sendRestaurantNotification } = require('../lib/email')
const { authenticateToken } = require('../middleware/auth')
const { updateOrderStatuses } = require('../jobs/updateOrderStatus')
const OrderRouter = require('../pos-adapters')
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
      locationId,
      loyaltyCustomerId,
      pointsUsed = 0,
      rewardUsed = null,
      discountAmount = 0
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
    const [dbItems, dbSpecials] = await Promise.all([
      prisma.menuItem.findMany({
        where: { id: { in: itemIds }, clientId }
      }),
      prisma.special.findMany({
        where: { id: { in: itemIds }, clientId }
      })
    ])
    const priceMap = {}
    for (const dbItem of dbItems) {
      priceMap[dbItem.id] = parseFloat(dbItem.price) || 0
    }
    for (const dbSpecial of dbSpecials) {
      priceMap[dbSpecial.id] = parseFloat(dbSpecial.price) || 0
    }

    let verifiedSubtotal = 0
    const verifiedItems = items.map(item => {
      const realPrice = priceMap[item.id]
      const qty = parseInt(item.quantity) || 1
      if (realPrice !== undefined) {
        verifiedSubtotal += realPrice * qty
        return { ...item, price: realPrice }
      }
      // Item not found in either table — use submitted price
      verifiedSubtotal += (parseFloat(item.price) || 0) * qty
      return item
    })

    // Recalculate tax and total
    const taxRate = parseFloat(ordering.taxRate || 0) / 100
    const verifiedTaxAmount = Math.round(verifiedSubtotal * taxRate * 100) / 100
    const verifiedDeliveryFee = orderType === 'delivery' ? parseFloat(deliveryFee || 0) : 0
    const verifiedTotal = Math.round((verifiedSubtotal + verifiedTaxAmount + verifiedDeliveryFee - discountAmount) * 100) / 100

    const orderNumber = await getNextOrderNumber(clientId)

    // Loyalty: Check if loyalty is enabled and process points
    let loyaltyConfig = null
    let customer = null
    let pointsEarned = 0

    try {
      loyaltyConfig = await prisma.loyaltyConfig.findUnique({
        where: { clientId }
      })

      if (loyaltyConfig && loyaltyConfig.enabled) {
        // If loyaltyCustomerId is provided, use it directly
        if (loyaltyCustomerId) {
          customer = await prisma.customer.findUnique({
            where: { id: loyaltyCustomerId }
          })
        } else {
          // Otherwise, find or create customer by phone
          const normalizedPhone = customerPhone.replace(/[\s\-()]/g, '')

          customer = await prisma.customer.findUnique({
            where: {
              clientId_phone: {
                clientId,
                phone: normalizedPhone
              }
            }
          })

          if (!customer) {
            customer = await prisma.customer.create({
              data: {
                clientId,
                phone: normalizedPhone,
                name: customerName,
                email: customerEmail,
                points: 0,
                totalOrders: 0,
                totalSpent: 0
              }
            })
          } else {
            // Update customer info if provided
            customer = await prisma.customer.update({
              where: { id: customer.id },
              data: {
                name: customerName || customer.name,
                email: customerEmail || customer.email
              }
            })
          }
        }

        // Calculate points earned (based on subtotal, not including tax/delivery)
        pointsEarned = Math.floor(verifiedSubtotal * loyaltyConfig.pointsPerDollar)

        // Update customer points and stats (account for points used)
        customer = await prisma.customer.update({
          where: { id: customer.id },
          data: {
            points: customer.points + pointsEarned - (pointsUsed || 0),
            totalOrders: customer.totalOrders + 1,
            totalSpent: customer.totalSpent + verifiedSubtotal
          }
        })
      }
    } catch (loyaltyError) {
      console.error('Loyalty processing error:', loyaltyError)
      // Continue with order creation even if loyalty fails
    }

    // Create order
    const order = await prisma.order.create({
      data: {
        clientId,
        customerId: customer?.id || null,
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
        locationId: locationId || null,
        pointsEarned,
        pointsUsed: pointsUsed || 0,
        rewardUsed: rewardUsed || null,
        discountAmount: discountAmount || 0
      }
    })

    // Get notification config from site config
    const notificationConfig = client.siteConfig?.notifications || {}
    console.log('[ORDER] Notification config:', JSON.stringify(notificationConfig, null, 2))

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

    // Get POS config for email override
    const posConfig = client.siteConfig?.posConfig || {}

    // Send email notifications (non-blocking)
    const clientName = client.name || 'Restaurant'
    const restaurantEmail = posConfig?.fallbackEmail || client.email
    Promise.all([
      sendOrderConfirmation(order, clientName, notificationConfig, clientData, locationData),
      sendRestaurantNotification(order, clientName, notificationConfig, restaurantEmail)
    ]).catch(err => console.error('Email notification error:', err))

    // Send order to POS using adapter layer (non-blocking)
    if (posConfig.posType && posConfig.posType !== 'none') {
      const orderRouter = new OrderRouter(posConfig)
      
      // Format order for POS
      const posOrder = {
        id: order.id,
        orderNumber: order.orderNumber,
        restaurantName: client.name,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
        items: order.items,
        subtotal: order.subtotal,
        tax: order.taxAmount,
        taxRate: ordering.tax?.rate || 0,
        total: order.total,
        deliveryFee: order.deliveryFee || 0,
        orderType: order.orderType,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        notes: order.note,
        scheduledFor: order.pickupTime,
        transactionId: order.paymentGatewayId
      }

      // Send to POS asynchronously
      orderRouter.sendOrder(posOrder)
        .then(result => {
          // Update order with POS order ID if successful
          if (result.success && result.posOrderId) {
            prisma.order.update({
              where: { id: order.id },
              data: { posOrderId: result.posOrderId }
            }).catch(err => console.error('Failed to update order with POS ID:', err))
          }
        })
        .catch(err => {
          console.error('Failed to send order to POS:', err)
          // Order is still created, just log the error
        })
    }

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
    const validStatuses = ['new', 'preparing', 'almost_ready', 'packing', 'ready', 'completed', 'cancelled']
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

// GET /update-statuses - Trigger automatic status update (for cron job or manual trigger)
router.get('/update-statuses', async (req, res) => {
  try {
    const result = await updateOrderStatuses()
    res.json(result)
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
