const BasePOSAdapter = require('./base-adapter')

const CLOVER_BASE = 'https://api.clover.com'
const CLOVER_SANDBOX = 'https://apisandbox.dev.clover.com'

/**
 * Clover POS Adapter
 * Docs: https://docs.clover.com/reference
 */
class CloverAdapter extends BasePOSAdapter {
  constructor(config) {
    super(config)
    this.accessToken = config.accessToken || ''
    this.merchantId = config.merchantId || config.locationId || ''
    this.sandbox = config.sandbox || process.env.NODE_ENV !== 'production'
    this.base = this.sandbox ? CLOVER_SANDBOX : CLOVER_BASE
  }

  _authHeaders() {
    return this._headers({ Authorization: `Bearer ${this.accessToken}` })
  }

  async testConnection() {
    if (!this.accessToken || !this.merchantId) throw new Error('Access token and merchant ID are required')
    const data = await this._fetch(
      `${this.base}/v3/merchants/${this.merchantId}`,
      { headers: this._authHeaders() }
    )
    return !!data.id
  }

  async connect(credentials) {
    this.accessToken = credentials.accessToken
    this.merchantId = credentials.merchantId || credentials.locationId
    const ok = await this.testConnection()
    if (!ok) throw new Error('Clover connection test failed')
    const merchant = await this._fetch(
      `${this.base}/v3/merchants/${this.merchantId}`,
      { headers: this._authHeaders() }
    )
    return { success: true, locationId: this.merchantId, locationName: merchant.name }
  }

  isTokenValid() {
    return !!this.accessToken
  }

  // ── Menu ──────────────────────────────────────────────────────────────────
  async fetchRawMenu() {
    if (!this.accessToken) throw new Error('Not connected')
    const [itemsRes, catsRes, modGroupsRes] = await Promise.all([
      this._fetch(`${this.base}/v3/merchants/${this.merchantId}/items?expand=categories,modifierGroups`, {
        headers: this._authHeaders()
      }),
      this._fetch(`${this.base}/v3/merchants/${this.merchantId}/categories`, {
        headers: this._authHeaders()
      }),
      this._fetch(`${this.base}/v3/merchants/${this.merchantId}/modifier_groups?expand=modifiers`, {
        headers: this._authHeaders()
      })
    ])
    return {
      items: itemsRes.elements || [],
      categories: catsRes.elements || [],
      modifierGroups: modGroupsRes.elements || []
    }
  }

  mapMenuToDineDesk({ items, categories, modifierGroups }) {
    const catMap = {}
    for (const c of categories) catMap[c.id] = c.name

    const modMap = {}
    for (const mg of modifierGroups) {
      modMap[mg.id] = {
        name: mg.name,
        minRequired: mg.minRequired || 0,
        maxAllowed: mg.maxAllowed || 0,
        options: (mg.modifiers?.elements || []).map(m => ({
          id: m.id,
          name: m.name,
          priceAdjustment: (m.price || 0) / 100
        }))
      }
    }

    return items.filter(i => !i.hidden).map(item => {
      const cat = item.categories?.elements?.[0]
      const category = cat ? (catMap[cat.id] || 'Uncategorised') : 'Uncategorised'

      const modifierGroups = (item.modifierGroups?.elements || []).map(mg => {
        const def = modMap[mg.id]
        if (!def) return null
        return {
          name: def.name,
          required: def.minRequired > 0,
          minSelect: def.minRequired,
          maxSelect: def.maxAllowed,
          options: def.options
        }
      }).filter(Boolean)

      return {
        posItemId: item.id,
        name: item.name,
        description: item.alternateName || null,
        category,
        basePrice: (item.price || 0) / 100,
        variants: [],
        modifierGroups,
        imageUrl: null,
        available: !item.hidden,
        posRawData: item
      }
    })
  }

