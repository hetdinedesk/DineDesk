const crypto = require('crypto')

/**
 * Generate QR code URL for table ordering
 * Format: https://yourdomain.com/menu?client={clientId}&location={locationId}&table={tableNumber}
 */
function generateTableQRCode(clientId, locationId, tableNumber) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.BASE_URL || 'http://localhost:3000'
  const params = new URLSearchParams({
    client: clientId,
    location: locationId,
    table: tableNumber.toString()
  })
  
  return `${baseUrl}/menu?${params.toString()}`
}

/**
 * Generate unique table identifier for QR codes
 * This can be used for more secure QR codes if needed
 */
function generateTableToken(clientId, locationId, tableNumber) {
  const data = `${clientId}:${locationId}:${tableNumber}`
  const secret = process.env.QR_CODE_SECRET || 'default-secret-key'
  
  return crypto.createHmac('sha256', secret)
    .update(data)
    .digest('hex')
    .substring(0, 16)
}

/**
 * Validate table token (if using secure QR codes)
 */
function validateTableToken(clientId, locationId, tableNumber, token) {
  const expectedToken = generateTableToken(clientId, locationId, tableNumber)
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expectedToken))
}

/**
 * Generate QR code data with optional security token
 */
function generateSecureTableQRCode(clientId, locationId, tableNumber, useToken = false) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.BASE_URL || 'http://localhost:3000'
  
  if (useToken) {
    const token = generateTableToken(clientId, locationId, tableNumber)
    const params = new URLSearchParams({
      client: clientId,
      location: locationId,
      table: tableNumber.toString(),
      token
    })
    
    return `${baseUrl}/menu?${params.toString()}`
  } else {
    return generateTableQRCode(clientId, locationId, tableNumber)
  }
}

module.exports = {
  generateTableQRCode,
  generateTableToken,
  validateTableToken,
  generateSecureTableQRCode
}