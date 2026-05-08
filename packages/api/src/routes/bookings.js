const express = require('express')
const router = express.Router()
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// Create a new booking
router.post('/', async (req, res) => {
  try {
    const { clientId, locationId, customerName, customerEmail, customerPhone, partySize, bookingDate, bookingTime, notes, confirmationMethod, tableId, autoAssignTable = false } = req.body

    // Validate required fields
    if (!clientId || !customerName || !partySize || !bookingDate || !bookingTime || !confirmationMethod) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // Get client config to check maxTables
    const siteConfig = await prisma.siteConfig.findUnique({
      where: { clientId },
      select: { booking: true }
    })

    const maxTables = siteConfig?.booking?.maxTables || 20

    // Handle table assignment
    let assignedTableId = tableId
    
    if (!assignedTableId && autoAssignTable && locationId) {
      // Auto-assign the best fit table based on party size
      const suitableTables = await prisma.restaurantTable.findMany({
        where: {
          clientId,
          locationId,
          capacity: { gte: parseInt(partySize) },
          isActive: true,
          bookingId: null // Not already booked
        },
        orderBy: { capacity: 'asc' } // Sort by capacity
      })
      
      // Find the table with the smallest capacity that can accommodate the party
      const bestFitTable = suitableTables.length > 0 ? suitableTables[0] : null
      
      if (bestFitTable) {
        assignedTableId = bestFitTable.id
      }
    }

    // If a table is specified, validate it's available
    if (assignedTableId && locationId) {
      const table = await prisma.restaurantTable.findFirst({
        where: {
          id: assignedTableId,
          clientId,
          locationId,
          isActive: true
        }
      })
      
      if (!table) {
        return res.status(400).json({ error: 'Table not found or inactive' })
      }
      
      if (table.capacity < parseInt(partySize)) {
        return res.status(400).json({ error: 'Table capacity insufficient for party size' })
      }
      
      // Check if table is already booked for this time slot
      const existingTableBooking = await prisma.booking.findFirst({
        where: {
          tableId: assignedTableId,
          bookingDate: new Date(bookingDate),
          bookingTime,
          status: { in: ['pending', 'confirmed'] }
        }
      })
      
      if (existingTableBooking) {
        return res.status(400).json({ error: 'Table already booked for this time slot' })
      }
    }

    // Check availability - count existing bookings for the same date/time and location
    const where = {
      clientId,
      bookingDate: new Date(bookingDate),
      bookingTime,
      status: { in: ['pending', 'confirmed'] }
    }

    // If locationId is provided, filter by location
    if (locationId) {
      where.locationId = locationId
    }

    const existingBookings = await prisma.booking.count({ where })

    if (existingBookings >= actualMaxTables) {
      return res.status(400).json({ error: 'No tables available for this time slot' })
    }

    // Get available tables for this time slot
    const bookedTableIds = await prisma.booking.findMany({
      where: {
        clientId,
        locationId,
        bookingDate: new Date(date),
        bookingTime: time,
        status: { in: ['pending', 'confirmed'] }
      },
      select: { tableId: true }
    })

    const availableTables = await prisma.restaurantTable.findMany({
      where: {
        clientId,
        locationId,
        isActive: true,
        id: { notIn: bookedTableIds.map(b => b.tableId).filter(Boolean) }
      },
      select: { id: true, tableNumber: true, capacity: true }
    })

    res.json({
      available: true,
      availableSlots: maxTables - existingBookings,
      totalTables: actualMaxTables,
      existingBookings,
      availableTables
    })

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        clientId,
        locationId,
        customerName,
        customerEmail,
        customerPhone,
        partySize: parseInt(partySize),
        bookingDate: new Date(bookingDate),
        bookingTime,
        notes,
        confirmationMethod,
        tableId: assignedTableId || null,
        status: 'pending'
      },
      include: {
        location: true,
        table: true
      }
    })

    // If a table was assigned, update the table with the booking reference
    if (assignedTableId) {
      await prisma.restaurantTable.update({
        where: { id: assignedTableId },
        data: { bookingId: booking.id }
      })
    }

    res.json(booking)
  } catch (error) {
    console.error('Booking creation error:', error)
    res.status(500).json({ error: 'Failed to create booking' })
  }
})

