// POS Adapter Layer
// Routes to the correct adapter based on posType from POSConfig

const SquareAdapter = require('./square-adapter')
const ToastAdapter = require('./toast-adapter')
const CloverAdapter = require('./clover-adapter')
const APIKeyAdapter = require('./apikey-adapter')
const FallbackAdapter = require('./fallback-adapter')

const OAUTH_TYPES = ['square', 'toast', 'clover']
const APIKEY_TYPES = ['abacus', 'lightspeed', 'revel']

function getAdapter(config = {}) {
  const posType = config.posType || 'none'

  if (posType === 'square') return new SquareAdapter(config)
  if (posType === 'toast') return new ToastAdapter(config)
  if (posType === 'clover') return new CloverAdapter(config)
  if (APIKEY_TYPES.includes(posType)) return new APIKeyAdapter(config)

  return new FallbackAdapter(config)
}

/**
 * Thin wrapper used by order processing — keeps the existing sendOrder / checkStatus API.
 */
class OrderRouter {
  constructor(posConfig) {
    this.posConfig = posConfig || {}
    this.adapter = getAdapter(this.posConfig)
  }

  async sendOrder(order) {
    try {
      const result = await this.adapter.pushOrder(order)
      return {
        success: true,
        orderId: order.id,
        posOrderId: result.posOrderId,
        message: 'Order sent to POS'
      }
    } catch (error) {
      console.error('POS sendOrder error:', error)
      return { success: false, error: error.message || 'Failed to send order to POS' }
    }
  }

  async checkStatus() {
    try {
      const health = await this.adapter.healthCheck()
      return { available: health.connected, latencyMs: health.latencyMs, error: health.lastError }
    } catch (error) {
      console.error('POS checkStatus error:', error)
      return { available: false, error: error.message }
    }
  }
}

module.exports = OrderRouter
module.exports.getAdapter = getAdapter
module.exports.OAUTH_TYPES = OAUTH_TYPES
module.exports.APIKEY_TYPES = APIKEY_TYPES
