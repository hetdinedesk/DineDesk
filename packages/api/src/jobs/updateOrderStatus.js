const { prisma } = require('../lib/prisma')

/**
 * Parse estimated prep time string (e.g., "15-25 min") to minutes
 * Uses the average of the range if provided, or the single value
 */
function parsePrepTime(prepTimeString) {
  if (!prepTimeString) return 20 // Default 20 minutes

  // Extract numbers from string
  const numbers = prepTimeString.match(/\d+/g)
  if (!numbers || numbers.length === 0) return 20

  if (numbers.length === 1) {
    return parseInt(numbers[0])
  }

  // If range (e.g., "15-25"), use the average
  const min = parseInt(numbers[0])
  const max = parseInt(numbers[1])
  return Math.floor((min + max) / 2)
}

/**
 * Update order statuses based on time elapsed since order acceptance
 * This should be called periodically (e.g., every minute via cron job)
 */
async function updateOrderStatuses() {
  try {
    // Get all active orders (not completed or cancelled) - only process accepted orders
    const activeOrders = await prisma.order.findMany({
      where: {
        status: {
          in: ['accepted', 'preparing', 'almost_ready', 'packing']
        },
        acceptedAt: {
          not: null
        }
      },
      include: {
        client: {
          include: {
            siteConfig: true
          }
        }
      }
    })

    let updatedCount = 0

    for (const order of activeOrders) {
      const ordering = order.client.siteConfig?.ordering || {}
      const prepTimeString = ordering.estimatedPrepTime || '15-25 min'
      const prepTimeMinutes = parsePrepTime(prepTimeString)

      // Use acceptedAt as the start time for timer
      const orderStartTime = new Date(order.acceptedAt)
      const now = new Date()
      const elapsedMinutes = (now - orderStartTime) / (1000 * 60)
      const percentageElapsed = (elapsedMinutes / prepTimeMinutes) * 100

      let newStatus = null

      // Determine new status based on percentage elapsed
      if (percentageElapsed >= 90 && order.status !== 'ready' && order.status !== 'completed') {
        newStatus = 'ready'
      } else if (percentageElapsed >= 70 && order.status === 'almost_ready') {
        newStatus = 'packing'
      } else if (percentageElapsed >= 70 && order.status === 'preparing') {
        newStatus = 'almost_ready'
      } else if (percentageElapsed >= 10 && order.status === 'accepted') {
        newStatus = 'preparing'
      }

      // Update status if it should change
      if (newStatus && newStatus !== order.status) {
        const updateData = { status: newStatus }
        const now = new Date()
        if (newStatus === 'preparing') updateData.preparingAt = now
        if (newStatus === 'ready') updateData.readyAt = now

        await prisma.order.update({
          where: { id: order.id },
          data: updateData
        })
        updatedCount++
      }
    }
    return { success: true, updatedCount }
  } catch (error) {
    console.error('[ORDER STATUS] Error updating order statuses:', error)
    return { success: false, error: error.message }
  }
}

module.exports = { updateOrderStatuses }
