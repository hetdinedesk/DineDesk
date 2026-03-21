const express = require('express')
const { BetaAnalyticsDataClient } = require('@google-analytics/data')
const { authenticateToken } = require('../middleware/auth')
const prisma = require('../lib/prisma')
const router = express.Router()
router.use(authenticateToken)

// Build the GA4 client from the base64 encoded service account key
let analyticsClient
try {
  const credentials = JSON.parse(
    Buffer.from(process.env.GA4_SERVICE_ACCOUNT, 'base64').toString()
  )
  analyticsClient = new BetaAnalyticsDataClient({ credentials })
} catch (e) {
  console.warn('GA4: could not parse service account key', e.message)
}

router.get('/:clientId/analytics', async (req, res) => {
  try {
    // Get the GA4 property ID saved in Config > Analytics
    const config = await prisma.siteConfig.findUnique({ where: { clientId: req.params.clientId } })
    const propertyId = config && config.analytics && config.analytics.ga4PropertyId

    if (!propertyId) {
      return res.json({ error: 'GA4 not configured — go to Config > Analytics and enter the Property ID' })
    }
    if (!analyticsClient) {
      return res.json({ error: 'GA4 service account key not set — check GA4_SERVICE_ACCOUNT in .env' })
    }

    // Map period param to GA4 date range
    const period = req.query.period || 'M'
    const periodMap = { W: '7daysAgo', M: '30daysAgo', Y: '365daysAgo' }
    const startDate = periodMap[period] || '30daysAgo'

    // Run both GA4 requests at the same time
    const [summaryRes, chartRes] = await Promise.all([
      analyticsClient.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate, endDate: 'today' }],
        metrics: [
          { name: 'totalUsers' },
          { name: 'screenPageViews' },
          { name: 'bounceRate' },
          { name: 'averageSessionDuration' }
        ]
      }),
      analyticsClient.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate, endDate: 'today' }],
        dimensions: [{ name: 'date' }],
        metrics:    [{ name: 'screenPageViews' }],
        orderBys:   [{ dimension: { dimensionName: 'date' } }]
      })
    ])

    const m = summaryRes[0].rows?.[0]?.metricValues || []
    const totalSecs = parseFloat(m[3]?.value || 0)
    const mins = Math.floor(totalSecs / 60)
    const secs = Math.round(totalSecs % 60)

    res.json({
      uniqueVisitors:  parseInt(m[0]?.value || 0),
      pageviews:       parseInt(m[1]?.value || 0),
      bounceRate:      (parseFloat(m[2]?.value || 0) * 100).toFixed(1) + '%',
      avgDuration:     mins + 'm ' + secs + 's',
      chartData: (chartRes[0].rows || []).map(r => ({
        date:  r.dimensionValues[0].value,
        views: parseInt(r.metricValues[0].value)
      }))
    })
  } catch (err) {
    console.error('GA4 error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

module.exports = router