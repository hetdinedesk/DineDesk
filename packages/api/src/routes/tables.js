const express = require('express')
const { prisma } = require('../lib/prisma')
const { authenticateToken, requireRole } = require('../middleware/auth')
const { generateTableQRCode } = require('../lib/qrCode')
const router = express.Router({ mergeParams: true })

const getClientId = (req) => req.params.clientId

// Helper to generate unique table number
async function getNextTableNumber(clientId, locationId) {
  const lastTable = await prisma.restaurantTable.findFirst({
    where: { clientId, locationId },
    orderBy: { tableNumber: 'desc' }
  })
  return (lastTable ? parseInt(lastTable.tableNumber) : 0) + 1
}

// GET - Get all tables for a location
router.get('/:clientId/locations/:locationId/tables', async (req, res) => {
  try {
    const clientId = getClientId(req)
    const { locationId } = req.params
    
    const tables = await prisma.restaurantTable.findMany({
      where: { clientId, locationId },
      orderBy: { tableNumber: 'asc' },
      include: {
        booking: {
          select: {
            id: true,
            customerName: true,
            bookingDate: true,
            bookingTime: true,
            status: true
          }
        },
        _count: {
          select: { orders: true }
        }
      }
    })
    
    res.json(tables)
  } catch (err) {
    console.error('[TABLES] Get tables error:', err)
    res.status(500).json({ error: err.message })
  }
})

// GET - Get single table
router.get('/:clientId/locations/:locationId/tables/:tableId', async (req, res) => {
  try {
    const clientId = getClientId(req)
    const { locationId, tableId } = req.params
    
    const table = await prisma.restaurantTable.findFirst({
      where: { id: tableId, clientId, locationId },
      include: {
        booking: true,
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    })
    
    if (!table) {
      return res.status(404).json({ error: 'Table not found' })
    }
    
    res.json(table)
  } catch (err) {
    console.error('[TABLES] Get table error:', err)
    res.status(500).json({ error: err.message })
  }
})

// POST - Create new table
router.post('/:clientId/locations/:locationId/tables', authenticateToken, async (req, res) => {
  try {
    const clientId = getClientId(req)
    const { locationId } = req.params
    const { tableNumber, capacity, position, autoGenerateQR = true } = req.body
    
    // Verify location belongs to client
    const location = await prisma.location.findFirst({
      where: { id: locationId, clientId }
    })
    
    if (!location) {
      return res.status(404).json({ error: 'Location not found' })
    }
    
    // Check if table number already exists for this location
    if (tableNumber) {
      const existingTable = await prisma.restaurantTable.findFirst({
        where: { locationId, tableNumber: tableNumber.toString() }
      })
      
      if (existingTable) {
        return res.status(400).json({ error: 'Table number already exists for this location' })
      }
    }
    
    const finalTableNumber = tableNumber || (await getNextTableNumber(clientId, locationId))
    
    // Generate QR code URL if requested
    let qrCodeUrl = null
    if (autoGenerateQR) {
      qrCodeUrl = generateTableQRCode(clientId, locationId, finalTableNumber)
    }
    
    const table = await prisma.restaurantTable.create({
      data: {
        clientId,
        locationId,
        tableNumber: finalTableNumber.toString(),
        capacity: capacity || 4,
        position: position || {},
        qrCodeUrl
      }
    })
    
    res.status(201).json(table)
  } catch (err) {
    console.error('[TABLES] Create table error:', err)
    res.status(500).json({ error: err.message })
  }
})

// PUT/PATCH - Update table
router.put('/:clientId/locations/:locationId/tables/:tableId', authenticateToken, async (req, res) => {
  try {
    const clientId = getClientId(req)
    const { locationId, tableId } = req.params
    const { tableNumber, capacity, position, isActive, bookingId } = req.body
    
    // Verify table belongs to client and location
    const existingTable = await prisma.restaurantTable.findFirst({
      where: { id: tableId, clientId, locationId }
    })
    
    if (!existingTable) {
      return res.status(404).json({ error: 'Table not found' })
    }
    
    // Check if new table number conflicts with another table
    if (tableNumber && tableNumber !== existingTable.tableNumber) {
      const conflictTable = await prisma.restaurantTable.findFirst({
        where: { 
          locationId, 
          tableNumber: tableNumber.toString(),
          id: { not: tableId }
        }
      })
      
      if (conflictTable) {
        return res.status(400).json({ error: 'Table number already exists for this location' })
      }
    }
    
    const updateData = {}
    if (tableNumber !== undefined) updateData.tableNumber = tableNumber.toString()
    if (capacity !== undefined) updateData.capacity = capacity
    if (position !== undefined) updateData.position = position
    if (isActive !== undefined) updateData.isActive = isActive
    if (bookingId !== undefined) updateData.bookingId = bookingId || null
    
    const table = await prisma.restaurantTable.update({
      where: { id: tableId },
      data: updateData
    })
    
    res.json(table)
  } catch (err) {
    console.error('[TABLES] Update table error:', err)
    res.status(500).json({ error: err.message })
  }
})

router.patch('/:clientId/locations/:locationId/tables/:tableId', router.stack[router.stack.length - 1].handle)

// DELETE - Delete table
router.delete('/:clientId/locations/:locationId/tables/:tableId', authenticateToken, async (req, res) => {
  try {
    const clientId = getClientId(req)
    const { locationId, tableId } = req.params
    
    // Verify table belongs to client and location
    const existingTable = await prisma.restaurantTable.findFirst({
      where: { id: tableId, clientId, locationId },
      include: {
        _count: {
          select: { orders: true }
        }
      }
    })
    
    if (!existingTable) {
      return res.status(404).json({ error: 'Table not found' })
    }
    
    // Don't allow deletion if table has orders
    if (existingTable._count.orders > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete table with existing orders. Archive it instead.' 
      })
    }
    
    await prisma.restaurantTable.delete({
      where: { id: tableId }
    })
    
    res.json({ success: true })
  } catch (err) {
    console.error('[TABLES] Delete table error:', err)
    res.status(500).json({ error: err.message })
  }
})

