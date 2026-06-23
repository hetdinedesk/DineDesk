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
 * 
 * DISABLED: All status transitions are now manual (controlled by staff).
 * Flow: New → Accepted → Preparing → Ready → Completed
 * This function is kept as a no-op so existing callers (cron, route) don't break.
 */
async function updateOrderStatuses() {
  // All status changes are now handled manually by staff via the CMS pipeline board.
  // No automatic status transitions.
  return { success: true, updatedCount: 0 }
}

module.exports = { updateOrderStatuses }
