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
 * Update order statuses based on time elapsed since order creation
 * This should be called periodically (e.g., every minute via cron job)
 */
async function updateOrderStatuses() {
  try {
    // Get all active orders (not completed or cancelled)
    const activeOrders = await prisma.order.findMany({
      where: {
        status: {
          in: ['new', 'preparing', 'almost_ready', 'packing']
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

      const orderCreatedAt = new Date(order.createdAt)
      const now = new Date()
      const elapsedMinutes = (now - orderCreatedAt) / (1000 * 60)
      const percentageElapsed = (elapsedMinutes / prepTimeMinutes) * 100

      let newStatus = null

      // Determine new status based on percentage elapsed
      if (percentageElapsed >= 90 && order.status !== 'ready' && order.status !== 'completed') {
        newStatus = 'ready'
      } else if (percentageElapsed >= 70 && order.status === 'almost_ready') {
        newStatus = 'packing'
      } else if (percentageElapsed >= 70 && order.status === 'preparing') {
        newStatus = 'almost_ready'
      } else if (percentageElapsed >= 10 && order.status === 'new') {
        newStatus = 'preparing'
      }

      // Update status if it should change
      if (newStatus && newStatus !== order.status) {
        await prisma.order.update({
          where: { id: order.id },
          data: { status: newStatus }
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
