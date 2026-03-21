const CMS_API_URL = process.env.NEXT_PUBLIC_CMS_API_URL
  || process.env.CMS_API_URL
  || 'http://localhost:3001/api'

// In browser, allow ?site= query param to override env var
// This lets the CMS open a preview with ?site=CLIENT_ID without rebuilding
function getClientId() {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search)
    const siteParam = params.get('site')
    if (siteParam) return siteParam
  }
  return process.env.NEXT_PUBLIC_SITE_ID
    || process.env.SITE_ID
    || ''
}

const SITE_ID = getClientId()

async function getSiteData() {
  const id = getClientId()
  if (!id) {
    console.warn('No SITE_ID — set SITE_ID in .env.local or pass ?site=ID in the URL')
    return {}
  }
  try {
    const res = await fetch(`${CMS_API_URL}/clients/${id}/export`, {
      cache: 'no-store'
    })
    if (!res.ok) {
      console.error('Export fetch failed:', res.status)
      return {}
    }
    return res.json()
  } catch (err) {
    console.error('getSiteData error:', err.message)
    return {}
  }
}

module.exports = { getSiteData, getClientId, SITE_ID, CMS_API_URL }