  async syncMenu() {
    const raw = await this.fetchRawMenu()
    const items = this.mapMenuToDineDesk(raw)
    return { items, rawCount: raw.items?.length || 0 }
  }

  // ── Orders ────────────────────────────────────────────────────────────────
  async pushOrder(order) {
    if (!this.accessToken || !this.merchantId) throw new Error('Clover adapter not fully configured')

    // Build line items — Clover uses price in cents, one line item per unit
    const lineItemElements = []
    for (const item of (order.items || [])) {
      const qty = item.quantity || 1
      // Build note from addons
      const addonNotes = []
      if (item.selectedSize) addonNotes.push(`Size: ${item.selectedSize}`)
      if (Array.isArray(item.selectedAddons)) {
        item.selectedAddons.forEach(a => addonNotes.push(a.name || a))
      }
      const itemNote = [item.notes, ...addonNotes].filter(Boolean).join(', ')

      // Clover expects one line item per quantity unit
      for (let i = 0; i < qty; i++) {
        lineItemElements.push({
          name: item.name,
          price: Math.round((item.price || 0) * 100),
          note: itemNote || undefined
        })
      }
    }

    // Build order note with all relevant info
    const orderNotes = []
    orderNotes.push(`DineDesk #${order.orderNumber || order.id}`)
    if (order.orderType === 'dine_in') orderNotes.push('DINE-IN')
    else if (order.orderType === 'delivery') orderNotes.push('DELIVERY')
    else orderNotes.push('PICKUP')
    if (order.tableNumber) orderNotes.push(`Table ${order.tableNumber}`)
    if (order.customerName) orderNotes.push(order.customerName)
    if (order.customerPhone) orderNotes.push(order.customerPhone)
    if (order.pickupTime) {
      const pt = new Date(order.pickupTime)
      orderNotes.push(`Scheduled: ${pt.toLocaleString('en-AU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}`)
    }
    if (order.notes) orderNotes.push(order.notes)

    const payload = {
      orderCart: {
        currency: order.currency || 'AUD',
        note: orderNotes.join(' · '),
        lineItems: lineItemElements.map(li => ({
          name: li.name,
          price: li.price,
          note: li.note
        }))
      }
    }

    const result = await this._fetch(
      `${this.base}/v3/merchants/${this.merchantId}/atomic_order/orders`,
      {
        method: 'POST',
        headers: this._authHeaders(),
        body: JSON.stringify(payload)
      }
    )

    return { success: true, posOrderId: result.id }
  }

  async getOrderStatus(posOrderId) {
    const data = await this._fetch(
      `${this.base}/v3/merchants/${this.merchantId}/orders/${posOrderId}`,
      { headers: this._authHeaders() }
    )
    const cloverState = data.state
    const statusMap = {
      open: 'sent_to_pos',
      locked: 'preparing',
      paid: 'completed'
    }
    return { posStatus: cloverState, dinedeskStatus: statusMap[cloverState] || 'sent_to_pos' }
  }

  async cancelOrder(posOrderId) {
    await this._fetch(
      `${this.base}/v3/merchants/${this.merchantId}/orders/${posOrderId}`,
      {
        method: 'DELETE',
        headers: this._authHeaders()
      }
    )
    return { success: true }
  }

  getAuthUrl(appId, redirectUri, state) {
    const base = this.sandbox
      ? 'https://sandbox.dev.clover.com/oauth/authorize'
      : 'https://www.clover.com/oauth/authorize'
    const params = new URLSearchParams({ client_id: appId, redirect_uri: redirectUri, state })
    return `${base}?${params}`
  }

  async exchangeCode(code, appId, appSecret) {
    const base = this.sandbox ? CLOVER_SANDBOX : CLOVER_BASE
    const data = await this._fetch(
      `${base}/oauth/token?client_id=${appId}&client_secret=${appSecret}&code=${code}`,
      { method: 'GET', headers: this._headers() }
    )
    return { accessToken: data.access_token }
  }
}

module.exports = CloverAdapter
