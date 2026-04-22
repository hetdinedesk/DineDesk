// POS Adapter Layer
// This module handles routing orders to different POS systems based on configuration

const APIAdapter = require('./api-adapter')
const OnlineOrdersAdapter = require('./online-orders-adapter')
const FallbackAdapter = require('./fallback-adapter')

/**
 * Order Router - determines which adapter to use based on POS configuration
 */
class OrderRouter {
  constructor(posConfig) {
    this.posConfig = posConfig || {}
    this.adapter = this.getAdapter()
  }

  /**
   * Get the appropriate adapter based on POS type
   */
  getAdapter() {
    const posType = this.posConfig.posType || 'none'

    switch (posType) {
      case 'api':
        return new APIAdapter(this.posConfig)
      case 'online-orders':
        return new OnlineOrdersAdapter(this.posConfig)
      case 'email-import':
      case 'unknown':
      case 'none':
      default:
        return new FallbackAdapter(this.posConfig)
    }
  }

  /**
   * Send order to POS
   */
  async sendOrder(order) {
    try {
      const result = await this.adapter.sendOrder(order)
      return {
        success: true,
        orderId: result.orderId,
        posOrderId: result.posOrderId,
        message: result.message || 'Order sent successfully'
      }
    } catch (error) {
      console.error('POS sendOrder error:', error)
      return {
        success: false,
        error: error.message || 'Failed to send order to POS'
      }
    }
  }

  /**
   * Check if POS is available
   */
  async checkStatus() {
    try {
      return await this.adapter.checkStatus()
    } catch (error) {
      console.error('POS checkStatus error:', error)
      return { available: false, error: error.message }
    }
  }
}

module.exports = OrderRouter
