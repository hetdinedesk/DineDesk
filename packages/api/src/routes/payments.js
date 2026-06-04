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
      // Use Stripe-Account header to create PI on connected account directly
      // This allows Apple Pay to use the client's domain verification
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        stripeAccount: paymentGateway.stripeAccountId
      })
      paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency: useCurrency.toLowerCase(),
        metadata: { orderId, clientId },
        automatic_payment_methods: { enabled: true }
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

// POST /webhook - Stripe webhook to handle payment events
router.post('/webhook', async (req, res) => {
  try {
    console.log('🔔 Stripe webhook received')
    const sig = req.headers['stripe-signature']
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET
    const connectedAccountId = req.headers['stripe-account']

    if (!endpointSecret) {
      console.error('❌ Webhook not configured - STRIPE_WEBHOOK_SECRET missing')
      return res.status(500).json({ error: 'Webhook not configured' })
    }

    let event
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
      // For Connect webhooks, verify with the connected account ID if present
      if (connectedAccountId) {
        console.log('🔔 Connect webhook from account:', connectedAccountId)
      }
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret)
      console.log('✅ Webhook signature verified, event type:', event.type, connectedAccountId ? '(Connect)' : '(Platform)')
    } catch (err) {
      console.error('❌ Webhook signature verification failed:', err.message)
      return res.status(400).send(`Webhook Error: ${err.message}`)
    }

    // Handle payment_intent.succeeded event
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object
      const orderId = paymentIntent.metadata.orderId
      console.log('💰 Payment succeeded for order:', orderId, 'Amount:', paymentIntent.amount / 100)

      if (orderId) {
        const updatedOrder = await prisma.order.update({
          where: { id: orderId },
          data: {
            paymentStatus: 'paid',
            status: 'new' // Move from pending_payment to new so restaurant sees it
          }
        })
        console.log('✅ Order updated to paid:', updatedOrder.id)
      } else {
        console.error('❌ No orderId in paymentIntent metadata')
      }
    }

    // Handle payment_intent.payment_failed event
    if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object
      const orderId = paymentIntent.metadata.orderId
      console.log('❌ Payment failed for order:', orderId)

      if (orderId) {
        await prisma.order.update({
          where: { id: orderId },
          data: {
            paymentStatus: 'failed',
            status: 'cancelled' // Cancel the order if payment fails
          }
        })
        console.log('✅ Order cancelled due to payment failure:', orderId)
      }
    }

    res.json({ received: true })
  } catch (err) {
    console.error('❌ Webhook processing error:', err)
    res.status(500).json({ error: err.message })
  }
})

// Global webhook endpoint (doesn't require clientId in URL)
router.post('/webhook', async (req, res) => {
  try {
    console.log('🔔 Global Stripe webhook received')
    const sig = req.headers['stripe-signature']
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET
    const connectedAccountId = req.headers['stripe-account']

    if (!endpointSecret) {
      console.error('❌ Webhook not configured - STRIPE_WEBHOOK_SECRET missing')
      return res.status(500).json({ error: 'Webhook not configured' })
    }

    let event
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret)
      console.log('✅ Webhook signature verified, event type:', event.type)
    } catch (err) {
      console.error('❌ Webhook signature verification failed:', err.message)
      return res.status(400).send(`Webhook Error: ${err.message}`)
    }

    // Handle payment_intent.succeeded event
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object
      const orderId = paymentIntent.metadata.orderId
      console.log('💰 Payment succeeded for order:', orderId, 'Amount:', paymentIntent.amount / 100)

      if (orderId) {
        const updatedOrder = await prisma.order.update({
          where: { id: orderId },
          data: {
            paymentStatus: 'paid',
            status: 'new' // Move from pending_payment to new so restaurant sees it
          }
        })
        console.log('✅ Order updated to paid:', updatedOrder.id)
      } else {
        console.error('❌ No orderId in paymentIntent metadata')
      }
    }

    // Handle payment_intent.payment_failed event
    if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object
      const orderId = paymentIntent.metadata.orderId
      console.log('❌ Payment failed for order:', orderId)

      if (orderId) {
        await prisma.order.update({
          where: { id: orderId },
          data: {
            paymentStatus: 'failed',
            status: 'cancelled' // Cancel the order if payment fails
          }
        })
        console.log('✅ Order cancelled due to payment failure:', orderId)
      }
    }

    res.json({ received: true })
  } catch (err) {
    console.error('❌ Webhook processing error:', err)
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
