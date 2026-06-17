const express = require('express')
const Stripe = require('stripe')
const { prisma } = require('../lib/prisma')
const { authenticateToken } = require('../middleware/auth')

const router = express.Router({ mergeParams: true })

const getPlatformStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not configured on the platform')
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY)
}

// GET /connect/status - check connected account status for a client
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const clientId = req.params.clientId
    const gateway = await prisma.paymentGateway.findUnique({ where: { clientId } })

    if (!gateway || !gateway.stripeAccountId) {
      return res.json({ status: 'not_connected', stripeAccountId: null })
    }

    // Verify the account is still valid with Stripe
    try {
      const stripe = getPlatformStripe()
      const account = await stripe.accounts.retrieve(gateway.stripeAccountId)
      const isReady = account.details_submitted && account.charges_enabled

      const status = isReady ? 'connected' : 'pending'
      if (status !== gateway.stripeConnectStatus) {
        await prisma.paymentGateway.update({
          where: { clientId },
          data: { stripeConnectStatus: status }
        })
      }

      return res.json({
        status,
        stripeAccountId: gateway.stripeAccountId,
        chargesEnabled: account.charges_enabled,
        detailsSubmitted: account.details_submitted,
        payoutsEnabled: account.payouts_enabled,
        email: account.email,
        businessName: account.business_profile?.name || account.settings?.dashboard?.display_name || null
      })
    } catch (stripeErr) {
      // Account may have been deleted from Stripe side
      await prisma.paymentGateway.update({
        where: { clientId },
        data: { stripeConnectStatus: 'not_connected', stripeAccountId: null }
      })
      return res.json({ status: 'not_connected', stripeAccountId: null })
    }
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /connect/create-link - create a Stripe Connect onboarding link
router.post('/create-link', authenticateToken, async (req, res) => {
  try {
    const clientId = req.params.clientId
    const stripe = getPlatformStripe()

    const client = await prisma.client.findUnique({ where: { id: clientId } })
    if (!client) return res.status(404).json({ error: 'Client not found' })

    let gateway = await prisma.paymentGateway.findUnique({ where: { clientId } })

    // Create a new Express account if one doesn't exist
    let stripeAccountId = gateway?.stripeAccountId

    if (!stripeAccountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        metadata: { clientId, clientName: client.name }
      })
      stripeAccountId = account.id

      // Upsert the gateway record
      gateway = await prisma.paymentGateway.upsert({
        where: { clientId },
        update: {
          stripeAccountId,
          stripeConnectStatus: 'pending',
          provider: 'stripe'
        },
        create: {
          clientId,
          provider: 'stripe',
          config: {},
          stripeAccountId,
          stripeConnectStatus: 'pending',
          cashEnabled: true,
          cashLabel: 'Pay at Pickup'
        }
      })
    }

    // Build the return & refresh URLs pointing back to the CMS
    const cmsOrigin = process.env.CMS_ORIGIN || process.env.CORS_ORIGINS?.split(',')[0] || 'http://localhost:5173'
    const returnUrl = `${cmsOrigin}/stripe-connect-return?clientId=${clientId}`
    const refreshUrl = `${cmsOrigin}/stripe-connect-refresh?clientId=${clientId}`

    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding'
    })

    res.json({ url: accountLink.url })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /connect/create-login-link - dashboard link for already-connected accounts
router.post('/create-login-link', authenticateToken, async (req, res) => {
  try {
    const clientId = req.params.clientId
    const gateway = await prisma.paymentGateway.findUnique({ where: { clientId } })

    if (!gateway?.stripeAccountId) {
      return res.status(400).json({ error: 'No connected Stripe account found' })
    }

    const stripe = getPlatformStripe()
    const loginLink = await stripe.accounts.createLoginLink(gateway.stripeAccountId)

    res.json({ url: loginLink.url })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /connect/disconnect - remove the Stripe Connect account link
router.delete('/disconnect', authenticateToken, async (req, res) => {
  try {
    const clientId = req.params.clientId
    const gateway = await prisma.paymentGateway.findUnique({ where: { clientId } })

    if (gateway?.stripeAccountId) {
      try {
        const stripe = getPlatformStripe()
        await stripe.oauth.deauthorize({
          client_id: process.env.STRIPE_CLIENT_ID,
          stripe_user_id: gateway.stripeAccountId
        })
      } catch (_) {
        // Deauthorize may fail if already revoked — proceed anyway
      }
    }

    await prisma.paymentGateway.update({
      where: { clientId },
      data: {
        stripeAccountId: null,
        stripeConnectStatus: 'not_connected',
        isActive: false
      }
    })

    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /connect/apple-pay - Register site domain(s) with Stripe for Apple Pay
router.post('/apple-pay', authenticateToken, async (req, res) => {
  try {
    const clientId = req.params.clientId
    const stripe = getPlatformStripe()

    // Get site URLs from siteConfig
    const siteConfig = await prisma.siteConfig.findUnique({ where: { clientId } })
    const netlify = siteConfig?.netlify || {}

    const domainsToRegister = []

    // Add preview URL (always present after site creation)
    if (netlify.previewUrl) {
      const host = netlify.previewUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')
      domainsToRegister.push(host)
    }

    // Add custom/primary domain if set
    const customDomain = netlify.primaryDomain || netlify.customDomain
    if (customDomain) {
      const host = customDomain.replace(/^https?:\/\//, '').replace(/\/$/, '')
      if (!domainsToRegister.includes(host)) domainsToRegister.push(host)
    }

    // Also allow manually passed domain
    if (req.body.domain) {
      const host = req.body.domain.replace(/^https?:\/\//, '').replace(/\/$/, '')
      if (!domainsToRegister.includes(host)) domainsToRegister.push(host)
    }

    if (domainsToRegister.length === 0) {
      return res.status(400).json({ error: 'No site domain found. Please deploy your site first.' })
    }

    const results = []
    for (const domain of domainsToRegister) {
      try {
        const result = await stripe.applePayDomains.create({ domain_name: domain })
        results.push({ domain, success: true, id: result.id })
      } catch (err) {
        // Already registered is fine
        if (err.message?.includes('already been registered')) {
          results.push({ domain, success: true, alreadyRegistered: true })
        } else {
          results.push({ domain, success: false, error: err.message })
        }
      }
    }

    // Save apple pay enabled state
    const gateway = await prisma.paymentGateway.findUnique({ where: { clientId } })
    if (gateway) {
      await prisma.paymentGateway.update({
        where: { clientId },
        data: { config: { ...(gateway.config || {}), applePayEnabled: true, applePayDomains: domainsToRegister } }
      })
    }

    const allOk = results.every(r => r.success)
    res.json({ success: allOk, results, domains: domainsToRegister })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /connect/apple-pay - Get Apple Pay registration status
router.get('/apple-pay', authenticateToken, async (req, res) => {
  try {
    const clientId = req.params.clientId
    const gateway = await prisma.paymentGateway.findUnique({ where: { clientId } })
    const config = gateway?.config || {}
    res.json({
      enabled: config.applePayEnabled === true,
      domains: config.applePayDomains || []
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