// POST - Update table booking status (for walk-ins)
router.post('/:clientId/locations/:locationId/tables/:tableId/booking-status', authenticateToken, async (req, res) => {
  try {
    const clientId = getClientId(req)
    const { locationId, tableId } = req.params
    const { isBooked, bookingId } = req.body

    // Verify table belongs to client and location
    const table = await prisma.restaurantTable.findFirst({
      where: { id: tableId, clientId, locationId }
    })

    if (!table) {
      return res.status(404).json({ error: 'Table not found' })
    }

    // Update table booking status
    const updatedTable = await prisma.restaurantTable.update({
      where: { id: tableId },
      data: {
        bookingId: isBooked ? (bookingId || null) : null
      }
    })

    res.json({ success: true, table: updatedTable })
  } catch (err) {
    console.error('[TABLES] Update booking status error:', err)
    res.status(500).json({ error: err.message })
  }
})

// POST - Generate/Regenerate QR code for table
router.post('/:clientId/locations/:locationId/tables/:tableId/qrcode', authenticateToken, async (req, res) => {
  try {
    const clientId = getClientId(req)
    const { locationId, tableId } = req.params
    
    // Verify table belongs to client and location
    const table = await prisma.restaurantTable.findFirst({
      where: { id: tableId, clientId, locationId }
    })
    
    if (!table) {
      return res.status(404).json({ error: 'Table not found' })
    }
    
    // Generate new QR code URL
    const qrCodeUrl = generateTableQRCode(clientId, locationId, table.tableNumber)
    
    // Update table with new QR code
    const updatedTable = await prisma.restaurantTable.update({
      where: { id: tableId },
      data: { qrCodeUrl }
    })
    
    res.json({ qrCodeUrl, table: updatedTable })
  } catch (err) {
    console.error('[TABLES] Generate QR code error:', err)
    res.status(500).json({ error: err.message })
  }
})

// GET - Get max party size based on available tables
router.get('/:clientId/locations/:locationId/max-party-size', async (req, res) => {
  try {
    const clientId = getClientId(req)
    const { locationId } = req.params

    // Get all active tables, ordered by capacity descending
    const tables = await prisma.restaurantTable.findMany({
      where: { clientId, locationId, isActive: true },
      orderBy: { capacity: 'desc' }
    })

    if (tables.length === 0) {
      return res.json({ maxPartySize: 0, availableCapacities: [] })
    }

    // Get tables with active bookings (excluding completed/cancelled)
    const tablesWithBookings = await prisma.restaurantTable.findMany({
      where: {
        clientId,
        locationId,
        isActive: true,
        booking: {
          status: { in: ['pending', 'confirmed'] }
        }
      },
      select: { id: true, capacity: true }
    })

    const bookedTableIds = tablesWithBookings.map(t => t.id)

    // Find the highest capacity table that's not booked
    const availableTables = tables.filter(t => !bookedTableIds.includes(t.id))
    const maxPartySize = availableTables.length > 0 ? availableTables[0].capacity : tables[0].capacity

    res.json({
      maxPartySize,
      availableCapacities: tables.map(t => t.capacity),
      bookedCapacities: tablesWithBookings.map(t => t.capacity)
    })
  } catch (err) {
    console.error('[TABLES] Max party size error:', err)
    res.status(500).json({ error: err.message })
  }
})

// GET - Get table by QR code (public endpoint for customer scanning)
router.get('/qr/:clientId/:locationId/:tableNumber', async (req, res) => {
  try {
    const { clientId, locationId, tableNumber } = req.params
    
    const table = await prisma.restaurantTable.findFirst({
      where: { 
        clientId, 
        locationId, 
        tableNumber,
        isActive: true 
      },
      include: {
        location: {
          select: {
            id: true,
            name: true,
            displayName: true,
            address: true
          }
        }
      }
    })
    
    if (!table) {
      return res.status(404).json({ error: 'Table not found or inactive' })
    }
    
    res.json({
      table: {
        id: table.id,
        tableNumber: table.tableNumber,
        capacity: table.capacity,
        location: table.location
      }
    })
  } catch (err) {
    console.error('[TABLES] QR lookup error:', err)
    res.status(500).json({ error: err.message })
  }
})

module.exports = router