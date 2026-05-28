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

    const lineItems = order.items.map(item => ({
      name: item.name,
      quantity: item.quantity || 1,
      sellingPrice: Math.round((item.price || 0) * 100)
    }))

    const payload = {
      restaurantGuid: this.restaurantGuid,
      diningOption: order.orderType === 'delivery' ? 'DELIVERY' : 'TAKE_OUT',
      checks: [{
        customer: {
          firstName: order.customerName?.split(' ')[0] || order.customerName,
          lastName: order.customerName?.split(' ').slice(1).join(' ') || '',
          phone: order.customerPhone
        },
        selections: lineItems
      }]
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
