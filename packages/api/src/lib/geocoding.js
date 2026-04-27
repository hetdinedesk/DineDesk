/**
 * Geocoding utility for converting addresses to latitude/longitude
 * Uses Nominatim (OpenStreetMap) - free, no API key required
 */

const axios = require('axios')

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search'

/**
 * Geocode an address to get latitude and longitude
 * @param {Object} addressParts - Address components
 * @param {string} addressParts.address - Street address
 * @param {string} addressParts.suburb - Suburb/area
 * @param {string} addressParts.city - City
 * @param {string} addressParts.state - State/region
 * @param {string} addressParts.postcode - Postal code
 * @param {string} addressParts.country - Country
 * @returns {Promise<{lat: string, lng: string} | null>} - Coordinates or null if not found
 */
async function geocodeAddress(addressParts) {
  const { address, suburb, city, state, postcode, country } = addressParts

  // Build full address string
  const parts = [address, suburb, city, state, postcode, country].filter(Boolean)
  const fullAddress = parts.join(', ')

  if (!address || !city) {
    return null
  }

  try {
    const params = new URLSearchParams({
      format: 'json',
      q: fullAddress,
      limit: '1',
      addressdetails: '1'
    })

    const url = `${NOMINATIM_URL}?${params.toString()}`

    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'DineDesk-CMS/1.0'
      },
      timeout: 10000 // Increased timeout to 10 seconds
    })

    const data = response.data

    if (data && data.length > 0) {
      const result = data[0]
      return {
        lat: result.lat,
        lng: result.lon
      }
    }

    return null
  } catch (err) {
    console.error('[Geocoding] Error:', err.message, err.code)
    return null
  }
}

/**
 * Check if address has changed significantly enough to warrant re-geocoding
 * @param {Object} current - Current address parts
 * @param {Object} previous - Previous address parts
 * @returns {boolean} - True if address has changed
 */
function hasAddressChanged(current, previous) {
  if (!previous) return true
  
  const fields = ['address', 'suburb', 'city', 'state', 'postcode', 'country']
  return fields.some(field => (current[field] || '') !== (previous[field] || ''))
}

module.exports = {
  geocodeAddress,
  hasAddressChanged
}
