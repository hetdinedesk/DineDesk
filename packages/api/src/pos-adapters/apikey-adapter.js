const BasePOSAdapter = require('./base-adapter')

/**
 * Generic API-Key POS Adapter
 * Covers: Abacus, Lightspeed, Revel
 * Each POS has a configured baseUrl + auth scheme.
 */

const POS_PROFILES = {
  abacus: {
    displayName: 'Abacus',
    authHeader: (key) => ({ 'X-API-Key': key }),
    menuEndpoint: '/api/v1/items',
    orderEndpoint: '/api/v1/orders',
    testEndpoint: '/api/v1/ping',
    menuMapper: (data) => (data.items || []).map(item => ({
      posItemId: String(item.id || item.item_id),
      name: item.name,
      description: item.description || null,
      category: item.category || item.department || 'Uncategorised',
      basePrice: parseFloat(item.price || 0),
      variants: [],
      modifierGroups: [],
      imageUrl: item.image_url || null,
      available: item.active !== false,
      posRawData: item
    })),
    orderMapper: (order) => ({
      external_id: order.id,
      type: order.orderType,
      customer_name: order.customerName,
      customer_phone: order.customerPhone,
      items: order.items.map(i => ({
        item_id: i.id,
        name: i.name,
        quantity: i.quantity,
        unit_price: i.price,
        notes: i.notes || ''
      })),
      total: order.total,
      notes: order.notes
    })
  },
  lightspeed: {
    displayName: 'Lightspeed',
    authHeader: (key) => ({ 'Authorization': `Bearer ${key}` }),
    menuEndpoint: '/API/Account/{accountId}/Item.json',
    orderEndpoint: '/API/Account/{accountId}/Sale.json',
    testEndpoint: '/API/Account/{accountId}/Account.json',
    menuMapper: (data) => (data.Item ? [].concat(data.Item) : []).map(item => ({
      posItemId: String(item.itemID),
      name: item.description,
      description: item.longDescription || null,
      category: item.Category?.name || 'Uncategorised',
      basePrice: parseFloat(item.Prices?.ItemPrice?.amount || 0),
      variants: [],
      modifierGroups: [],
      imageUrl: null,
      available: item.archived !== 'true',
      posRawData: item
    })),
    orderMapper: (order) => ({
      Customer: { customerID: 0 },
      Note: `DineDesk #${order.orderNumber} - ${order.customerName}`,
      SaleLines: {
        SaleLine: order.items.map(i => ({
          itemID: i.posItemId || 0,
          qty: i.quantity,
          unitPrice: i.price
        }))
      }
    })
  },
  revel: {
    displayName: 'Revel',
    authHeader: (key, secret) => ({ 'API-KEY': key, 'API-SECRET': secret }),
    menuEndpoint: '/resources/Product/?format=json',
    orderEndpoint: '/resources/Order/?format=json',
    testEndpoint: '/resources/Establishment/?format=json',
    menuMapper: (data) => (data.objects || []).map(item => ({
      posItemId: String(item.id),
      name: item.name,
      description: item.description || null,
      category: item.menu_category_name || 'Uncategorised',
      basePrice: parseFloat(item.price || 0),
      variants: [],
      modifierGroups: (item.modifier_classes || []).map(mc => ({
        name: mc.name,
        required: mc.required || false,
        minSelect: 0,
        maxSelect: mc.max_amount || 0,
        options: (mc.modifiers || []).map(m => ({
          id: String(m.id),
          name: m.name,
          priceAdjustment: parseFloat(m.price || 0)
        }))
      })),
      imageUrl: item.image || null,
      available: item.active !== false,
      posRawData: item
    })),
    orderMapper: (order) => ({
      note: `DineDesk #${order.orderNumber}`,
      order_type: order.orderType === 'dine_in' ? 0 : 1,
      items: order.items.map(i => ({
        product: i.posItemId,
        quantity: i.quantity,
        price: i.price
      }))
    })
  }
}

class APIKeyAdapter extends BasePOSAdapter {
  constructor(config) {
    super(config)
    this.posType = config.posType
    this.apiKey = config.apiKey || ''
    this.apiSecret = config.apiSecret || ''
    this.storeId = config.storeId || config.locationId || ''
    this.baseUrl = config.baseUrl || ''
    this.profile = POS_PROFILES[config.posType] || null
  }

  _authHeaders() {
    if (!this.profile) return this._headers()
    const auth = this.profile.authHeader(this.apiKey, this.apiSecret)
    return { ...this._headers(), ...auth }
  }

  _resolveUrl(endpoint) {
    const url = endpoint.replace('{accountId}', this.storeId)
    return `${this.baseUrl}${url}`
  }

  async testConnection() {
    if (!this.apiKey) throw new Error('API Key is required')
    if (!this.profile) throw new Error(`Unknown POS type: ${this.posType}`)
    const url = this._resolveUrl(this.profile.testEndpoint)
    await this._fetch(url, { headers: this._authHeaders() })
    return true
  }

  async connect(credentials) {
    this.apiKey = credentials.apiKey
    this.apiSecret = credentials.apiSecret || ''
    this.storeId = credentials.storeId || credentials.locationId || ''
    this.baseUrl = credentials.baseUrl || this.baseUrl
    const ok = await this.testConnection()
    if (!ok) throw new Error(`${this.profile?.displayName || this.posType} connection test failed`)
    return { success: true, locationId: this.storeId }
  }

  async fetchRawMenu() {
    if (!this.profile) throw new Error(`Unknown POS type: ${this.posType}`)
    const url = this._resolveUrl(this.profile.menuEndpoint)
    return this._fetch(url, { headers: this._authHeaders() })
  }

  mapMenuToDineDesk(rawData) {
    if (!this.profile?.menuMapper) return []
    return this.profile.menuMapper(rawData)
  }

  async syncMenu() {
    const raw = await this.fetchRawMenu()
    const items = this.mapMenuToDineDesk(raw)
    return { items, rawCount: Array.isArray(raw) ? raw.length : Object.keys(raw).length }
  }

  async pushOrder(order) {
    if (!this.profile) throw new Error(`Unknown POS type: ${this.posType}`)
    const url = this._resolveUrl(this.profile.orderEndpoint)
    const payload = this.profile.orderMapper(order)
    const result = await this._fetch(url, {
      method: 'POST',
      headers: this._authHeaders(),
      body: JSON.stringify(payload)
    })
    return { success: true, posOrderId: String(result.id || result.order_id || result.saleID || Date.now()) }
  }

  async getOrderStatus(posOrderId) {
    return { posStatus: 'unknown', dinedeskStatus: 'sent_to_pos' }
  }

  async cancelOrder(posOrderId) {
    return { success: true }
  }
}

module.exports = APIKeyAdapter
