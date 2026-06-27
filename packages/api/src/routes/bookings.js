const express = require('express')
const rateLimit = require('express-rate-limit')
const { authenticateToken } = require('../middleware/auth')
const { prisma } = require('../lib/prisma')
const { log } = require('../lib/activityLog')
const { sendBookingConfirmation } = require('../lib/email')
const router = express.Router()

// Rate limiting for public booking endpoints
const bookingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window per IP
  message: { error: 'Too many booking attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
})

const availabilityLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute per IP
  message: { error: 'Too many availability checks. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false
})

// Create a new booking - with rate limiting
router.post('/', bookingLimiter, async (req, res) => {
  try {
    const { clientId, customerName, customerEmail, customerPhone, partySize, bookingDate, bookingTime, notes, confirmationMethod, tableId, autoAssignTable = false } = req.body
    let locationId = req.body.locationId

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

    // If no locationId provided, use the client's primary location
    if (!locationId) {
      const primaryLocation = await prisma.location.findFirst({
        where: { clientId, isPrimary: true }
      })
      if (primaryLocation) {
        locationId = primaryLocation.id
      } else {
        // Fallback to first location if no primary is set
        const anyLocation = await prisma.location.findFirst({
          where: { clientId }
        })
        if (anyLocation) {
          locationId = anyLocation.id
        }
      }
    }

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

    if (existingBookings >= maxTables) {
      return res.status(400).json({ error: 'No tables available for this time slot' })
    }

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
        tables: true
      }
    })

    // Don't set RestaurantTable.bookingId for future reservations
    // The Booking.tableId field links the reservation to the table
    // RestaurantTable.bookingId is only for current walk-in bookings

    // Send booking confirmation email to customer
    try {
      const client = await prisma.client.findUnique({
        where: { id: clientId },
        select: {
          name: true,
          colours: true,
          email: true
        }
      })
      
      const siteConfig = await prisma.siteConfig.findUnique({
        where: { id: clientId },
        select: { notifications: true }
      })
      
      if (client && customerEmail) {
        await sendBookingConfirmation(
          booking,
          client.name,
          siteConfig?.notifications || {},
          client,
          booking.location
        )
      }

      // Send notification to client (restaurant owner)
      if (client && client.email) {
        await sendBookingConfirmation(
          { ...booking, customerName: `${booking.customerName} (Customer)`, customerEmail: client.email },
          client.name,
          siteConfig?.notifications || {},
          client,
          booking.location
        )
      }
    } catch (emailError) {
      console.error('Failed to send booking confirmation email:', emailError)
      // Don't fail the booking if email fails
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

    // Calculate available tables
    let availableTables = actualMaxTables - existingBookings
    
    // If no tables are configured, show 0 available
    if (totalTables === 0) {
      availableTables = 0
    }

    res.json({
      maxTables: actualMaxTables,
      existingBookings,
      availableTables,
      isAvailable: availableTables > 0,
      totalConfiguredTables: totalTables
    })
  } catch (error) {
    console.error('Availability check error:', error)
    res.status(500).json({ error: 'Failed to check availability' })
  }
})

// Get all bookings for a client
router.get('/:clientId/bookings', async (req, res) => {
  try {
    const { clientId } = req.params
    const bookings = await prisma.booking.findMany({
      where: { clientId },
      include: {
        location: true,
        tables: true
      },
      orderBy: { bookingDate: 'desc' }
    })
    res.json(bookings)
  } catch (error) {
    console.error('Get bookings error:', error)
    res.status(500).json({ error: 'Failed to get bookings' })
  }
})

// Create a booking from CMS (authenticated)
router.post('/:clientId/bookings', authenticateToken, async (req, res) => {
  try {
    const { clientId } = req.params
    const { customerName, customerEmail, customerPhone, partySize, bookingDate, bookingTime, notes, tableId, locationId, status = 'confirmed' } = req.body

    // Validate required fields
    if (!customerName || !partySize || !bookingDate || !bookingTime) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // If no locationId provided, use the client's primary location
    let finalLocationId = locationId
    if (!finalLocationId) {
      const primaryLocation = await prisma.location.findFirst({
        where: { clientId, isPrimary: true }
      })
      if (primaryLocation) {
        finalLocationId = primaryLocation.id
      } else {
        const anyLocation = await prisma.location.findFirst({
          where: { clientId }
        })
        if (anyLocation) {
          finalLocationId = anyLocation.id
        }
      }
    }

    // If a table is specified, validate it's available
    if (tableId && finalLocationId) {
      const table = await prisma.restaurantTable.findFirst({
        where: {
          id: tableId,
          clientId,
          locationId: finalLocationId,
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
          tableId,
          bookingDate: new Date(bookingDate),
          bookingTime,
          status: { in: ['pending', 'confirmed'] }
        }
      })
      
      if (existingTableBooking) {
        return res.status(400).json({ error: 'Table already booked for this time slot' })
      }
    }

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        clientId,
        locationId: finalLocationId,
        customerName,
        customerEmail,
        customerPhone,
        partySize: parseInt(partySize),
        bookingDate: new Date(bookingDate),
        bookingTime,
        notes,
        tableId: tableId || null,
        status,
        confirmationMethod: 'cms'
      },
      include: {
        location: true,
        tables: true
      }
    })

    // Send booking confirmation email
    try {
      const client = await prisma.client.findUnique({
        where: { id: clientId },
        select: {
          name: true,
          colours: true,
          email: true
        }
      })
      
      const siteConfig = await prisma.siteConfig.findUnique({
        where: { id: clientId },
        select: { notifications: true }
      })
      
      if (client && customerEmail) {
        await sendBookingConfirmation(
          booking,
          client.name,
          siteConfig?.notifications || {},
          client,
          booking.location
        )
      }

      // Send notification to client (restaurant owner)
      if (client && client.email) {
        await sendBookingConfirmation(
          { ...booking, customerName: `${booking.customerName} (Customer)`, customerEmail: client.email },
          client.name,
          siteConfig?.notifications || {},
          client,
          booking.location
        )
      }
    } catch (emailError) {
      console.error('Failed to send booking confirmation email:', emailError)
      // Don't fail the booking if email fails
    }

    res.json(booking)
  } catch (error) {
    console.error('CMS booking creation error:', error)
    res.status(500).json({ error: 'Failed to create booking' })
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

    if (!['pending', 'confirmed', 'seated', 'cancelled'].includes(status)) {
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
