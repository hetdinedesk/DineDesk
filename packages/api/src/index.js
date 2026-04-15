require('dotenv').config({ path: require('path').join(__dirname, '../.env') })
const express = require('express')
const cors = require('cors')
const path = require('path')

const app = express()
const PORT = process.env.PORT || 3001

// Trust proxy for Railway deployment (required for rate limiting behind proxy)
app.set('trust proxy', true)

const corsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(s => s.trim())
  : [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:3001',
      'http://localhost:3000'
    ]

app.use(cors({
  origin: (origin, callback) => {
    // Allow all Netlify domains (*.netlify.app) plus configured origins
    const isNetlify = origin && origin.endsWith('.netlify.app')
    const isConfigured = corsOrigins.includes(origin)
    const isLocal = !origin // Allow requests with no origin (like mobile apps, curl)
    
    if (isNetlify || isConfigured || isLocal) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
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

// CORE ROUTES - LOGIN & USERS WORK
app.use('/api/auth', require('./routes/auth'))
app.use('/api/users', require('./routes/users'))
app.use('/api/clients', require('./routes/clients'))
app.use('/api/clients', require('./routes/menuItems')) // Handles /api/clients/:clientId/menu-items and menu-categories

// GROUPS ROUTE - for organizing sites
app.use('/api/groups', require('./routes/groups'))

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
  console.log('✅ Login fixed: /api/auth/login ready!')
  console.log('👥 User admin: /api/users ready!')
  console.log('📁 Groups: /api/groups ready!')
  console.log('🔑 Site Admin http://localhost:5173/site-admin')
  console.log('**Run Prisma seed for admin user**')
})
