const BasePOSAdapter = require('./base-adapter')

const SQUARE_BASE = 'https://connect.squareup.com'
const SQUARE_SANDBOX = 'https://connect.squareupsandbox.com'

/**
 * Square POS Adapter
 * Docs: https://developer.squareup.com/reference/square
 */
class SquareAdapter extends BasePOSAdapter {
  constructor(config) {
    super(config)
    this.accessToken = config.accessToken || ''
    this.locationId = config.locationId || ''
    this.sandbox = config.sandbox || process.env.NODE_ENV !== 'production'
    this.base = this.sandbox ? SQUARE_SANDBOX : SQUARE_BASE
  }

  _authHeaders() {
    return this._headers({ Authorization: `Bearer ${this.accessToken}` })
  }

  // ── Connection ────────────────────────────────────────────────────────────
  async testConnection() {
    if (!this.accessToken) throw new Error('Access token is required')
    const data = await this._fetch(`${this.base}/v2/merchants/me`, {
      headers: this._authHeaders()
    })
    return !!data.merchant
  }

  async connect(credentials) {
    this.accessToken = credentials.accessToken
    this.locationId = credentials.locationId || this.locationId
    const ok = await this.testConnection()
    if (!ok) throw new Error('Square connection test failed')

    const locations = await this._fetch(`${this.base}/v2/locations`, {
      headers: this._authHeaders()
    })
    const loc = (locations.locations || []).find(l => l.id === this.locationId) || locations.locations?.[0]
    return {
      success: true,
      locationId: loc?.id,
      locationName: loc?.name,
      merchantId: loc?.merchant_id
    }
  }

  isTokenValid() {
    // Square access tokens don't have a fixed expiry — revocation is detected via 401
    return !!this.accessToken
  }

  // ── Menu ──────────────────────────────────────────────────────────────────
  async fetchRawMenu() {
    if (!this.accessToken) throw new Error('Not connected')
    const data = await this._fetch(
      `${this.base}/v2/catalog/list?types=ITEM,CATEGORY,MODIFIER_LIST,IMAGE`,
      { headers: this._authHeaders() }
    )
    return data.objects || []
  }

  mapMenuToDineDesk(rawObjects) {
    const categories = {}
    const images = {}
    const modifierLists = {}

    for (const obj of rawObjects) {
      if (obj.type === 'CATEGORY') {
        categories[obj.id] = obj.category_data?.name || 'Uncategorised'
      }
      if (obj.type === 'IMAGE') {
        images[obj.id] = obj.image_data?.url
      }
      if (obj.type === 'MODIFIER_LIST') {
        modifierLists[obj.id] = {
          name: obj.modifier_list_data?.name,
          selectionType: obj.modifier_list_data?.selection_type,
          options: (obj.modifier_list_data?.modifiers || []).map(m => ({
            id: m.id,
            name: m.modifier_data?.name,
            priceAdjustment: (m.modifier_data?.price_money?.amount || 0) / 100
          }))
        }
      }
    }

    const items = []
    for (const obj of rawObjects) {
      if (obj.type !== 'ITEM') continue
      const itemData = obj.item_data || {}

      const categoryId = itemData.category_id
      const category = categoryId ? (categories[categoryId] || 'Uncategorised') : 'Uncategorised'

      const imageId = itemData.image_ids?.[0]
      const imageUrl = imageId ? images[imageId] : null

      const variations = (itemData.variations || [])
      const basePrice = variations.length > 0
        ? (variations[0].item_variation_data?.price_money?.amount || 0) / 100
        : 0

      const variants = variations.length > 1
        ? variations.map(v => ({
            id: v.id,
            name: v.item_variation_data?.name,
            priceAdjustment: ((v.item_variation_data?.price_money?.amount || 0) / 100) - basePrice
          }))
        : []

      const modifierGroups = (itemData.modifier_list_info || []).map(info => {
        const list = modifierLists[info.modifier_list_id]
        if (!list) return null
        return {
          name: list.name,
          required: info.min_selected_modifiers > 0,
          minSelect: info.min_selected_modifiers || 0,
          maxSelect: info.max_selected_modifiers || 0,
          options: list.options
        }
      }).filter(Boolean)

      items.push({
        posItemId: obj.id,
        name: itemData.name || 'Unnamed Item',
        description: itemData.description || null,
        category,
        basePrice,
        variants,
        modifierGroups,
        imageUrl,
        available: !itemData.is_deleted && obj.present_at_all_locations !== false,
        posRawData: obj
      })
    }

    return items
  }

  async syncMenu() {
    const raw = await this.fetchRawMenu()
    const items = this.mapMenuToDineDesk(raw)
    return { items, rawCount: raw.length }
  }

