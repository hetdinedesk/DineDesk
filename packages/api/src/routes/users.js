const { log } = require('../lib/activityLog')
const express  = require('express')
const bcrypt   = require('bcryptjs')
const { authenticateToken } = require('../middleware/auth')
const prisma   = require('../lib/prisma')
const router   = express.Router()

router.use(authenticateToken)

// GET all users
router.get('/', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id:true, name:true, email:true, role:true, clientAccess:true, createdAt:true },
      orderBy: { createdAt: 'asc' }
    })
    res.json(users)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// CREATE user
router.post('/', async (req, res) => {
  try {
    const { name, email, password, role, clientAccess } = req.body
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required.' })
    }
    const hash = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hash,
        role: role || 'EDITOR',
        clientAccess: clientAccess || {}
      }
    })
    log({
      action: 'USER_CREATED', entity: 'User', entityName: user.name,
      userId: req.user.id, userName: req.user.name
    })
    res.json({ id:user.id, name:user.name, email:user.email, role:user.role })
  } catch (err) {
    if (err.message.includes('Unique') || err.message.includes('unique')) {
      return res.status(400).json({ error: 'Email already exists.' })
    }
    res.status(500).json({ error: 'Failed to create user.' })
  }
})

// UPDATE user — name, email, clientAccess
router.put('/:id', async (req, res) => {
  try {
    const { name, email, clientAccess } = req.body
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        ...(name  ? { name }  : {}),
        ...(email ? { email } : {}),
        clientAccess: clientAccess || {}
      }
    })
    log({
      action: 'USER_EDITED', entity: 'User', entityName: user.name,
      userId: req.user.id, userName: req.user.name
    })
    res.json({ id:user.id, name:user.name, email:user.email })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE user
router.delete('/:id', async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'You cannot delete your own account.' })
    }
    await prisma.user.delete({ where: { id: req.params.id } })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router