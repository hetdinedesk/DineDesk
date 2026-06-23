const BasePOSAdapter = require('./base-adapter')

const TOAST_BASE = 'https://ws-api.toasttab.com'

/**
 * Toast POS Adapter
 * Requires Toast API Partner access: https://dev.toasttab.com
 */
class ToastAdapter extends BasePOSAdapter {
  constructor(config) {
    super(config)
    this.clientId = config.clientId || ''
    this.clientSecret = config.clientSecret || ''
    this.accessToken = config.accessToken || ''
    this.restaurantGuid = config.restaurantGuid || config.locationId || ''
    this.tokenExpiresAt = config.tokenExpiresAt ? new Date(config.tokenExpiresAt) : null
  }

  _authHeaders() {
    return this._headers({
      Authorization: `Bearer ${this.accessToken}`,
      'Toast-Restaurant-External-ID': this.restaurantGuid
    })
  }

  isTokenValid() {
    if (!this.accessToken) return false
    if (this.tokenExpiresAt && new Date() >= this.tokenExpiresAt) return false
    return true
  }

  async refreshToken() {
    const data = await this._fetch(`${TOAST_BASE}/authentication/v1/authentication/login`, {
      method: 'POST',
      headers: this._headers(),
      body: JSON.stringify({
        clientId: this.clientId,
        clientSecret: this.clientSecret,
        userAccessType: 'TOAST_MACHINE_CLIENT'
      })
    })
    this.accessToken = data.token?.accessToken
    this.tokenExpiresAt = data.token?.expiresIn
      ? new Date(Date.now() + data.token.expiresIn * 1000)
      : null
    return { accessToken: this.accessToken, expiresAt: this.tokenExpiresAt }
  }

  async testConnection() {
    if (!this.isTokenValid()) await this.refreshToken()
    const data = await this._fetch(
      `${TOAST_BASE}/restaurants/v1/restaurants/${this.restaurantGuid}`,
      { headers: this._authHeaders() }
    )
    return !!data.guid
  }

  async connect(credentials) {
    this.clientId = credentials.clientId
    this.clientSecret = credentials.clientSecret
    this.restaurantGuid = credentials.restaurantGuid || credentials.locationId
    await this.refreshToken()
    const ok = await this.testConnection()
    if (!ok) throw new Error('Toast connection test failed')
    return { success: true, locationId: this.restaurantGuid }
  }

  // ── Menu ──────────────────────────────────────────────────────────────────
  async fetchRawMenu() {
    if (!this.isTokenValid()) await this.refreshToken()
    const data = await this._fetch(
      `${TOAST_BASE}/menus/v2/menus?restaurantGuid=${this.restaurantGuid}`,
      { headers: this._authHeaders() }
    )
    return data
  }

  mapMenuToDineDesk(rawMenus) {
    const items = []
    for (const menu of rawMenus || []) {
      for (const group of menu.menuGroups || []) {
        const category = group.name || 'Uncategorised'
        for (const item of group.menuItems || []) {
          const basePrice = item.price || 0

          const modifierGroups = (item.modifierGroups || []).map(mg => ({
            name: mg.name,
            required: mg.minSelections > 0,
            minSelect: mg.minSelections || 0,
            maxSelect: mg.maxSelections || 0,
            options: (mg.modifiers || []).map(m => ({
              id: m.guid,
              name: m.name,
              priceAdjustment: m.price || 0
            }))
          }))

          items.push({
            posItemId: item.guid,
            name: item.name,
            description: item.description || null,
            category,
            basePrice,
            variants: [],
            modifierGroups,
            imageUrl: item.imageUrl || null,
            available: item.visibility !== 'HIDDEN',
            posRawData: item
          })
        }
      }
    }
    return items
  }

  async syncMenu() {
    const raw = await this.fetchRawMenu()
    const items = this.mapMenuToDineDesk(raw)
    return { items, rawCount: raw?.length || 0 }
  }

