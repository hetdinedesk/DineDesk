const { log } = require('../lib/activityLog')
const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const rateLimit = require('express-rate-limit')
const { authenticateToken } = require('../middleware/auth')
const { prisma } = require('../lib/prisma')
const router = express.Router()
const loginLimit = rateLimit({ windowMs: 60000, max: 10 })

router.post('/login', loginLimit, async function(req, res) {
  try {
    const user = await prisma.user.findUnique({ where: { email: req.body.email } })
    if (!user) return res.status(401).json({ error: 'Invalid credentials' })
    const valid = await bcrypt.compare(req.body.password, user.password)
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' })
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ error: 'Server configuration error' })
    }
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name, clientAccess: user.clientAccess || [] },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    )
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, clientAccess: user.clientAccess || [] }
    })

    log({ action:'USER_LOGIN', entity:'User', entityName:user.name,
  userId:user.id, userName:user.name })
  
  } catch(err) {
    console.error('Login error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

router.get('/me', authenticateToken, function(req, res) { res.json(req.user) })

module.exports = router