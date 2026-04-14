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
    res.json({ ...payment, config: maskedConfig })
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

    const config = paymentGateway.config || {}
    const stripeSecretKey = paymentGateway.testMode
      ? config.testSecretKey
      : config.liveSecretKey

    if (!stripeSecretKey) {
      return res.status(400).json({ error: 'Stripe secret key is not configured' })
    }

    const stripe = new Stripe(stripeSecretKey)

    // Create PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency || paymentGateway.currency || 'aud',
      metadata: { orderId },
      automatic_payment_methods: {
        enabled: true
      }
    })

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
    console.error('Create PaymentIntent error:', err)
    res.status(500).json({ error: err.message })
  }
})

// POST /webhook - Stripe webhook to handle payment events
router.post('/webhook', async (req, res) => {
  try {
    const sig = req.headers['stripe-signature']
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET

    if (!endpointSecret) {
      console.error('STRIPE_WEBHOOK_SECRET not configured — rejecting webhook')
      return res.status(500).json({ error: 'Webhook not configured' })
    }

    let event
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message)
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
            status: 'new' // Keep as new until restaurant acknowledges
          }
        })
        console.log(`Order ${orderId} payment succeeded`)
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
            paymentStatus: 'failed'
          }
        })
        console.log(`Order ${orderId} payment failed`)
      }
    }

    res.json({ received: true })
  } catch (err) {
    console.error('Webhook error:', err)
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