  // ── Orders ────────────────────────────────────────────────────────────────
  async pushOrder(order) {
    if (!this.isTokenValid()) await this.refreshToken()

    // Build line item selections
    const selections = (order.items || []).map(item => {
      const addonNotes = []
      if (item.selectedSize) addonNotes.push(`Size: ${item.selectedSize}`)
      if (Array.isArray(item.selectedAddons)) {
        item.selectedAddons.forEach(a => addonNotes.push(a.name || a))
      }
      const specialRequest = [item.notes, ...addonNotes].filter(Boolean).join(', ')

      return {
        displayName: item.name,
        quantity: item.quantity || 1,
        preDiscountPrice: Math.round((item.price || 0) * 100),
        price: Math.round((item.price || 0) * 100),
        specialRequest: specialRequest || undefined
      }
    })

    // Map order type to Toast dining options
    let diningOption = 'TAKE_OUT'
    if (order.orderType === 'delivery') diningOption = 'DELIVERY'
    else if (order.orderType === 'dine_in') diningOption = 'DINE_IN'

    // Build customer
    const nameParts = (order.customerName || 'Guest').split(' ')
    const customer = {
      firstName: nameParts[0] || 'Guest',
      lastName: nameParts.slice(1).join(' ') || '',
      phone: order.customerPhone || undefined,
      email: order.customerEmail || undefined
    }

    // Build order note
    const orderNotes = []
    if (order.orderNumber) orderNotes.push(`DineDesk #${order.orderNumber}`)
    if (order.tableNumber) orderNotes.push(`Table ${order.tableNumber}`)
    if (order.notes) orderNotes.push(order.notes)

    const payload = {
      entityType: 'Order',
      externalReferenceId: `DD-${order.orderNumber || order.id}`,
      restaurantGuid: this.restaurantGuid,
      source: 'DineDesk',
      diningOption,
      promisedDateTime: order.pickupTime ? new Date(order.pickupTime).toISOString() : undefined,
      deliveryInfo: order.orderType === 'delivery' ? {
        notes: order.notes || undefined
      } : undefined,
      checks: [{
        customer,
        displayName: order.customerName || 'Guest',
        selections,
        amount: Math.round((order.total || 0) * 100),
        totalAmount: Math.round((order.total || 0) * 100),
        specialInstructions: orderNotes.join(' · ') || undefined
      }]
    }

    // Add table info for dine-in
    if (order.orderType === 'dine_in' && order.tableNumber) {
      payload.table = { displayName: `Table ${order.tableNumber}` }
    }

    const result = await this._fetch(
      `${TOAST_BASE}/orders/v2/orders`,
      {
        method: 'POST',
        headers: this._authHeaders(),
        body: JSON.stringify(payload)
      }
    )

    return { success: true, posOrderId: result.guid }
  }

  async getOrderStatus(posOrderId) {
    if (!this.isTokenValid()) await this.refreshToken()
    const data = await this._fetch(
      `${TOAST_BASE}/orders/v2/orders/${posOrderId}`,
      { headers: this._authHeaders() }
    )
    const toastStatus = data.displayState
    const statusMap = {
      OPEN: 'sent_to_pos',
      NEEDS_APPROVAL: 'sent_to_pos',
      APPROVED: 'accepted',
      PREPARING: 'preparing',
      READY_FOR_PICKUP: 'ready',
      CLOSED: 'completed',
      VOIDED: 'cancelled'
    }
    return { posStatus: toastStatus, dinedeskStatus: statusMap[toastStatus] || 'sent_to_pos' }
  }

  async cancelOrder(posOrderId) {
    if (!this.isTokenValid()) await this.refreshToken()
    await this._fetch(
      `${TOAST_BASE}/orders/v2/orders/${posOrderId}/void`,
      { method: 'POST', headers: this._authHeaders() }
    )
    return { success: true }
  }
}

module.exports = ToastAdapter
