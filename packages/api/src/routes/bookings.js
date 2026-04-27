const express = require('express')
const router = express.Router()
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// Create a new booking
router.post('/', async (req, res) => {
  try {
    const { clientId, locationId, customerName, customerEmail, customerPhone, partySize, bookingDate, bookingTime, notes, confirmationMethod } = req.body

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
        status: 'pending'
      },
      include: {
        location: true
      }
    })

    res.json(booking)
  } catch (error) {
    console.error('Booking creation error:', error)
    res.status(500).json({ error: 'Failed to create booking' })
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
