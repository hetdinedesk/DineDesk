const CMS_API_URL = process.env.NEXT_PUBLIC_CMS_API_URL
  || process.env.CMS_API_URL
  || 'http://localhost:3001/api'

// Default SITE_ID from env - used for SSR and when no query param
const DEFAULT_SITE_ID = process.env.NEXT_PUBLIC_SITE_ID
  || process.env.SITE_ID
  || ''

// Import mock data as fallback
import { getCMSData } from '../data/cms.js'

// In browser, allow ?site= query param to override env var
// This lets the CMS open a preview with ?site=CLIENT_ID without rebuilding
function getClientId() {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search)
    const siteParam = params.get('site')
    if (siteParam) return siteParam
  }
  return DEFAULT_SITE_ID
}

const SITE_ID = DEFAULT_SITE_ID

async function getSiteData(clientId) {
  // Use provided clientId, or get from browser query param, or fallback to env
  const id = clientId || getClientId()
  
  if (!id) {
    console.warn('No SITE_ID — using mock data. Set SITE_ID in .env.local or pass ?site=ID in the URL')
    return getCMSData()
  }

  // LOG FOR DEBUGGING
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[getSiteData] Fetching data for ID: "${id}" (passed clientId: "${clientId || ''}")`)
  }

  try {
    const res = await fetch(`${CMS_API_URL}/clients/${id}/export`, {
      cache: 'no-store'
    })
    if (!res.ok) {
      console.error('Export fetch failed:', res.status, 'for client:', id, '- using mock data')
      return getCMSData()
    }
    return res.json()
  } catch (err) {
    console.error('getSiteData error:', err.message, '- using mock data')
    return getCMSData()
  }
}

export { getSiteData, getClientId, SITE_ID, CMS_API_URL }