// Get available tables for a specific date/time and party size
router.get('/available-tables', async (req, res) => {
  try {
    const { clientId, locationId, date, time, partySize } = req.query

    if (!clientId || !locationId || !partySize) {
      return res.status(400).json({ error: 'Missing clientId, locationId, or partySize' })
    }

    // Get all active tables for the location
    const allTables = await prisma.restaurantTable.findMany({
      where: {
        clientId,
        locationId,
        isActive: true,
        capacity: { gte: parseInt(partySize) }
      },
      orderBy: { capacity: 'asc' }
    })

    // If date and time are provided, check for conflicts
    let availableTables = allTables
    if (date && time) {
      const bookedTableIds = await prisma.booking.findMany({
        where: {
          clientId,
          locationId,
          bookingDate: new Date(date),
          bookingTime,
          status: { in: ['pending', 'confirmed'] }
        },
        select: { tableId: true }
      })

      const bookedIds = bookedTableIds.map(b => b.tableId).filter(Boolean)
      availableTables = allTables.filter(table => !bookedIds.includes(table.id))
    }

    res.json(availableTables)
  } catch (error) {
    console.error('Available tables error:', error)
    res.status(500).json({ error: 'Failed to get available tables' })
  }
})

// Check availability for a specific date/time
router.get('/availability', async (req, res) => {
  try {
    const { clientId, locationId, date, time } = req.query

    if (!clientId || !date) {
      return res.status(400).json({ error: 'Missing clientId or date' })
    }

    // Get client config to check maxTables
    const siteConfig = await prisma.siteConfig.findUnique({
      where: { clientId },
      select: { booking: true }
    })

    const maxTables = siteConfig?.booking?.maxTables || 20

    // Count existing bookings
    const where = {
      clientId,
      bookingDate: new Date(date),
      status: { in: ['pending', 'confirmed'] }
    }

    // If locationId is provided, filter by location
    if (locationId) {
      where.locationId = locationId
    }

    // Get total tables for the location
    const totalTables = await prisma.restaurantTable.count({
      where: {
        clientId,
        locationId,
        isActive: true
      }
    })

    // If we have table information, use it for more accurate availability
    const actualMaxTables = Math.min(maxTables, totalTables)

    if (time) {
      where.bookingTime = time
    }

    const existingBookings = await prisma.booking.count({ where })

    const availableTables = maxTables - existingBookings

    res.json({
      maxTables,
      existingBookings,
      availableTables,
      isAvailable: availableTables > 0
    })
  } catch (error) {
    console.error('Availability check error:', error)
    res.status(500).json({ error: 'Failed to check availability' })
  }
})

// Get all bookings for a client
router.get('/:clientId', async (req, res) => {
  try {
    const { clientId } = req.params
    const bookings = await prisma.booking.findMany({
      where: { clientId },
      include: {
        location: true
      },
      orderBy: { bookingDate: 'desc' }
    })
    res.json(bookings)
  } catch (error) {
    console.error('Get bookings error:', error)
    res.status(500).json({ error: 'Failed to get bookings' })
  }
})

// Get bookings for a specific location
router.get('/location/:locationId', async (req, res) => {
  try {
    const { locationId } = req.params
    const bookings = await prisma.booking.findMany({
      where: { locationId },
      include: {
        location: true
      },
      orderBy: { bookingDate: 'desc' }
    })
    res.json(bookings)
  } catch (error) {
    console.error('Get location bookings error:', error)
    res.status(500).json({ error: 'Failed to get location bookings' })
  }
})

// Update booking status
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    if (!['pending', 'confirmed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' })
    }

    const booking = await prisma.booking.update({
      where: { id },
      data: { status },
      include: {
        location: true
      }
    })

    res.json(booking)
  } catch (error) {
    console.error('Update booking status error:', error)
    res.status(500).json({ error: 'Failed to update booking status' })
  }
})

// Delete booking
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    await prisma.booking.delete({ where: { id } })
    res.json({ success: true })
  } catch (error) {
    console.error('Delete booking error:', error)
    res.status(500).json({ error: 'Failed to delete booking' })
  }
})

module.exports = router
