/**
 * Base POS Adapter — defines the interface every adapter must implement.
 */
class BasePOSAdapter {
  constructor(config) {
    this.config = config || {}
  }

  // ── Connection ──────────────────────────────────────────────────────────
  async connect(credentials) { throw new Error('Not implemented') }
  async testConnection() { throw new Error('Not implemented') }
  async disconnect() { return { success: true } }
  async refreshToken() { throw new Error('Not implemented') }
  isTokenValid() { return true }

  // ── Menu (POS → DineDesk) ───────────────────────────────────────────────
  async fetchRawMenu() { throw new Error('Not implemented') }
  mapMenuToDineDesk(rawData) { throw new Error('Not implemented') }
  async syncMenu() { throw new Error('Not implemented') }

  // ── Orders (DineDesk → POS) ─────────────────────────────────────────────
  async pushOrder(order) { throw new Error('Not implemented') }
  async getOrderStatus(posOrderId) { throw new Error('Not implemented') }
  async cancelOrder(posOrderId) { throw new Error('Not implemented') }

  // ── Health ───────────────────────────────────────────────────────────────
  async healthCheck() {
    try {
      const start = Date.now()
      const ok = await this.testConnection()
      return { connected: ok, latencyMs: Date.now() - start, lastError: null }
    } catch (err) {
      return { connected: false, latencyMs: null, lastError: err.message }
    }
  }

  // ── Shared Helpers ────────────────────────────────────────────────────────
  _headers(extra = {}) {
    return { 'Content-Type': 'application/json', ...extra }
  }

  async _fetch(url, options = {}) {
    const https = url.startsWith('https')
    if (!https && process.env.NODE_ENV === 'production') {
      throw new Error('POS API calls must use HTTPS in production')
    }
    const res = await fetch(url, options)
    if (!res.ok) {
      const body = await res.text()
      const err = new Error(`HTTP ${res.status}: ${body}`)
      err.status = res.status
      throw err
    }
    return res.json()
  }
}

module.exports = BasePOSAdapter
