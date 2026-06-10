const crypto = require('crypto')
const { prisma } = require('./prisma')

/**
 * Resolve the live base URL for a client's site.
 * Priority: client.domain → netlify previewUrl → env fallback
 */
async function resolveClientBaseUrl(clientId) {
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { domain: true, siteConfig: { select: { netlify: true } } }
  })

  // 1. Custom domain (strip trailing slash, ensure https)
  if (client?.domain && !client.domain.includes('localhost') && !client.domain.endsWith('.local')) {
    const d = client.domain.replace(/\/+$/, '')
    return d.startsWith('http') ? d : `https://${d}`
  }

  // 2. Netlify preview URL from site config
  const netlify = client?.siteConfig?.netlify
  if (netlify?.previewUrl) {
    return netlify.previewUrl.replace(/\/+$/, '')
  }

  // 3. Env fallback (only for local dev)
  return process.env.NEXT_PUBLIC_APP_URL || process.env.BASE_URL || 'http://localhost:3000'
}

/**
 * Generate QR code URL for table ordering
 * Format: https://client-domain.com/menu?client={clientId}&location={locationId}&table={tableNumber}
 */
async function generateTableQRCode(clientId, locationId, tableNumber) {
  const baseUrl = await resolveClientBaseUrl(clientId)
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
async function generateSecureTableQRCode(clientId, locationId, tableNumber, useToken = false) {
  const baseUrl = await resolveClientBaseUrl(clientId)
  
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