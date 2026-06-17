const express = require('express')
const { prisma } = require('../lib/prisma')
const Stripe = require('stripe')
const { authenticateToken } = require('../middleware/auth')
const router = express.Router({ mergeParams: true })

// Helper to get clientId from params (handles both /:clientId and /:id)
const getClientId = (req) => req.params.clientId || req.params.id

// Get payment config (admin only — includes config for CMS editing)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const clientId = getClientId(req)
    const payment = await prisma.paymentGateway.findUnique({
      where: { clientId }
    })
    if (!payment) return res.json({})
    // Mask secret keys so they aren't fully visible in network tab
    const cfg = payment.config || {}
    const maskedConfig = { ...cfg }
    if (maskedConfig.testSecretKey) maskedConfig.testSecretKey = maskedConfig.testSecretKey.slice(0, 8) + '••••••••'
    if (maskedConfig.liveSecretKey) maskedConfig.liveSecretKey = maskedConfig.liveSecretKey.slice(0, 8) + '••••••••'
    res.json({
      ...payment,
      config: maskedConfig,
      stripeConnectStatus: payment.stripeConnectStatus || 'not_connected',
      stripeAccountId: payment.stripeAccountId || null
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Update payment config (admin only)
router.put('/', authenticateToken, async (req, res) => {
  try {
    const clientId = getClientId(req)

    // Check if client exists first
    const client = await prisma.client.findUnique({ where: { id: clientId } })
    if (!client) return res.status(404).json({ error: 'Client not found' })

    // Whitelist allowed fields
    const allowed = ['provider', 'isActive', 'currency', 'cashEnabled', 'cashLabel', 'testMode', 'config']
    const data = {}
    for (const key of allowed) {
      if (req.body[key] !== undefined) data[key] = req.body[key]
    }

    // If config contains masked secret keys (••••), preserve the existing ones
    if (data.config) {
      const existing = await prisma.paymentGateway.findUnique({ where: { clientId } })
      const existingCfg = existing?.config || {}
      if (data.config.testSecretKey && data.config.testSecretKey.includes('••••')) {
        data.config.testSecretKey = existingCfg.testSecretKey || ''
      }
      if (data.config.liveSecretKey && data.config.liveSecretKey.includes('••••')) {
        data.config.liveSecretKey = existingCfg.liveSecretKey || ''
      }
    }

    const payment = await prisma.paymentGateway.upsert({
      where: { clientId },
      update: data,
      create: { ...data, clientId }
    })
    res.json(payment)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /create-intent - Create Stripe PaymentIntent
router.post('/create-intent', async (req, res) => {
  try {
    const clientId = getClientId(req)
    const { orderId, amount, currency } = req.body

    if (!orderId || !amount) {
      return res.status(400).json({ error: 'orderId and amount are required' })
    }

    // Get payment gateway config
    const paymentGateway = await prisma.paymentGateway.findUnique({
      where: { clientId }
    })
    if (!paymentGateway || !paymentGateway.isActive || paymentGateway.provider !== 'stripe') {
      return res.status(400).json({ error: 'Stripe is not configured for this client' })
    }

    const useCurrency = currency || paymentGateway.currency || 'aud'
    let paymentIntent

    // --- Stripe Connect path (preferred) ---
    if (paymentGateway.stripeAccountId && paymentGateway.stripeConnectStatus === 'connected') {
      if (!process.env.STRIPE_SECRET_KEY) {
        return res.status(500).json({ error: 'Platform Stripe key not configured' })
      }
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
      paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency: useCurrency.toLowerCase(),
        metadata: { orderId, clientId },
        automatic_payment_methods: { enabled: true },
        on_behalf_of: paymentGateway.stripeAccountId,
        transfer_data: { destination: paymentGateway.stripeAccountId }
      })
    } else {
      // --- Legacy manual keys path ---
      const config = paymentGateway.config || {}
      const stripeSecretKey = paymentGateway.testMode
        ? config.testSecretKey
        : config.liveSecretKey

      if (!stripeSecretKey) {
        return res.status(400).json({ error: 'Stripe is not connected. Please connect your Stripe account in Payment Settings.' })
      }

      const stripe = new Stripe(stripeSecretKey)
      paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency: useCurrency.toLowerCase(),
        metadata: { orderId },
        automatic_payment_methods: { enabled: true }
      })
    }

    // Update order with stripePaymentIntentId
    await prisma.order.update({
      where: { id: orderId },
      data: { stripePaymentIntentId: paymentIntent.id }
    })

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /confirm-payment - Called by frontend after successful payment to immediately mark order as paid
router.post('/confirm-payment', async (req, res) => {
  try {
    const clientId = getClientId(req)
    const { orderId, paymentIntentId } = req.body

    if (!orderId || !paymentIntentId) {
      return res.status(400).json({ error: 'orderId and paymentIntentId are required' })
    }

    // Verify the payment with Stripe to ensure it actually succeeded
    const paymentGateway = await prisma.paymentGateway.findUnique({
      where: { clientId }
    })

    let verified = false

    if (paymentGateway?.stripeAccountId && paymentGateway?.stripeConnectStatus === 'connected') {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
      const intent = await stripe.paymentIntents.retrieve(paymentIntentId)
      verified = intent.status === 'succeeded'
    } else {
      const config = paymentGateway?.config || {}
      const stripeSecretKey = paymentGateway?.testMode ? config.testSecretKey : config.liveSecretKey
      if (stripeSecretKey) {
        const stripe = new Stripe(stripeSecretKey)
        const intent = await stripe.paymentIntents.retrieve(paymentIntentId)
        verified = intent.status === 'succeeded'
      }
    }

    if (!verified) {
      return res.status(400).json({ error: 'Payment not confirmed by Stripe' })
    }

    // Update order to paid and visible to restaurant
    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: 'paid',
        status: 'new'
      }
    })

    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /refund - Issue a full or partial refund for a paid order
router.post('/refund', authenticateToken, async (req, res) => {
  try {
    const clientId = getClientId(req)
    const { orderId, amount } = req.body

    if (!orderId) {
      return res.status(400).json({ error: 'orderId is required' })
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } })
    if (!order) return res.status(404).json({ error: 'Order not found' })
    if (order.paymentStatus !== 'paid') return res.status(400).json({ error: 'Order is not paid' })
    if (!order.stripePaymentIntentId) return res.status(400).json({ error: 'No Stripe payment found for this order' })

    const paymentGateway = await prisma.paymentGateway.findUnique({ where: { clientId } })

    let stripe
    if (paymentGateway?.stripeAccountId && paymentGateway?.stripeConnectStatus === 'connected') {
      stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
    } else {
      const config = paymentGateway?.config || {}
      const stripeSecretKey = paymentGateway?.testMode ? config.testSecretKey : config.liveSecretKey
      if (!stripeSecretKey) return res.status(400).json({ error: 'Stripe not configured' })
      stripe = new Stripe(stripeSecretKey)
    }

    const refundAmount = amount ? Math.round(amount * 100) : undefined

    const refund = await stripe.refunds.create({
      payment_intent: order.stripePaymentIntentId,
      ...(refundAmount ? { amount: refundAmount } : {})
    })

    const isFullRefund = !refundAmount || refundAmount >= Math.round((order.total || 0) * 100)

    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: isFullRefund ? 'refunded' : 'partial_refund',
        status: isFullRefund ? 'cancelled' : order.status
      }
    })

    res.json({ success: true, refundId: refund.id, status: refund.status })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /webhook - Stripe webhook to handle payment events
router.post('/webhook', async (req, res) => {
  try {
    const sig = req.headers['stripe-signature']
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET

    if (!endpointSecret) {
      return res.status(500).json({ error: 'Webhook not configured' })
    }

    let event
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret)
    } catch (err) {
      return res.status(400).send(`Webhook Error: ${err.message}`)
    }

    // Handle payment_intent.succeeded event
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object
      const orderId = paymentIntent.metadata.orderId

      if (orderId) {
        await prisma.order.update({
          where: { id: orderId },
          data: {
            paymentStatus: 'paid',
            status: 'new' // Move from pending_payment to new so restaurant sees it
          }
        })
      }
    }

    // Handle payment_intent.payment_failed event
    if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object
      const orderId = paymentIntent.metadata.orderId

      if (orderId) {
        await prisma.order.update({
          where: { id: orderId },
          data: {
            paymentStatus: 'failed',
            status: 'cancelled' // Cancel the order if payment fails
          }
        })
      }
    }

    res.json({ received: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
