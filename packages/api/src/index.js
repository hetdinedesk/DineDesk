require('dotenv').config({ path: require('path').join(__dirname, '../.env') })
const express = require('express')
const cors = require('cors')
const path = require('path')

const app = express()
const PORT = process.env.PORT || 3001

// Trust proxy only in production (Railway deployment)
// Required for rate limiting behind proxy, but not needed in local development
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', true)
}

const corsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(s => s.trim()).filter(Boolean)
  : process.env.NODE_ENV === 'production'
    ? [] // Require explicit CORS origins in production
    : [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:3001',
        'http://localhost:3000'
      ]

// Validate CORS origins in production
if (process.env.NODE_ENV === 'production' && corsOrigins.length === 0) {
  console.warn('⚠️  WARNING: CORS_ORIGINS not set in production. Only Netlify domains and same-origin requests will be allowed.')
}

app.use(cors({
  origin: (origin, callback) => {
    // In production, require explicit CORS origins or Netlify domains
    if (process.env.NODE_ENV === 'production') {
      const isNetlify = origin && origin.endsWith('.netlify.app')
      const isConfigured = corsOrigins.includes(origin)
      const isSameOrigin = !origin // Allow requests with no origin (server-to-server, mobile apps)
      
      if (isNetlify || isConfigured || isSameOrigin) {
        callback(null, true)
      } else {
        console.warn(`🚫 CORS blocked request from origin: ${origin}`)
        callback(new Error(`CORS: Origin ${origin} not allowed`))
      }
    } else {
      // In development, allow all origins
      callback(null, true)
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Serve local uploads (fallback when R2 not configured)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

app.get('/health', (req, res) => res.json({ status: 'OK', timestamp: new Date().toISOString() }))

// AUTOMATIC ORDER STATUS UPDATES
// Run every minute to update order statuses based on elapsed time
const { updateOrderStatuses } = require('./jobs/updateOrderStatus')
setInterval(async () => {
  await updateOrderStatuses()
}, 60000) // 60 seconds

// CORE ROUTES - LOGIN & USERS WORK
app.use('/api/auth', require('./routes/auth'))
app.use('/api/users', require('./routes/users'))
app.use('/api/clients', require('./routes/clients'))
app.use('/api/clients', require('./routes/menuItems')) // Handles /api/clients/:clientId/menu-items and menu-categories
app.use('/api/clients', require('./routes/bookings')) // Handles /api/clients/:clientId/bookings
app.use('/api/clients', require('./routes/orders')) // Handles /api/clients/:clientId/orders
app.use('/api/clients', require('./routes/tables')) // Handles /api/clients/:clientId/locations/:locationId/tables
app.use('/api/loyalty', require('./routes/loyalty'))
app.use('/api/enquiries', require('./routes/enquiries'))

// GROUPS ROUTE - for organizing sites
app.use('/api/groups', require('./routes/groups'))

// ACTIVITY LOG ROUTE - for site admin dashboard
app.use('/api/activity', require('./routes/activityLog'))

// PLATFORM SETTINGS ROUTE
app.use('/api/platform', require('./routes/platform'))

// CATCH 404 BEFORE WILD CARDS
app.use((req, res) => res.status(404).json({ error: 'Endpoint not found' }))

app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Server error' })
})

app.listen(PORT, () => {
  console.log(`🚀 API Server running on http://localhost:${PORT}`)
  console.log(`📱 Health: http://localhost:${PORT}/health`)
})
