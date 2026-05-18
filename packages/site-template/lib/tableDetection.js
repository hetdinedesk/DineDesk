import { TablesAPI } from './tables'

/**
 * Table detection utilities for QR code ordering
 */

/**
 * Extract table information from URL parameters
 */
export function getTableFromQuery(query) {
  const { client, location, table } = query
  
  if (!client || !location || !table) {
    return null
  }
  
  return {
    clientId: client,
    locationId: location,
    tableNumber: table.toString()
  }
}

/**
 * Validate table exists and is active
 */
export async function validateTable(clientId, locationId, tableNumber) {
  try {
    const result = await TablesAPI.getTableByQR(clientId, locationId, tableNumber)
    return result.table
  } catch (error) {
    console.error('Table validation error:', error)
    return null
  }
}

/**
 * Get table information with validation
 */
export async function getTableInfo(query) {
  const tableParams = getTableFromQuery(query)
  if (!tableParams) {
    return null
  }
  
  const table = await validateTable(
    tableParams.clientId,
    tableParams.locationId,
    tableParams.tableNumber
  )
  
  if (!table) {
    return null
  }
  
  return {
    ...tableParams,
    tableId: table.id,
    capacity: table.capacity,
    location: table.location,
    isValid: true
  }
}

/**
 * Check if current session is a table ordering session
 */
export function isTableOrderingSession(query) {
  return !!getTableFromQuery(query)
}

/**
 * Generate table ordering URL
 */
export function generateTableOrderingUrl(clientId, locationId, tableNumber) {
  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  
  const params = new URLSearchParams({
    client: clientId,
    location: locationId,
    table: tableNumber.toString()
  })
  
  return `${baseUrl}/menu?${params.toString()}`
}

/**
 * Store table information in session storage
 */
export function storeTableSession(tableInfo) {
  if (typeof window === 'undefined') return
  
  try {
    sessionStorage.setItem('tableOrdering', JSON.stringify({
      ...tableInfo,
      timestamp: Date.now()
    }))
  } catch (error) {
    console.error('Error storing table session:', error)
  }
}

/**
 * Retrieve table information from session storage
 */
export function getStoredTableSession() {
  if (typeof window === 'undefined') return null
  
  try {
    const stored = sessionStorage.getItem('tableOrdering')
    if (!stored) return null
    
    const session = JSON.parse(stored)
    
    // Check if session is not too old (24 hours)
    const maxAge = 24 * 60 * 60 * 1000 // 24 hours
    if (Date.now() - session.timestamp > maxAge) {
      sessionStorage.removeItem('tableOrdering')
      return null
    }
    
    return session
  } catch (error) {
    console.error('Error retrieving table session:', error)
    return null
  }
}

/**
 * Clear table session
 */
export function clearTableSession() {
  if (typeof window === 'undefined') return
  
  try {
    sessionStorage.removeItem('tableOrdering')
  } catch (error) {
    console.error('Error clearing table session:', error)
  }
}

/**
 * Get table information from query or session storage
 */
export async function getCurrentTableInfo(query) {
  // First try to get from query parameters
  const queryTableInfo = await getTableInfo(query)
  if (queryTableInfo) {
    storeTableSession(queryTableInfo)
    return queryTableInfo
  }
  
  // Fall back to session storage
  const sessionTableInfo = getStoredTableSession()
  if (sessionTableInfo) {
    // Revalidate the table
    const table = await validateTable(
      sessionTableInfo.clientId,
      sessionTableInfo.locationId,
      sessionTableInfo.tableNumber
    )
    
    if (table) {
      return {
        ...sessionTableInfo,
        tableId: table.id,
        capacity: table.capacity,
        location: table.location,
        isValid: true
      }
    } else {
      // Table is no longer valid, clear session
      clearTableSession()
    }
  }
  
  return null
}

/**
 * Format table display text
 */
export function formatTableDisplay(tableInfo) {
  if (!tableInfo) return ''
  
  return `Table ${tableInfo.tableNumber}${tableInfo.location?.name ? ` at ${tableInfo.location.name}` : ''}`
}

/**
 * Check if order type should be dine-in based on table info
 */
export function shouldUseDineInOrdering(tableInfo) {
  return !!tableInfo && tableInfo.isValid
}

/**
 * Get order type for cart based on table info
 */
export function getOrderType(tableInfo) {
  return shouldUseDineInOrdering(tableInfo) ? 'dine_in' : 'pickup'
}

/**
 * Get payment preference for table ordering
 */
export function getPaymentPreference(tableInfo) {
  return shouldUseDineInOrdering(tableInfo) ? 'pay_at_table' : 'pay_online'
}

export default {
  getTableFromQuery,
  validateTable,
  getTableInfo,
  isTableOrderingSession,
  generateTableOrderingUrl,
  storeTableSession,
  getStoredTableSession,
  clearTableSession,
  getCurrentTableInfo,
  formatTableDisplay,
  shouldUseDineInOrdering,
  getOrderType,
  getPaymentPreference
}