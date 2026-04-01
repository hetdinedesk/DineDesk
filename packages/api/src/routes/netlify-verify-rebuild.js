// Netlify Site Verification & Rebuild API Endpoints
// Add these to packages/api/src/routes/clients.js

/**
 * VERIFY ENDPOINT - Check if Netlify site actually exists
 * GET /api/clients/:id/netlify/verify
 */
router.get('/:id/netlify/verify', async (req, res) => {
  try {
    const client = await prisma.client.findUnique({ where: { id: req.params.id } })
    if (!client) {
      return res.status(404).json({ error: 'Client not found' })
    }
    
    const config = await prisma.siteConfig.findUnique({ where: { clientId: client.id } })
    const siteId = config?.netlify?.siteId
    
    if (!siteId) {
      return res.json({ exists: false, reason: 'No site ID in database' })
    }
    
    // Check if site actually exists on Netlify
    const netlifyRes = await require('axios').get(
      `https://api.netlify.com/api/v1/sites/${siteId}`,
      { headers: { Authorization: `Bearer ${process.env.NETLIFY_TOKEN}` } }
    )
    
    if (netlifyRes.status === 200) {
      res.json({ 
        exists: true, 
        siteName: netlifyRes.data.name,
        url: netlifyRes.data.ssl_url || netlifyRes.data.url,
        adminUrl: netlifyRes.data.admin_url
      })
    } else {
      res.json({ exists: false, reason: 'Site not found on Netlify' })
    }
  } catch (err) {
    console.error('❌ Verify error:', err.message)
    if (err.response?.status === 404) {
      res.json({ exists: false, reason: 'Site deleted from Netlify' })
    } else {
      res.status(500).json({ 
        error: 'Verification failed',
        details: err.message 
      })
    }
  }
})

/**
 * REBUILD ENDPOINT - Trigger Netlify rebuild
 * POST /api/clients/:id/netlify/rebuild
 */
router.post('/:id/netlify/rebuild', async (req, res) => {
  try {
    const client = await prisma.client.findUnique({ where: { id: req.params.id } })
    if (!client) {
      return res.status(404).json({ error: 'Client not found' })
    }
    
    const config = await prisma.siteConfig.findUnique({ where: { clientId: client.id } })
    const buildHook = config?.netlify?.buildHook
    
    if (!buildHook) {
      return res.status(400).json({ error: 'No build hook configured' })
    }
    
    // Trigger build via webhook
    await require('axios').post(buildHook)
    
    res.json({ 
      success: true, 
      message: 'Build triggered successfully',
      buildHook: buildHook
    })
  } catch (err) {
    console.error('❌ Rebuild error:', err.message)
    res.status(500).json({ 
      error: 'Failed to trigger rebuild',
      details: err.message 
    })
  }
})