  // ── Orders ────────────────────────────────────────────────────────────────
  async pushOrder(order) {
    if (!this.accessToken || !this.locationId) {
      throw new Error('Square adapter not fully configured')
    }

    const currency = order.currency || 'AUD'

    // Build line items — include addons as separate line items
    const lineItems = []
    for (const item of (order.items || [])) {
      const qty = item.quantity || 1
      // Build note from selected addons/options for context
      const addonNotes = []
      if (item.selectedSize) addonNotes.push(`Size: ${item.selectedSize}`)
      if (Array.isArray(item.selectedAddons)) {
        item.selectedAddons.forEach(a => addonNotes.push(a.name || a))
      }
      const itemNote = [item.notes, ...addonNotes].filter(Boolean).join(', ')

      lineItems.push({
        name: item.name,
        quantity: String(qty),
        base_price_money: {
          amount: Math.round((item.price || 0) * 100),
          currency
        },
        note: itemNote || undefined
      })
    }

    // Build fulfillment note
    const fulfillmentNotes = []
    if (order.orderNumber) fulfillmentNotes.push(`DineDesk #${order.orderNumber}`)
    if (order.tableNumber) fulfillmentNotes.push(`Table ${order.tableNumber}`)
    if (order.notes) fulfillmentNotes.push(order.notes)
    const fulfillmentNote = fulfillmentNotes.join(' · ')

    // Determine fulfillment type
    const isDineIn = order.orderType === 'dine_in'
    const isDelivery = order.orderType === 'delivery'
    const fulfillmentType = isDelivery ? 'DELIVERY' : 'PICKUP'

    // Build fulfillment with pickup_details (Square uses pickup_details for both pickup and dine-in)
    const fulfillment = {
      type: fulfillmentType,
      state: 'PROPOSED'
    }

    if (!isDelivery) {
      fulfillment.pickup_details = {
        recipient: {
          display_name: order.customerName || 'Guest',
          phone_number: order.customerPhone || undefined,
          email_address: order.customerEmail || undefined
        },
        note: fulfillmentNote || undefined,
        schedule_type: order.pickupTime ? 'SCHEDULED' : 'ASAP',
        pickup_at: order.pickupTime ? new Date(order.pickupTime).toISOString() : undefined,
        is_curbside_pickup: false
      }
      if (isDineIn) {
        fulfillment.pickup_details.note = `DINE-IN${order.tableNumber ? ` · Table ${order.tableNumber}` : ''}${order.notes ? ` · ${order.notes}` : ''}`
      }
    } else {
      fulfillment.delivery_details = {
        recipient: {
          display_name: order.customerName || 'Guest',
          phone_number: order.customerPhone || undefined,
          email_address: order.customerEmail || undefined
        },
        note: fulfillmentNote || undefined,
        schedule_type: order.pickupTime ? 'SCHEDULED' : 'ASAP',
        deliver_at: order.pickupTime ? new Date(order.pickupTime).toISOString() : undefined
      }
    }

    const payload = {
      idempotency_key: `dinedesk-${order.id}-${Date.now()}`,
      order: {
        location_id: this.locationId,
        reference_id: `DD-${order.orderNumber || order.id}`,
        line_items: lineItems,
        fulfillments: [fulfillment],
        metadata: {
          dinedesk_order_id: order.id,
          dinedesk_order_number: String(order.orderNumber || ''),
          order_type: order.orderType || 'pickup'
        }
      }
    }

    const result = await this._fetch(`${this.base}/v2/orders`, {
      method: 'POST',
      headers: this._authHeaders(),
      body: JSON.stringify(payload)
    })

    return {
      success: true,
      posOrderId: result.order?.id,
      posOrderVersion: result.order?.version
    }
  }

  async getOrderStatus(posOrderId) {
    const data = await this._fetch(`${this.base}/v2/orders/${posOrderId}`, {
      headers: this._authHeaders()
    })
    const squareState = data.order?.state
    const statusMap = {
      OPEN: 'sent_to_pos',
      IN_PROGRESS: 'preparing',
      COMPLETED: 'completed',
      CANCELED: 'cancelled'
    }
    return { posStatus: squareState, dinedeskStatus: statusMap[squareState] || 'sent_to_pos' }
  }

  async cancelOrder(posOrderId) {
    // Square requires updating fulfillment state to cancel
    const data = await this._fetch(`${this.base}/v2/orders/${posOrderId}`, {
      headers: this._authHeaders()
    })
    await this._fetch(`${this.base}/v2/orders/${posOrderId}`, {
      method: 'PUT',
      headers: this._authHeaders(),
      body: JSON.stringify({
        idempotency_key: `cancel-${posOrderId}-${Date.now()}`,
        order: { version: data.order.version, state: 'CANCELED', location_id: this.locationId }
      })
    })
    return { success: true }
  }

  // ── OAuth helpers (used by POS route) ─────────────────────────────────────
  getAuthUrl(clientId, redirectUri, state) {
    const base = this.sandbox
      ? 'https://connect.squareupsandbox.com/oauth2/authorize'
      : 'https://connect.squareup.com/oauth2/authorize'
    const params = new URLSearchParams({
      client_id: clientId,
      scope: 'MERCHANT_PROFILE_READ ITEMS_READ ORDERS_WRITE ORDERS_READ INVENTORY_READ',
      session: 'false',
      redirect_uri: redirectUri,
      state
    })
    return `${base}?${params}`
  }

  async exchangeCode(code, clientId, clientSecret, redirectUri) {
    const base = this.sandbox ? SQUARE_SANDBOX : SQUARE_BASE
    const data = await this._fetch(`${base}/oauth2/token`, {
      method: 'POST',
      headers: this._headers(),
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri
      })
    })
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: data.expires_at
    }
  }
}

module.exports = SquareAdapter
