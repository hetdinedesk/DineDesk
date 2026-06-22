const { log } = require('../lib/activityLog')
const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const rateLimit = require('express-rate-limit')
const { authenticateToken } = require('../middleware/auth')
const { prisma } = require('../lib/prisma')
const router = express.Router()
const loginLimit = rateLimit({ windowMs: 60000, max: 10 })

// JWT secret strength validation
const validateJWTSecret = () => {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    return { valid: false, error: 'JWT_SECRET is not set' }
  }
  if (secret.length < 32) {
    return { valid: false, error: 'JWT_SECRET must be at least 32 characters' }
  }
  if (secret === 'your-secret-key' || secret === 'secret' || secret === 'jwt-secret') {
    return { valid: false, error: 'JWT_SECRET must be changed from default value' }
  }
  return { valid: true }
}

router.post('/login', loginLimit, async function(req, res) {
  try {
    const user = await prisma.user.findUnique({ where: { email: req.body.email } })
    if (!user) return res.status(401).json({ error: 'Invalid credentials' })
    const valid = await bcrypt.compare(req.body.password, user.password)
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' })
    
    const secretValidation = validateJWTSecret()
    if (!secretValidation.valid) {
      return res.status(500).json({ error: 'Server configuration error' })
    }
    
    const tokenExpiry = user.role === 'EDITOR' ? '7d' : '24h'
    const clientAccess = (typeof user.clientAccess === 'string' ? JSON.parse(user.clientAccess) : user.clientAccess) || {}
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name, clientAccess },
      process.env.JWT_SECRET,
      { expiresIn: tokenExpiry }
    )
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, clientAccess }
    })

    log({ action:'USER_LOGIN', entity:'User', entityName:user.name,
  userId:user.id, userName:user.name })
  
  } catch(err) {
    res.status(500).json({ error: 'Server error' })
  }
})

router.get('/me', authenticateToken, async function(req, res) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, role: true, clientAccess: true }
    })
    if (!user) return res.status(401).json({ error: 'User not found' })
    res.json(user)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router