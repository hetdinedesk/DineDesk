// Fallback Adapter for email/print-based order delivery
// Used when no POS integration is available or for legacy systems

class FallbackAdapter {
  constructor(config) {
    this.config = config
    this.fallbackEmail = config.fallbackEmail
    this.fallbackMethod = config.fallbackMethod || 'email'
  }

  /**
   * Send order via fallback method (email/print)
   */
  async sendOrder(order) {
    const method = this.fallbackMethod

    switch (method) {
      case 'email':
        return await this.sendViaEmail(order)
      case 'email-print':
        await this.sendViaEmail(order)
        return await this.sendToPrinter(order)
      case 'print':
        return await this.sendToPrinter(order)
      default:
        return await this.sendViaEmail(order)
    }
  }

  /**
   * Send order via email
   */
  async sendViaEmail(order) {
    // Validate configuration
    if (!this.fallbackEmail) {
      throw new Error('Fallback email is required for email-based order delivery')
    }

    // Format order for email
    const emailContent = this.formatEmailContent(order)
    const emailSubject = `New Order #${order.id} - ${order.restaurantName}`

    // TODO: Implement actual email sending
    // This would use nodemailer or similar service

    return {
      orderId: order.id,
      posOrderId: order.id,
      message: 'Order sent via email'
    }
  }

  /**
   * Format order content for email
   */
  formatEmailContent(order) {
    const items = order.items.map(item => 
      `- ${item.name} x${item.quantity} - $${(item.price * item.quantity).toFixed(2)}${item.notes ? ` (${item.notes})` : ''}`
    ).join('\n')

    return `
NEW ORDER #${order.id}
==================

Restaurant: ${order.restaurantName}
Order Type: ${order.orderType || 'pickup'}
Date: ${new Date().toLocaleString()}

CUSTOMER
--------
Name: ${order.customerName}
Email: ${order.customerEmail || 'N/A'}
Phone: ${order.customerPhone || 'N/A'}

ORDER ITEMS
-----------
${items}

TOTALS
------
Subtotal: $${order.subtotal.toFixed(2)}
Tax: $${order.tax.toFixed(2)}
Delivery Fee: $${(order.deliveryFee || 0).toFixed(2)}
Total: $${order.total.toFixed(2)}

PAYMENT
-------
Method: ${order.paymentMethod}
Status: ${order.paymentStatus}

NOTES
-----
${order.notes || 'None'}
    `.trim()
  }

  /**
   * Send order to kitchen printer
   */
  async sendToPrinter(order) {
    // Format order for printing
    const printContent = this.formatPrintContent(order)

    // TODO: Implement actual printer integration
    // This would use thermal printer libraries or print services

    return {
      orderId: order.id,
      posOrderId: order.id,
      message: 'Order sent to printer'
    }
  }

  /**
   * Format order content for printing
   */
  formatPrintContent(order) {
    const items = order.items.map(item => 
      `${item.quantity}x ${item.name} - $${(item.price * item.quantity).toFixed(2)}`
    ).join('\n')

    return `
================================
  ORDER #${order.id}
  ${new Date().toLocaleString()}
================================

${order.orderType?.toUpperCase() || 'PICKUP'}

CUSTOMER: ${order.customerName}
PHONE: ${order.customerPhone || 'N/A'}

--------------------------------
ITEMS
--------------------------------
${items}

--------------------------------
TOTAL: $${order.total.toFixed(2)}
PAID: ${order.paymentStatus}
================================
    `.trim()
  }

  /**
   * Check if fallback method is available
   */
  async checkStatus() {
    const checks = []

    // Check email configuration
    if (this.fallbackMethod === 'email' || this.fallbackMethod === 'email-print') {
      checks.push({
        method: 'email',
        available: !!this.fallbackEmail,
        message: this.fallbackEmail ? 'Email configured' : 'Email not configured'
      })
    }

    // Check printer configuration
    if (this.fallbackMethod === 'print' || this.fallbackMethod === 'email-print') {
      checks.push({
        method: 'print',
        available: true, // Always available for fallback
        message: 'Printer fallback available'
      })
    }

    return {
      available: checks.some(c => c.available),
      methods: checks,
      message: checks.some(c => c.available) ? 'Fallback methods available' : 'No fallback methods configured'
    }
  }
}

module.exports = FallbackAdapter
