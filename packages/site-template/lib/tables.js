/**
 * Tables API client for managing restaurant tables
 */

export const API_BASE = process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:3001/api'

export class TablesAPI {
  /**
   * Get all tables for a location
   */
  static async getTables(locationId) {
    const response = await fetch(`${API_BASE}/locations/${locationId}/tables`)
    if (!response.ok) {
      throw new Error(`Failed to fetch tables: ${response.statusText}`)
    }
    return response.json()
  }

  /**
   * Get a single table by ID
   */
  static async getTable(locationId, tableId) {
    const response = await fetch(`${API_BASE}/locations/${locationId}/tables/${tableId}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch table: ${response.statusText}`)
    }
    return response.json()
  }

  /**
   * Create a new table
   */
  static async createTable(locationId, tableData) {
    const response = await fetch(`${API_BASE}/locations/${locationId}/tables`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tableData),
    })
    
    if (!response.ok) {
      throw new Error(`Failed to create table: ${response.statusText}`)
    }
    
    return response.json()
  }

  /**
   * Update an existing table
   */
  static async updateTable(locationId, tableId, tableData) {
    const response = await fetch(`${API_BASE}/locations/${locationId}/tables/${tableId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tableData),
    })
    
    if (!response.ok) {
      throw new Error(`Failed to update table: ${response.statusText}`)
    }
    
    return response.json()
  }

  /**
   * Delete a table
   */
  static async deleteTable(locationId, tableId) {
    const response = await fetch(`${API_BASE}/locations/${locationId}/tables/${tableId}`, {
      method: 'DELETE',
    })
    
    if (!response.ok) {
      throw new Error(`Failed to delete table: ${response.statusText}`)
    }
    
    return response.json()
  }

  /**
   * Generate or regenerate QR code for a table
   */
  static async generateQRCode(locationId, tableId) {
    const response = await fetch(`${API_BASE}/locations/${locationId}/tables/${tableId}/qrcode`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) {
      throw new Error(`Failed to generate QR code: ${response.statusText}`)
    }
    
    return response.json()
  }

  /**
   * Get table information by QR code (public endpoint)
   */
  static async getTableByQR(clientId, locationId, tableNumber) {
    const response = await fetch(`${API_BASE}/qr/${clientId}/${locationId}/${tableNumber}`)
    if (!response.ok) {
      throw new Error(`Table not found: ${response.statusText}`)
    }
    return response.json()
  }

  /**
   * Get next available table number for a location
   */
  static async getNextTableNumber(locationId) {
    try {
      const tables = await this.getTables(locationId)
      const maxNumber = Math.max(...tables.map(t => parseInt(t.tableNumber) || 0))
      return maxNumber + 1
    } catch (error) {
      console.error('Error getting next table number:', error)
      return 1
    }
  }

  /**
   * Create multiple tables at once
   */
  static async createMultipleTables(locationId, tableConfigs) {
    const results = []
    for (const config of tableConfigs) {
      try {
        const table = await this.createTable(locationId, config)
        results.push({ success: true, table })
      } catch (error) {
        results.push({ success: false, error: error.message, config })
      }
    }
    return results
  }

  /**
   * Batch update tables
   */
  static async batchUpdateTables(locationId, updates) {
    const results = []
    for (const { tableId, data } of updates) {
      try {
        const table = await this.updateTable(locationId, tableId, data)
        results.push({ success: true, table })
      } catch (error) {
        results.push({ success: false, error: error.message, tableId })
      }
    }
    return results
  }
}

/**
 * Utility functions for table management
 */
export const TableUtils = {
  /**
   * Format table capacity display
   */
  formatCapacity(capacity) {
    return `${capacity} guest${capacity !== 1 ? 's' : ''}`
  },

  /**
   * Get table status color
   */
  getStatusColor(isActive) {
    return isActive ? '#10B981' : '#EF4444'
  },

  /**
   * Get table status text
   */
  getStatusText(isActive) {
    return isActive ? 'Active' : 'Inactive'
  },

  /**
   * Generate QR code display URL (for QR code generation libraries)
   */
  generateQRDataURL(url) {
    // This would integrate with a QR code library like qrcode.js
    // For now, return the URL that would be encoded
    return url
  },

  /**
   * Check if table has current booking
   */
  hasCurrentBooking(table) {
    return table.booking && table.booking.status === 'confirmed'
  },

  /**
   * Get table order statistics
   */
  getOrderStats(table) {
    const orderCount = table._count?.orders || 0
    return {
      total: orderCount,
      text: `${orderCount} order${orderCount !== 1 ? 's' : ''}`
    }
  },

  /**
   * Validate table data
   */
  validateTableData(data) {
    const errors = []
    
    if (!data.tableNumber || data.tableNumber.trim() === '') {
      errors.push('Table number is required')
    }
    
    if (!data.capacity || data.capacity < 1 || data.capacity > 20) {
      errors.push('Capacity must be between 1 and 20')
    }
    
    if (data.position && typeof data.position !== 'object') {
      errors.push('Position must be an object')
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }
}

export default TablesAPI