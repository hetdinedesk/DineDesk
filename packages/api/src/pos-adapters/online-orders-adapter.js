// Online Orders Adapter for Abacus-style POS systems
// Handles webhook-based integration with POS systems that have online ordering inboxes

class OnlineOrdersAdapter {
  constructor(config) {
    this.config = config
    this.webhookUrl = config.webhookUrl
    this.apiKey = config.apiKey
    this.autoConfirm = config.autoConfirm !== false
  }

  /**
   * Send order to POS via webhook
   */
  async sendOrder(order) {
    // Validate configuration
    if (!this.webhookUrl) {
      throw new Error('Webhook URL is required for Online Orders integration')
    }

    // Convert internal order format to online orders format
    const formattedOrder = this.formatOrder(order)

    // Send to POS webhook
    const response = await this.sendToWebhook(formattedOrder)

    return {
      orderId: order.id,
      posOrderId: response.id || order.id,
      message: this.autoConfirm ? 'Order sent to online orders inbox' : 'Order sent awaiting confirmation'
    }
  }

  /**
   * Format internal order to online orders format
   */
  formatOrder(order) {
    // Format commonly used by online ordering systems
    return {
      order_id: order.id,
      restaurant_name: order.restaurantName,
      order_type: order.orderType || 'pickup',
      customer: {
        name: order.customerName,
        email: order.customerEmail,
        phone: order.customerPhone
      },
      items: order.items.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        notes: item.notes || '',
        modifiers: item.modifiers || []
      })),
      totals: {
        subtotal: order.subtotal,
        tax: order.tax,
        tax_rate: order.taxRate,
        total: order.total,
        delivery_fee: order.deliveryFee || 0,
        discount: order.discount || 0
      },
      payment: {
        method: order.paymentMethod,
        status: order.paymentStatus || 'paid',
        transaction_id: order.transactionId
      },
      scheduled_for: order.scheduledFor || null,
      notes: order.notes || '',
      created_at: new Date().toISOString()
    }
  }

  /**
   * Send formatted order to POS webhook
   */
  async sendToWebhook(formattedOrder) {
    try {
      const headers = {
        'Content-Type': 'application/json'
      }

      // Add API key if provided
      if (this.apiKey) {
        headers['Authorization'] = `Bearer ${this.apiKey}`
        headers['X-API-Key'] = this.apiKey
      }

      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(formattedOrder)
      })

      if (!response.ok) {
        throw new Error(`Webhook returned ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      
      return {
        id: data.order_id || data.id || formattedOrder.order_id,
        status: data.status || 'received'
      }
    } catch (error) {
      console.error('Webhook send error:', error)
      throw new Error(`Failed to send order to webhook: ${error.message}`)
    }
  }

  /**
   * Check if webhook endpoint is available
   */
  async checkStatus() {
    if (!this.webhookUrl) {
      return {
        available: false,
        error: 'Webhook URL not configured'
      }
    }

    try {
      // Try a simple HEAD request to check if endpoint is reachable
      const response = await fetch(this.webhookUrl, {
        method: 'HEAD',
        headers: this.apiKey ? { 'X-API-Key': this.apiKey } : {}
      })

      return {
        available: response.ok || response.status === 405, // 405 Method Not Allowed is OK for HEAD
        message: response.ok ? 'Webhook endpoint is available' : 'Webhook endpoint returned non-OK status'
      }
    } catch (error) {
      return {
        available: false,
        error: error.message
      }
    }
  }
}

module.exports = OnlineOrdersAdapter
