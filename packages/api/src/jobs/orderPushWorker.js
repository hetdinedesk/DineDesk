const { prisma } = require('../lib/prisma')
const { getAdapter } = require('../pos-adapters')
const { decrypt, decryptJSON } = require('../lib/encryption')

// Retry delay schedule: attempt 2→10s, 3→30s, 4→60s
const RETRY_DELAYS_MS = [0, 10_000, 30_000, 60_000]

function retryDelayMs(attemptNumber) {
  return RETRY_DELAYS_MS[attemptNumber - 1] ?? 60_000
}

async function processOrderPushQueue() {
  let processed = 0
  try {
    const jobs = await prisma.orderPushQueue.findMany({
      where: {
        status: 'pending',
        nextRetryAt: { lte: new Date() }
      },
      take: 10,
      orderBy: { nextRetryAt: 'asc' }
    })

    for (const job of jobs) {
      await processSingleJob(job)
      processed++
    }
  } catch (err) {
    console.error('[OrderPushWorker] Queue processing error:', err)
  }
  return processed
}

async function processSingleJob(job) {
  // Mark as processing to prevent duplicate pickup
  await prisma.orderPushQueue.update({
    where: { id: job.id },
    data: { status: 'processing' }
  })

  try {
    // Load order
    const order = await prisma.order.findUnique({ where: { id: job.orderId } })
    if (!order) {
      await prisma.orderPushQueue.update({
        where: { id: job.id },
        data: { status: 'abandoned', processedAt: new Date(), lastError: 'Order not found' }
      })
      return
    }

    // Load POS config + decrypt
    const pos = await prisma.pOSConfig.findUnique({ where: { id: job.posConfigId } })
    if (!pos || !pos.connected) {
      throw new Error('POS not connected')
    }

    const creds = decryptJSON(pos.encryptedCredentials) || {}
    const adapterConfig = {
      posType: pos.posType,
      accessToken: decrypt(pos.oauthAccessToken),
      refreshToken: decrypt(pos.oauthRefreshToken),
      tokenExpiresAt: pos.oauthTokenExpiresAt,
      locationId: pos.locationId,
      ...creds
    }

    const adapter = getAdapter(adapterConfig)

    // Build order payload
    const orderPayload = {
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      items: order.items,
      subtotal: order.subtotal,
      tax: order.taxAmount,
      total: order.total,
      deliveryFee: order.deliveryFee || 0,
      orderType: order.orderType,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      notes: order.note,
      currency: order.currency || 'AUD'
    }

    const result = await adapter.pushOrder(orderPayload)

    // Success
    await Promise.all([
      prisma.orderPushQueue.update({
        where: { id: job.id },
        data: { status: 'success', processedAt: new Date() }
      }),
      prisma.order.update({
        where: { id: order.id },
        data: {
          posOrderId: result.posOrderId,
          status: 'accepted',
          posPushAttempts: job.attemptNumber
        }
      }),
      prisma.pOSConfig.update({
        where: { id: pos.id },
        data: { lastOrderPushAt: new Date() }
      })
    ])

    console.log(`[OrderPushWorker] Order ${order.orderNumber} pushed to ${pos.posType}: ${result.posOrderId}`)
  } catch (err) {
    console.error(`[OrderPushWorker] Job ${job.id} attempt ${job.attemptNumber} failed:`, err.message)

    const nextAttempt = job.attemptNumber + 1
    const isAbandoned = nextAttempt > job.maxAttempts

    if (isAbandoned) {
      // All retries exhausted
      await Promise.all([
        prisma.orderPushQueue.update({
          where: { id: job.id },
          data: {
            status: 'abandoned',
            lastError: err.message,
            processedAt: new Date()
          }
        }),
        prisma.order.update({
          where: { id: job.orderId },
          data: {
            status: 'new', // Fall back to dashboard-only mode
            posPushLastError: err.message,
            posPushAttempts: job.attemptNumber
          }
        }).catch(() => {})
      ])
      console.warn(`[OrderPushWorker] Order ${job.orderId} permanently failed after ${job.attemptNumber} attempts`)
    } else {
      const delayMs = retryDelayMs(nextAttempt)
      await prisma.orderPushQueue.update({
        where: { id: job.id },
        data: {
          status: 'pending',
          attemptNumber: nextAttempt,
          nextRetryAt: new Date(Date.now() + delayMs),
          lastError: err.message
        }
      })
    }
  }
}

/**
 * Enqueue an order for POS push.
 * Called from orders.js after order creation.
 */
async function enqueueOrderPush(orderId, clientId) {
  try {
    const pos = await prisma.pOSConfig.findUnique({ where: { clientId } })
    if (!pos || !pos.connected || pos.posType === 'none') return null

    const job = await prisma.orderPushQueue.create({
      data: {
        orderId,
        clientId,
        posConfigId: pos.id,
        posType: pos.posType,
        status: 'pending',
        nextRetryAt: new Date()
      }
    })
    console.log(`[OrderPushWorker] Enqueued order ${orderId} for POS push (${pos.posType})`)
    return job
  } catch (err) {
    console.error('[OrderPushWorker] Enqueue error:', err)
    return null
  }
}

module.exports = { processOrderPushQueue, enqueueOrderPush }
