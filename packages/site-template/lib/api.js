const CMS_API_URL = process.env.NEXT_PUBLIC_CMS_API_URL
  || process.env.CMS_API_URL
  || 'http://localhost:3001/api'

// Default SITE_ID from env - used for SSR and when no query param
const DEFAULT_SITE_ID = process.env.NEXT_PUBLIC_SITE_ID
  || process.env.SITE_ID
  || ''

// Empty state fallback data - used when no SITE_ID or API fetch fails
const EMPTY_STATE_DATA = {
  client: null,
  locations: [],
  pages: [],
  banners: [],
  menuCategories: [],
  menuItems: [],
  specials: [],
  navigation: [],
  homepageSections: [],
  settings: {},
  colours: {},
  reviews: {},
  booking: {
    bookingUrl: '',
    bookLabel: 'Book Table',
    showInHeader: false,
    orderUrl: '',
    orderLabel: 'Order Online',
    showOrderBtn: false,
  },
  headerCtas: [
    {
      id: 'primary',
      label: 'Book Table',
      value: '/contact',
      variant: 'primary',
      active: false
    },
    {
      id: 'secondary',
      label: 'Order Online',
      value: '#',
      variant: 'secondary',
      active: false
    }
  ],
  header: {
    type: 'standard-full',
    utilityBelt: true,
    utilityItems: {
      'contact-info': true,
      'social-links': true,
      reviews: true,
      'header-ctas': true,
    },
  },
  footer: {
    theme: 'dark',
    tagline: '',
    socialLinks: {},
  },
  social: {},
  socialLinks: {},
  paymentGateway: {
    isActive: false,
    provider: 'stripe',
    testMode: true,
    testPublishableKey: '',
    livePublishableKey: '',
    currency: 'AUD',
    cashEnabled: true,
    cashLabel: 'Pay at Pickup'
  },
  ordering: {
    enabled: true,
    acceptingOrders: true,
    orderTypes: ['pickup'],
    estimatedPrepTime: '15-20 minutes'
  }
}

// In browser, allow ?site= query param to override env var
// This lets the CMS open a preview with ?site=CLIENT_ID without rebuilding
function getClientId() {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search)
    const siteParam = params.get('site')
    // Reject literal string "undefined" as invalid site ID
    if (siteParam && siteParam !== 'undefined' && siteParam.trim() !== '') {
      return siteParam
    }
  }
  return DEFAULT_SITE_ID
}

const SITE_ID = DEFAULT_SITE_ID

async function getSiteData(clientId) {
  // Use provided clientId, or get from browser query param, or fallback to env
  const id = clientId || getClientId()
  
  if (!id) {
    console.warn('No SITE_ID provided - showing empty state. Set SITE_ID in .env.local or pass ?site=ID in the URL')
    return EMPTY_STATE_DATA
  }

  try {
    const res = await fetch(`${CMS_API_URL}/clients/${id}/export`, {
      cache: 'no-store'
    })
    if (!res.ok) {
      console.error('Export fetch failed:', res.status, 'for client:', id, '- using empty state')
      return EMPTY_STATE_DATA
    }
    const data = await res.json()
    return data
  } catch (err) {
    console.error('getSiteData error:', err.message, '- using empty state')
    return EMPTY_STATE_DATA
  }
}

export { getSiteData, getClientId, SITE_ID, CMS_API_URL }